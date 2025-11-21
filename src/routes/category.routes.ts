import { Router } from "express";
import { categoryController, CategoryController } from "../controllers/category.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createCategorySchema, updateCategorySchema, filterCategoriesSchame } from '../validators/category.validator';


const router = Router();

router.get(
    '/stats', 
    authenticate, 
    categoryController.getCategoryStats.bind(categoryController)
);

router.get( 
  '/',
  authenticate,
  validate(filterCategoriesSchame),
  categoryController.getAllCategories.bind(categoryController)
);

router.get(
  '/:id',
  authenticate,
  categoryController.getCategoryById.bind(categoryController)
);

router.post(
  '/',
  authenticate,
  validate(createCategorySchema),
  categoryController.createCategory.bind(categoryController)
);

router.put(
  '/:id',
  authenticate,
  validate(updateCategorySchema),
  categoryController.updateCategory.bind(categoryController)
);

router.delete(
  '/:id',
  authenticate,
  categoryController.deleteCategory.bind(categoryController)
);

export default router;


