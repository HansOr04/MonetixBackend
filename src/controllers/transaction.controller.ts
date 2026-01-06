import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { ITransactionService } from '../services/interfaces/ITransactionService';
import { ITransactionAnalyticsService } from '../services/interfaces/ITransactionAnalyticsService';
import { TransactionFilter, PaginationOptions } from '../dtos/transaction.dto';

@injectable()
export class TransactionController {
  constructor(
    @inject(Symbol.for('ITransactionService')) private transactionService: ITransactionService,
    @inject(Symbol.for('ITransactionAnalyticsService'))
    private analyticsService: ITransactionAnalyticsService
  ) {}

  async getTransactions(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id!;

      // Construir filtros desde query params
      const filter: TransactionFilter = this.buildFilterFromQuery(request.query);

      // Construir opciones de paginación
      const pagination: PaginationOptions = this.buildPaginationFromQuery(request.query);

      // Usar servicio en lugar de acceso directo a modelo
      const result = await this.transactionService.getTransactions(userId, filter, pagination);

      return response.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return this.handleError(error, response, 'Error al obtener transacciones');
    }
  }

  async getTransactionById(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const userId = request.user?.id!;

      const transaction = await this.transactionService.getTransactionById(userId, id);

      if (!transaction) {
        return response.status(404).json({
          success: false,
          message: 'Transacción no encontrada',
        });
      }

      return response.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      return this.handleError(error, response, 'Error al obtener transacción');
    }
  }

  async createTransaction(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id!;
      const { categoryId, amount, type, description, date } = request.body;

      const transaction = await this.transactionService.createTransaction(userId, {
        categoryId,
        amount,
        type,
        description,
        date: date ? new Date(date) : undefined,
      });

      return response.status(201).json({
        success: true,
        message: 'Transacción creada exitosamente',
        data: transaction,
      });
    } catch (error) {
      return this.handleError(error, response, 'Error al crear transacción');
    }
  }

  async updateTransaction(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const userId = request.user?.id!;
      const updateData = request.body;

      const transaction = await this.transactionService.updateTransaction(userId, id, updateData);

      if (!transaction) {
        return response.status(404).json({
          success: false,
          message: 'Transacción no encontrada',
        });
      }

      return response.status(200).json({
        success: true,
        message: 'Transacción actualizada exitosamente',
        data: transaction,
      });
    } catch (error) {
      return this.handleError(error, response, 'Error al actualizar transacción');
    }
  }

  async deleteTransaction(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const userId = request.user?.id!;

      const deletedInfo = await this.transactionService.deleteTransaction(userId, id);

      return response.status(200).json({
        success: true,
        message: 'Transacción eliminada exitosamente',
        data: deletedInfo,
      });
    } catch (error) {
      return this.handleError(error, response, 'Error al eliminar transacción');
    }
  }

  async getStatistics(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id!;

      const stats = await this.analyticsService.getStatistics(userId);

      return response.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return this.handleError(error, response, 'Error al obtener estadísticas');
    }
  }

  async getByCategory(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id!;

      const byCategory = await this.analyticsService.getByCategory(userId);

      return response.status(200).json({
        success: true,
        data: byCategory,
      });
    } catch (error) {
      return this.handleError(error, response, 'Error al obtener transacciones por categoría');
    }
  }

  async getByPeriod(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id!;
      const { period = 'month' } = request.query;

      const byPeriod = await this.analyticsService.getByPeriod(
        userId,
        period as 'day' | 'week' | 'month'
      );

      return response.status(200).json({
        success: true,
        data: byPeriod,
      });
    } catch (error) {
      return this.handleError(error, response, 'Error al obtener transacciones por período');
    }
  }

  // ========== HELPER METHODS ==========

  private buildFilterFromQuery(query: any): TransactionFilter {
    const filter: TransactionFilter = {};

    if (query.type) {
      filter.type = query.type as 'income' | 'expense';
    }

    if (query.categoryId) {
      filter.categoryId = query.categoryId as string;
    }

    if (query.dateFrom || query.dateTo) {
      const dateRange: any = {};
      if (query.dateFrom) dateRange.from = new Date(query.dateFrom as string);
      if (query.dateTo) dateRange.to = new Date(query.dateTo as string);
      filter.dateRange = dateRange;
    }

    if (query.minAmount || query.maxAmount) {
      const amountRange: any = {};
      if (query.minAmount) amountRange.min = parseFloat(query.minAmount as string);
      if (query.maxAmount) amountRange.max = parseFloat(query.maxAmount as string);
      filter.amountRange = amountRange;
    }

    return filter;
  }

  private buildPaginationFromQuery(query: any): PaginationOptions {
    return {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
      sortBy: (query.sortBy as string) || 'date',
      sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
    };
  }

  private handleError(error: unknown, response: Response, defaultMessage: string): Response {
    console.error(defaultMessage, error);

    const message = error instanceof Error ? error.message : 'Error desconocido';

    return response.status(500).json({
      success: false,
      message: defaultMessage,
      error: message,
    });
  }
}

// Exportar instancia desde contenedor
import { container } from '../config/container';
container.bind<TransactionController>(Symbol.for('TransactionController')).to(TransactionController);

export const transactionController = container.get<TransactionController>(
  Symbol.for('TransactionController')
);
