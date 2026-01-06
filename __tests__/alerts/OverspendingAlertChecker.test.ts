import 'reflect-metadata';
import { OverspendingAlertChecker } from '../../src/core/alerts/checkers/OverspendingAlertChecker';
import { ITransactionRepository } from '../../src/repositories/interfaces/ITransactionRepository';
import { ICategoryRepository } from '../../src/repositories/interfaces/ICategoryRepository';
import { IAlertRepository } from '../../src/repositories/interfaces/IAlertRepository';

describe('OverspendingAlertChecker', () => {
  let checker: OverspendingAlertChecker;
  let mockTransactionRepo: jest.Mocked<ITransactionRepository>;
  let mockCategoryRepo: jest.Mocked<ICategoryRepository>;
  let mockAlertRepo: jest.Mocked<IAlertRepository>;

  beforeEach(() => {
    // Crear mocks
    mockTransactionRepo = {
      findByDateRange: jest.fn(),
    } as any;

    mockCategoryRepo = {
      findById: jest.fn(),
    } as any;

    mockAlertRepo = {
      create: jest.fn(),
    } as any;

    // Crear instancia del checker
    checker = new OverspendingAlertChecker(
      mockTransactionRepo,
      mockCategoryRepo,
      mockAlertRepo
    );
  });

  describe('check', () => {
    it('should not create alert if not enough recent transactions', async () => {
      // Arrange
      const userId = 'user123';

      // Solo 3 transacciones recientes (menos del mínimo de 5)
      mockTransactionRepo.findByDateRange.mockResolvedValueOnce([
        { type: 'expense', amount: 100, date: new Date() },
        { type: 'expense', amount: 200, date: new Date() },
        { type: 'expense', amount: 150, date: new Date() },
      ] as any);

      // Act
      await checker.check(userId);

      // Assert
      expect(mockAlertRepo.create).not.toHaveBeenCalled();
    });

    it('should create alert when spending increased significantly', async () => {
      // Arrange
      const userId = 'user123';

      // Transacciones recientes (últimos 30 días) - total 1500 / 30 = 50/día
      const recentExpenses = Array(10)
        .fill(null)
        .map(() => ({
          type: 'expense',
          amount: 150,
          date: new Date(),
          categoryId: 'cat123',
        }));

      // Transacciones previas (30-60 días atrás) - total 600 / 30 = 20/día
      const previousExpenses = Array(10)
        .fill(null)
        .map(() => ({
          type: 'expense',
          amount: 60,
          date: new Date(),
          categoryId: 'cat123',
        }));

      mockTransactionRepo.findByDateRange
        .mockResolvedValueOnce(recentExpenses as any) // Llamada para recientes
        .mockResolvedValueOnce(previousExpenses as any); // Llamada para previos

      // Act
      await checker.check(userId);

      // Assert
      expect(mockAlertRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: 'overspending',
          severity: expect.stringMatching(/warning|critical/),
          message: expect.stringContaining('aumentado'),
        })
      );
    });

    it('should not create alert when spending is stable', async () => {
      // Arrange
      const userId = 'user123';

      // Gastos similares en ambos períodos
      const recentExpenses = Array(10)
        .fill(null)
        .map(() => ({
          type: 'expense',
          amount: 100,
          date: new Date(),
          categoryId: 'cat123',
        }));

      const previousExpenses = Array(10)
        .fill(null)
        .map(() => ({
          type: 'expense',
          amount: 95,
          date: new Date(),
          categoryId: 'cat123',
        }));

      mockTransactionRepo.findByDateRange
        .mockResolvedValueOnce(recentExpenses as any)
        .mockResolvedValueOnce(previousExpenses as any);

      // Act
      await checker.check(userId);

      // Assert
      // No debería crear alerta porque el incremento es menor al 20%
      expect(mockAlertRepo.create).not.toHaveBeenCalled();
    });

    it('should create critical severity alert for very high increases', async () => {
      // Arrange
      const userId = 'user123';

      // Incremento de más del 50% (crítico)
      const recentExpenses = Array(10)
        .fill(null)
        .map(() => ({
          type: 'expense',
          amount: 200,
          date: new Date(),
          categoryId: 'cat123',
        }));

      const previousExpenses = Array(10)
        .fill(null)
        .map(() => ({
          type: 'expense',
          amount: 100,
          date: new Date(),
          categoryId: 'cat123',
        }));

      mockTransactionRepo.findByDateRange
        .mockResolvedValueOnce(recentExpenses as any)
        .mockResolvedValueOnce(previousExpenses as any);

      // Act
      await checker.check(userId);

      // Assert
      expect(mockAlertRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'critical',
        })
      );
    });
  });

  describe('getType', () => {
    it('should return overspending type', () => {
      expect(checker.getType()).toBe('overspending');
    });
  });

  describe('getName', () => {
    it('should return checker name', () => {
      expect(checker.getName()).toBe('Overspending Alert Checker');
    });
  });
});
