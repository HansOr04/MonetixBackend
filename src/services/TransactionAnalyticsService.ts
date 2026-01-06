import { injectable, inject } from 'inversify';
import { ITransactionAnalyticsService } from './interfaces/ITransactionAnalyticsService';
import { ITransactionRepository } from '../repositories/interfaces/ITransactionRepository';
import {
  TransactionStatistics,
  CategoryAggregation,
  PeriodAggregation,
} from '../dtos/transaction.dto';
import { TYPES } from './TransactionService';

@injectable()
export class TransactionAnalyticsService implements ITransactionAnalyticsService {
  constructor(
    @inject(TYPES.ITransactionRepository) private transactionRepo: ITransactionRepository
  ) {}

  async getStatistics(userId: string): Promise<TransactionStatistics> {
    const transactions = await this.transactionRepo.findByUser(userId);

    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const incomeTotal = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const expenseTotal = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    const incomeCount = incomeTransactions.length;
    const expenseCount = expenseTransactions.length;

    return {
      income: {
        total: incomeTotal,
        count: incomeCount,
        average: incomeCount > 0 ? incomeTotal / incomeCount : 0,
      },
      expense: {
        total: expenseTotal,
        count: expenseCount,
        average: expenseCount > 0 ? expenseTotal / expenseCount : 0,
      },
      balance: incomeTotal - expenseTotal,
      totalTransactions: incomeCount + expenseCount,
    };
  }

  async getByCategory(userId: string): Promise<CategoryAggregation[]> {
    return this.transactionRepo.aggregateByCategory(userId);
  }

  async getByPeriod(userId: string, period: 'day' | 'week' | 'month'): Promise<PeriodAggregation[]> {
    return this.transactionRepo.aggregateByPeriod(userId, period);
  }
}
