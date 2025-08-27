import { Router } from 'express';
import { imagingRoutes } from './imagingRoutes';
import { graphicRoutes } from './graphicRoutes';
import { pacsRoutes } from './pacsRoutes';
import { healthRoutes } from './healthRoutes';
import databaseViewerRoutes from './databaseViewerRoutes';
import fileNumRoutes from './fileNumRoutes';
import { haRoutes } from './haRoutes';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// Medical imaging routes
router.use('/imaging', imagingRoutes);

// Graphics and pathology routes
router.use('/graphics', graphicRoutes);

// PACS system routes
router.use('/pacs', pacsRoutes);

// Health Assessment (HA) routes
router.use('/ha', haRoutes);

// Database viewer routes
router.use('/database-viewer', databaseViewerRoutes);

// FileNum search routes
router.use('/file-num', fileNumRoutes);

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ngọc Minh Medical Backend API',
    version: '1.0.0',
    description: 'Hệ thống backend quản lý dữ liệu hình ảnh y tế',
    endpoints: {
      health: '/health',
      imaging: '/imaging',
      graphics: '/graphics',
      pacs: '/pacs',
      databaseViewer: '/database-viewer',
      fileNumSearch: '/file-num',
    },
    documentation: {
      swagger: '/docs',
      postman: '/postman',
    },
  });
});

export default router;
