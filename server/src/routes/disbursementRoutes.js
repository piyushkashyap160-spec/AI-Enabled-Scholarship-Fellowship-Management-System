import express from 'express';
import {
  getMyDisbursements,
  uploadProgressReport,
  releaseDisbursement,
  getPendingDisbursements,
  getDisbursementReport
} from '../controllers/disbursementController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/mine', getMyDisbursements);
router.get('/pending', requireRole('officer', 'admin'), getPendingDisbursements);
router.post('/:id/report', upload.single('file'), uploadProgressReport);
router.get('/:id/report', getDisbursementReport);
router.post('/:id/release', requireRole('officer', 'admin'), releaseDisbursement);

export default router;
