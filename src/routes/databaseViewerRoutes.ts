import { Router } from 'express';
import { DatabaseViewerController } from '../controllers/databaseViewerController';

const router = Router();
const dbViewerController = new DatabaseViewerController();

// Trang chính để xem database
router.get('/', dbViewerController.showDatabaseViewer);

// API để lấy dữ liệu của bảng/view
router.get('/api/table-data', dbViewerController.getTableData);

// API để lấy ảnh từ cột BLOB
router.get('/api/image', dbViewerController.getImageData);

// API để lấy thông tin cột
router.get('/api/columns', dbViewerController.getTableColumns);

export default router;
