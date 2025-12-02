import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  filterCategoriesSchema,
} from '../validators/category.validator';

const router = Router();

/**
 * Todas las rutas de categorías requieren autenticación
 */

/**
 * @route   GET /api/v1/categories/stats
 * @desc    Obtener estadísticas de categorías
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  categoryController.getCategoryStats.bind(categoryController)
);

/**
 * @route   GET /api/v1/categories
 * @desc    Obtener todas las categorías (del sistema + personalizadas del usuario)
 * @query   type=income|expense - Filtrar por tipo
 * @query   isDefault=true|false - Filtrar por categorías del sistema o personalizadas
 * @query   search=texto - Buscar por nombre
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validate(filterCategoriesSchema),
  categoryController.getAllCategories.bind(categoryController)
);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Obtener una categoría por ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  categoryController.getCategoryById.bind(categoryController)
);

/**
 * @route   POST /api/v1/categories
 * @desc    Crear una nueva categoría personalizada
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(createCategorySchema),
  categoryController.createCategory.bind(categoryController)
);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Actualizar una categoría personalizada
 * @access  Private (solo categorías propias)
 */
router.put(
  '/:id',
  authenticate,
  validate(updateCategorySchema),
  categoryController.updateCategory.bind(categoryController)
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Eliminar una categoría personalizada
 * @access  Private (solo categorías propias)
 */
router.delete(
  '/:id',
  authenticate,
  categoryController.deleteCategory.bind(categoryController)
);

export default router;
