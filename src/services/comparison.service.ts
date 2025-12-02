import { Transaction } from '../models/Transaction.model';
import { Prediction } from '../models/Prediction.model';
import mongoose from 'mongoose';

/**
 * Servicio para comparar datos entre diferentes tablas y dimensiones
 */
export class ComparisonService {
    /**
     * Compara predicciones entre diferentes categorías para un usuario
     */
    async compareByCategory(userId: string, periods: number = 6): Promise<any> {
        const transactions = await Transaction.find({ userId }).lean();

        // Agrupar por categoría
        const categoriesMap = new Map<string, any[]>();
        transactions.forEach(t => {
            const catId = t.categoryId?.toString() || 'sin_categoria';
            if (!categoriesMap.has(catId)) {
                categoriesMap.set(catId, []);
            }
            categoriesMap.get(catId)!.push(t);
        });

        const comparisons: any[] = [];

        for (const [categoryId, categoryTransactions] of categoriesMap.entries()) {
            const totalAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
            const avgAmount = totalAmount / categoryTransactions.length;
            const transactionCount = categoryTransactions.length;

            comparisons.push({
                categoryId,
                categoryName: categoryTransactions[0]?.category || 'Sin categoría',
                totalAmount,
                avgAmount,
                transactionCount,
                percentage: 0 // Se calculará después
            });
        }

        // Calcular porcentajes
        const grandTotal = comparisons.reduce((sum, c) => sum + c.totalAmount, 0);
        comparisons.forEach(c => {
            c.percentage = grandTotal > 0 ? (c.totalAmount / grandTotal) * 100 : 0;
        });

        // Ordenar por total descendente
        comparisons.sort((a, b) => b.totalAmount - a.totalAmount);

        return {
            userId,
            comparisonType: 'by_category',
            totalCategories: comparisons.length,
            grandTotal,
            categories: comparisons,
            generatedAt: new Date()
        };
    }

    /**
     * Compara predicciones generadas en diferentes momentos
     */
    async compareByTime(userId: string, limit: number = 5): Promise<any> {
        const predictions = await Prediction.find({ userId })
            .sort({ generatedAt: -1 })
            .limit(limit)
            .lean();

        const comparisons = predictions.map(pred => {
            const avgPrediction = pred.predictions.reduce((sum, p) => sum + p.amount, 0) / pred.predictions.length;
            const firstPrediction = pred.predictions[0]?.amount || 0;
            const lastPrediction = pred.predictions[pred.predictions.length - 1]?.amount || 0;
            const trend = lastPrediction > firstPrediction ? 'creciente' : 'decreciente';

            return {
                predictionId: pred._id,
                generatedAt: pred.generatedAt,
                confidence: pred.confidence,
                avgPredictedAmount: avgPrediction,
                firstPeriodAmount: firstPrediction,
                lastPeriodAmount: lastPrediction,
                trend,
                periodsCount: pred.predictions.length
            };
        });

        return {
            userId,
            comparisonType: 'temporal',
            totalPredictions: comparisons.length,
            predictions: comparisons,
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
}

export const comparisonService = new ComparisonService();
