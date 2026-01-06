import { injectable, inject } from 'inversify';
import { IAlertChecker, AlertType } from '../interfaces/IAlertChecker';
import { ITransactionRepository } from '../../../repositories/interfaces/ITransactionRepository';
import { ICategoryRepository } from '../../../repositories/interfaces/ICategoryRepository';
import { IAlertRepository } from '../../../repositories/interfaces/IAlertRepository';
import { ITransaction } from '../../../models/Transaction.model';
import { TYPES } from '../../../services/TransactionService';

@injectable()
export class RecommendationAlertChecker implements IAlertChecker {
  private readonly DAYS_60 = 60;
  private readonly MIN_TRANSACTIONS = 20;
  private readonly SAVINGS_RATE_THRESHOLD = 10;
  private readonly RECOMMENDED_SAVINGS_RATE = 20;
  private readonly CATEGORY_SPENDING_THRESHOLD = 40;

  constructor(
    @inject(TYPES.ITransactionRepository) private transactionRepo: ITransactionRepository,
    @inject(Symbol.for('ICategoryRepository')) private categoryRepo: ICategoryRepository,
    @inject(Symbol.for('IAlertRepository')) private alertRepo: IAlertRepository
  ) {}

  getType(): AlertType {
    return 'recommendation';
  }

  getName(): string {
    return 'Recommendation Alert Checker';
  }

  async check(userId: string): Promise<void> {
    const transactions = await this.getRecentTransactions(userId);

    if (transactions.length < this.MIN_TRANSACTIONS) {
      return;
    }

    const { totalIncome, totalExpense, expenses } = this.aggregateTransactions(transactions);

    await this.checkSavingsRate(userId, totalIncome, totalExpense);
    await this.checkTopSpendingCategory(userId, totalExpense, expenses);
  }

  private async getRecentTransactions(userId: string): Promise<ITransaction[]> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - this.DAYS_60);

    return this.transactionRepo.findByDateRange(userId, sixtyDaysAgo, new Date());
  }

  private aggregateTransactions(transactions: ITransaction[]) {
    const income = transactions.filter((t) => t.type === 'income');
    const expenses = transactions.filter((t) => t.type === 'expense');

    return {
      totalIncome: income.reduce((sum, t) => sum + t.amount, 0),
      totalExpense: expenses.reduce((sum, t) => sum + t.amount, 0),
      income,
      expenses,
    };
  }

  private async checkSavingsRate(
    userId: string,
    totalIncome: number,
    totalExpense: number
  ): Promise<void> {
    if (totalIncome === 0) return;

    const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;

    if (savingsRate < this.SAVINGS_RATE_THRESHOLD) {
      await this.alertRepo.create({
        userId,
        type: 'recommendation',
        severity: 'info',
        message:
          `Tu tasa de ahorro es del ${savingsRate.toFixed(1)}%. ` +
          `Se recomienda ahorrar al menos el ${this.RECOMMENDED_SAVINGS_RATE}% de tus ingresos. ` +
          `Considera reducir gastos no esenciales.`,
        relatedData: {
          savingsRate,
          recommendedRate: this.RECOMMENDED_SAVINGS_RATE,
          monthlySavings: (totalIncome - totalExpense) / 2,
          monthlyIncome: totalIncome / 2,
        },
      });
    }
  }

  private async checkTopSpendingCategory(
    userId: string,
    totalExpense: number,
    expenses: ITransaction[]
  ): Promise<void> {
    const categoryTotals = this.groupExpensesByCategory(expenses);
    const topCategory = this.findTopCategory(categoryTotals);

    if (!topCategory) return;

    const percentage = (topCategory.amount / totalExpense) * 100;

    if (percentage > this.CATEGORY_SPENDING_THRESHOLD) {
      const category = await this.categoryRepo.findById(topCategory.categoryId);

      await this.alertRepo.create({
        userId,
        type: 'recommendation',
        severity: 'info',
        message:
          `El ${percentage.toFixed(1)}% de tus gastos son en "${category?.name || 'Desconocida'}". ` +
          `Considera si puedes optimizar en esta área.`,
        relatedData: {
          categoryId: topCategory.categoryId,
          categoryName: category?.name,
          amount: topCategory.amount,
          percentage,
        },
      });
    }
  }

  private groupExpensesByCategory(expenses: ITransaction[]): Map<string, number> {
    const totals = new Map<string, number>();

    expenses.forEach((expense) => {
      const categoryId = expense.categoryId.toString();
      totals.set(categoryId, (totals.get(categoryId) || 0) + expense.amount);
    });

    return totals;
  }

  private findTopCategory(totals: Map<string, number>) {
    let topCategoryId = '';
    let topAmount = 0;

    totals.forEach((amount, categoryId) => {
      if (amount > topAmount) {
        topAmount = amount;
        topCategoryId = categoryId;
      }
    });

    return topCategoryId ? { categoryId: topCategoryId, amount: topAmount } : null;
  }
}
