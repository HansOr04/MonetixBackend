import { IGoal } from '../../models/Goal.model';
import { CreateGoalDTO, UpdateGoalDTO, GoalFilter } from '../../dtos/goal.dto';

export interface IGoalService {
  getAllGoals(userId: string, filter?: GoalFilter): Promise<IGoal[]>;

  getGoalById(userId: string, id: string): Promise<IGoal | null>;

  createGoal(userId: string, data: Omit<CreateGoalDTO, 'userId'>): Promise<IGoal>;

  updateGoal(userId: string, id: string, data: UpdateGoalDTO): Promise<IGoal | null>;

  deleteGoal(userId: string, id: string): Promise<{ id: string; name: string }>;

  addToActiveGoals(userId: string, amount: number): Promise<void>;
}
