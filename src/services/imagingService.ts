import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error';
import { ServiceResponse, QueryParams } from '../types';

export class ImagingService {
  constructor(private db: PrismaClient = prisma) {}

  // Lấy danh sách kết quả chẩn đoán hình ảnh
  async getImagingResults(params: QueryParams): Promise<ServiceResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        filter = {},
      } = params;

      const skip = (page - 1) * limit;

      // Build where condition
      const where: any = {};

      if (search) {
        where.OR = [
          { patientId: { contains: search, mode: 'insensitive' } },
          { fileName: { contains: search, mode: 'insensitive' } },
          { resultContent: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Apply filters
      if (filter.patientId) {
        where.patientId = filter.patientId;
      }
      if (filter.pathologyType) {
        where.pathologyType = parseInt(filter.pathologyType);
      }
      if (filter.status) {
        where.status = parseInt(filter.status);
      }
      if (filter.doctorId) {
        where.doctorId = filter.doctorId;
      }

      // Get total count
      const total = await this.db.cN_ImagingResult.count({ where });

      // Get paginated results
      const results = await this.db.cN_ImagingResult.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          patientId: true,
          fileName: true,
          pathologyType: true,
          examDate: true,
          resultContent: true,
          doctorId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`Retrieved ${results.length} imaging results for page ${page}`);

      return {
        success: true,
        data: {
          results,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      logger.error('Error getting imaging results:', error);
      return {
        success: false,
        error: {
          message: 'Không thể lấy danh sách kết quả chẩn đoán hình ảnh',
          code: 'GET_IMAGING_RESULTS_ERROR',
          details: error,
        },
      };
    }
  }

  // Lấy kết quả chẩn đoán hình ảnh theo ID
  async getImagingResultById(id: number): Promise<ServiceResponse> {
    try {
      const result = await this.db.cN_ImagingResult.findUnique({
        where: { id },
      });

      if (!result) {
        throw new AppError(
          'Không tìm thấy kết quả chẩn đoán hình ảnh',
          404,
          'IMAGING_RESULT_NOT_FOUND'
        );
      }

      logger.info(`Retrieved imaging result with ID: ${id}`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error(`Error getting imaging result by ID ${id}:`, error);
      return {
        success: false,
        error: {
          message:
            error instanceof AppError ? error.message : 'Không thể lấy kết quả chẩn đoán hình ảnh',
          code: 'GET_IMAGING_RESULT_ERROR',
          details: error,
        },
      };
    }
  }

  // Tạo kết quả chẩn đoán hình ảnh mới
  async createImagingResult(data: any): Promise<ServiceResponse> {
    try {
      const result = await this.db.cN_ImagingResult.create({
        data: {
          ...data,
          status: data.status || 1, // Default to "Đang xử lý"
        },
      });

      logger.info(`Created new imaging result with ID: ${result.id}`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error('Error creating imaging result:', error);
      return {
        success: false,
        error: {
          message: 'Không thể tạo kết quả chẩn đoán hình ảnh',
          code: 'CREATE_IMAGING_RESULT_ERROR',
          details: error,
        },
      };
    }
  }

  // Cập nhật kết quả chẩn đoán hình ảnh
  async updateImagingResult(id: number, data: any): Promise<ServiceResponse> {
    try {
      // Check if record exists
      const existing = await this.db.cN_ImagingResult.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError(
          'Không tìm thấy kết quả chẩn đoán hình ảnh',
          404,
          'IMAGING_RESULT_NOT_FOUND'
        );
      }

      const result = await this.db.cN_ImagingResult.update({
        where: { id },
        data,
      });

      logger.info(`Updated imaging result with ID: ${id}`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error(`Error updating imaging result ${id}:`, error);
      return {
        success: false,
        error: {
          message:
            error instanceof AppError
              ? error.message
              : 'Không thể cập nhật kết quả chẩn đoán hình ảnh',
          code: 'UPDATE_IMAGING_RESULT_ERROR',
          details: error,
        },
      };
    }
  }

  // Xóa kết quả chẩn đoán hình ảnh
  async deleteImagingResult(id: number): Promise<ServiceResponse> {
    try {
      // Check if record exists
      const existing = await this.db.cN_ImagingResult.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError(
          'Không tìm thấy kết quả chẩn đoán hình ảnh',
          404,
          'IMAGING_RESULT_NOT_FOUND'
        );
      }

      await this.db.cN_ImagingResult.delete({
        where: { id },
      });

      logger.info(`Deleted imaging result with ID: ${id}`);

      return {
        success: true,
        data: { message: 'Đã xóa kết quả chẩn đoán hình ảnh thành công' },
      };
    } catch (error) {
      logger.error(`Error deleting imaging result ${id}:`, error);
      return {
        success: false,
        error: {
          message:
            error instanceof AppError ? error.message : 'Không thể xóa kết quả chẩn đoán hình ảnh',
          code: 'DELETE_IMAGING_RESULT_ERROR',
          details: error,
        },
      };
    }
  }

  // Lấy dữ liệu ảnh kết quả
  async getImagingResultData(resultId: number): Promise<ServiceResponse> {
    try {
      const data = await this.db.cN_ImagingResultData.findFirst({
        where: { resultId },
      });

      if (!data) {
        throw new AppError('Không tìm thấy dữ liệu ảnh', 404, 'IMAGING_DATA_NOT_FOUND');
      }

      logger.info(`Retrieved imaging data for result ID: ${resultId}`);

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error(`Error getting imaging data for result ${resultId}:`, error);
      return {
        success: false,
        error: {
          message: error instanceof AppError ? error.message : 'Không thể lấy dữ liệu ảnh',
          code: 'GET_IMAGING_DATA_ERROR',
          details: error,
        },
      };
    }
  }

  // Lưu dữ liệu ảnh kết quả
  async saveImagingResultData(data: {
    resultId: number;
    resultData?: Buffer;
    conclusionData?: Buffer;
    suggestionData?: Buffer;
    createdBy?: string;
  }): Promise<ServiceResponse> {
    try {
      const result = await this.db.cN_ImagingResultData.create({
        data,
      });

      logger.info(`Saved imaging data for result ID: ${data.resultId}`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error('Error saving imaging data:', error);
      return {
        success: false,
        error: {
          message: 'Không thể lưu dữ liệu ảnh',
          code: 'SAVE_IMAGING_DATA_ERROR',
          details: error,
        },
      };
    }
  }

  // Thống kê kết quả chẩn đoán theo loại
  async getImagingStatistics(): Promise<ServiceResponse> {
    try {
      const stats = await this.db.cN_ImagingResult.groupBy({
        by: ['pathologyType'],
        _count: {
          id: true,
        },
      });

      const pathologyTypeNames: { [key: number]: string } = {
        1: 'X-quang',
        2: 'CT',
        3: 'MRI',
        4: 'Siêu âm',
        5: 'Chụp vú',
        6: 'Nội soi',
      };

      const formattedStats = stats.map(stat => ({
        pathologyType: stat.pathologyType,
        pathologyTypeName: pathologyTypeNames[stat.pathologyType || 0] || 'Không xác định',
        count: stat._count.id,
      }));

      logger.info('Retrieved imaging statistics');

      return {
        success: true,
        data: formattedStats,
      };
    } catch (error) {
      logger.error('Error getting imaging statistics:', error);
      return {
        success: false,
        error: {
          message: 'Không thể lấy thống kê',
          code: 'GET_STATISTICS_ERROR',
          details: error,
        },
      };
    }
  }
}
