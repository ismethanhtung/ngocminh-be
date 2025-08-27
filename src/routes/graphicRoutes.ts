import { Router } from 'express';
import Joi from 'joi';
import { validate, commonSchemas, imagingSchemas } from '../middleware/validation';
import { uploadSingle } from '../middleware/upload';
import { catchAsync } from '../middleware/error';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';
import { logger } from '../config/logger';

const router = Router();

/**
 * @route GET /api/v1/graphics
 * @desc Lấy danh sách hình ảnh đồ họa
 * @access Public
 */
router.get(
  '/',
  validate({ query: commonSchemas.pagination }),
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      patientId,
      graphicType,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { fileName: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (patientId) where.patientId = patientId as string;
    if (graphicType) where.graphicType = graphicType as string;

    // Mock data for testing
    const total = 0;
    const graphics: any[] = [];
    // const [total, graphics] = await Promise.all([
    //   prisma.cN_Graphic.count({ where }),
    //   prisma.cN_Graphic.findMany({
    //     where,
    //     skip,
    //     take: Number(limit),
    //     orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' },
    //   }),
    // ]);

    const response: ApiResponse = {
      success: true,
      message: 'Lấy danh sách hình ảnh đồ họa thành công',
      data: graphics,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };

    logger.info(`Retrieved ${graphics.length} graphics`);
    res.status(200).json(response);
  })
);

/**
 * @route GET /api/v1/graphics/:id
 * @desc Lấy hình ảnh đồ họa theo ID
 * @access Public
 */
router.get(
  '/:id',
  validate({ params: commonSchemas.id }),
  catchAsync(async (req, res) => {
    const id = parseInt(req.params.id);

    const graphic = await prisma.cN_Graphic.findUnique({
      where: { id },
    });

    if (!graphic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hình ảnh đồ họa',
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Lấy hình ảnh đồ họa thành công',
      data: graphic,
    };

    logger.info(`Retrieved graphic with ID: ${id}`);
    res.status(200).json(response);
  })
);

/**
 * @route POST /api/v1/graphics
 * @desc Tạo hình ảnh đồ họa mới
 * @access Public
 */
router.post(
  '/',
  uploadSingle('file', 'graphics'),
  validate({ body: imagingSchemas.createGraphic }),
  catchAsync(async (req, res) => {
    const { patientId, graphicType, description, createdBy } = req.body;
    const file = req.file;

    const graphicData: any = {
      patientId,
      graphicType,
      description,
      createdBy,
    };

    if (file) {
      graphicData.fileName = file.originalname;
      graphicData.filePath = file.path;
      graphicData.fileSize = file.size;
      graphicData.mimeType = file.mimetype;
    }

    const graphic = await prisma.cN_Graphic.create({
      data: graphicData,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Tạo hình ảnh đồ họa thành công',
      data: graphic,
    };

    logger.info(`Created new graphic with ID: ${graphic.id}`);
    res.status(201).json(response);
  })
);

/**
 * @route PUT /api/v1/graphics/:id
 * @desc Cập nhật hình ảnh đồ họa
 * @access Public
 */
router.put(
  '/:id',
  validate({ params: commonSchemas.id }),
  uploadSingle('file', 'graphics'),
  catchAsync(async (req, res) => {
    const id = parseInt(req.params.id);
    const { graphicType, description } = req.body;
    const file = req.file;

    const existing = await prisma.cN_Graphic.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hình ảnh đồ họa',
      });
    }

    const updateData: any = {
      graphicType,
      description,
    };

    if (file) {
      updateData.fileName = file.originalname;
      updateData.filePath = file.path;
      updateData.fileSize = file.size;
      updateData.mimeType = file.mimetype;
    }

    const graphic = await prisma.cN_Graphic.update({
      where: { id },
      data: updateData,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Cập nhật hình ảnh đồ họa thành công',
      data: graphic,
    };

    logger.info(`Updated graphic with ID: ${id}`);
    res.status(200).json(response);
  })
);

/**
 * @route DELETE /api/v1/graphics/:id
 * @desc Xóa hình ảnh đồ họa
 * @access Public
 */
router.delete(
  '/:id',
  validate({ params: commonSchemas.id }),
  catchAsync(async (req, res) => {
    const id = parseInt(req.params.id);

    const existing = await prisma.cN_Graphic.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hình ảnh đồ họa',
      });
    }

    await prisma.cN_Graphic.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Xóa hình ảnh đồ họa thành công',
    };

    logger.info(`Deleted graphic with ID: ${id}`);
    res.status(200).json(response);
  })
);

export { router as graphicRoutes };
