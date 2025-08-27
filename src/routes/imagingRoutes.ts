import { Router } from 'express';
import Joi from 'joi';
import { ImagingController } from '../controllers/imagingController';
import { validate, commonSchemas, imagingSchemas } from '../middleware/validation';
import { uploadFields } from '../middleware/upload';

const router = Router();
const imagingController = new ImagingController();

// Upload fields configuration for imaging data
const uploadImageFields = [
  { name: 'resultImage', maxCount: 1 },
  { name: 'conclusionImage', maxCount: 1 },
  { name: 'suggestionImage', maxCount: 1 },
];

/**
 * @route GET /api/v1/imaging/results
 * @desc Lấy danh sách kết quả chẩn đoán hình ảnh
 * @access Public
 * @query page, limit, sortBy, sortOrder, search, patientId, pathologyType, status, doctorId
 */
router.get(
  '/results',
  validate({ query: commonSchemas.pagination }),
  imagingController.getImagingResults
);

/**
 * @route GET /api/v1/imaging/results/:id
 * @desc Lấy kết quả chẩn đoán hình ảnh theo ID
 * @access Public
 */
router.get(
  '/results/:id',
  validate({ params: commonSchemas.id }),
  imagingController.getImagingResultById
);

/**
 * @route POST /api/v1/imaging/results
 * @desc Tạo kết quả chẩn đoán hình ảnh mới
 * @access Public
 */
router.post(
  '/results',
  validate({ body: imagingSchemas.createImagingResult }),
  imagingController.createImagingResult
);

/**
 * @route PUT /api/v1/imaging/results/:id
 * @desc Cập nhật kết quả chẩn đoán hình ảnh
 * @access Public
 */
router.put(
  '/results/:id',
  validate({
    params: commonSchemas.id,
    body: imagingSchemas.updateImagingResult,
  }),
  imagingController.updateImagingResult
);

/**
 * @route DELETE /api/v1/imaging/results/:id
 * @desc Xóa kết quả chẩn đoán hình ảnh
 * @access Public
 */
router.delete(
  '/results/:id',
  validate({ params: commonSchemas.id }),
  imagingController.deleteImagingResult
);

/**
 * @route POST /api/v1/imaging/results/:resultId/data
 * @desc Upload dữ liệu ảnh cho kết quả chẩn đoán
 * @access Public
 */
router.post(
  '/results/:resultId/data',
  validate({ params: Joi.object({ resultId: Joi.number().integer().positive().required() }) }),
  uploadFields(uploadImageFields, 'memory'),
  imagingController.uploadImagingData
);

/**
 * @route GET /api/v1/imaging/results/:resultId/data
 * @desc Lấy dữ liệu ảnh của kết quả chẩn đoán
 * @access Public
 */
router.get(
  '/results/:resultId/data',
  validate({ params: Joi.object({ resultId: Joi.number().integer().positive().required() }) }),
  imagingController.getImagingData
);

/**
 * @route GET /api/v1/imaging/results/:resultId/download/:dataType
 * @desc Download ảnh kết quả (result/conclusion/suggestion)
 * @access Public
 */
router.get(
  '/results/:resultId/download/:dataType',
  validate({
    params: Joi.object({
      resultId: Joi.number().integer().positive().required(),
      dataType: Joi.string().valid('result', 'conclusion', 'suggestion').required(),
    }),
  }),
  imagingController.downloadImagingData
);

/**
 * @route GET /api/v1/imaging/statistics
 * @desc Lấy thống kê kết quả chẩn đoán theo loại
 * @access Public
 */
router.get('/statistics', imagingController.getImagingStatistics);

export { router as imagingRoutes };
