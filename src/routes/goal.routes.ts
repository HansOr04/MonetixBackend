import { Router } from 'express';
import { goalController } from '../controllers/goal.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createGoalSchema,
  updateGoalSchema,
  updateProgressSchema,
  filterGoalsSchema,
} from '../validators/goal.validator';

const router = Router();

router.get(
  '/',
  authenticate,
  validate(filterGoalsSchema, 'query'),
  goalController.getGoals.bind(goalController)
);

router.get(
  '/:id',
  authenticate,
  goalController.getGoalById.bind(goalController)
);

router.get(
  '/:id/projection',
  authenticate,
  goalController.getProjection.bind(goalController)
);

router.post(
  '/',
  authenticate,
  validate(createGoalSchema),
  goalController.createGoal.bind(goalController)
);

router.put(
  '/:id',
  authenticate,
  validate(updateGoalSchema),
  goalController.updateGoal.bind(goalController)
);

router.put(
  '/:id/progress',
  authenticate,
  validate(updateProgressSchema),
  goalController.updateProgress.bind(goalController)
);

router.delete(
  '/:id',
  authenticate,
  goalController.deleteGoal.bind(goalController)
);

export default router;
