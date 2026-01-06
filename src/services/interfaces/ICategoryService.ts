import { ICategory } from '../../models/Category.model';
import { CreateCategoryDTO, UpdateCategoryDTO, CategoryFilter } from '../../dtos/category.dto';

export interface ICategoryService {
  getAllCategories(userId: string, filter?: CategoryFilter): Promise<ICategory[]>;

  getCategoryById(userId: string, id: string): Promise<ICategory | null>;

  createCategory(
    userId: string,
    userRole: string,
    data: Omit<CreateCategoryDTO, 'userId' | 'isDefault'>
  ): Promise<ICategory>;

  updateCategory(userId: string, id: string, data: UpdateCategoryDTO): Promise<ICategory | null>;

  deleteCategory(userId: string, id: string): Promise<{ id: string; name: string }>;

  getCategoryStats(userId: string): Promise<{
    total: number;
    income: number;
    expense: number;
    custom: number;
    default: number;
  }>;
}
