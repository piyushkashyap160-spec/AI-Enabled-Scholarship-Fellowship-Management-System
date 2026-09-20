import express from 'express';
import { getScrutinyList, makeEligibilityDecision, recommendForMerit } from '../controllers/officerController.js';
import { getMeritList } from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('officer', 'admin'));

router.get('/scrutiny', getScrutinyList);
router.get('/merit/:schemeId', getMeritList);
router.post('/applications/:id/eligibility-decision', makeEligibilityDecision);
router.post('/applications/:id/recommend', recommendForMerit);

export default router;
