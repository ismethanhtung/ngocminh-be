import { Router } from 'express';
import Joi from 'joi';
import { validate, commonSchemas, imagingSchemas } from '../middleware/validation';
import { catchAsync } from '../middleware/error';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';
import { logger } from '../config/logger';

const router = Router();

/**
 * @route GET /api/v1/pacs/requests
 * @desc Lấy danh sách yêu cầu PACS
 * @access Public
 */
router.get(
  '/requests',
  validate({ query: commonSchemas.pagination }),
  catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      patientId,
      modality,
      status,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { patientId: { contains: search as string, mode: 'insensitive' } },
        { studyId: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (patientId) where.patientId = patientId as string;
    if (modality) where.modality = modality as string;
    if (status) where.status = parseInt(status as string);

    const [total, requests] = await Promise.all([
      prisma.pACS_RequestInfo.count({ where }),
      prisma.pACS_RequestInfo.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' },
      }),
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Lấy danh sách yêu cầu PACS thành công',
      data: requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };

    logger.info(`Retrieved ${requests.length} PACS requests`);
    res.status(200).json(response);
  })
);

/**
 * @route GET /api/v1/pacs/requests/:id
 * @desc Lấy yêu cầu PACS theo ID
 * @access Public
 */
router.get(
  '/requests/:id',
  validate({ params: commonSchemas.id }),
  catchAsync(async (req, res) => {
    const id = parseInt(req.params.id);

    const request = await prisma.pACS_RequestInfo.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu PACS',
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Lấy yêu cầu PACS thành công',
      data: request,
    };

    logger.info(`Retrieved PACS request with ID: ${id}`);
    res.status(200).json(response);
  })
);

/**
 * @route POST /api/v1/pacs/requests
 * @desc Tạo yêu cầu PACS mới
 * @access Public
 */
router.post(
  '/requests',
  validate({ body: imagingSchemas.createPACSRequest }),
  catchAsync(async (req, res) => {
    const data = req.body;

    const request = await prisma.pACS_RequestInfo.create({
      data: {
        ...data,
        status: data.status || 1, // Default to active
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Tạo yêu cầu PACS thành công',
      data: request,
    };

    logger.info(`Created new PACS request with ID: ${request.id}`);
    res.status(201).json(response);
  })
);

/**
 * @route PUT /api/v1/pacs/requests/:id
 * @desc Cập nhật yêu cầu PACS
 * @access Public
 */
router.put(
  '/:id',
  validate({ params: commonSchemas.id }),
  catchAsync(async (req, res) => {
    const id = parseInt(req.params.id);
    const data = req.body;

    const existing = await prisma.pACS_RequestInfo.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu PACS',
      });
    }

    const request = await prisma.pACS_RequestInfo.update({
      where: { id },
      data,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Cập nhật yêu cầu PACS thành công',
      data: request,
    };

    logger.info(`Updated PACS request with ID: ${id}`);
    res.status(200).json(response);
  })
);

/**
 * @route DELETE /api/v1/pacs/requests/:id
 * @desc Xóa yêu cầu PACS
 * @access Public
 */
router.delete(
  '/requests/:id',
  validate({ params: commonSchemas.id }),
  catchAsync(async (req, res) => {
    const id = parseInt(req.params.id);

    const existing = await prisma.pACS_RequestInfo.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu PACS',
      });
    }

    await prisma.pACS_RequestInfo.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Xóa yêu cầu PACS thành công',
    };

    logger.info(`Deleted PACS request with ID: ${id}`);
    res.status(200).json(response);
  })
);

/**
 * @route GET /api/v1/pacs/modalities
 * @desc Lấy danh sách các modality được sử dụng
 * @access Public
 */
router.get(
  '/modalities',
  catchAsync(async (req, res) => {
    const modalities = await prisma.pACS_RequestInfo.findMany({
      select: {
        modality: true,
      },
      distinct: ['modality'],
      where: {
        modality: {
          not: null,
        },
      },
    });

    const modalityList = modalities
      .map(m => m.modality)
      .filter(Boolean)
      .sort();

    const response: ApiResponse = {
      success: true,
      message: 'Lấy danh sách modality thành công',
      data: modalityList,
    };

    logger.info(`Retrieved ${modalityList.length} modalities`);
    res.status(200).json(response);
  })
);

/**
 * @route GET /api/v1/pacs/statistics
 * @desc Thống kê yêu cầu PACS theo modality
 * @access Public
 */
router.get(
  '/statistics',
  catchAsync(async (req, res) => {
    const stats = await prisma.pACS_RequestInfo.groupBy({
      by: ['modality', 'status'],
      _count: {
        id: true,
      },
    });

    const formattedStats = stats.reduce((acc: any, stat) => {
      const modality = stat.modality || 'Unknown';
      const status = stat.status === 1 ? 'Active' : 'Archived';

      if (!acc[modality]) {
        acc[modality] = { total: 0, active: 0, archived: 0 };
      }

      acc[modality].total += stat._count.id;
      if (status === 'Active') {
        acc[modality].active += stat._count.id;
      } else {
        acc[modality].archived += stat._count.id;
      }

      return acc;
    }, {});

    const response: ApiResponse = {
      success: true,
      message: 'Lấy thống kê PACS thành công',
      data: formattedStats,
    };

    logger.info('Retrieved PACS statistics');
    res.status(200).json(response);
  })
);

export { router as pacsRoutes };
