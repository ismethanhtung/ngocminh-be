import { Request, Response } from 'express';
import { S3Service } from '../services/s3Service';
import { logger } from '../config/logger';
import { Readable } from 'stream';
import { uploadMultiple, uploadSingle } from '../middleware/upload';
import type { RequestHandler } from 'express';
import { S3Service } from '../services/s3Service';

export class S3Controller {
  /**
   * Lấy thông tin file từ S3
   * GET /api/s3/file-info/:filename
   */
  static async getFileInfo(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;

      if (!filename) {
        res.status(400).json({
          success: false,
          message: 'Tên file là bắt buộc',
        });
        return;
      }

      const fileInfo = await S3Service.getFileInfo(filename);

      if (!fileInfo.exists) {
        res.status(404).json({
          success: false,
          message: 'File không tồn tại trong S3',
          data: fileInfo,
        });
        return;
      }

      res.json({
        success: true,
        message: 'Lấy thông tin file thành công',
        data: fileInfo,
      });
    } catch (error: any) {
      logger.error('Lỗi trong getFileInfo:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin file',
        error: error.message,
      });
    }
  }

  /**
   * Tạo signed URL để tải file từ S3
   * GET /api/s3/download-url/:filename
   */
  static async getDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const { expiresIn } = req.query;

      if (!filename) {
        res.status(400).json({
          success: false,
          message: 'Tên file là bắt buộc',
        });
        return;
      }

      const expiresInSeconds = expiresIn ? parseInt(expiresIn as string, 10) : 3600;

      if (isNaN(expiresInSeconds) || expiresInSeconds <= 0) {
        res.status(400).json({
          success: false,
          message: 'Thời gian hết hạn phải là số dương',
        });
        return;
      }

      const signedUrl = await S3Service.getSignedDownloadUrl(filename, expiresInSeconds);

      if (!signedUrl) {
        res.status(404).json({
          success: false,
          message: 'File không tồn tại trong S3',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Tạo signed URL thành công',
        data: {
          filename,
          signedUrl,
          expiresIn: expiresInSeconds,
        },
      });
    } catch (error: any) {
      logger.error('Lỗi trong getDownloadUrl:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo signed URL',
        error: error.message,
      });
    }
  }

  /**
   * Tải file trực tiếp từ S3
   * GET /api/s3/download/:filename
   */
  static async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;

      if (!filename) {
        res.status(400).json({
          success: false,
          message: 'Tên file là bắt buộc',
        });
        return;
      }

      // Lấy thông tin file trước
      const fileInfo = await S3Service.getFileInfo(filename);

      if (!fileInfo.exists) {
        res.status(404).json({
          success: false,
          message: 'File không tồn tại trong S3',
        });
        return;
      }

      // Lấy file stream
      const fileStream = await S3Service.getFileStream(filename);

      if (!fileStream) {
        res.status(404).json({
          success: false,
          message: 'Không thể tải file từ S3',
        });
        return;
      }

      // Set headers
      res.setHeader('Content-Type', fileInfo.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      if (fileInfo.size) {
        res.setHeader('Content-Length', fileInfo.size.toString());
      }

      // Pipe file stream to response
      if (fileStream instanceof Readable) {
        fileStream.pipe(res);
      } else if (fileStream && 'transformToByteArray' in fileStream) {
        // Handle AWS SDK stream
        try {
          const chunks: Uint8Array[] = [];
          const reader = (fileStream as any).getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }

          const buffer = Buffer.concat(chunks);
          res.send(buffer);
        } catch (error) {
          logger.error('Lỗi khi đọc file stream:', error);
          res.status(500).end();
        }
      } else {
        // Fallback - try to send as buffer
        try {
          const buffer = Buffer.from(await (fileStream as any).arrayBuffer());
          res.send(buffer);
        } catch (error) {
          logger.error('Lỗi khi xử lý file stream:', error);
          res.status(500).json({
            success: false,
            message: 'Không thể xử lý file stream',
          });
        }
      }
    } catch (error: any) {
      logger.error('Lỗi trong downloadFile:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tải file',
        error: error.message,
      });
    }
  }

  /**
   * Upload 1 file lên S3
   * POST /api/s3/upload (field: file)
   */
  static uploadSingleToS3: RequestHandler[] = [
    uploadSingle('file', 'memory'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const file = req.file;
        const { prefix } = req.body;

        if (!file) {
          res
            .status(400)
            .json({ success: false, message: 'Vui lòng gửi file với field name "file"' });
          return;
        }

        const uploaded = await S3Service.uploadMulterFile(file, { prefix });
        res.json({ success: true, message: 'Upload thành công', data: uploaded });
      } catch (error: any) {
        logger.error('Lỗi uploadSingleToS3:', error);
        res
          .status(500)
          .json({ success: false, message: 'Lỗi server khi upload', error: error.message });
      }
    },
  ];

  /**
   * Upload nhiều file lên S3
   * POST /api/s3/upload-multiple (field: files)
   */
  static uploadMultipleToS3: RequestHandler[] = [
    uploadMultiple('files', 10, 'memory'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const files = (req.files as Express.Multer.File[]) || [];
        const { prefix } = req.body;

        if (!files.length) {
          res.status(400).json({
            success: false,
            message: 'Vui lòng gửi ít nhất 1 file với field name "files"',
          });
          return;
        }

        const uploaded = await S3Service.uploadMulterFiles(files, { prefix });
        res.json({ success: true, message: 'Upload nhiều file thành công', data: uploaded });
      } catch (error: any) {
        logger.error('Lỗi uploadMultipleToS3:', error);
        res.status(500).json({
          success: false,
          message: 'Lỗi server khi upload nhiều file',
          error: error.message,
        });
      }
    },
  ];

  /**
   * Lấy file với thông tin đầy đủ (bao gồm signed URL)
   * GET /api/s3/file/:filename
   */
  static async getFileWithInfo(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const { includeSignedUrl = 'true' } = req.query;

      if (!filename) {
        res.status(400).json({
          success: false,
          message: 'Tên file là bắt buộc',
        });
        return;
      }

      const shouldIncludeSignedUrl = includeSignedUrl === 'true';
      const fileInfo = await S3Service.getFileWithInfo(filename, shouldIncludeSignedUrl);

      if (!fileInfo.exists) {
        res.status(404).json({
          success: false,
          message: 'File không tồn tại trong S3',
          data: fileInfo,
        });
        return;
      }

      res.json({
        success: true,
        message: 'Lấy thông tin file thành công',
        data: fileInfo,
      });
    } catch (error: any) {
      logger.error('Lỗi trong getFileWithInfo:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin file',
        error: error.message,
      });
    }
  }

  /**
   * Redirect đến signed URL để tải file
   * GET /api/s3/redirect/:filename
   */
  static async redirectToFile(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const { expiresIn } = req.query;

      if (!filename) {
        res.status(400).json({
          success: false,
          message: 'Tên file là bắt buộc',
        });
        return;
      }

      const expiresInSeconds = expiresIn ? parseInt(expiresIn as string, 10) : 3600;
      const signedUrl = await S3Service.getSignedDownloadUrl(filename, expiresInSeconds);

      if (!signedUrl) {
        res.status(404).json({
          success: false,
          message: 'File không tồn tại trong S3',
        });
        return;
      }

      // Redirect đến signed URL
      res.redirect(signedUrl);
    } catch (error: any) {
      logger.error('Lỗi trong redirectToFile:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo redirect URL',
        error: error.message,
      });
    }
  }
}
