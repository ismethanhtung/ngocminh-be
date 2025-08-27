import { Router } from 'express';
import { FileNumController } from '../controllers/fileNumController';

const router = Router();
const fileNumController = new FileNumController();

// Trang chính để tìm kiếm FileNum
router.get('/', fileNumController.showFileNumSearch);

// API để tìm kiếm FileNum (trả về JSON)
router.get('/api/search', fileNumController.searchFileNum);

// Trang tìm kiếm với kết quả (render server-side)
router.get('/search', fileNumController.searchFileNumPage);

export default router;
