import { Router } from 'express';
import { predictionController } from '../controllers/prediction.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  generatePredictionSchema,
  filterPredictionsSchema,
} from '../validators/prediction.validator';

const router = Router();

router.post(
  '/generate',
  authenticate,
  validate(generatePredictionSchema),
  predictionController.generatePrediction.bind(predictionController)
);



router.get(
  '/',
  authenticate,
  validate(filterPredictionsSchema, 'query'),
  predictionController.getPredictions.bind(predictionController)
);

router.get(
  '/insights',
  authenticate,
  predictionController.getInsights.bind(predictionController)
);

export default router;
