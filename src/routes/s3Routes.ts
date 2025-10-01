import { Router } from 'express';
import { S3Controller } from '../controllers/s3Controller';

const router = Router();

/**
 * @route GET /api/s3/file-info/:filename
 * @desc Lấy thông tin file từ S3
 * @access Public
 */
router.get('/file-info/:filename', S3Controller.getFileInfo);

/**
 * @route GET /api/s3/download-url/:filename
 * @desc Tạo signed URL để tải file từ S3
 * @query expiresIn - Thời gian hết hạn (giây), mặc định 3600
 * @access Public
 */
router.get('/download-url/:filename', S3Controller.getDownloadUrl);

/**
 * @route GET /api/s3/download/:filename
 * @desc Tải file trực tiếp từ S3
 * @access Public
 */
router.get('/download/:filename', S3Controller.downloadFile);

/**
 * @route GET /api/s3/file/:filename
 * @desc Lấy file với thông tin đầy đủ (bao gồm signed URL)
 * @query includeSignedUrl - Có tạo signed URL không (true/false), mặc định true
 * @access Public
 */
router.get('/file/:filename', S3Controller.getFileWithInfo);

/**
 * @route GET /api/s3/redirect/:filename
 * @desc Redirect đến signed URL để tải file
 * @query expiresIn - Thời gian hết hạn (giây), mặc định 3600
 * @access Public
 */
router.get('/redirect/:filename', S3Controller.redirectToFile);

export default router;
