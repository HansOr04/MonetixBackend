import { injectable } from 'inversify';
import mongoose from 'mongoose';
import { Goal, IGoal } from '../models/Goal.model';
import { IGoalRepository } from './interfaces/IGoalRepository';
import { CreateGoalDTO, UpdateGoalDTO, GoalFilter } from '../dtos/goal.dto';

@injectable()
export class MongoGoalRepository implements IGoalRepository {
  async findById(id: string): Promise<IGoal | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Goal.findById(id).lean() as unknown as IGoal | null;
  }

  async findByUser(userId: string, filter?: GoalFilter): Promise<IGoal[]> {
    const mongoFilter = this.buildFilter(userId, filter);
    return Goal.find(mongoFilter).sort({ createdAt: -1 }).lean() as unknown as IGoal[];
  }

  async findActiveByUser(userId: string): Promise<IGoal[]> {
    return Goal.find({
      userId,
      status: 'active',
    }).lean() as unknown as IGoal[];
  }

  async create(data: CreateGoalDTO): Promise<IGoal> {
    const goal = new Goal({
      userId: data.userId,
      name: data.name,
      description: data.description,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || 0,
      targetDate: data.targetDate,
      category: data.category,
      status: 'active',
    });

    await goal.save();
    return goal.toObject();
  }

  async update(id: string, userId: string, data: UpdateGoalDTO): Promise<IGoal | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Goal.findOneAndUpdate(
      { _id: id, userId },
      data,
      { new: true, runValidators: true }
    ).lean() as unknown as IGoal | null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const result = await Goal.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  }

  async addToActiveGoals(userId: string, amount: number): Promise<void> {
    await Goal.updateMany(
      { userId, status: 'active' },
      { $inc: { currentAmount: amount } }
    );
  }

  async updateProgress(goalId: string): Promise<IGoal | null> {
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return null;
    }

    const goal = await Goal.findById(goalId);
    if (!goal) {
      return null;
    }

    // Actualizar estado si alcanzó la meta
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
      await goal.save();
    }

    return goal.toObject();
  }

  async countByUser(userId: string, filter?: GoalFilter): Promise<number> {
    const mongoFilter = this.buildFilter(userId, filter);
    return Goal.countDocuments(mongoFilter);
  }

  // Helper methods privados
  private buildFilter(userId: string, filter?: GoalFilter): any {
    const mongoFilter: any = { userId };

    if (!filter) return mongoFilter;

    if (filter.status) {
      mongoFilter.status = filter.status;
    }

    if (filter.category) {
      mongoFilter.category = filter.category;
    }

    return mongoFilter;
  }
}
