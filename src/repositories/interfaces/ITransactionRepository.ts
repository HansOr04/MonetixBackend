import { ITransaction } from '../../models/Transaction.model';
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionFilter,
  PaginationOptions,
  PaginatedResult,
  CategoryAggregation,
  PeriodAggregation,
} from '../../dtos/transaction.dto';

export interface ITransactionRepository {
  // Búsqueda y consulta
  findById(id: string): Promise<ITransaction | null>;
  findByUser(userId: string, filter?: TransactionFilter): Promise<ITransaction[]>;
  findByCategory(categoryId: string): Promise<ITransaction[]>;
  findByDateRange(userId: string, from: Date, to: Date): Promise<ITransaction[]>;

  // CRUD
  create(data: CreateTransactionDTO): Promise<ITransaction>;
  update(id: string, userId: string, data: UpdateTransactionDTO): Promise<ITransaction | null>;
  delete(id: string, userId: string): Promise<boolean>;

  // Agregaciones
  countByUser(userId: string, filter?: TransactionFilter): Promise<number>;
  sumByType(userId: string, type: 'income' | 'expense'): Promise<number>;

  // Consultas complejas
  findWithPagination(
    userId: string,
    filter: TransactionFilter,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<ITransaction>>;

  aggregateByCategory(userId: string): Promise<CategoryAggregation[]>;
  aggregateByPeriod(userId: string, period: 'day' | 'week' | 'month'): Promise<PeriodAggregation[]>;
}
