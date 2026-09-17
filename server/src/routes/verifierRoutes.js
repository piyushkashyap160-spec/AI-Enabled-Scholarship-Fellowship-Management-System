import express from 'express';
import { getVerifierQueue, documentDecision, raiseDeficiency } from '../controllers/verifierController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('verifier', 'officer', 'admin'));

router.get('/queue', getVerifierQueue);
router.post('/documents/:id/decision', documentDecision);
router.post('/applications/:id/deficiency', raiseDeficiency);

export default router;
