import {
  TransactionStatistics,
  CategoryAggregation,
  PeriodAggregation,
} from '../../dtos/transaction.dto';

export interface ITransactionAnalyticsService {
  getStatistics(userId: string): Promise<TransactionStatistics>;

  getByCategory(userId: string): Promise<CategoryAggregation[]>;

  getByPeriod(userId: string, period: 'day' | 'week' | 'month'): Promise<PeriodAggregation[]>;
}
