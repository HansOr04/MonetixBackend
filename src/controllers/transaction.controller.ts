import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction.model';
import { Category } from '../models/Category.model';
import { Goal } from '../models/Goal.model';
import mongoose from 'mongoose';

export class TransactionController {
  async getTransactions(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const {
        type,
        categoryId,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        page = 1,
        limit = 20,
        sortBy = 'date',
        sortOrder = 'desc',
      } = req.query;

      const filter: any = { userId };

      if (type) filter.type = type;
      if (categoryId) filter.categoryId = categoryId;

      if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom as string);
        if (dateTo) filter.date.$lte = new Date(dateTo as string);
      }

      if (minAmount || maxAmount) {
        filter.amount = {};
        if (minAmount) filter.amount.$gte = parseFloat(minAmount as string);
        if (maxAmount) filter.amount.$lte = parseFloat(maxAmount as string);
      }

      const skip = (Number(page) - 1) * Number(limit);
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const transactions = await Transaction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('categoryId', 'name type icon color')
        .lean();

      const total = await Transaction.countDocuments(filter);

      return res.status(200).json({
        success: true,
        data: transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error al obtener transacciones:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener transacciones',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getTransactionById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de transacción inválido',
        });
      }

      const transaction = await Transaction.findOne({ _id: id, userId })
        .populate('categoryId', 'name type icon color')
        .lean();

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada',
        });
      }

      return res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      console.error('Error al obtener transacción:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener transacción',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async createTransaction(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { categoryId, amount, type, description, date } = req.body;

      const category = await Category.findOne({
        _id: categoryId,
        $or: [{ isDefault: true }, { userId }],
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada',
        });
      }

      const transaction = new Transaction({
        userId,
        categoryId,
        amount,
        type,
        description,
        date: date || new Date(),
      });

      await transaction.save();

      if (type === 'income') {
        await Goal.updateMany(
          { userId, status: 'active' },
          { $inc: { currentAmount: amount } }
        );
      }

      const populatedTransaction = await Transaction.findById(transaction._id)
        .populate('categoryId', 'name type icon color')
        .lean();

      return res.status(201).json({
        success: true,
        message: 'Transacción creada exitosamente',
        data: populatedTransaction,
      });
    } catch (error) {
      console.error('Error al crear transacción:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al crear transacción',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async updateTransaction(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de transacción inválido',
        });
      }

      if (updateData.categoryId) {
        const category = await Category.findOne({
          _id: updateData.categoryId,
          $or: [{ isDefault: true }, { userId }],
        });

        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Categoría no encontrada',
          });
        }
      }

      const transaction = await Transaction.findOneAndUpdate(
        { _id: id, userId },
        updateData,
        { new: true, runValidators: true }
      ).populate('categoryId', 'name type icon color');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Transacción actualizada exitosamente',
        data: transaction,
      });
    } catch (error) {
      console.error('Error al actualizar transacción:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar transacción',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async deleteTransaction(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de transacción inválido',
        });
      }

      const transaction = await Transaction.findOneAndDelete({ _id: id, userId });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Transacción eliminada exitosamente',
        data: {
          id: transaction._id,
          amount: transaction.amount,
          type: transaction.type,
        },
      });
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar transacción',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      const stats = await Transaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avg: { $avg: '$amount' },
          },
        },
      ]);

      const incomeStats = stats.find(s => s._id === 'income') || { total: 0, count: 0, avg: 0 };
      const expenseStats = stats.find(s => s._id === 'expense') || { total: 0, count: 0, avg: 0 };

      return res.status(200).json({
        success: true,
        data: {
          income: {
            total: incomeStats.total,
            count: incomeStats.count,
            average: incomeStats.avg,
          },
          expense: {
            total: expenseStats.total,
            count: expenseStats.count,
            average: expenseStats.avg,
          },
          balance: incomeStats.total - expenseStats.total,
          totalTransactions: incomeStats.count + expenseStats.count,
        },
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getByCategory(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      const byCategory = await Transaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: { categoryId: '$categoryId', type: '$type' },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
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
          },
        },
        { $sort: { total: -1 } },
      ]);

      return res.status(200).json({
        success: true,
        data: byCategory,
      });
    } catch (error) {
      console.error('Error al obtener transacciones por categoría:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener transacciones por categoría',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getByPeriod(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { period = 'month' } = req.query;

      let groupBy: any;
      switch (period) {
        case 'day':
          groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
          break;
        case 'week':
          groupBy = { $isoWeek: '$date' };
          break;
        case 'month':
        default:
          groupBy = { $dateToString: { format: '%Y-%m', date: '$date' } };
          break;
      }

      const byPeriod = await Transaction.aggregate([
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

      return res.status(200).json({
        success: true,
        data: byPeriod,
      });
    } catch (error) {
      console.error('Error al obtener transacciones por período:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener transacciones por período',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}

export const transactionController = new TransactionController();
