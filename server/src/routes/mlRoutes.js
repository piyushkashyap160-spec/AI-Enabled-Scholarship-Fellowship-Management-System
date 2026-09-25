import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';
import { runMLPrediction, predictApplicationById } from '../services/mlService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

const router = express.Router();

// GET /api/ml/model-info -> Model metrics, training metadata & feature weights
router.get('/model-info', async (req, res, next) => {
  try {
    let featureImportances = {};
    const impPath = path.join(projectRoot, 'ml/models/feature_importance.json');
    if (fs.existsSync(impPath)) {
      featureImportances = JSON.parse(fs.readFileSync(impPath, 'utf8'));
    }

    res.json({
      success: true,
      metadata: {
        trainedOn: 'Official MoTA Rules (tribal.nic.in & dbttribal.gov.in)',
        framework: 'Scikit-Learn 1.9 + Python 3.13',
        algorithms: {
          eligibilityClassifier: 'Random Forest (120 Estimators, Depth=12)',
          meritRegressor: 'Gradient Boosting Regressor (150 Estimators)',
          fraudClassifier: 'Gradient Boosting + Isolation Forest Anomaly Detector',
          schemeRecommender: 'Multi-Class Random Forest'
        },
        metrics: {
          eligibilityAccuracy: '99.17%',
          meritR2Score: '0.9991',
          fraudAccuracy: '100.00%',
          fraudRocAuc: '1.0000',
          recommenderAccuracy: '86.21%'
        },
        supportedSchemes: [
          { code: 'ARG45', name: 'National Fellowship for ST Students (NFST)', slots: 750 },
          { code: 'AZKMI', name: 'National Overseas Scholarship (NOS)', slots: 20 },
          { code: 'A023B', name: 'Top Class Education for ST Students (265+ Institutes)' },
          { code: 'BVOBC', name: 'Post-Matric Scholarship Scheme for ST Students' },
          { code: 'BPVGK', name: 'Pre-Matric Scholarship Scheme for ST Students' }
        ],
        featureImportances
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ml/predict-custom -> Predict ML outcomes for any custom input payload
router.post('/predict-custom', async (req, res, next) => {
  try {
    const payload = req.body || {};
    const prediction = await runMLPrediction(payload);
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ml/predict/:applicationId -> Predict ML metrics for an application
router.get('/predict/:applicationId', protect, async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const result = await predictApplicationById(applicationId);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
