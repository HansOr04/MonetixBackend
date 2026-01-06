import { injectable, inject } from 'inversify';
import { IGoalService } from './interfaces/IGoalService';
import { IGoal } from '../models/Goal.model';
import { IGoalRepository } from '../repositories/interfaces/IGoalRepository';
import { CreateGoalDTO, UpdateGoalDTO, GoalFilter } from '../dtos/goal.dto';

@injectable()
export class GoalService implements IGoalService {
  constructor(@inject(Symbol.for('IGoalRepository')) private goalRepo: IGoalRepository) { }

  async getAllGoals(userId: string, filter?: GoalFilter): Promise<IGoal[]> {
    return this.goalRepo.findByUser(userId, filter);
  }

  async getGoalById(userId: string, id: string): Promise<IGoal | null> {
    const goal = await this.goalRepo.findById(id);

    if (!goal || goal.userId.toString() !== userId) {
      return null;
    }

    return goal;
  }

  async createGoal(userId: string, data: Omit<CreateGoalDTO, 'userId'>): Promise<IGoal> {
    return this.goalRepo.create({
      userId,
      ...data,
    });
  }

  async updateGoal(userId: string, id: string, data: UpdateGoalDTO): Promise<IGoal | null> {
    const goal = await this.goalRepo.findById(id);

    if (!goal || goal.userId.toString() !== userId) {
      return null;
    }

    return this.goalRepo.update(id, userId, data);
  }

  async deleteGoal(userId: string, id: string): Promise<{ id: string; name: string }> {
    const goal = await this.goalRepo.findById(id);

    if (!goal || goal.userId.toString() !== userId) {
      throw new Error('Meta no encontrada o no tienes permiso para eliminarla');
    }

    const deleted = await this.goalRepo.delete(id, userId);

    if (!deleted) {
      throw new Error('No se pudo eliminar la meta');
    }

    return {
      id: goal._id.toString(),
      name: goal.name,
    };
  }

  async addToActiveGoals(userId: string, amount: number): Promise<void> {
    await this.goalRepo.addToActiveGoals(userId, amount);
  }
}
