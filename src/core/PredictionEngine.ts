import { Transaction } from '../models/Transaction.model';
import { Prediction } from '../models/Prediction.model';
import { DataPreprocessor, DataPoint } from './utils/dataPreprocessor';
import { LinearRegressionModel } from './models/LinearRegression';
import { IPredictionModel, TimeSeriesData } from './interfaces/PredictionModel';

export class PredictionEngine {
  private static instance: PredictionEngine;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000;

  private constructor() { }

  static getInstance(): PredictionEngine {
    if (!PredictionEngine.instance) {
      PredictionEngine.instance = new PredictionEngine();
    }
    return PredictionEngine.instance;
  }

  async predict(
    userId: string,
    modelType: 'linear_regression',
    periods: number = 6
  ): Promise<any> {
    const cacheKey = `${userId}-${modelType}-${periods}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const transactions = await Transaction.find({ userId })
      .sort({ date: 1 })
      .lean();

    if (transactions.length < 30) {
      throw new Error('Se necesitan al menos 30 transacciones para generar predicciones');
    }

    const dataPoints = this.transactionsToDataPoints(transactions);
    const cleanedData = DataPreprocessor.cleanData(dataPoints);
    const aggregatedData = DataPreprocessor.aggregateByPeriod(cleanedData, 'month');
    const timeSeriesData = DataPreprocessor.toTimeSeries(aggregatedData);

    const model = this.getModel(modelType);
    model.train(timeSeriesData);

    const predictions = model.predict(periods);
    const confidence = model.getConfidence();
    const metadata = model.getMetadata();

    const predictionDoc = new Prediction({
      userId,
      modelType,
      predictions: predictions.map(p => ({
        date: p.date,
        amount: p.amount,
        lowerBound: p.lowerBound,
        upperBound: p.upperBound,
      })),
      confidence,
      metadata,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.CACHE_TTL),
    });

    await predictionDoc.save();

    const result = {
      id: predictionDoc._id,
      userId: predictionDoc.userId,
      modelType: predictionDoc.modelType,
      predictions: predictionDoc.predictions,
      confidence: predictionDoc.confidence,
      metadata: predictionDoc.metadata,
      generatedAt: predictionDoc.generatedAt,
    };

    this.setCache(cacheKey, result);
    return result;
  }



  async generateInsights(userId: string): Promise<any> {
    const transactions = await Transaction.find({ userId })
      .sort({ date: 1 })
      .lean();

    if (transactions.length < 10) {
      return {
        insights: ['Necesitas más transacciones para generar insights significativos'],
        summary: {
          totalTransactions: transactions.length,
          hasEnoughData: false,
        },
      };
    }

    const dataPoints = this.transactionsToDataPoints(transactions);
    const cleanedData = DataPreprocessor.cleanData(dataPoints);

    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgIncome = incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0;
    const avgExpense = expenseTransactions.length > 0 ? totalExpense / expenseTransactions.length : 0;

    const insights: string[] = [];

    if (totalExpense > totalIncome) {
      const deficit = totalExpense - totalIncome;
      insights.push(
        `Tus gastos totales ($${totalExpense.toFixed(2)}) superan tus ingresos ($${totalIncome.toFixed(2)}) por $${deficit.toFixed(2)}`
      );
    } else {
      const surplus = totalIncome - totalExpense;
      insights.push(
        `Tienes un superávit de $${surplus.toFixed(2)}. ¡Buen trabajo manteniendo tus gastos bajo control!`
      );
    }

    if (avgExpense > avgIncome * 0.8) {
      insights.push(
        `Tu gasto promedio ($${avgExpense.toFixed(2)}) es alto en comparación con tu ingreso promedio ($${avgIncome.toFixed(2)}). Considera reducir gastos.`
      );
    }

    const recentTransactions = transactions.slice(-10);
    const recentExpenseRatio =
      recentTransactions.filter(t => t.type === 'expense').length / recentTransactions.length;
    if (recentExpenseRatio > 0.8) {
      insights.push(
        'Has tenido muchos gastos recientemente. Considera revisar tus categorías de gasto más frecuentes.'
      );
    }

    return {
      insights,
      summary: {
        totalTransactions: transactions.length,
        totalIncome,
        totalExpense,
        avgIncome,
        avgExpense,
        balance: totalIncome - totalExpense,
        hasEnoughData: true,
      },
    };
  }

  invalidateCache(userId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(userId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private transactionsToDataPoints(transactions: any[]): DataPoint[] {
    const monthlyData = new Map<string, number>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      if (!monthlyData.has(key)) {
        monthlyData.set(key, 0);
      }

      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      monthlyData.set(key, monthlyData.get(key)! + amount);
    });

    const dataPoints: DataPoint[] = [];
    monthlyData.forEach((value, key) => {
      const [year, month] = key.split('-').map(Number);
      dataPoints.push({
        date: new Date(year, month, 1),
        value: Math.abs(value),
      });
    });

    return dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private getModel(modelType: 'linear_regression'): IPredictionModel {
    return new LinearRegressionModel();
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

export const predictionEngine = PredictionEngine.getInstance();
