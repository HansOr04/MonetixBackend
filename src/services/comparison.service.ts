import { Transaction } from '../models/Transaction.model';
import { Prediction } from '../models/Prediction.model';
import mongoose from 'mongoose';

/**
 * Servicio para comparar datos entre diferentes tablas y dimensiones
 */
export class ComparisonService {
    /**
     * Compara una categoría específica entre el período actual y el anterior
     */
    async compareByCategory(userId: string, categoryId: string): Promise<any> {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Fetch category details
        const { Category } = await import('../models/Category.model');
        const category = await Category.findById(categoryId).lean();

        // Fetch transactions for current period
        const currentTransactions = await Transaction.find({
            userId,
            categoryId,
            date: { $gte: currentMonthStart, $lte: currentMonthEnd }
        }).lean();

        // Fetch transactions for previous period
        const previousTransactions = await Transaction.find({
            userId,
            categoryId,
            date: { $gte: previousMonthStart, $lte: previousMonthEnd }
        }).lean();

        const calculateStats = (transactions: any[]) => ({
            total: transactions.reduce((sum, t) => sum + t.amount, 0),
            count: transactions.length
        });

        const currentStats = calculateStats(currentTransactions);
        const previousStats = calculateStats(previousTransactions);

        const difference = currentStats.total - previousStats.total;
        const percentageChange = previousStats.total !== 0
            ? ((currentStats.total - previousStats.total) / previousStats.total) * 100
            : 0;

        return {
            userId,
            category: category || { name: 'Categoría desconocida' },
            currentPeriod: {
                ...currentStats,
                startDate: currentMonthStart,
                endDate: currentMonthEnd
            },
            previousPeriod: {
                ...previousStats,
                startDate: previousMonthStart,
                endDate: previousMonthEnd
            },
            comparison: {
                difference,
                percentageChange,
                trend: difference > 0 ? 'increasing' : difference < 0 ? 'decreasing' : 'stable'
            },
            generatedAt: new Date()
        };
    }

    /**
     * Compara datos financieros a lo largo del tiempo
     */
    async compareByTime(userId: string, period: 'month' | 'quarter' | 'year' = 'month'): Promise<any> {
        const transactions = await Transaction.find({ userId }).sort({ date: 1 }).lean();

        const periodsMap = new Map<string, { income: number; expense: number; count: number }>();

        transactions.forEach(t => {
            const date = new Date(t.date);
            let key = '';

            if (period === 'month') {
                // Format: YYYY-MM
                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            } else if (period === 'quarter') {
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                key = `Q${quarter} ${date.getFullYear()}`;
            } else {
                key = `${date.getFullYear()}`;
            }

            if (!periodsMap.has(key)) {
                periodsMap.set(key, { income: 0, expense: 0, count: 0 });
            }

            const entry = periodsMap.get(key)!;
            if (t.type === 'income') {
                entry.income += t.amount;
            } else {
                entry.expense += t.amount;
            }
            entry.count++;
        });

        // Convert map to array. Note: Sorting by string key might not be chronological if using names.
        // Better to sort by date logic, but for simplicity let's rely on insertion order if transactions are sorted?
        // No, map iteration order is insertion order. Transactions are sorted by date.
        // So if we process sorted transactions, keys will be created in chronological order.

        const periods = Array.from(periodsMap.entries()).map(([key, data]) => ({
            period: key,
            income: data.income,
            expense: data.expense,
            balance: data.income - data.expense,
            count: data.count
        }));

        // Calculate comparison between last two periods
        let comparison = {
            incomeChange: 0,
            expenseChange: 0,
            balanceChange: 0
        };

        if (periods.length >= 2) {
            const current = periods[periods.length - 1];
            const previous = periods[periods.length - 2];

            const calcChange = (curr: number, prev: number) => prev !== 0 ? ((curr - prev) / prev) * 100 : 0;

            comparison = {
                incomeChange: calcChange(current.income, previous.income),
                expenseChange: calcChange(current.expense, previous.expense),
                balanceChange: calcChange(current.balance, previous.balance)
            };
        }

        return {
            userId,
            comparisonType: 'temporal',
            periodType: period,
            periods,
            comparison,
            generatedAt: new Date()
        };
    }

