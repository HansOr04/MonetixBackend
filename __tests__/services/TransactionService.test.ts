import 'reflect-metadata';
import { TransactionService } from '../../src/services/TransactionService';
import { ITransactionRepository } from '../../src/repositories/interfaces/ITransactionRepository';
import { ICategoryRepository } from '../../src/repositories/interfaces/ICategoryRepository';
import { IGoalRepository } from '../../src/repositories/interfaces/IGoalRepository';
import { CreateTransactionDTO } from '../../src/dtos/transaction.dto';

describe('TransactionService', () => {
  let service: TransactionService;
  let mockTransactionRepo: jest.Mocked<ITransactionRepository>;
  let mockCategoryRepo: jest.Mocked<ICategoryRepository>;
  let mockGoalRepo: jest.Mocked<IGoalRepository>;

  beforeEach(() => {
    // Crear mocks de los repositorios
    mockTransactionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUser: jest.fn(),
      findByCategory: jest.fn(),
      findByDateRange: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByUser: jest.fn(),
      sumByType: jest.fn(),
      findWithPagination: jest.fn(),
      aggregateByCategory: jest.fn(),
      aggregateByPeriod: jest.fn(),
    } as any;

    mockCategoryRepo = {
      findById: jest.fn(),
      findByUser: jest.fn(),
      findAccessibleByUser: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByUser: jest.fn(),
      getStats: jest.fn(),
    } as any;

    mockGoalRepo = {
      findById: jest.fn(),
      findByUser: jest.fn(),
      findActiveByUser: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addToActiveGoals: jest.fn(),
      updateProgress: jest.fn(),
      countByUser: jest.fn(),
    } as any;

    // Crear instancia del servicio con los mocks
    service = new TransactionService(mockTransactionRepo, mockCategoryRepo, mockGoalRepo);
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      // Arrange
      const userId = 'user123';
      const dto: Omit<CreateTransactionDTO, 'userId'> = {
        categoryId: 'cat123',
        amount: 100,
        type: 'income',
        description: 'Test transaction',
      };

      const mockCategory = {
        _id: 'cat123',
        name: 'Salario',
        type: 'income',
        isDefault: false,
        userId: 'user123',
      };

      const mockTransaction = {
        _id: 'trans123',
        userId: 'user123',
        categoryId: 'cat123',
        amount: 100,
        type: 'income',
        description: 'Test transaction',
        date: new Date(),
      };

      mockCategoryRepo.findAccessibleByUser.mockResolvedValue(mockCategory as any);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction as any);
      mockGoalRepo.addToActiveGoals.mockResolvedValue();

      // Act
      const result = await service.createTransaction(userId, dto);

      // Assert
      expect(result).toEqual(mockTransaction);
      expect(mockCategoryRepo.findAccessibleByUser).toHaveBeenCalledWith(userId, dto.categoryId);
      expect(mockTransactionRepo.create).toHaveBeenCalledWith({
        userId,
        ...dto,
        date: expect.any(Date),
      });
      expect(mockGoalRepo.addToActiveGoals).toHaveBeenCalledWith(userId, dto.amount);
    });

    it('should throw error if category not found', async () => {
      // Arrange
      const userId = 'user123';
      const dto: Omit<CreateTransactionDTO, 'userId'> = {
        categoryId: 'invalid_cat',
        amount: 100,
        type: 'income',
      };

      mockCategoryRepo.findAccessibleByUser.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createTransaction(userId, dto)).rejects.toThrow('Categoría no encontrada');
      expect(mockTransactionRepo.create).not.toHaveBeenCalled();
    });

    it('should not update goals if transaction type is expense', async () => {
      // Arrange
      const userId = 'user123';
      const dto: Omit<CreateTransactionDTO, 'userId'> = {
        categoryId: 'cat123',
        amount: 50,
        type: 'expense',
      };

      const mockCategory = { _id: 'cat123', name: 'Food', type: 'expense' };
      const mockTransaction = {
        _id: 'trans123',
        userId: 'user123',
        categoryId: 'cat123',
        amount: 50,
        type: 'expense',
        date: new Date(),
      };

      mockCategoryRepo.findAccessibleByUser.mockResolvedValue(mockCategory as any);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction as any);

      // Act
      await service.createTransaction(userId, dto);

      // Assert
      expect(mockGoalRepo.addToActiveGoals).not.toHaveBeenCalled();
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      // Arrange
      const userId = 'user123';
      const transactionId = 'trans123';

      const mockTransaction = {
        _id: transactionId,
        userId: 'user123',
        amount: 100,
        type: 'income',
      };

      mockTransactionRepo.findById.mockResolvedValue(mockTransaction as any);
      mockTransactionRepo.delete.mockResolvedValue(true);

      // Act
      const result = await service.deleteTransaction(userId, transactionId);

      // Assert
      expect(result).toEqual({
        id: transactionId,
        amount: 100,
        type: 'income',
      });
      expect(mockTransactionRepo.delete).toHaveBeenCalledWith(transactionId, userId);
    });

    it('should throw error if transaction not found', async () => {
      // Arrange
      const userId = 'user123';
      const transactionId = 'invalid_trans';

      mockTransactionRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteTransaction(userId, transactionId)).rejects.toThrow(
        'Transacción no encontrada'
      );
      expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw error if user does not own the transaction', async () => {
      // Arrange
      const userId = 'user123';
      const transactionId = 'trans123';

      const mockTransaction = {
        _id: transactionId,
        userId: 'different_user',
        amount: 100,
        type: 'income',
      };

      mockTransactionRepo.findById.mockResolvedValue(mockTransaction as any);

      // Act & Assert
      await expect(service.deleteTransaction(userId, transactionId)).rejects.toThrow(
        'Transacción no encontrada'
      );
      expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction if user owns it', async () => {
      // Arrange
      const userId = 'user123';
      const transactionId = 'trans123';

      const mockTransaction = {
        _id: transactionId,
        userId: 'user123',
        amount: 100,
        type: 'income',
      };

      mockTransactionRepo.findById.mockResolvedValue(mockTransaction as any);

      // Act
      const result = await service.getTransactionById(userId, transactionId);

      // Assert
      expect(result).toEqual(mockTransaction);
    });

    it('should return null if transaction does not belong to user', async () => {
      // Arrange
      const userId = 'user123';
      const transactionId = 'trans123';

      const mockTransaction = {
        _id: transactionId,
        userId: 'different_user',
        amount: 100,
        type: 'income',
      };

      mockTransactionRepo.findById.mockResolvedValue(mockTransaction as any);

      // Act
      const result = await service.getTransactionById(userId, transactionId);

      // Assert
      expect(result).toBeNull();
    });
  });
});
