import { injectable } from 'inversify';
import mongoose from 'mongoose';
import { Transaction, ITransaction } from '../models/Transaction.model';
import { ITransactionRepository } from './interfaces/ITransactionRepository';
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionFilter,
  PaginationOptions,
  PaginatedResult,
  CategoryAggregation,
  PeriodAggregation,
} from '../dtos/transaction.dto';

@injectable()
export class MongoTransactionRepository implements ITransactionRepository {
  async findById(id: string): Promise<ITransaction | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Transaction.findById(id)
      .populate('categoryId', 'name type icon color')
      .lean() as unknown as ITransaction | null;
  }

  async findByUser(userId: string, filter?: TransactionFilter): Promise<ITransaction[]> {
    const mongoFilter = this.buildFilter(userId, filter);

    return Transaction.find(mongoFilter)
      .populate('categoryId', 'name type icon color')
      .sort({ date: -1 })
      .lean() as unknown as ITransaction[];
  }

  async findByCategory(categoryId: string): Promise<ITransaction[]> {
    return Transaction.find({ categoryId })
      .populate('categoryId', 'name type icon color')
      .sort({ date: -1 })
      .lean() as unknown as ITransaction[];
  }

  async findByDateRange(userId: string, from: Date, to: Date): Promise<ITransaction[]> {
    return Transaction.find({
      userId,
      date: { $gte: from, $lte: to },
    })
      .populate('categoryId', 'name type icon color')
      .sort({ date: 1 })
      .lean() as unknown as ITransaction[];
  }

  async create(data: CreateTransactionDTO): Promise<ITransaction> {
    const transaction = new Transaction({
      userId: data.userId,
      categoryId: data.categoryId,
      amount: data.amount,
      type: data.type,
      description: data.description,
      date: data.date || new Date(),
    });

    await transaction.save();

    const populated = await Transaction.findById(transaction._id)
      .populate('categoryId', 'name type icon color')
      .lean() as unknown as ITransaction;

    return populated!;
  }

  async update(id: string, userId: string, data: UpdateTransactionDTO): Promise<ITransaction | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Transaction.findOneAndUpdate(
      { _id: id, userId },
      data,
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name type icon color')
      .lean() as unknown as ITransaction | null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const result = await Transaction.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  }

  async countByUser(userId: string, filter?: TransactionFilter): Promise<number> {
    const mongoFilter = this.buildFilter(userId, filter);
    return Transaction.countDocuments(mongoFilter);
  }

  async sumByType(userId: string, type: 'income' | 'expense'): Promise<number> {
    const result = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), type } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  async findWithPagination(
    userId: string,
    filter: TransactionFilter,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<ITransaction>> {
    const mongoFilter = this.buildFilter(userId, filter);
    const { skip, limit, sort } = this.buildPaginationQuery(pagination);

    const [transactions, total] = await Promise.all([
      Transaction.find(mongoFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name type icon color')
        .lean() as unknown as ITransaction[],
      Transaction.countDocuments(mongoFilter),
    ]);

    return {
      data: transactions,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async aggregateByCategory(userId: string): Promise<CategoryAggregation[]> {
    const results = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { categoryId: '$categoryId', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avg: { $avg: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          categoryId: '$_id.categoryId',
          categoryName: '$category.name',
          type: '$_id.type',
          icon: '$category.icon',
          color: '$category.color',
          total: 1,
          count: 1,
          average: '$avg',
        },
      },
      { $sort: { total: -1 } },
    ]);

    return results.map((r) => ({
      categoryId: r.categoryId.toString(),
      categoryName: r.categoryName,
      type: r.type,
      icon: r.icon,
      color: r.color,
      total: r.total,
      count: r.count,
      average: r.average,
    }));
  }

  async aggregateByPeriod(
    userId: string,
    period: 'day' | 'week' | 'month'
  ): Promise<PeriodAggregation[]> {
    const groupBy = this.getPeriodGroupBy(period);

    const results = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { period: groupBy, type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.period': 1 } },
    ]);

    return results.map((r) => ({
      period: r._id.period,
      type: r._id.type,
      total: r.total,
      count: r.count,
    }));
  }

  // Helper methods privados
  private buildFilter(userId: string, filter?: TransactionFilter): any {
    const mongoFilter: any = { userId };

    if (!filter) return mongoFilter;

    if (filter.type) {
      mongoFilter.type = filter.type;
    }

    if (filter.categoryId) {
      mongoFilter.categoryId = filter.categoryId;
    }

    if (filter.dateRange) {
      mongoFilter.date = {};
      if (filter.dateRange.from) mongoFilter.date.$gte = filter.dateRange.from;
      if (filter.dateRange.to) mongoFilter.date.$lte = filter.dateRange.to;
    }

    if (filter.amountRange) {
      mongoFilter.amount = {};
      if (filter.amountRange.min) mongoFilter.amount.$gte = filter.amountRange.min;
      if (filter.amountRange.max) mongoFilter.amount.$lte = filter.amountRange.max;
    }

    return mongoFilter;
  }

  private buildPaginationQuery(pagination: PaginationOptions) {
    const skip = (pagination.page - 1) * pagination.limit;
    const limit = pagination.limit;
    const sort: any = {};
    sort[pagination.sortBy] = pagination.sortOrder === 'asc' ? 1 : -1;

    return { skip, limit, sort };
  }

  private getPeriodGroupBy(period: 'day' | 'week' | 'month'): any {
    switch (period) {
      case 'day':
        return { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
      case 'week':
        return { $isoWeek: '$date' };
      case 'month':
      default:
        return { $dateToString: { format: '%Y-%m', date: '$date' } };
    }
  }
}
