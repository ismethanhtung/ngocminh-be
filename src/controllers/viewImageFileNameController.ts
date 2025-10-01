import { Request, Response } from 'express';
import { ViewImageFileNameService } from '../services/viewImageFileNameService';
import { logger } from '../config/logger';

export class ViewImageFileNameController {
  /**
   * Lấy tất cả data trong viewImageFileName theo itemnum
   * GET /api/view-image-file-name/:itemNum
   */
  static async getImageFileNameByItemNum(req: Request, res: Response): Promise<void> {
    try {
      const { itemNum } = req.params;

      if (!itemNum) {
        res.status(400).json({
          success: false,
          message: 'ItemNum là bắt buộc',
        });
        return;
      }

      logger.info(`API: Lấy data viewImageFileName theo itemNum: ${itemNum}`);

      const data = await ViewImageFileNameService.prototype.getImageFileNameByItemNum(itemNum);

      res.json({
        success: true,
        message: `Lấy data viewImageFileName thành công cho itemNum: ${itemNum}`,
        data: {
          itemNum,
          totalRecords: data.length,
          records: data,
        },
      });
    } catch (error: any) {
      logger.error('Lỗi trong getImageFileNameByItemNum:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy data viewImageFileName',
        error: error.message,
      });
    }
  }

  /**
   * Lấy tất cả data trong viewImageFileName (không filter)
   * GET /api/view-image-file-name
   */
  static async getAllImageFileNameData(req: Request, res: Response): Promise<void> {
    try {
      logger.info('API: Lấy tất cả data viewImageFileName');

      const data = await ViewImageFileNameService.prototype.getAllImageFileNameData();

      res.json({
        success: true,
        message: 'Lấy tất cả data viewImageFileName thành công',
        data: {
          totalRecords: data.length,
          records: data,
        },
      });
    } catch (error: any) {
      logger.error('Lỗi trong getAllImageFileNameData:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy tất cả data viewImageFileName',
        error: error.message,
      });
    }
  }

  /**
   * Lấy cấu trúc của view viewImageFileName
   * GET /api/view-image-file-name/structure
   */
  static async getViewImageFileNameStructure(req: Request, res: Response): Promise<void> {
    try {
      logger.info('API: Lấy cấu trúc viewImageFileName');

      const structure = await ViewImageFileNameService.prototype.getViewImageFileNameStructure();

      res.json({
        success: true,
        message: 'Lấy cấu trúc viewImageFileName thành công',
        data: {
          columns: structure,
          totalColumns: structure.length,
        },
      });
    } catch (error: any) {
      logger.error('Lỗi trong getViewImageFileNameStructure:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy cấu trúc viewImageFileName',
        error: error.message,
      });
    }
  }

  /**
   * Lấy data viewImageFileName với query parameters
   * GET /api/view-image-file-name?itemNum=xxx
   */
  static async getImageFileNameData(req: Request, res: Response): Promise<void> {
    try {
      const { itemNum } = req.query;

      if (itemNum) {
        // Nếu có itemNum, gọi API theo itemNum
        req.params.itemNum = itemNum as string;
        return ViewImageFileNameController.getImageFileNameByItemNum(req, res);
      } else {
        // Nếu không có itemNum, lấy tất cả data
        return ViewImageFileNameController.getAllImageFileNameData(req, res);
      }
    } catch (error: any) {
      logger.error('Lỗi trong getImageFileNameData:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy data viewImageFileName',
        error: error.message,
      });
    }
  }
}
