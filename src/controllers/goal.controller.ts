import { Request, Response } from 'express';
import { Goal } from '../models/Goal.model';
import { Transaction } from '../models/Transaction.model';
import mongoose from 'mongoose';

export class GoalController {
  async getGoals(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id;
      const { status, sortBy = 'targetDate', sortOrder = 'asc' } = request.query;

      const filter: any = { userId };
      if (status) filter.status = status;

      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      // Calculate global balance
      const stats = await Transaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]);

      const income = stats.find(s => s._id === 'income')?.total || 0;
      const expense = stats.find(s => s._id === 'expense')?.total || 0;
      const currentBalance = income - expense;

      const goals = await Goal.find(filter).sort(sort).lean();

      // Update currentAmount with global balance for all goals
      const goalsWithBalance = goals.map(goal => ({
        ...goal,
        currentAmount: currentBalance,
        progress: goal.targetAmount > 0 ? Math.min((currentBalance / goal.targetAmount) * 100, 100) : 0
      }));

      return response.status(200).json({
        success: true,
        data: goalsWithBalance,
        total: goals.length,
      });
    } catch (error) {
      console.error('Error al obtener metas:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al obtener metas',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getGoalById(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const userId = request.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({
          success: false,
          message: 'ID de meta inválido',
        });
      }

      const goal = await Goal.findOne({ _id: id, userId }).lean();

      if (!goal) {
        return response.status(404).json({
          success: false,
          message: 'Meta no encontrada',
        });
      }

      return response.status(200).json({
        success: true,
        data: goal,
      });
    } catch (error) {
      console.error('Error al obtener meta:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al obtener meta',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async createGoal(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id;
      const { name, targetAmount, targetDate, description, currentAmount } = request.body;

      const goal = new Goal({
        userId,
        name,
        targetAmount,
        targetDate,
        description,
        currentAmount: currentAmount || 0,
      });

      await goal.save();

      return response.status(201).json({
        success: true,
        message: 'Meta creada exitosamente',
        data: goal,
      });
    } catch (error) {
      console.error('Error al crear meta:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al crear meta',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async updateGoal(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const userId = request.user?.id;
      const updateData = request.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({
          success: false,
          message: 'ID de meta inválido',
        });
      }

      const goal = await Goal.findOneAndUpdate({ _id: id, userId }, updateData, {
        new: true,
        runValidators: true,
      });

      if (!goal) {
        return response.status(404).json({
          success: false,
          message: 'Meta no encontrada',
        });
      }

      return response.status(200).json({
        success: true,
        message: 'Meta actualizada exitosamente',
        data: goal,
      });
    } catch (error) {
      console.error('Error al actualizar meta:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al actualizar meta',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async deleteGoal(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const userId = request.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({
          success: false,
          message: 'ID de meta inválido',
        });
      }

      const goal = await Goal.findOneAndDelete({ _id: id, userId });

      if (!goal) {
        return response.status(404).json({
          success: false,
          message: 'Meta no encontrada',
        });
      }

      return response.status(200).json({
        success: true,
        message: 'Meta eliminada exitosamente',
        data: {
          id: goal._id,
          name: goal.name,
        },
      });
    } catch (error) {
      console.error('Error al eliminar meta:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al eliminar meta',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async updateProgress(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const userId = request.user?.id;
      const { currentAmount } = request.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({
          success: false,
          message: 'ID de meta inválido',
        });
      }

      const goal = await Goal.findOne({ _id: id, userId });

      if (!goal) {
        return response.status(404).json({
          success: false,
          message: 'Meta no encontrada',
        });
      }

      goal.currentAmount = currentAmount;
      await goal.save();

      return response.status(200).json({
        success: true,
        message: 'Progreso actualizado exitosamente',
        data: goal,
      });
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al actualizar progreso',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getProjection(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const userId = request.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({
          success: false,
          message: 'ID de meta inválido',
        });
      }

      const goal = await Goal.findOne({ _id: id, userId }).lean();

      if (!goal) {
        return response.status(404).json({
          success: false,
          message: 'Meta no encontrada',
        });
      }

      // Calculate global balance
      const stats = await Transaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]);

      const income = stats.find(s => s._id === 'income')?.total || 0;
      const expense = stats.find(s => s._id === 'expense')?.total || 0;
      const currentBalance = income - expense;

      // Use currentBalance instead of goal.currentAmount
      const currentAmount = currentBalance;

      const now = Date.now();
      const targetTime = goal.targetDate.getTime();
      const createdTime = goal.createdAt.getTime();

      // Calculate months
      const totalMonths = Math.max(1, Math.ceil((targetTime - createdTime) / (1000 * 60 * 60 * 24 * 30)));
      const elapsedMonths = Math.max(0, Math.ceil((now - createdTime) / (1000 * 60 * 60 * 24 * 30)));
      const remainingMonths = Math.max(0, Math.ceil((targetTime - now) / (1000 * 60 * 60 * 24 * 30)));
      const remainingDays = Math.max(0, Math.ceil((targetTime - now) / (1000 * 60 * 60 * 24)));

      const expectedProgress = (elapsedMonths / totalMonths) * 100;
      const currentProgress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;

      const amountNeeded = goal.targetAmount - currentAmount;
      const monthlyRateNeeded = remainingMonths > 0 ? amountNeeded / remainingMonths : 0;

      // Calculate monthly savings rate based on current progress
      // If less than a month has passed, we can estimate based on partial month, but for stability let's use at least 1 month if elapsed > 0
      const monthlySavingsRate = elapsedMonths > 0 ? currentAmount / elapsedMonths : currentAmount;

      // Calculate projected amount at deadline
      const projectedAmount = currentAmount + (monthlySavingsRate * remainingMonths);

      const willAchieve = remainingDays > 0 && currentProgress >= expectedProgress * 0.8;

      return response.status(200).json({
        success: true,
        data: {
          goalId: goal._id,
          goalName: goal.name,
          currentProgress: Math.min(currentProgress, 100),
          expectedProgress,
          onTrack: currentProgress >= expectedProgress * 0.9,
          willAchieve,
          amountNeeded,
          monthlyRateNeeded,
          projectedAmount,
          daysRemaining: remainingDays, // Keep daysRemaining for UI display
          projectedCompletionDate: willAchieve ? goal.targetDate : null,
        },
      });
    } catch (error) {
      console.error('Error al obtener proyección:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al obtener proyección',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}

export const goalController = new GoalController();
