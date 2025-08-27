import { Request, Response, NextFunction } from 'express';
import { ImagingService } from '../services/imagingService';
import { catchAsync } from '../middleware/error';
import { ApiResponse, QueryParams } from '../types';
import { logger } from '../config/logger';

export class ImagingController {
  private imagingService: ImagingService;

  constructor() {
    this.imagingService = new ImagingService();
  }

  // Lấy danh sách kết quả chẩn đoán hình ảnh
  getImagingResults = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const queryParams: QueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      search: req.query.search as string,
      filter: {
        patientId: req.query.patientId as string,
        pathologyType: req.query.pathologyType as string,
        status: req.query.status as string,
        doctorId: req.query.doctorId as string,
      },
    };

    const result = await this.imagingService.getImagingResults(queryParams);

    if (!result.success) {
      return next(new Error(result.error?.message));
    }

    const response: ApiResponse = {
      success: true,
      message: 'Lấy danh sách kết quả chẩn đoán hình ảnh thành công',
      data: result.data?.results,
      pagination: result.data?.pagination,
    };

    logger.info(`API: Retrieved ${result.data?.results?.length || 0} imaging results`);
    res.status(200).json(response);
  });

  // Lấy kết quả chẩn đoán hình ảnh theo ID
  getImagingResultById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    const result = await this.imagingService.getImagingResultById(id);

    if (!result.success) {
      return next(new Error(result.error?.message));
    }

    const response: ApiResponse = {
      success: true,
      message: 'Lấy kết quả chẩn đoán hình ảnh thành công',
      data: result.data,
    };

    logger.info(`API: Retrieved imaging result with ID: ${id}`);
    res.status(200).json(response);
  });

  // Tạo kết quả chẩn đoán hình ảnh mới
  createImagingResult = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const result = await this.imagingService.createImagingResult(data);

    if (!result.success) {
      return next(new Error(result.error?.message));
    }

    const response: ApiResponse = {
      success: true,
      message: 'Tạo kết quả chẩn đoán hình ảnh thành công',
      data: result.data,
    };

    logger.info(`API: Created new imaging result with ID: ${result.data?.id}`);
    res.status(201).json(response);
  });

  // Cập nhật kết quả chẩn đoán hình ảnh
  updateImagingResult = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    const data = req.body;
    const result = await this.imagingService.updateImagingResult(id, data);

    if (!result.success) {
      return next(new Error(result.error?.message));
    }

    const response: ApiResponse = {
      success: true,
      message: 'Cập nhật kết quả chẩn đoán hình ảnh thành công',
      data: result.data,
    };

    logger.info(`API: Updated imaging result with ID: ${id}`);
    res.status(200).json(response);
  });

  // Xóa kết quả chẩn đoán hình ảnh
  deleteImagingResult = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    const result = await this.imagingService.deleteImagingResult(id);

    if (!result.success) {
      return next(new Error(result.error?.message));
    }

    const response: ApiResponse = {
      success: true,
      message: 'Xóa kết quả chẩn đoán hình ảnh thành công',
      data: result.data,
    };

    logger.info(`API: Deleted imaging result with ID: ${id}`);
    res.status(200).json(response);
  });

  // Upload và lưu dữ liệu ảnh kết quả
  uploadImagingData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const resultId = parseInt(req.params.resultId);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    let resultData: Buffer | undefined;
    let conclusionData: Buffer | undefined;
    let suggestionData: Buffer | undefined;

    // Process uploaded files
    if (files.resultImage && files.resultImage[0]) {
      resultData = files.resultImage[0].buffer;
    }
    if (files.conclusionImage && files.conclusionImage[0]) {
      conclusionData = files.conclusionImage[0].buffer;
    }
    if (files.suggestionImage && files.suggestionImage[0]) {
      suggestionData = files.suggestionImage[0].buffer;
    }

    const data = {
      resultId,
      resultData,
      conclusionData,
      suggestionData,
      createdBy: req.body.createdBy,
    };

    const result = await this.imagingService.saveImagingResultData(data);

    if (!result.success) {
      return next(new Error(result.error?.message));
    }

    const response: ApiResponse = {
      success: true,
      message: 'Upload dữ liệu ảnh thành công',
      data: result.data,
    };

    logger.info(`API: Uploaded imaging data for result ID: ${resultId}`);
    res.status(201).json(response);
  });

  // Lấy dữ liệu ảnh kết quả
  getImagingData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const resultId = parseInt(req.params.resultId);
    const result = await this.imagingService.getImagingResultData(resultId);

    if (!result.success) {
      return next(new Error(result.error?.message));
    }

    const response: ApiResponse = {
      success: true,
      message: 'Lấy dữ liệu ảnh thành công',
      data: result.data,
    };

    logger.info(`API: Retrieved imaging data for result ID: ${resultId}`);
    res.status(200).json(response);
  });

  // Thống kê kết quả chẩn đoán theo loại
  getImagingStatistics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await this.imagingService.getImagingStatistics();

    if (!result.success) {
      return next(new Error(result.error?.message));
    }

    const response: ApiResponse = {
      success: true,
      message: 'Lấy thống kê thành công',
      data: result.data,
    };

    logger.info('API: Retrieved imaging statistics');
    res.status(200).json(response);
  });

  // Download ảnh kết quả
  downloadImagingData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const resultId = parseInt(req.params.resultId);
    const dataType = req.params.dataType as 'result' | 'conclusion' | 'suggestion';

    const result = await this.imagingService.getImagingResultData(resultId);

    if (!result.success) {
      return next(new Error(result.error?.message));
    }

    const data = result.data;
    let imageBuffer: Buffer | null = null;
    let filename = '';

    switch (dataType) {
      case 'result':
        imageBuffer = data?.resultData;
        filename = `result-${resultId}.jpg`;
        break;
      case 'conclusion':
        imageBuffer = data?.conclusionData;
        filename = `conclusion-${resultId}.jpg`;
        break;
      case 'suggestion':
        imageBuffer = data?.suggestionData;
        filename = `suggestion-${resultId}.jpg`;
        break;
      default:
        return next(new Error('Loại dữ liệu không hợp lệ'));
    }

    if (!imageBuffer) {
      return next(new Error('Không tìm thấy dữ liệu ảnh'));
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', imageBuffer.length);

    logger.info(`API: Downloaded ${dataType} image for result ID: ${resultId}`);
    res.send(imageBuffer);
  });
}
