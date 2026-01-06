import { IGoal } from '../../models/Goal.model';
import { CreateGoalDTO, UpdateGoalDTO, GoalFilter } from '../../dtos/goal.dto';

export interface IGoalRepository {
  // Búsqueda y consulta
  findById(id: string): Promise<IGoal | null>;
  findByUser(userId: string, filter?: GoalFilter): Promise<IGoal[]>;
  findActiveByUser(userId: string): Promise<IGoal[]>;

  // CRUD
  create(data: CreateGoalDTO): Promise<IGoal>;
  update(id: string, userId: string, data: UpdateGoalDTO): Promise<IGoal | null>;
  delete(id: string, userId: string): Promise<boolean>;

  // Operaciones especiales
  addToActiveGoals(userId: string, amount: number): Promise<void>;
  updateProgress(goalId: string): Promise<IGoal | null>;

  // Utilidades
  countByUser(userId: string, filter?: GoalFilter): Promise<number>;
}
