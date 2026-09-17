import express from 'express';
import { getDashboardStats, getTimeseries, getByState, getFunnel } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('verifier', 'officer', 'admin'));

router.get('/stats', getDashboardStats);
router.get('/timeseries', getTimeseries);
router.get('/by-state', getByState);
router.get('/funnel', getFunnel);

export default router;
