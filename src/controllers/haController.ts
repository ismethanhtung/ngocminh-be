import { Request, Response } from 'express';
import { HAService } from '../services/haService';

const haService = new HAService();

export class HAController {
  // 1) GET /ha/results?fileNum=25003245
  async getResultsByFileNum(req: Request, res: Response) {
    try {
      const fileNum = String(req.query.fileNum || '').trim();
      if (!fileNum) {
        return res.status(400).json({ success: false, message: 'Thiếu tham số fileNum' });
      }
      const results = await haService.getHAResultsByFileNum(fileNum);
      return res.json({ success: true, data: results });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message: 'Lỗi khi lấy ViewHAResult',
          error: (error as Error).message,
        });
    }
  }

  // 2) GET /ha/clinical-items/:resultId
  async getClinicalItems(req: Request, res: Response) {
    try {
      const resultId = Number(req.params.resultId);
      if (!Number.isFinite(resultId)) {
        return res.status(400).json({ success: false, message: 'resultId không hợp lệ' });
      }
      const items = await haService.getClinicalItemsByResultId(resultId);
      return res.json({ success: true, data: items });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message: 'Lỗi khi lấy ViewHAResultItem',
          error: (error as Error).message,
        });
    }
  }

  // 3) GET /ha/pathology/:resultId
  async getPathology(req: Request, res: Response) {
    try {
      const resultId = Number(req.params.resultId);
      if (!Number.isFinite(resultId)) {
        return res.status(400).json({ success: false, message: 'resultId không hợp lệ' });
      }
      const items = await haService.getPathologyByResultId(resultId);
      return res.json({ success: true, data: items });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message: 'Lỗi khi lấy ViewHAPathologyResult',
          error: (error as Error).message,
        });
    }
  }

  // 4) GET /ha/imaging?itemNum=123
  async getImagingChain(req: Request, res: Response) {
    try {
      const itemNum = Number(req.query.itemNum);
      if (!Number.isFinite(itemNum)) {
        return res.status(400).json({ success: false, message: 'Thiếu hoặc sai itemNum' });
      }
      const data = await haService.getImagingChainByItemNum(itemNum);
      return res.json({ success: true, data });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message: 'Lỗi khi lấy chuỗi chẩn đoán hình ảnh',
          error: (error as Error).message,
        });
    }
  }
}
