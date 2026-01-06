import { ICategory } from '../../models/Category.model';
import { CreateCategoryDTO, UpdateCategoryDTO, CategoryFilter } from '../../dtos/category.dto';

export interface ICategoryRepository {
  // Búsqueda y consulta
  findById(id: string): Promise<ICategory | null>;
  findByUser(userId: string, filter?: CategoryFilter): Promise<ICategory[]>;
  findAccessibleByUser(userId: string, categoryId: string): Promise<ICategory | null>;
  findByName(name: string, type: 'income' | 'expense', userId?: string): Promise<ICategory | null>;

  // CRUD
  create(data: CreateCategoryDTO): Promise<ICategory>;
  update(id: string, userId: string, data: UpdateCategoryDTO): Promise<ICategory | null>;
  delete(id: string, userId: string): Promise<boolean>;

  // Utilidades
  countByUser(userId: string, filter?: CategoryFilter): Promise<number>;
  getStats(userId: string): Promise<{
    total: number;
    income: number;
    expense: number;
    custom: number;
    default: number;
  }>;
}
