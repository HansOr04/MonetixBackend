import { Transaction } from '../models/Transaction.model';
import { Goal } from '../models/Goal.model';
import { Alert } from '../models/Alert.model';
import { Category } from '../models/Category.model';
import { StatisticalTests } from './utils/statisticalTests';

export class AlertGenerator {
  async checkOverspending(userId: string): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExpenses = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: thirtyDaysAgo },
    }).lean();

    if (recentExpenses.length < 5) {
      return;
    }

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const previousExpenses = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    }).lean();

    if (previousExpenses.length < 5) {
      return;
    }

    const recentTotal = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const previousTotal = previousExpenses.reduce((sum, t) => sum + t.amount, 0);
    const recentAvg = recentTotal / 30;
    const previousAvg = previousTotal / 30;

    if (recentAvg > previousAvg * 1.2) {
      const increasePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

      await Alert.create({
        userId,
        type: 'overspending',
        severity: increasePercent > 50 ? 'critical' : 'warning',
        message: `Tus gastos han aumentado un ${increasePercent.toFixed(1)}% en los últimos 30 días. Gasto diario promedio: $${recentAvg.toFixed(2)} (antes: $${previousAvg.toFixed(2)})`,
        relatedData: {
          recentAverage: recentAvg,
          previousAverage: previousAvg,
          increasePercent,
          period: '30 días',
        },
      });
    }

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

      const unusualExpenses = amounts.filter(amount => amount > avgAmount + 2 * stdDev);

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

  async checkGoalProgress(userId: string): Promise<void> {
    const activeGoals = await Goal.find({
      userId,
      status: 'active',
    }).lean();

    for (const goal of activeGoals) {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const daysUntilTarget = Math.ceil(
        (goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilTarget <= 0 && progress < 100) {
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
        continue;
      }

      const daysElapsed = Math.ceil(
        (Date.now() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalDays = Math.ceil(
        (goal.targetDate.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const expectedProgress = (daysElapsed / totalDays) * 100;

      if (progress < expectedProgress * 0.7 && daysUntilTarget > 0) {
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
      } else if (progress >= 90 && progress < 100) {
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
    }
  }

  async detectUnusualPatterns(userId: string): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = await Transaction.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    }).lean();

    if (recentTransactions.length < 10) {
      return;
    }

    const amounts = recentTransactions.map(t => t.amount);
    const avgAmount = StatisticalTests.mean(amounts);
    const stdDev = StatisticalTests.standardDeviation(amounts);

    const highValueTransactions = recentTransactions.filter(
      t => t.amount > avgAmount + 2 * stdDev
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
          threshold: avgAmount + 2 * stdDev,
          highValueTransactions: highValueTransactions.map(t => ({
            amount: t.amount,
            date: t.date,
            type: t.type,
          })),
        },
      });
    }

    const transactionsByDay = new Map<number, number>();
    recentTransactions.forEach(t => {
      const day = new Date(t.date).getDay();
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

  async generateRecommendations(userId: string): Promise<void> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const transactions = await Transaction.find({
      userId,
      date: { $gte: sixtyDaysAgo },
    }).lean();

    if (transactions.length < 20) {
      return;
    }

    const incomes = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');

    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    if (savingsRate < 10 && totalIncome > 0) {
      await Alert.create({
        userId,
        type: 'recommendation',
        severity: 'info',
        message: `Tu tasa de ahorro es del ${savingsRate.toFixed(1)}%. Se recomienda ahorrar al menos el 20% de tus ingresos. Considera reducir gastos no esenciales.`,
        relatedData: {
          savingsRate,
          recommendedRate: 20,
          monthlySavings: (totalIncome - totalExpense) / 2,
          monthlyIncome: totalIncome / 2,
        },
      });
    }

    const expensesByCategory = new Map<string, number>();
    for (const expense of expenses) {
      const categoryId = expense.categoryId.toString();
      expensesByCategory.set(categoryId, (expensesByCategory.get(categoryId) || 0) + expense.amount);
    }

    const sortedCategories = Array.from(expensesByCategory.entries()).sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0];
      const topCategoryPercent = (topCategory[1] / totalExpense) * 100;

      if (topCategoryPercent > 40) {
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

  async runAllChecks(userId: string): Promise<void> {
    await Promise.all([
      this.checkOverspending(userId),
      this.checkGoalProgress(userId),
      this.detectUnusualPatterns(userId),
      this.generateRecommendations(userId),
    ]);
  }
}

export const alertGenerator = new AlertGenerator();
