export interface CreateGoalDTO {
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate: Date;
  category?: string;
}

export interface UpdateGoalDTO {
  name?: string;
  description?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: Date;
  category?: string;
  status?: 'active' | 'completed' | 'cancelled';
}

export interface GoalFilter {
  status?: 'active' | 'completed' | 'cancelled';
  category?: string;
}
