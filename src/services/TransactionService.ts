import { injectable, inject } from 'inversify';
import { ITransactionService } from './interfaces/ITransactionService';
import { ITransaction } from '../models/Transaction.model';
import { ITransactionRepository } from '../repositories/interfaces/ITransactionRepository';
import { ICategoryRepository } from '../repositories/interfaces/ICategoryRepository';
import { IGoalRepository } from '../repositories/interfaces/IGoalRepository';
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionFilter,
  PaginationOptions,
  PaginatedResult,
} from '../dtos/transaction.dto';

// Símbolos para inyección de dependencias
export const TYPES = {
  ITransactionRepository: Symbol.for('ITransactionRepository'),
  ICategoryRepository: Symbol.for('ICategoryRepository'),
  IGoalRepository: Symbol.for('IGoalRepository'),
};

@injectable()
export class TransactionService implements ITransactionService {
  constructor(
    @inject(TYPES.ITransactionRepository) private transactionRepo: ITransactionRepository,
    @inject(TYPES.ICategoryRepository) private categoryRepo: ICategoryRepository,
    @inject(TYPES.IGoalRepository) private goalRepo: IGoalRepository
  ) { }

  async getTransactions(
    userId: string,
    filter: TransactionFilter,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<ITransaction>> {
    return this.transactionRepo.findWithPagination(userId, filter, pagination);
  }

  async getTransactionById(userId: string, id: string): Promise<ITransaction | null> {
    const transaction = await this.transactionRepo.findById(id);

    if (!transaction || transaction.userId.toString() !== userId) {
      return null;
    }

    return transaction;
  }

  async createTransaction(
    userId: string,
    data: Omit<CreateTransactionDTO, 'userId'>
  ): Promise<ITransaction> {
    // Validar que la categoría existe y el usuario tiene acceso a ella
    const category = await this.categoryRepo.findAccessibleByUser(userId, data.categoryId);

    if (!category) {
      throw new Error('Categoría no encontrada');
    }

    // Crear la transacción
    const transaction = await this.transactionRepo.create({
      userId,
      ...data,
      date: data.date || new Date(),
    });

    // Si es ingreso, actualizar metas activas
    if (data.type === 'income') {
      await this.goalRepo.addToActiveGoals(userId, data.amount);
    }

    return transaction;
  }

  async updateTransaction(
    userId: string,
    id: string,
    data: UpdateTransactionDTO
  ): Promise<ITransaction | null> {
    // Validar que la transacción existe y pertenece al usuario
    const existingTransaction = await this.transactionRepo.findById(id);

    if (!existingTransaction || existingTransaction.userId.toString() !== userId) {
      return null;
    }

    // Si se está actualizando la categoría, validar que existe
    if (data.categoryId) {
      const category = await this.categoryRepo.findAccessibleByUser(userId, data.categoryId);

      if (!category) {
        throw new Error('Categoría no encontrada');
      }
    }

    // Actualizar la transacción
    return this.transactionRepo.update(id, userId, data);
  }

  async deleteTransaction(
    userId: string,
    id: string
  ): Promise<{ id: string; amount: number; type: string }> {
    // Obtener la transacción antes de eliminarla
    const transaction = await this.transactionRepo.findById(id);

    if (!transaction || transaction.userId.toString() !== userId) {
      throw new Error('Transacción no encontrada');
    }

    // Eliminar la transacción
    const deleted = await this.transactionRepo.delete(id, userId);

    if (!deleted) {
      throw new Error('No se pudo eliminar la transacción');
    }

    return {
      id: transaction._id.toString(),
      amount: transaction.amount,
      type: transaction.type,
    };
  }
}
