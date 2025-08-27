import { prisma } from '../config/database';
import zlib from 'zlib';

export interface TableInfo {
  TABLE_NAME: string;
  TABLE_TYPE: string;
  ROW_COUNT?: number;
}

export interface ColumnInfo {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  IS_NULLABLE: string;
  COLUMN_DEFAULT?: string;
}

export interface TableData {
  columns: ColumnInfo[];
  data: any[];
  totalRows: number;
  currentPage: number;
  pageSize: number;
}

export class DatabaseViewerService {
  /**
   * Lấy danh sách tất cả bảng và view
   */
  async getAllTablesAndViews(): Promise<TableInfo[]> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Thử kết nối database lần ${attempt}/${maxRetries}...`);

        const result = await Promise.race([
          prisma.$queryRaw`
            SELECT TABLE_NAME, TABLE_TYPE
            FROM INFORMATION_SCHEMA.TABLES
            ORDER BY TABLE_TYPE, TABLE_NAME
          `,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout sau 15 giây')), 15000)
          ),
        ]);

        console.log(`Kết nối thành công lần ${attempt}!`);
        return result as TableInfo[];
      } catch (error) {
        lastError = error as Error;
        console.error(`Lỗi lần ${attempt}:`, error);

        if (attempt < maxRetries) {
          console.log(`Chờ 2 giây trước khi thử lại...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    try {
      console.log('Thử fallback query...');
      const simpleResult = await Promise.race([
        prisma.$queryRaw`
          SELECT TOP 50 TABLE_NAME, TABLE_TYPE
          FROM INFORMATION_SCHEMA.TABLES
          ORDER BY TABLE_TYPE, TABLE_NAME
        `,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fallback timeout sau 10 giây')), 10000)
        ),
      ]);

