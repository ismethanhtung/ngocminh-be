import { Router } from 'express';
import { ViewImageFileNameController } from '../controllers/viewImageFileNameController';

const router = Router();

/**
 * @route GET /api/view-image-file-name
 * @desc Lấy tất cả data trong viewImageFileName hoặc filter theo itemNum
 * @query itemNum - ItemNum để filter (optional)
 * @access Public
 */
router.get('/', ViewImageFileNameController.getImageFileNameData);

/**
 * @route GET /api/view-image-file-name/:itemNum
 * @desc Lấy tất cả data trong viewImageFileName theo itemNum
 * @access Public
 */
router.get('/:itemNum', ViewImageFileNameController.getImageFileNameByItemNum);

/**
 * @route GET /api/view-image-file-name/structure
 * @desc Lấy cấu trúc của view viewImageFileName
 * @access Public
 */
router.get('/structure', ViewImageFileNameController.getViewImageFileNameStructure);

export default router;