    /**
     * Compara patrones entre diferentes usuarios (solo admin)
     */
    async compareByUsers(userIds: string[]): Promise<any> {
        const comparisons: any[] = [];

        for (const userId of userIds) {
            const transactions = await Transaction.find({ userId }).lean();
            const predictions = await Prediction.find({ userId }).sort({ generatedAt: -1 }).limit(1).lean();

            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const balance = totalIncome - totalExpense;
            const avgTransaction = transactions.length > 0 ? (totalIncome + totalExpense) / transactions.length : 0;

            const latestPrediction = predictions[0];
            const avgPredicted = latestPrediction
                ? latestPrediction.predictions.reduce((sum, p) => sum + p.amount, 0) / latestPrediction.predictions.length
                : 0;

            comparisons.push({
                userId,
                transactionCount: transactions.length,
                totalIncome,
                totalExpense,
                balance,
                avgTransaction,
                latestPredictionConfidence: latestPrediction?.confidence || 0,
                avgPredictedAmount: avgPredicted,
                hasEnoughData: transactions.length >= 30
            });
        }

        return {
            comparisonType: 'by_users',
            totalUsers: comparisons.length,
            users: comparisons,
            generatedAt: new Date()
        };
    }

    /**
     * Compara datos reales vs predicciones para evaluar precisión
     */
    async compareRealVsPredicted(userId: string, predictionId: string): Promise<any> {
        const prediction = await Prediction.findById(predictionId).lean();
        if (!prediction || prediction.userId.toString() !== userId) {
            throw new Error('Predicción no encontrada');
        }

        const predictionStartDate = prediction.predictions[0].date;
        const predictionEndDate = prediction.predictions[prediction.predictions.length - 1].date;

        // Obtener transacciones reales en el rango de fechas predicho
        const realTransactions = await Transaction.find({
            userId,
            date: { $gte: predictionStartDate, $lte: predictionEndDate }
        }).lean();

        // Agrupar transacciones reales por mes
        const realByMonth = new Map<string, number>();
        realTransactions.forEach(t => {
            const monthKey = `${t.date.getFullYear()}-${t.date.getMonth()}`;
            const amount = t.type === 'income' ? t.amount : -t.amount;
            realByMonth.set(monthKey, (realByMonth.get(monthKey) || 0) + Math.abs(amount));
        });

        // Comparar con predicciones
        const comparisons = prediction.predictions.map(pred => {
            const monthKey = `${pred.date.getFullYear()}-${pred.date.getMonth()}`;
            const realAmount = realByMonth.get(monthKey) || 0;
            const predictedAmount = pred.amount;
            const difference = realAmount - predictedAmount;
            const percentageError = predictedAmount > 0 ? Math.abs(difference / predictedAmount) * 100 : 0;
            const isAccurate = percentageError < 20; // Menos del 20% de error

            return {
                date: pred.date,
                predictedAmount,
                predictedLowerBound: pred.lowerBound,
                predictedUpperBound: pred.upperBound,
                realAmount,
                difference,
                percentageError,
                isAccurate,
                withinBounds: realAmount >= pred.lowerBound && realAmount <= pred.upperBound
            };
        });

        const avgError = comparisons.reduce((sum, c) => sum + c.percentageError, 0) / comparisons.length;
        const accurateCount = comparisons.filter(c => c.isAccurate).length;
        const withinBoundsCount = comparisons.filter(c => c.withinBounds).length;

        return {
            userId,
            predictionId,
            comparisonType: 'real_vs_predicted',
            predictionGeneratedAt: prediction.generatedAt,
            modelConfidence: prediction.confidence,
            avgPercentageError: avgError,
            accuracyRate: (accurateCount / comparisons.length) * 100,
            boundsAccuracyRate: (withinBoundsCount / comparisons.length) * 100,
            comparisons,
            generatedAt: new Date()
        };
    }

