import { Request, Response } from 'express';
import { FileNumService } from '../services/fileNumService';

const fileNumService = new FileNumService();

export class FileNumController {
  /**
   * Hiển thị trang tìm kiếm FileNum
   */
  async showFileNumSearch(req: Request, res: Response) {
    try {
      res.render('file-num-search', {
        title: 'Tìm kiếm FileNum - Ngọc Minh Medical',
        patientInfo: null,
        searchPerformed: false,
      });
    } catch (error) {
      res.status(500).render('error', {
        title: 'Lỗi',
        message: 'Lỗi khi tải trang tìm kiếm FileNum',
        error: (error as Error).message,
      });
    }
  }

  /**
   * API để tìm kiếm thông tin theo FileNum
   */
  async searchFileNum(req: Request, res: Response) {
    try {
      const { fileNum } = req.query;

      if (!fileNum || typeof fileNum !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'FileNum là bắt buộc',
        });
      }

      // Kiểm tra xem FileNum có tồn tại không
      const exists = await fileNumService.checkFileNumExists(fileNum);
      if (!exists) {
        return res.json({
          success: true,
          data: {
            fileNum,
            exists: false,
            message: 'Không tìm thấy thông tin cho FileNum này',
          },
        });
      }

      // Tìm kiếm thông tin chi tiết
      const patientInfo = await fileNumService.searchByFileNum(fileNum);

      res.json({
        success: true,
        data: {
          ...patientInfo,
          exists: true,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tìm kiếm FileNum',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Hiển thị kết quả tìm kiếm FileNum (render server-side)
   */
  async searchFileNumPage(req: Request, res: Response) {
    try {
      const { fileNum } = req.query;

      if (!fileNum || typeof fileNum !== 'string') {
        return res.render('file-num-search', {
          title: 'Tìm kiếm FileNum - Ngọc Minh Medical',
          patientInfo: null,
          searchPerformed: false,
        });
      }

      // Kiểm tra xem FileNum có tồn tại không
      const exists = await fileNumService.checkFileNumExists(fileNum);
      if (!exists) {
        return res.render('file-num-search', {
          title: 'Tìm kiếm FileNum - Ngọc Minh Medical',
          patientInfo: null,
          searchPerformed: true,
          fileNum,
          message: 'Không tìm thấy thông tin cho FileNum này',
        });
      }

      // Tìm kiếm thông tin chi tiết
      const patientInfo = await fileNumService.searchByFileNum(fileNum);

      res.render('file-num-search', {
        title: 'Tìm kiếm FileNum - Ngọc Minh Medical',
        patientInfo,
        searchPerformed: true,
        fileNum,
      });
    } catch (error) {
      res.status(500).render('error', {
        title: 'Lỗi',
        message: 'Lỗi khi tìm kiếm FileNum',
        error: (error as Error).message,
      });
    }
  }
}
