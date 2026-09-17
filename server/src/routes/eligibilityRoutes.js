import express from 'express';
import { checkEligibility, getRecommendations } from '../controllers/eligibilityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/check', checkEligibility);
router.get('/recommend', protect, getRecommendations);

export default router;
