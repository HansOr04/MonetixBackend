import { injectable, inject } from 'inversify';
import { IAlertChecker, AlertType } from '../interfaces/IAlertChecker';
import { IGoalRepository } from '../../../repositories/interfaces/IGoalRepository';
import { IAlertRepository } from '../../../repositories/interfaces/IAlertRepository';
import { IGoal } from '../../../models/Goal.model';

@injectable()
export class GoalProgressAlertChecker implements IAlertChecker {
  constructor(
    @inject(Symbol.for('IGoalRepository')) private goalRepo: IGoalRepository,
    @inject(Symbol.for('IAlertRepository')) private alertRepo: IAlertRepository
  ) {}

  getType(): AlertType {
    return 'goal_progress';
  }

  getName(): string {
    return 'Goal Progress Alert Checker';
  }

  async check(userId: string): Promise<void> {
    const activeGoals = await this.goalRepo.findActiveByUser(userId);

    for (const goal of activeGoals) {
      await this.evaluateGoal(userId, goal);
    }
  }

  private async evaluateGoal(userId: string, goal: IGoal): Promise<void> {
    const evaluation = this.calculateGoalProgress(goal);

    if (evaluation.isExpired) {
      await this.createExpiredAlert(userId, goal, evaluation);
    } else if (evaluation.isBehindSchedule) {
      await this.createBehindScheduleAlert(userId, goal, evaluation);
    } else if (evaluation.isNearCompletion) {
      await this.createNearCompletionAlert(userId, goal, evaluation);
    }
  }

  private calculateGoalProgress(goal: IGoal) {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysUntilTarget = Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const daysElapsed = Math.ceil((Date.now() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil(
      (goal.targetDate.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const expectedProgress = (daysElapsed / totalDays) * 100;

    return {
      progress,
      expectedProgress,
      daysUntilTarget,
      daysElapsed,
      isExpired: daysUntilTarget <= 0 && progress < 100,
      isBehindSchedule: progress < expectedProgress * 0.7 && daysUntilTarget > 0,
      isNearCompletion: progress >= 90 && progress < 100,
      amountNeeded: goal.targetAmount - goal.currentAmount,
    };
  }

  private async createExpiredAlert(userId: string, goal: IGoal, evaluation: any): Promise<void> {
    await this.alertRepo.create({
      userId,
      type: 'goal_progress',
      severity: 'critical',
      message:
        `La meta "${goal.name}" ha expirado. Progreso: ${evaluation.progress.toFixed(1)}% ` +
        `($${goal.currentAmount.toFixed(2)} de $${goal.targetAmount.toFixed(2)})`,
      relatedData: {
        goalId: goal._id,
        goalName: goal.name,
        ...evaluation,
      },
    });
  }

  private async createBehindScheduleAlert(userId: string, goal: IGoal, evaluation: any): Promise<void> {
    await this.alertRepo.create({
      userId,
      type: 'goal_progress',
      severity: evaluation.daysUntilTarget < 30 ? 'warning' : 'info',
      message:
        `La meta "${goal.name}" está retrasada. Progreso actual: ${evaluation.progress.toFixed(1)}%, ` +
        `progreso esperado: ${evaluation.expectedProgress.toFixed(1)}%. ` +
        `Quedan ${evaluation.daysUntilTarget} días.`,
      relatedData: {
        goalId: goal._id,
        goalName: goal.name,
        ...evaluation,
      },
    });
  }

  private async createNearCompletionAlert(userId: string, goal: IGoal, evaluation: any): Promise<void> {
    await this.alertRepo.create({
      userId,
      type: 'goal_progress',
      severity: 'info',
      message:
        `¡Casi lo logras! La meta "${goal.name}" está al ${evaluation.progress.toFixed(1)}%. ` +
        `Solo faltan $${evaluation.amountNeeded.toFixed(2)}`,
      relatedData: {
        goalId: goal._id,
        goalName: goal.name,
        ...evaluation,
      },
    });
  }
}
