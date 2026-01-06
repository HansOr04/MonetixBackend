import { injectable, inject } from 'inversify';
import { ICategoryService } from './interfaces/ICategoryService';
import { ICategory } from '../models/Category.model';
import { ICategoryRepository } from '../repositories/interfaces/ICategoryRepository';
import { CreateCategoryDTO, UpdateCategoryDTO, CategoryFilter } from '../dtos/category.dto';

@injectable()
export class CategoryService implements ICategoryService {
  constructor(
    @inject(Symbol.for('ICategoryRepository')) private categoryRepo: ICategoryRepository
  ) { }

  async getAllCategories(userId: string, filter?: CategoryFilter): Promise<ICategory[]> {
    return this.categoryRepo.findByUser(userId, filter);
  }

  async getCategoryById(userId: string, id: string): Promise<ICategory | null> {
    const category = await this.categoryRepo.findAccessibleByUser(userId, id);
    return category;
  }

  async createCategory(
    userId: string,
    userRole: string,
    data: Omit<CreateCategoryDTO, 'userId' | 'isDefault'>
  ): Promise<ICategory> {
    const isAdmin = userRole === 'admin';

    // Verificar si ya existe una categoría con el mismo nombre y tipo
    const existingCategory = await this.categoryRepo.findByName(
      data.name,
      data.type,
      isAdmin ? undefined : userId
    );

    if (existingCategory) {
      throw new Error(`Ya existe una categoría "${data.name}" de tipo "${data.type}"`);
    }

    // Crear nueva categoría
    return this.categoryRepo.create({
      ...data,
      userId: isAdmin ? null : userId,
      isDefault: isAdmin,
    });
  }

  async updateCategory(userId: string, id: string, data: UpdateCategoryDTO): Promise<ICategory | null> {
    // Buscar la categoría
    const category = await this.categoryRepo.findById(id);

    if (!category || category.userId?.toString() !== userId) {
      return null;
    }

    // No permitir actualizar categorías del sistema
    if (category.isDefault) {
      throw new Error('No puedes modificar categorías predeterminadas del sistema');
    }

    // Si se está cambiando el nombre o tipo, verificar que no exista otra categoría
    if (data.name || data.type) {
      const checkName = data.name || category.name;
      const checkType = data.type || category.type;

      const existingCategory = await this.categoryRepo.findByName(checkName, checkType, userId);

      if (existingCategory && existingCategory._id.toString() !== id) {
        throw new Error(`Ya existe otra categoría "${checkName}" de tipo "${checkType}"`);
      }
    }

    // Actualizar la categoría
    return this.categoryRepo.update(id, userId, data);
  }

  async deleteCategory(userId: string, id: string): Promise<{ id: string; name: string }> {
    // Buscar la categoría
    const category = await this.categoryRepo.findById(id);

    if (!category || category.userId?.toString() !== userId) {
      throw new Error('Categoría no encontrada o no tienes permiso para eliminarla');
    }

    // No permitir eliminar categorías del sistema
    if (category.isDefault) {
      throw new Error('No puedes eliminar categorías predeterminadas del sistema');
    }

    // Eliminar la categoría
    const deleted = await this.categoryRepo.delete(id, userId);

    if (!deleted) {
      throw new Error('No se pudo eliminar la categoría');
    }

    return {
      id: category._id.toString(),
      name: category.name,
    };
  }

  async getCategoryStats(userId: string): Promise<{
    total: number;
    income: number;
    expense: number;
    custom: number;
    default: number;
  }> {
    return this.categoryRepo.getStats(userId);
  }
}