    /**
     * Compara predicciones con diferentes números de períodos
     */
    async compareByPeriods(userId: string, periodOptions: number[] = [3, 6, 12]): Promise<any> {
        const { predictionEngine } = await import('../core/PredictionEngine');

        const comparisons: any[] = [];

        for (const periods of periodOptions) {
            try {
                const prediction = await predictionEngine.predict(userId, 'linear_regression', periods);

                const avgAmount = prediction.predictions.reduce((sum: number, p: any) => sum + p.amount, 0) / prediction.predictions.length;
                const totalAmount = prediction.predictions.reduce((sum: number, p: any) => sum + p.amount, 0);
                const firstAmount = prediction.predictions[0]?.amount || 0;
                const lastAmount = prediction.predictions[prediction.predictions.length - 1]?.amount || 0;
                const growthRate = firstAmount > 0 ? ((lastAmount - firstAmount) / firstAmount) * 100 : 0;

                comparisons.push({
                    periods,
                    confidence: prediction.confidence,
                    avgPredictedAmount: avgAmount,
                    totalPredictedAmount: totalAmount,
                    firstPeriodAmount: firstAmount,
                    lastPeriodAmount: lastAmount,
                    growthRate,
                    predictions: prediction.predictions
                });
            } catch (error) {
                comparisons.push({
                    periods,
                    error: error instanceof Error ? error.message : 'Error desconocido',
                    success: false
                });
            }
        }

        return {
            userId,
            comparisonType: 'by_periods',
            periodOptions,
            comparisons,
            generatedAt: new Date()
        };
    }
    /**
     * Compara dos categorías específicas en un período de tiempo
     */
    async compareCategories(userId: string, categoryAId: string, categoryBId: string, period: 'month' | 'quarter' | 'year' = 'month'): Promise<any> {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();

        // Determinar rango de fechas
        if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (period === 'quarter') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
        }

        // Obtener transacciones para ambas categorías
        const transactionsA = await Transaction.find({
            userId,
            categoryId: categoryAId,
            date: { $gte: startDate, $lte: endDate }
        }).populate('categoryId', 'name icon color').lean();

        const transactionsB = await Transaction.find({
            userId,
            categoryId: categoryBId,
            date: { $gte: startDate, $lte: endDate }
        }).populate('categoryId', 'name icon color').lean();

        // Calcular métricas para Categoría A
        const totalA = transactionsA.reduce((sum, t) => sum + t.amount, 0);
        const countA = transactionsA.length;
        const avgA = countA > 0 ? totalA / countA : 0;
        const categoryA = transactionsA[0]?.categoryId || { name: 'Categoría A' };

        // Calcular métricas para Categoría B
        const totalB = transactionsB.reduce((sum, t) => sum + t.amount, 0);
        const countB = transactionsB.length;
        const avgB = countB > 0 ? totalB / countB : 0;
        const categoryB = transactionsB[0]?.categoryId || { name: 'Categoría B' };

        // Calcular diferencias
        const diffTotal = totalA - totalB;
        const diffPercentage = totalB > 0 ? ((totalA - totalB) / totalB) * 100 : 0;

        return {
            period,
            startDate,
            endDate,
            categoryA: {
                id: categoryAId,
                name: (categoryA as any).name,
                icon: (categoryA as any).icon,
                color: (categoryA as any).color,
                total: totalA,
                count: countA,
                average: avgA
            },
            categoryB: {
                id: categoryBId,
                name: (categoryB as any).name,
                icon: (categoryB as any).icon,
                color: (categoryB as any).color,
                total: totalB,
                count: countB,
                average: avgB
            },
            comparison: {
                difference: diffTotal,
                percentageDifference: diffPercentage,
                higherCategory: totalA > totalB ? 'A' : totalB > totalA ? 'B' : 'equal'
            }
        };
    }
}

export const comparisonService = new ComparisonService();