      console.log('Fallback thành công!');
      return simpleResult as TableInfo[];
    } catch (fallbackError) {
      console.error('Fallback cũng thất bại:', fallbackError);
      throw new Error(
        `Không thể kết nối database sau ${maxRetries} lần thử. Lỗi cuối: ${lastError?.message}`
      );
    }
  }

  /**
   * Lấy thông tin cột của một bảng/view
   */
  async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = ${tableName}
        ORDER BY ORDINAL_POSITION
      `;

      return result as ColumnInfo[];
    } catch (error) {
      console.error(`Lỗi khi lấy cột của ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Lấy dữ liệu từ bảng/view với phân trang
   */
  async getTableData(
    tableName: string,
    page: number = 1,
    pageSize: number = 50,
    searchTerm?: string,
    searchColumn?: string
  ): Promise<TableData> {
    try {
      let countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
      if (searchTerm && searchColumn) {
        countQuery += ` WHERE ${searchColumn} LIKE '%${searchTerm}%'`;
      }

      const countResult = await prisma.$queryRawUnsafe(countQuery);
      const totalRows = (countResult as any[])[0]?.total || 0;

      // Lấy danh sách cột để xác định cột sắp xếp mặc định "mới nhất"
      const columns = await this.getTableColumns(tableName);
      const preferredOrderKeywords = [
        'updated_at',
        'updatedat',
        'update_at',
        'last_updated',
        'modified_at',
        'modify_at',
        'created_at',
        'createdat',
        'create_at',
        'createddate',
        'ngay_tao',
        'ngaytao',
        'date_created',
        // Các dạng chung hơn để bắt thêm khả năng
        'date',
        'datetime',
        'timestamp',
        'time',
        'ngay',
        // Cuối cùng fallback theo id
        'id',
      ];
      let effectiveSortColumn: string | null = null;
      const loweredToOriginal: Record<string, string> = {};
      for (const c of columns) loweredToOriginal[c.COLUMN_NAME.toLowerCase()] = c.COLUMN_NAME;
      for (const key of preferredOrderKeywords) {
        if (loweredToOriginal[key]) {
          effectiveSortColumn = loweredToOriginal[key];
          break;
        }
        const matched = columns.find(c => c.COLUMN_NAME.toLowerCase().includes(key));
        if (matched) {
          effectiveSortColumn = matched.COLUMN_NAME;
          break;
        }
      }

      let dataQuery = `SELECT * FROM ${tableName}`;
      if (searchTerm && searchColumn) {
        dataQuery += ` WHERE ${searchColumn} LIKE '%${searchTerm}%'`;
      }

      const offset = (page - 1) * pageSize;
      if (effectiveSortColumn) {
        dataQuery += ` ORDER BY ${effectiveSortColumn} DESC`;
      } else {
        dataQuery += ` ORDER BY (SELECT NULL)`;
      }
      dataQuery += ` OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;

      const data = await prisma.$queryRawUnsafe(dataQuery);

      return {
        columns,
        data: data as any[],
        totalRows,
        currentPage: page,
        pageSize,
      };
    } catch (error) {
      console.error(`Lỗi khi lấy dữ liệu từ ${tableName}:`, error);
      throw error;
    }
  }

  private convertToBufferIfNeeded(value: any): Buffer | null {
    if (!value) return null;

    if (Buffer.isBuffer(value)) return value as Buffer;

    if (typeof value === 'string') {
      // Dạng hex 0x...
      if (value.startsWith('0x') || value.startsWith('0X')) {
        try {
          const hex = value.slice(2);
          return Buffer.from(hex, 'hex');
        } catch (_e) {
          return null;
        }
      }
      // Dạng base64
      try {
        return Buffer.from(value, 'base64');
      } catch (_e) {
        // ignore
      }
    }

    return null;
  }

  private isGzipData(buffer: Buffer): boolean {
    return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
  }

  private tryGunzip(buffer: Buffer): Buffer {
    try {
      return zlib.gunzipSync(buffer);
    } catch (_e) {
      return buffer;
    }
  }

  private detectMimeType(buffer: Buffer): string {
    if (buffer.length < 12) return 'application/octet-stream';

    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';

    // PNG
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    )
      return 'image/png';

    // GIF
    if (buffer.slice(0, 3).toString('ascii') === 'GIF') return 'image/gif';

    // WEBP (RIFF....WEBP)
    if (
      buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
      buffer.slice(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }

    // BMP
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) return 'image/bmp';

    // TIFF
    if (
      (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
      (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)
    )
      return 'image/tiff';

    // DICOM (DICM magic at offset 128)
    if (buffer.length > 132 && buffer.slice(128, 132).toString('ascii') === 'DICM') {
      return 'application/dicom';
    }

    return 'application/octet-stream';
  }

  /**
   * Lấy dữ liệu ảnh từ cột BLOB/VARBINARY, hỗ trợ hex 0x..., gzip
   */
  async getImageData(
    tableName: string,
    idColumn: string,
    idValue: any,
    imageColumn: string
  ): Promise<{ data: Buffer; mimeType: string } | null> {
    try {
      const result = await prisma.$queryRawUnsafe(
        `SELECT ${imageColumn} FROM ${tableName} WHERE ${idColumn} = ${idValue}`
      );

      const row = (result as any[])[0];
      if (!row || row[imageColumn] == null) return null;

      let buffer: Buffer | null = null;

      if (Buffer.isBuffer(row[imageColumn])) {
        buffer = row[imageColumn] as Buffer;
      } else {
        buffer = this.convertToBufferIfNeeded(row[imageColumn]);
      }

      if (!buffer) return null;

      // Nếu là gzip thì giải nén
      if (this.isGzipData(buffer)) {
        buffer = this.tryGunzip(buffer);
      }

      const mimeType = this.detectMimeType(buffer);
      return { data: buffer, mimeType };
    } catch (error) {
      console.error(`Lỗi khi lấy ảnh từ ${tableName}:`, error);
      return null;
    }
  }

  isImageColumn(column: ColumnInfo): boolean {
    const imageTypes = ['image', 'varbinary', 'binary', 'blob'];
    const imageNames = ['image', 'photo', 'img', 'picture', 'scan', 'xray', 'ct', 'mri'];

    return (
      imageTypes.some(type => column.DATA_TYPE.toLowerCase().includes(type)) ||
      imageNames.some(name => column.COLUMN_NAME.toLowerCase().includes(name))
    );
  }

  getDataPreview(value: any, maxLength: number = 100): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    const stringValue = String(value);
    if (stringValue.length <= maxLength) {
      return stringValue;
    }

    return stringValue.substring(0, maxLength) + '...';
  }
}
