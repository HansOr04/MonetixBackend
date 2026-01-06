import { injectable, inject } from 'inversify';
import { IAlertChecker, AlertType } from '../interfaces/IAlertChecker';
import { ITransactionRepository } from '../../../repositories/interfaces/ITransactionRepository';
import { IAlertRepository } from '../../../repositories/interfaces/IAlertRepository';
import { ITransaction } from '../../../models/Transaction.model';
import { StatisticalTests } from '../../utils/statisticalTests';
import { TYPES } from '../../../services/TransactionService';

@injectable()
export class UnusualPatternAlertChecker implements IAlertChecker {
  private readonly DAYS_30 = 30;
  private readonly MIN_TRANSACTIONS_FOR_PATTERN = 10;
  private readonly UNUSUAL_STD_DEV_MULTIPLIER = 2;

  constructor(
    @inject(TYPES.ITransactionRepository) private transactionRepo: ITransactionRepository,
    @inject(Symbol.for('IAlertRepository')) private alertRepo: IAlertRepository
  ) {}

  getType(): AlertType {
    return 'unusual_pattern';
  }

  getName(): string {
    return 'Unusual Pattern Alert Checker';
  }

  async check(userId: string): Promise<void> {
    const recentTransactions = await this.getRecentTransactions(userId);

    if (recentTransactions.length < this.MIN_TRANSACTIONS_FOR_PATTERN) {
      return;
    }

    await this.checkHighValueTransactions(userId, recentTransactions);
    await this.checkTransactionTiming(userId, recentTransactions);
  }

  private async getRecentTransactions(userId: string): Promise<ITransaction[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.DAYS_30);

    return this.transactionRepo.findByDateRange(userId, thirtyDaysAgo, new Date());
  }

  private async checkHighValueTransactions(
    userId: string,
    transactions: ITransaction[]
  ): Promise<void> {
    const amounts = transactions.map((t) => t.amount);
    const avgAmount = StatisticalTests.mean(amounts);
    const stdDev = StatisticalTests.standardDeviation(amounts);
    const threshold = avgAmount + this.UNUSUAL_STD_DEV_MULTIPLIER * stdDev;

    const highValueTransactions = transactions.filter((t) => t.amount > threshold);

    if (highValueTransactions.length > 0) {
      await this.alertRepo.create({
        userId,
        type: 'unusual_pattern',
        severity: 'info',
        message:
          `Se detectaron ${highValueTransactions.length} transacciones con montos inusualmente altos ` +
          `en los últimos 30 días`,
        relatedData: {
          transactionCount: highValueTransactions.length,
          averageAmount: avgAmount,
          threshold,
          highValueTransactions: highValueTransactions.map((t) => ({
            amount: t.amount,
            date: t.date,
            type: t.type,
          })),
        },
      });
    }
  }

  private async checkTransactionTiming(
    userId: string,
    transactions: ITransaction[]
  ): Promise<void> {
    const dayFrequency = this.calculateDayFrequency(transactions);
    const mostActiveDay = this.findMostActiveDay(dayFrequency);

    if (mostActiveDay.frequency > transactions.length * 0.3) {
      await this.alertRepo.create({
        userId,
        type: 'unusual_pattern',
        severity: 'info',
        message: `La mayoría de tus transacciones (${mostActiveDay.count}) ocurren los ${mostActiveDay.name}s`,
        relatedData: {
          day: mostActiveDay.name,
          transactionCount: mostActiveDay.count,
          percentage: (mostActiveDay.count / transactions.length) * 100,
        },
      });
    }
  }

  private calculateDayFrequency(transactions: ITransaction[]): Map<number, number> {
    const frequency = new Map<number, number>();

    transactions.forEach((t) => {
      const day = new Date(t.date).getDay();
      frequency.set(day, (frequency.get(day) || 0) + 1);
    });

    return frequency;
  }

  private findMostActiveDay(frequency: Map<number, number>) {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let maxDay = 0;
    let maxCount = 0;

    frequency.forEach((count, day) => {
      if (count > maxCount) {
        maxCount = count;
        maxDay = day;
      }
    });

    return {
      day: maxDay,
      name: dayNames[maxDay],
      count: maxCount,
      frequency: maxCount,
    };
  }
}
