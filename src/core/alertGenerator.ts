import { Transaction } from '../models/Transaction.model';
import { Goal } from '../models/Goal.model';
import { Alert } from '../models/Alert.model';
import { Category } from '../models/Category.model';
import { StatisticalTests } from './utils/statisticalTests';

export class AlertGenerator {
  private readonly DAYS_30 = 30;
  private readonly DAYS_60 = 60;
  private readonly MIN_EXPENSES_FOR_CHECK = 5;
  private readonly OVERSPENDING_THRESHOLD = 1.2; // 20% increase
  private readonly CRITICAL_INCREASE_PERCENT = 50;
  private readonly UNUSUAL_EXPENSE_STD_DEV_MULTIPLIER = 2;
  private readonly MIN_TRANSACTIONS_FOR_PATTERN = 10;
  private readonly MIN_TRANSACTIONS_FOR_RECOMMENDATIONS = 20;
  private readonly SAVINGS_RATE_THRESHOLD = 10;
  private readonly RECOMMENDED_SAVINGS_RATE = 20;
  private readonly CATEGORY_SPENDING_THRESHOLD_PERCENT = 40;

  async checkOverspending(userId: string): Promise<void> {
    const thirtyDaysAgo = this.getDateDaysAgo(this.DAYS_30);
    const recentExpenses = await this.getExpensesSince(userId, thirtyDaysAgo);

    if (recentExpenses.length < this.MIN_EXPENSES_FOR_CHECK) {
      return;
    }

    const sixtyDaysAgo = this.getDateDaysAgo(this.DAYS_60);
    const previousExpenses = await this.getExpensesBetween(userId, sixtyDaysAgo, thirtyDaysAgo);

    if (previousExpenses.length < this.MIN_EXPENSES_FOR_CHECK) {
      return;
    }

    await this.analyzeSpendingIncrease(userId, recentExpenses, previousExpenses);
    await this.analyzeCategorySpending(userId, recentExpenses);
  }

  async checkGoalProgress(userId: string): Promise<void> {
    const activeGoals = await Goal.find({
      userId,
      status: 'active',
    }).lean();

    for (const goal of activeGoals) {
      await this.evaluateGoal(userId, goal);
    }
  }

