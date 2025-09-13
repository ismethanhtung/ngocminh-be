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
      return res.status(500).json({
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
      return res.status(500).json({
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
      return res.status(500).json({
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
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chuỗi chẩn đoán hình ảnh',
        error: (error as Error).message,
      });
    }
  }

  // 5) GET /ha/obstetric-history?patientId=XXXX
  async getObstetricHistory(req: Request, res: Response) {
    try {
      const patientId = String(req.query.patientId || '').trim();
      if (!patientId) {
        return res.status(400).json({ success: false, message: 'Thiếu tham số patientId' });
      }
      const rows = await haService.getObstetricHistoryByPatientId(patientId);
      return res.json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy tiền sử sản phụ khoa',
        error: (error as Error).message,
      });
    }
  }

  // 6) GET /ha/general-exam?patientId=XXXX
  async getGeneralExam(req: Request, res: Response) {
    try {
      const patientId = String(req.query.patientId || '').trim();
      if (!patientId) {
        return res.status(400).json({ success: false, message: 'Thiếu tham số patientId' });
      }
      const rows = await haService.getGeneralExamByPatientId(patientId);
      return res.json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy khám tổng quát',
        error: (error as Error).message,
      });
    }
  }

  // 7) GET /ha/results-by-item?itemNum=XXXX
  async getResultsByItemNum(req: Request, res: Response) {
    try {
      const itemNum = String(req.query.itemNum || '').trim();
      if (!itemNum) {
        return res.status(400).json({ success: false, message: 'Thiếu tham số itemNum' });
      }
      const rows = await haService.getHAResultsByItemNum(itemNum);
      return res.json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy ViewHAResult theo ItemNum',
        error: (error as Error).message,
      });
    }
  }

  // 8) GET /ha/all-data - Lấy tất cả data trong ViewHAData
  async getAllHAData(req: Request, res: Response) {
    try {
      const rows = await haService.getAllHAData();
      return res.json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy tất cả data từ ViewHAData',
        error: (error as Error).message,
      });
    }
  }

  // 9) GET /ha/result-detail/:dataId - Lấy ViewHAResultDetail theo DataId
  async getHAResultDetailByDataId(req: Request, res: Response) {
    try {
      const dataId = Number(req.params.dataId);
      if (!Number.isFinite(dataId)) {
        return res.status(400).json({ success: false, message: 'dataId không hợp lệ' });
      }
      const rows = await haService.getHAResultDetailByDataId(dataId);
      return res.json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy ViewHAResultDetail theo DataId',
        error: (error as Error).message,
      });
    }
  }

  // 10) PUT /ha/result-detail/:id - Cập nhật HA_ResultDetail theo Id
  async updateHAResultDetail(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ success: false, message: 'Id không hợp lệ' });
      }

      const { HealthType, Conclusion, Suggestion, ConclusionDate, FileName, ConclusionDoctor } =
        req.body;

      // Kiểm tra ít nhất một trường được cung cấp
      const hasUpdateData = [
        HealthType,
        Conclusion,
        Suggestion,
        ConclusionDate,
        FileName,
        ConclusionDoctor,
      ].some(field => field !== undefined);

      if (!hasUpdateData) {
        return res.status(400).json({
          success: false,
          message: 'Cần cung cấp ít nhất một trường để cập nhật',
        });
      }

      const updateData: any = {};
      if (HealthType !== undefined)
        updateData.HealthType = HealthType === '' ? null : String(HealthType);
      if (Conclusion !== undefined)
        updateData.Conclusion = Conclusion === '' ? null : String(Conclusion);
      if (Suggestion !== undefined)
        updateData.Suggestion = Suggestion === '' ? null : String(Suggestion);
      if (ConclusionDate !== undefined)
        updateData.ConclusionDate = ConclusionDate === '' ? null : String(ConclusionDate);
      if (FileName !== undefined) updateData.FileName = FileName === '' ? null : String(FileName);
      if (ConclusionDoctor !== undefined)
        updateData.ConclusionDoctor = ConclusionDoctor === '' ? null : String(ConclusionDoctor);

      const result = await haService.updateHAResultDetail(id, updateData);

      return res.json({
        success: true,
        message: 'Cập nhật thành công',
        affectedRows: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật HA_ResultDetail',
        error: (error as Error).message,
      });
    }
  }
}
