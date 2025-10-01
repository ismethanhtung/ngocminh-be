import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env';
import { logger } from '../config/logger';

// Khởi tạo S3 client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export interface S3FileInfo {
  filename: string;
  size?: number;
  lastModified?: Date;
  contentType?: string;
  signedUrl?: string;
  exists: boolean;
}

export class S3Service {
  /**
   * Lấy thông tin file từ S3
   * @param filename - Tên file trong S3
   * @returns Thông tin file hoặc null nếu không tồn tại
   */
  static async getFileInfo(filename: string): Promise<S3FileInfo> {
    try {
      const command = new HeadObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: filename,
      });

      const response = await s3Client.send(command);

      return {
        filename,
        size: response.ContentLength,
        lastModified: response.LastModified,
        contentType: response.ContentType,
        exists: true,
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return {
          filename,
          exists: false,
        };
      }

      logger.error('Lỗi khi lấy thông tin file từ S3:', error);
      throw new Error(`Lỗi khi lấy thông tin file: ${error.message}`);
    }
  }

  /**
   * Tạo signed URL để tải file từ S3
   * @param filename - Tên file trong S3
   * @param expiresIn - Thời gian hết hạn (giây), mặc định 3600 (1 giờ)
   * @returns Signed URL hoặc null nếu file không tồn tại
   */
  static async getSignedDownloadUrl(
    filename: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    try {
      // Kiểm tra file có tồn tại không
      const fileInfo = await this.getFileInfo(filename);
      if (!fileInfo.exists) {
        return null;
      }

      const command = new GetObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: filename,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error: any) {
      logger.error('Lỗi khi tạo signed URL:', error);
      throw new Error(`Lỗi khi tạo signed URL: ${error.message}`);
    }
  }

  /**
   * Lấy file stream từ S3
   * @param filename - Tên file trong S3
   * @returns Stream của file hoặc null nếu không tồn tại
   */
  static async getFileStream(filename: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: filename,
      });

      const response = await s3Client.send(command);
      return response.Body;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return null;
      }

      logger.error('Lỗi khi lấy file stream từ S3:', error);
      throw new Error(`Lỗi khi lấy file: ${error.message}`);
    }
  }

  /**
   * Lấy file với thông tin đầy đủ (bao gồm signed URL)
   * @param filename - Tên file trong S3
   * @param includeSignedUrl - Có tạo signed URL không
   * @returns Thông tin file đầy đủ
   */
  static async getFileWithInfo(
    filename: string,
    includeSignedUrl: boolean = true
  ): Promise<S3FileInfo> {
    const fileInfo = await this.getFileInfo(filename);

    if (fileInfo.exists && includeSignedUrl) {
      const signedUrl = await this.getSignedDownloadUrl(filename);
      fileInfo.signedUrl = signedUrl || undefined;
    }

    return fileInfo;
  }
}
