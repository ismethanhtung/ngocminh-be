import { Router } from 'express';
import { HAController } from '../controllers/haController';

const router = Router();
const controller = new HAController();

// 1) ViewHAResult by FileNum
router.get('/results', controller.getResultsByFileNum);

// 2) Clinical items by ResultId
router.get('/clinical-items/:resultId', controller.getClinicalItems);

// 3) Pathology by ResultId
router.get('/pathology/:resultId', controller.getPathology);

// 4) Imaging chain by ItemNum
router.get('/imaging', controller.getImagingChain);

export { router as haRoutes };
