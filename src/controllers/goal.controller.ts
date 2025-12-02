import { Request, Response } from 'express';
import { Goal } from '../models/Goal.model';
import mongoose from 'mongoose';

export class GoalController {
  async getGoals(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { status, sortBy = 'targetDate', sortOrder = 'asc' } = req.query;

      const filter: any = { userId };
      if (status) filter.status = status;

      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const goals = await Goal.find(filter).sort(sort).lean();

      return res.status(200).json({
        success: true,
        data: goals,
        total: goals.length,
      });
    } catch (error) {
      console.error('Error al obtener metas:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener metas',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getGoalById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de meta inválido',
        });
      }

      const goal = await Goal.findOne({ _id: id, userId }).lean();

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Meta no encontrada',
        });
      }

      return res.status(200).json({
        success: true,
        data: goal,
      });
    } catch (error) {
      console.error('Error al obtener meta:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener meta',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async createGoal(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { name, targetAmount, targetDate, description, currentAmount } = req.body;

      const goal = new Goal({
        userId,
        name,
        targetAmount,
        targetDate,
        description,
        currentAmount: currentAmount || 0,
      });

      await goal.save();

      return res.status(201).json({
        success: true,
        message: 'Meta creada exitosamente',
        data: goal,
      });
    } catch (error) {
      console.error('Error al crear meta:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al crear meta',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async updateGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de meta inválido',
        });
      }

      const goal = await Goal.findOneAndUpdate({ _id: id, userId }, updateData, {
        new: true,
        runValidators: true,
      });

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Meta no encontrada',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Meta actualizada exitosamente',
        data: goal,
      });
    } catch (error) {
      console.error('Error al actualizar meta:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar meta',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async deleteGoal(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de meta inválido',
        });
      }

      const goal = await Goal.findOneAndDelete({ _id: id, userId });

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Meta no encontrada',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Meta eliminada exitosamente',
        data: {
          id: goal._id,
          name: goal.name,
        },
      });
    } catch (error) {
      console.error('Error al eliminar meta:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar meta',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async updateProgress(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { currentAmount } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de meta inválido',
        });
      }

      const goal = await Goal.findOne({ _id: id, userId });

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Meta no encontrada',
        });
      }

      goal.currentAmount = currentAmount;
      await goal.save();

      return res.status(200).json({
        success: true,
        message: 'Progreso actualizado exitosamente',
        data: goal,
      });
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar progreso',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getProjection(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de meta inválido',
        });
      }

      const goal = await Goal.findOne({ _id: id, userId }).lean();

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Meta no encontrada',
        });
      }

      const now = Date.now();
      const targetTime = goal.targetDate.getTime();
      const createdTime = goal.createdAt.getTime();

      const totalDays = Math.ceil((targetTime - createdTime) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((now - createdTime) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((targetTime - now) / (1000 * 60 * 60 * 24));

      const expectedProgress = (elapsedDays / totalDays) * 100;
      const currentProgress = goal.progress;

      const amountNeeded = goal.targetAmount - goal.currentAmount;
      const dailyRateNeeded = remainingDays > 0 ? amountNeeded / remainingDays : 0;

      const willAchieve = remainingDays > 0 && currentProgress >= expectedProgress * 0.8;

      return res.status(200).json({
        success: true,
        data: {
          goalId: goal._id,
          goalName: goal.name,
          currentProgress: goal.progress,
          expectedProgress,
          onTrack: currentProgress >= expectedProgress * 0.9,
          willAchieve,
          amountNeeded,
          dailyRateNeeded,
          daysRemaining: Math.max(0, remainingDays),
          projectedCompletionDate: willAchieve ? goal.targetDate : null,
        },
      });
    } catch (error) {
      console.error('Error al obtener proyección:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener proyección',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}

export const goalController = new GoalController();
