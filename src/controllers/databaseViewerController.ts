import { Request, Response } from 'express';
import { DatabaseViewerService } from '../services/databaseViewerService';

const dbViewerService = new DatabaseViewerService();

export class DatabaseViewerController {
  /**
   * Hiển thị trang chính để xem database
   */
  async showDatabaseViewer(req: Request, res: Response) {
    try {
      const tables = await dbViewerService.getAllTablesAndViews();

      res.render('database-viewer', {
        title: 'Database Viewer - Ngọc Minh Medical',
        tables,
        currentTable: null,
        tableData: null,
      });
    } catch (error) {
      res.status(500).render('error', {
        title: 'Lỗi',
        message: 'Lỗi khi tải danh sách bảng/view',
        error: (error as Error).message,
      });
    }
  }

  /**
   * API để lấy dữ liệu của một bảng/view
   */
  async getTableData(req: Request, res: Response) {
    try {
      const { tableName, page = 1, pageSize = 50, searchTerm, searchColumn } = req.query;

      if (!tableName) {
        return res.status(400).json({
          success: false,
          message: 'Tên bảng/view là bắt buộc',
        });
      }

      const tableData = await dbViewerService.getTableData(
        tableName as string,
        Number(page),
        Number(pageSize),
        searchTerm as string,
        searchColumn as string
      );

      res.json({
        success: true,
        data: tableData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy dữ liệu bảng/view',
        error: (error as Error).message,
      });
    }
  }

  /**
   * API để lấy ảnh từ cột BLOB
   */
  async getImageData(req: Request, res: Response) {
    try {
      const { tableName, idColumn, idValue, imageColumn } = req.query;

      if (!tableName || !idColumn || !idValue || !imageColumn) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin cần thiết để lấy ảnh',
        });
      }

      const result = await dbViewerService.getImageData(
        tableName as string,
        idColumn as string,
        idValue,
        imageColumn as string
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ảnh',
        });
      }

      const { data, mimeType } = result;

      // Nếu dữ liệu không phải ảnh hỗ trợ hiển thị, trả về dạng download
      const inlineMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff',
      ];
      const isInline = inlineMimeTypes.includes(mimeType);

      res.set({
        'Content-Type': mimeType,
        'Content-Length': data.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': isInline ? 'inline' : 'attachment; filename="image"',
      });

      res.send(data);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy ảnh',
        error: (error as Error).message,
      });
    }
  }

  /**
   * API để lấy thông tin cột của bảng/view
   */
  async getTableColumns(req: Request, res: Response) {
    try {
      const { tableName } = req.query;

      if (!tableName) {
        return res.status(400).json({
          success: false,
          message: 'Tên bảng/view là bắt buộc',
        });
      }

      const columns = await dbViewerService.getTableColumns(tableName as string);

      res.json({
        success: true,
        data: columns,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin cột',
        error: (error as Error).message,
      });
    }
  }
}
