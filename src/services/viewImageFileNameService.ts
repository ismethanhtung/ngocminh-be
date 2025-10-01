import { prisma } from '../config/database';
import { logger } from '../config/logger';

export interface ViewImageFileNameData {
  [key: string]: any;
}

export class ViewImageFileNameService {
  /**
   * Lấy tất cả data trong viewImageFileName theo itemnum
   * @param itemNum - ItemNum để tìm kiếm
   * @returns Danh sách data từ viewImageFileName
   */
  async getImageFileNameByItemNum(itemNum: string | number): Promise<ViewImageFileNameData[]> {
    try {
      logger.info(`Đang lấy data từ viewImageFileName với itemNum: ${itemNum}`);

      const results = await prisma.$queryRawUnsafe(`
        SELECT *
        FROM viewImageFileName
        WHERE itemnum = '${itemNum}'
        ORDER BY id DESC
      `);

      const data = results as ViewImageFileNameData[];
      logger.info(`Tìm thấy ${data.length} bản ghi trong viewImageFileName`);

      return data;
    } catch (error: any) {
      logger.error('Lỗi khi lấy data từ viewImageFileName:', error);

      // Thử với tên view khác có thể có
      try {
        logger.info('Thử với tên view khác: ViewImageFileName');
        const results = await prisma.$queryRawUnsafe(`
          SELECT *
          FROM ViewImageFileName
          WHERE itemnum = '${itemNum}'
          ORDER BY id DESC
        `);

        const data = results as ViewImageFileNameData[];
        logger.info(`Tìm thấy ${data.length} bản ghi trong ViewImageFileName`);
        return data;
      } catch (secondError: any) {
        logger.error('Lỗi khi thử với ViewImageFileName:', secondError);

        // Thử với tên view khác nữa
        try {
          logger.info('Thử với tên view khác: view_image_file_name');
          const results = await prisma.$queryRawUnsafe(`
            SELECT *
            FROM view_image_file_name
            WHERE itemnum = '${itemNum}'
            ORDER BY id DESC
          `);

          const data = results as ViewImageFileNameData[];
          logger.info(`Tìm thấy ${data.length} bản ghi trong view_image_file_name`);
          return data;
        } catch (thirdError: any) {
          logger.error('Lỗi khi thử với view_image_file_name:', thirdError);
          throw new Error(`Không thể tìm thấy view viewImageFileName. Lỗi: ${error.message}`);
        }
      }
    }
  }

  /**
   * Lấy tất cả data trong viewImageFileName (không filter)
   * @returns Tất cả data từ viewImageFileName
   */
  async getAllImageFileNameData(): Promise<ViewImageFileNameData[]> {
    try {
      logger.info('Đang lấy tất cả data từ viewImageFileName');

      const results = await prisma.$queryRawUnsafe(`
        SELECT *
        FROM viewImageFileName
        ORDER BY id DESC
      `);

      const data = results as ViewImageFileNameData[];
      logger.info(`Tìm thấy ${data.length} bản ghi trong viewImageFileName`);

      return data;
    } catch (error: any) {
      logger.error('Lỗi khi lấy tất cả data từ viewImageFileName:', error);

      // Thử với tên view khác có thể có
      try {
        logger.info('Thử với tên view khác: ViewImageFileName');
        const results = await prisma.$queryRawUnsafe(`
          SELECT *
          FROM ViewImageFileName
          ORDER BY id DESC
        `);

        const data = results as ViewImageFileNameData[];
        logger.info(`Tìm thấy ${data.length} bản ghi trong ViewImageFileName`);
        return data;
      } catch (secondError: any) {
        logger.error('Lỗi khi thử với ViewImageFileName:', secondError);

        // Thử với tên view khác nữa
        try {
          logger.info('Thử với tên view khác: view_image_file_name');
          const results = await prisma.$queryRawUnsafe(`
            SELECT *
            FROM view_image_file_name
            ORDER BY id DESC
          `);

          const data = results as ViewImageFileNameData[];
          logger.info(`Tìm thấy ${data.length} bản ghi trong view_image_file_name`);
          return data;
        } catch (thirdError: any) {
          logger.error('Lỗi khi thử với view_image_file_name:', thirdError);
          throw new Error(`Không thể tìm thấy view viewImageFileName. Lỗi: ${error.message}`);
        }
      }
    }
  }

  /**
   * Lấy thông tin cấu trúc của view viewImageFileName
   * @returns Thông tin cột của view
   */
  async getViewImageFileNameStructure(): Promise<any[]> {
    try {
      logger.info('Đang lấy cấu trúc của viewImageFileName');

      const results = await prisma.$queryRawUnsafe(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'viewImageFileName'
        ORDER BY ORDINAL_POSITION
      `);

      return results as any[];
    } catch (error: any) {
      logger.error('Lỗi khi lấy cấu trúc viewImageFileName:', error);

      // Thử với tên view khác
      try {
        const results = await prisma.$queryRawUnsafe(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'ViewImageFileName'
          ORDER BY ORDINAL_POSITION
        `);
        return results as any[];
      } catch (secondError: any) {
        try {
          const results = await prisma.$queryRawUnsafe(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'view_image_file_name'
            ORDER BY ORDINAL_POSITION
          `);
          return results as any[];
        } catch (thirdError: any) {
          throw new Error(`Không thể lấy cấu trúc view viewImageFileName. Lỗi: ${error.message}`);
        }
      }
    }
  }
}
