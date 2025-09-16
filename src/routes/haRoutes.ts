import { Router } from 'express';
import { HAController } from '../controllers/haController';
import { uploadMultiple } from '../middleware/upload';

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

// 5) Obstetric history by PatientId
router.get('/obstetric-history', controller.getObstetricHistory);

// 6) General exam by PatientId
router.get('/general-exam', controller.getGeneralExam);

// 7) ViewHAResult by ItemNum
router.get('/results-by-item', controller.getResultsByItemNum);

// 8) All HAData
router.get('/all-data', controller.getAllHAData);

// 9) ViewHAResultDetail by DataId
router.get('/result-detail/:dataId', controller.getHAResultDetailByDataId);

// 10) Update HA_ResultDetail by Id
router.put('/result-detail/:id', controller.updateHAResultDetail);

// 11) Upload nhiều file HA docs và cập nhật FileName theo ItemNum
router.post('/upload-ha-docs', uploadMultiple('files', 10, 'haDocs'), controller.uploadHADocuments);

// 12) Tải file theo filename
router.get('/ha-docs/:filename', controller.downloadHADocument);

// 13) ViewHAResultDetail theo ItemNum
router.get('/result-detail-by-item', controller.getHAResultDetailByItemNum);

export { router as haRoutes };
