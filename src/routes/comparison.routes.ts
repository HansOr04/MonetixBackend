import { Router } from 'express';
import { comparisonController } from '../controllers/comparison.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/authorize.middleware';

const router = Router();

// Comparación por categoría
router.get(
    '/category',
    authenticate,
    comparisonController.compareByCategory.bind(comparisonController)
);

// Comparación temporal
router.get(
    '/temporal',
    authenticate,
    comparisonController.compareByTime.bind(comparisonController)
);

// Comparación entre usuarios (solo admin)
router.post(
    '/users',
    authenticate,
    authorizeRoles('admin'),
    comparisonController.compareByUsers.bind(comparisonController)
);

// Comparación real vs predicho
router.get(
    '/real-vs-predicted/:predictionId',
    authenticate,
    comparisonController.compareRealVsPredicted.bind(comparisonController)
);

// Comparación por períodos
router.post(
    '/periods',
    authenticate,
    comparisonController.compareByPeriods.bind(comparisonController)
);

// Comparación entre dos categorías
router.post(
    '/compare-categories',
    authenticate,
    comparisonController.compareCategories.bind(comparisonController)
);

export default router;
