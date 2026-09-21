import express from 'express';
import {
  getMeritList,
  publishMeritList,
  overrideApplicationStatus,
  getAnomalies,
  getAuditLogs,
  verifyAuditTrail,
  getUsers,
  updateUserRole
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('admin'));

router.get('/merit/:schemeId', getMeritList);
router.post('/merit/:schemeId/publish', publishMeritList);
router.post('/applications/:id/override', overrideApplicationStatus);
router.get('/anomalies', getAnomalies);
router.get('/audit/verify', verifyAuditTrail);
router.get('/audit', getAuditLogs);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);

export default router;
