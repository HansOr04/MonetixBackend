import { injectable } from 'inversify';
import mongoose from 'mongoose';
import { Category, ICategory } from '../models/Category.model';
import { ICategoryRepository } from './interfaces/ICategoryRepository';
import { CreateCategoryDTO, UpdateCategoryDTO, CategoryFilter } from '../dtos/category.dto';

@injectable()
export class MongoCategoryRepository implements ICategoryRepository {
  async findById(id: string): Promise<ICategory | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Category.findById(id).lean() as unknown as ICategory | null;
  }

  async findByUser(userId: string, filter?: CategoryFilter): Promise<ICategory[]> {
    const mongoFilter = this.buildFilter(userId, filter);
    return Category.find(mongoFilter).sort({ type: 1, name: 1 }).lean() as unknown as ICategory[];
  }

  async findAccessibleByUser(userId: string, categoryId: string): Promise<ICategory | null> {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return null;
    }

    return Category.findOne({
      _id: categoryId,
      $or: [{ isDefault: true }, { userId }],
    }).lean() as unknown as ICategory | null;
  }

  async findByName(name: string, type: 'income' | 'expense', userId?: string): Promise<ICategory | null> {
    const query: any = {
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      type,
    };

    if (userId) {
      query.$or = [{ isDefault: true }, { userId }];
    } else {
      query.isDefault = true;
    }

    return Category.findOne(query).lean() as unknown as ICategory | null;
  }

  async create(data: CreateCategoryDTO): Promise<ICategory> {
    const category = new Category({
      name: data.name,
      type: data.type,
      icon: data.icon || '💰',
      color: data.color || '#6D9C71',
      description: data.description,
      userId: data.userId,
      isDefault: data.isDefault || false,
    });

    await category.save();
    return category.toObject();
  }

  async update(id: string, userId: string, data: UpdateCategoryDTO): Promise<ICategory | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Category.findOneAndUpdate(
      { _id: id, userId },
      data,
      { new: true, runValidators: true }
    ).lean() as unknown as ICategory | null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const result = await Category.deleteOne({ _id: id, userId, isDefault: false });
    return result.deletedCount > 0;
  }

  async countByUser(userId: string, filter?: CategoryFilter): Promise<number> {
    const mongoFilter = this.buildFilter(userId, filter);
    return Category.countDocuments(mongoFilter);
  }

  async getStats(userId: string): Promise<{
    total: number;
    income: number;
    expense: number;
    custom: number;
    default: number;
  }> {
    const [total, income, expense, custom] = await Promise.all([
      Category.countDocuments({
        $or: [{ isDefault: true }, { userId }],
      }),
      Category.countDocuments({
        type: 'income',
        $or: [{ isDefault: true }, { userId }],
      }),
      Category.countDocuments({
        type: 'expense',
        $or: [{ isDefault: true }, { userId }],
      }),
      Category.countDocuments({
        userId,
        isDefault: false,
      }),
    ]);

    return {
      total,
      income,
      expense,
      custom,
      default: total - custom,
    };
  }

  // Helper methods privados
  private buildFilter(userId: string, filter?: CategoryFilter): any {
    const mongoFilter: any = {
      $or: [{ isDefault: true }, { userId }],
    };

    if (!filter) return mongoFilter;

    if (filter.type) {
      mongoFilter.type = filter.type;
    }

    if (filter.isDefault !== undefined) {
      mongoFilter.isDefault = filter.isDefault;
      delete mongoFilter.$or;
    }

    if (filter.search) {
      mongoFilter.name = { $regex: filter.search, $options: 'i' };
    }

    return mongoFilter;
  }
}
