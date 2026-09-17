import express from 'express';
import { getSchemes, getSchemeById, createScheme, updateScheme, testRules } from '../controllers/schemeController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

router.get('/', getSchemes);
router.get('/:id', getSchemeById);
router.post('/', protect, requireRole('admin'), createScheme);
router.put('/:id', protect, requireRole('admin'), updateScheme);
router.post('/:id/test-rules', protect, requireRole('admin'), testRules);

export default router;
