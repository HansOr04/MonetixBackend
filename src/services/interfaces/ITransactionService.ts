import { ITransaction } from '../../models/Transaction.model';
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionFilter,
  PaginationOptions,
  PaginatedResult,
} from '../../dtos/transaction.dto';

export interface ITransactionService {
  getTransactions(
    userId: string,
    filter: TransactionFilter,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<ITransaction>>;

  getTransactionById(userId: string, id: string): Promise<ITransaction | null>;

  createTransaction(userId: string, data: Omit<CreateTransactionDTO, 'userId'>): Promise<ITransaction>;

  updateTransaction(userId: string, id: string, data: UpdateTransactionDTO): Promise<ITransaction | null>;

  deleteTransaction(userId: string, id: string): Promise<{ id: string; amount: number; type: string }>;
}