  async detectUnusualPatterns(userId: string): Promise<void> {
    const thirtyDaysAgo = this.getDateDaysAgo(this.DAYS_30);
    const recentTransactions = await Transaction.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    }).lean();

    if (recentTransactions.length < this.MIN_TRANSACTIONS_FOR_PATTERN) {
      return;
    }

    await this.checkHighValueTransactions(userId, recentTransactions);
    await this.checkTransactionTiming(userId, recentTransactions);
  }

  async generateRecommendations(userId: string): Promise<void> {
    const sixtyDaysAgo = this.getDateDaysAgo(this.DAYS_60);
    const transactions = await Transaction.find({
      userId,
      date: { $gte: sixtyDaysAgo },
    }).lean();

    if (transactions.length < this.MIN_TRANSACTIONS_FOR_RECOMMENDATIONS) {
      return;
    }

    const incomeTransactions = transactions.filter(transaction => transaction.type === 'income');
    const expenseTransactions = transactions.filter(transaction => transaction.type === 'expense');

    const totalIncome = incomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    await this.checkSavingsRate(userId, totalIncome, totalExpense);
    await this.checkTopSpendingCategory(userId, totalExpense, expenseTransactions);
  }

  async runAllChecks(userId: string): Promise<void> {
    await Promise.all([
      this.checkOverspending(userId),
      this.checkGoalProgress(userId),
      this.detectUnusualPatterns(userId),
      this.generateRecommendations(userId),
    ]);
  }

  // Helper methods

  private getDateDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private async getExpensesSince(userId: string, date: Date): Promise<any[]> {
    return Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: date },
    }).lean();
  }

  private async getExpensesBetween(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: startDate, $lt: endDate },
    }).lean();
  }

  private async analyzeSpendingIncrease(userId: string, recentExpenses: any[], previousExpenses: any[]): Promise<void> {
    const recentTotal = recentExpenses.reduce((sum, transaction) => sum + transaction.amount, 0);
    const previousTotal = previousExpenses.reduce((sum, transaction) => sum + transaction.amount, 0);
    const recentAvg = recentTotal / this.DAYS_30;
    const previousAvg = previousTotal / this.DAYS_30;

    if (recentAvg > previousAvg * this.OVERSPENDING_THRESHOLD) {
      const increasePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

      await Alert.create({
        userId,
        type: 'overspending',
        severity: increasePercent > this.CRITICAL_INCREASE_PERCENT ? 'critical' : 'warning',
        message: `Tus gastos han aumentado un ${increasePercent.toFixed(1)}% en los últimos 30 días. Gasto diario promedio: $${recentAvg.toFixed(2)} (antes: $${previousAvg.toFixed(2)})`,
        relatedData: {
          recentAverage: recentAvg,
          previousAverage: previousAvg,
          increasePercent,
          period: '30 días',
        },
      });
    }
  }

  private async analyzeCategorySpending(userId: string, recentExpenses: any[]): Promise<void> {
    const expensesByCategory = new Map<string, number[]>();
    recentExpenses.forEach(expense => {
      const categoryId = expense.categoryId.toString();
      if (!expensesByCategory.has(categoryId)) {
        expensesByCategory.set(categoryId, []);
      }
      expensesByCategory.get(categoryId)!.push(expense.amount);
    });

    for (const [categoryId, amounts] of expensesByCategory) {
      if (amounts.length < 3) continue;

      const avgAmount = StatisticalTests.mean(amounts);
      const stdDev = StatisticalTests.standardDeviation(amounts);

      const unusualExpenses = amounts.filter(amount => amount > avgAmount + this.UNUSUAL_EXPENSE_STD_DEV_MULTIPLIER * stdDev);

      if (unusualExpenses.length > 0) {
        const category = await Category.findById(categoryId).lean();
        const categoryName = category ? category.name : 'Desconocida';

        await Alert.create({
          userId,
          type: 'unusual_pattern',
          severity: 'warning',
          message: `Gastos inusuales detectados en la categoría "${categoryName}". Algunos gastos superan significativamente tu promedio de $${avgAmount.toFixed(2)}`,
          relatedData: {
            categoryId,
            categoryName,
            averageAmount: avgAmount,
            unusualExpenses,
            unusualCount: unusualExpenses.length,
          },
        });
      }
    }
  }

  private async evaluateGoal(userId: string, goal: any): Promise<void> {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysUntilTarget = Math.ceil(
      (goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilTarget <= 0 && progress < 100) {
      await this.createGoalExpiredAlert(userId, goal, progress, daysUntilTarget);
      return;
    }

    const daysElapsed = Math.ceil(
      (Date.now() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = Math.ceil(
      (goal.targetDate.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const expectedProgress = (daysElapsed / totalDays) * 100;

    if (progress < expectedProgress * 0.7 && daysUntilTarget > 0) {
      await this.createGoalBehindAlert(userId, goal, progress, expectedProgress, daysUntilTarget);
    } else if (progress >= 90 && progress < 100) {
      await this.createGoalNearCompletionAlert(userId, goal, progress);
    }
  }

  private async createGoalExpiredAlert(userId: string, goal: any, progress: number, daysUntilTarget: number): Promise<void> {
    await Alert.create({
      userId,
      type: 'goal_progress',
      severity: 'critical',
      message: `La meta "${goal.name}" ha expirado. Progreso: ${progress.toFixed(1)}% ($${goal.currentAmount.toFixed(2)} de $${goal.targetAmount.toFixed(2)})`,
      relatedData: {
        goalId: goal._id,
        goalName: goal.name,
        progress,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate,
        daysOverdue: Math.abs(daysUntilTarget),
      },
    });
  }

  private async createGoalBehindAlert(userId: string, goal: any, progress: number, expectedProgress: number, daysUntilTarget: number): Promise<void> {
    await Alert.create({
      userId,
      type: 'goal_progress',
      severity: daysUntilTarget < 30 ? 'warning' : 'info',
      message: `La meta "${goal.name}" está retrasada. Progreso actual: ${progress.toFixed(1)}%, progreso esperado: ${expectedProgress.toFixed(1)}%. Quedan ${daysUntilTarget} días.`,
      relatedData: {
        goalId: goal._id,
        goalName: goal.name,
        currentProgress: progress,
        expectedProgress,
        daysRemaining: daysUntilTarget,
        amountNeeded: goal.targetAmount - goal.currentAmount,
      },
    });
  }

  private async createGoalNearCompletionAlert(userId: string, goal: any, progress: number): Promise<void> {
    await Alert.create({
      userId,
      type: 'goal_progress',
      severity: 'info',
      message: `¡Casi lo logras! La meta "${goal.name}" está al ${progress.toFixed(1)}%. Solo faltan $${(goal.targetAmount - goal.currentAmount).toFixed(2)}`,
      relatedData: {
        goalId: goal._id,
        goalName: goal.name,
        progress,
        amountNeeded: goal.targetAmount - goal.currentAmount,
      },
    });
  }

  private async checkHighValueTransactions(userId: string, recentTransactions: any[]): Promise<void> {
    const amounts = recentTransactions.map(transaction => transaction.amount);
    const avgAmount = StatisticalTests.mean(amounts);
    const stdDev = StatisticalTests.standardDeviation(amounts);

    const highValueTransactions = recentTransactions.filter(
      transaction => transaction.amount > avgAmount + this.UNUSUAL_EXPENSE_STD_DEV_MULTIPLIER * stdDev
    );

    if (highValueTransactions.length > 0) {
      await Alert.create({
        userId,
        type: 'unusual_pattern',
        severity: 'info',
        message: `Se detectaron ${highValueTransactions.length} transacciones con montos inusualmente altos en los últimos 30 días`,
        relatedData: {
          transactionCount: highValueTransactions.length,
          averageAmount: avgAmount,
          threshold: avgAmount + this.UNUSUAL_EXPENSE_STD_DEV_MULTIPLIER * stdDev,
          highValueTransactions: highValueTransactions.map(transaction => ({
            amount: transaction.amount,
            date: transaction.date,
            type: transaction.type,
          })),
        },
      });
    }
  }

  private async checkTransactionTiming(userId: string, recentTransactions: any[]): Promise<void> {
    const transactionsByDay = new Map<number, number>();
    recentTransactions.forEach(transaction => {
      const day = new Date(transaction.date).getDay();
      transactionsByDay.set(day, (transactionsByDay.get(day) || 0) + 1);
    });

    const mostActiveDay = Array.from(transactionsByDay.entries()).reduce((max, entry) =>
      entry[1] > max[1] ? entry : max
    );

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    if (mostActiveDay[1] > recentTransactions.length * 0.3) {
      await Alert.create({
        userId,
        type: 'unusual_pattern',
        severity: 'info',
        message: `La mayoría de tus transacciones (${mostActiveDay[1]}) ocurren los ${dayNames[mostActiveDay[0]]}s`,
        relatedData: {
          day: dayNames[mostActiveDay[0]],
          transactionCount: mostActiveDay[1],
          percentage: (mostActiveDay[1] / recentTransactions.length) * 100,
        },
      });
    }
  }

  private async checkSavingsRate(userId: string, totalIncome: number, totalExpense: number): Promise<void> {
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    if (savingsRate < this.SAVINGS_RATE_THRESHOLD && totalIncome > 0) {
      await Alert.create({
        userId,
        type: 'recommendation',
        severity: 'info',
        message: `Tu tasa de ahorro es del ${savingsRate.toFixed(1)}%. Se recomienda ahorrar al menos el ${this.RECOMMENDED_SAVINGS_RATE}% de tus ingresos. Considera reducir gastos no esenciales.`,
        relatedData: {
          savingsRate,
          recommendedRate: this.RECOMMENDED_SAVINGS_RATE,
          monthlySavings: (totalIncome - totalExpense) / 2,
          monthlyIncome: totalIncome / 2,
        },
      });
    }
  }

  private async checkTopSpendingCategory(userId: string, totalExpense: number, expenseTransactions: any[]): Promise<void> {
    const expensesByCategory = new Map<string, number>();
    for (const expense of expenseTransactions) {
      const categoryId = expense.categoryId.toString();
      expensesByCategory.set(categoryId, (expensesByCategory.get(categoryId) || 0) + expense.amount);
    }

    const sortedCategories = Array.from(expensesByCategory.entries()).sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0];
      const topCategoryPercent = (topCategory[1] / totalExpense) * 100;

      if (topCategoryPercent > this.CATEGORY_SPENDING_THRESHOLD_PERCENT) {
        const category = await Category.findById(topCategory[0]).lean();
        const categoryName = category ? category.name : 'Desconocida';

        await Alert.create({
          userId,
          type: 'recommendation',
          severity: 'info',
          message: `El ${topCategoryPercent.toFixed(1)}% de tus gastos son en "${categoryName}". Considera si puedes optimizar en esta área.`,
          relatedData: {
            categoryId: topCategory[0],
            categoryName,
            amount: topCategory[1],
            percentage: topCategoryPercent,
          },
        });
      }
    }
  }
}

export const alertGenerator = new AlertGenerator();
