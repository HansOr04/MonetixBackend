import { injectable, inject } from 'inversify';
import { IAlertChecker, AlertType } from '../interfaces/IAlertChecker';
import { ITransactionRepository } from '../../../repositories/interfaces/ITransactionRepository';
import { ICategoryRepository } from '../../../repositories/interfaces/ICategoryRepository';
import { IAlertRepository } from '../../../repositories/interfaces/IAlertRepository';
import { ITransaction } from '../../../models/Transaction.model';
import { StatisticalTests } from '../../utils/statisticalTests';
import { TYPES } from '../../../services/TransactionService';

@injectable()
export class OverspendingAlertChecker implements IAlertChecker {
  private readonly DAYS_30 = 30;
  private readonly DAYS_60 = 60;
  private readonly MIN_EXPENSES_FOR_CHECK = 5;
  private readonly OVERSPENDING_THRESHOLD = 1.2;
  private readonly CRITICAL_INCREASE_PERCENT = 50;
  private readonly UNUSUAL_EXPENSE_STD_DEV_MULTIPLIER = 2;

  constructor(
    @inject(TYPES.ITransactionRepository) private transactionRepo: ITransactionRepository,
    @inject(Symbol.for('ICategoryRepository')) private categoryRepo: ICategoryRepository,
    @inject(Symbol.for('IAlertRepository')) private alertRepo: IAlertRepository
  ) {}

  getType(): AlertType {
    return 'overspending';
  }

  getName(): string {
    return 'Overspending Alert Checker';
  }

  async check(userId: string): Promise<void> {
    const recentExpenses = await this.getRecentExpenses(userId);

    if (recentExpenses.length < this.MIN_EXPENSES_FOR_CHECK) {
      return;
    }

    const previousExpenses = await this.getPreviousExpenses(userId);

    if (previousExpenses.length < this.MIN_EXPENSES_FOR_CHECK) {
      return;
    }

    await this.analyzeSpendingIncrease(userId, recentExpenses, previousExpenses);
    await this.analyzeCategorySpending(userId, recentExpenses);
  }

  private async getRecentExpenses(userId: string): Promise<ITransaction[]> {
    const thirtyDaysAgo = this.getDateDaysAgo(this.DAYS_30);
    const transactions = await this.transactionRepo.findByDateRange(userId, thirtyDaysAgo, new Date());
    return transactions.filter((t) => t.type === 'expense');
  }

  private async getPreviousExpenses(userId: string): Promise<ITransaction[]> {
    const sixtyDaysAgo = this.getDateDaysAgo(this.DAYS_60);
    const thirtyDaysAgo = this.getDateDaysAgo(this.DAYS_30);
    const transactions = await this.transactionRepo.findByDateRange(userId, sixtyDaysAgo, thirtyDaysAgo);
    return transactions.filter((t) => t.type === 'expense');
  }

  private async analyzeSpendingIncrease(
    userId: string,
    recent: ITransaction[],
    previous: ITransaction[]
  ): Promise<void> {
    const metrics = this.calculateSpendingMetrics(recent, previous);

    if (metrics.hasIncreased) {
      await this.alertRepo.create({
        userId,
        type: 'overspending',
        severity: this.determineSeverity(metrics.increasePercent),
        message: this.buildIncreaseMessage(metrics),
        relatedData: metrics,
      });
    }
  }

  private async analyzeCategorySpending(userId: string, expenses: ITransaction[]): Promise<void> {
    const expensesByCategory = this.groupByCategory(expenses);

    for (const [categoryId, amounts] of expensesByCategory) {
      if (amounts.length < 3) continue;

      const analysis = this.analyzeAmounts(amounts);

      if (analysis.hasUnusualExpenses) {
        const category = await this.categoryRepo.findById(categoryId);

        await this.alertRepo.create({
          userId,
          type: 'unusual_pattern',
          severity: 'warning',
          message: this.buildCategoryMessage(category?.name || 'Desconocida', analysis),
          relatedData: {
            categoryId,
            categoryName: category?.name,
            ...analysis,
          },
        });
      }
    }
  }

  private calculateSpendingMetrics(recent: ITransaction[], previous: ITransaction[]) {
    const recentTotal = recent.reduce((sum, t) => sum + t.amount, 0);
    const previousTotal = previous.reduce((sum, t) => sum + t.amount, 0);
    const recentAvg = recentTotal / this.DAYS_30;
    const previousAvg = previousTotal / this.DAYS_30;
    const increasePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

    return {
      recentAverage: recentAvg,
      previousAverage: previousAvg,
      increasePercent,
      hasIncreased: recentAvg > previousAvg * this.OVERSPENDING_THRESHOLD,
    };
  }

  private determineSeverity(increasePercent: number): 'info' | 'warning' | 'critical' {
    return increasePercent > this.CRITICAL_INCREASE_PERCENT ? 'critical' : 'warning';
  }

  private buildIncreaseMessage(metrics: any): string {
    return (
      `Tus gastos han aumentado un ${metrics.increasePercent.toFixed(1)}% en los últimos 30 días. ` +
      `Gasto diario promedio: $${metrics.recentAverage.toFixed(2)} ` +
      `(antes: $${metrics.previousAverage.toFixed(2)})`
    );
  }

  private buildCategoryMessage(categoryName: string, analysis: any): string {
    return (
      `Gastos inusuales detectados en la categoría "${categoryName}". ` +
      `Algunos gastos superan significativamente tu promedio de $${analysis.averageAmount.toFixed(2)}`
    );
  }

  private groupByCategory(expenses: ITransaction[]): Map<string, number[]> {
    const map = new Map<string, number[]>();

    expenses.forEach((expense) => {
      const categoryId = expense.categoryId.toString();
      if (!map.has(categoryId)) {
        map.set(categoryId, []);
      }
      map.get(categoryId)!.push(expense.amount);
    });

    return map;
  }

  private analyzeAmounts(amounts: number[]) {
    const avg = StatisticalTests.mean(amounts);
    const stdDev = StatisticalTests.standardDeviation(amounts);
    const threshold = avg + this.UNUSUAL_EXPENSE_STD_DEV_MULTIPLIER * stdDev;
    const unusualExpenses = amounts.filter((amount) => amount > threshold);

    return {
      averageAmount: avg,
      standardDeviation: stdDev,
      threshold,
      unusualExpenses,
      hasUnusualExpenses: unusualExpenses.length > 0,
    };
  }

  private getDateDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
}
