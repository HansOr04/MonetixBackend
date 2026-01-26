import { Transaction } from '../models/Transaction.model';
import { Prediction } from '../models/Prediction.model';
import { DataPreprocessor, DataPoint } from './utils/dataPreprocessor';
import { LinearRegressionModel } from './models/LinearRegression';
import { IPredictionModel, TimeSeriesData } from './interfaces/PredictionModel';
import { geminiService } from '../services/GeminiService';
import { Alert } from '../models/Alert.model';

export class PredictionEngine {
  private static instance: PredictionEngine;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000;
  private readonly MIN_TRANSACTIONS_FOR_PREDICTION = 30;
  private readonly MIN_TRANSACTIONS_FOR_INSIGHTS = 10;
  private readonly EXPENSE_RATIO_THRESHOLD = 0.8;
  private readonly RECENT_TRANSACTIONS_COUNT = 10;

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
    periods: number = 6,
    type?: 'income' | 'expense'
  ): Promise<any> {
    const cacheKey = `${userId}-${modelType}-${periods}-${type || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const query: any = { userId };
    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .sort({ date: 1 })
      .lean();

    if (transactions.length < this.MIN_TRANSACTIONS_FOR_PREDICTION) {
      throw new Error(`Se necesitan al menos ${this.MIN_TRANSACTIONS_FOR_PREDICTION} transacciones para generar predicciones`);
    }

    const dataPoints = this.transactionsToDataPoints(transactions, type);
    const cleanedData = DataPreprocessor.cleanData(dataPoints);
    const aggregatedData = DataPreprocessor.aggregateByPeriod(cleanedData, 'month');
    const timeSeriesData = DataPreprocessor.toTimeSeries(aggregatedData);

    const model = this.getModel(modelType);
    model.train(timeSeriesData);

    const predictions = model.predict(periods);
    const confidence = model.getConfidence();
    const metadata = model.getMetadata();

    // Generate AI Alerts
    const alerts = await geminiService.generateFinancialAlerts(
      cleanedData.map(d => ({
        month: `${d.date.getFullYear()}-${d.date.getMonth() + 1}`,
        amount: d.value,
        type: type || 'net'
      }))
    );

    const predictionDoc = new Prediction({
      userId,
      modelType,
      type: type || 'net', // Store the type in the prediction document
      predictions: predictions.map(prediction => ({
        date: prediction.date,
        amount: prediction.amount,
        lowerBound: prediction.lowerBound,
        upperBound: prediction.upperBound,
      })),
      confidence,
      metadata,
      alerts,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.CACHE_TTL),
    });

    await predictionDoc.save();

    const result = {
      id: predictionDoc._id,
      userId: predictionDoc.userId,
      modelType: predictionDoc.modelType,
      type: predictionDoc.type,
      predictions: predictionDoc.predictions,
      confidence: predictionDoc.confidence,
      metadata: predictionDoc.metadata,
      generatedAt: predictionDoc.generatedAt,
      alerts: predictionDoc.alerts,
    };

    // Save alerts to the Alert collection for the notification system
    if (alerts && alerts.length > 0) {
      const alertPromises = alerts.map(async (alertMsg) => {
        try {
          await Alert.create({
            userId,
            type: 'recommendation',
            severity: 'info',
            message: alertMsg,
            isRead: false,
            relatedData: {
              predictionId: predictionDoc._id,
              modelType,
              generatedAt: new Date()
            }
          });
        } catch (err) {
          console.error('Error saving individual alert:', err);
        }
      });
      // We don't await this to avoid blocking the response, or we can await if we want to ensure consistency
      // Given the user feedback "no me llega", awaiting is safer to ensure they exist when the frontend calls GET /alerts
      await Promise.all(alertPromises);
    }

    this.setCache(cacheKey, result);
    return result;
  }

  async generateInsights(userId: string): Promise<any> {
    const transactions = await Transaction.find({ userId })
      .sort({ date: 1 })
      .lean();

    if (transactions.length < this.MIN_TRANSACTIONS_FOR_INSIGHTS) {
      return {
        insights: ['Necesitas más transacciones para generar insights significativos'],
        summary: {
          totalTransactions: transactions.length,
          hasEnoughData: false,
        },
      };
    }

    const incomeTransactions = transactions.filter(transaction => transaction.type === 'income');
    const expenseTransactions = transactions.filter(transaction => transaction.type === 'expense');

    const totalIncome = incomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const avgIncome = incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0;
    const avgExpense = expenseTransactions.length > 0 ? totalExpense / expenseTransactions.length : 0;

    const insights: string[] = [];

    this.analyzeBalance(totalIncome, totalExpense, insights);
    this.analyzeSpendingHabits(avgIncome, avgExpense, insights);
    this.analyzeRecentActivity(transactions, insights);

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

  private analyzeBalance(totalIncome: number, totalExpense: number, insights: string[]): void {
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
  }

  private analyzeSpendingHabits(avgIncome: number, avgExpense: number, insights: string[]): void {
    if (avgExpense > avgIncome * this.EXPENSE_RATIO_THRESHOLD) {
      insights.push(
        `Tu gasto promedio ($${avgExpense.toFixed(2)}) es alto en comparación con tu ingreso promedio ($${avgIncome.toFixed(2)}). Considera reducir gastos.`
      );
    }
  }

  private analyzeRecentActivity(transactions: any[], insights: string[]): void {
    const recentTransactions = transactions.slice(-this.RECENT_TRANSACTIONS_COUNT);
    const recentExpenseRatio =
      recentTransactions.filter(transaction => transaction.type === 'expense').length / recentTransactions.length;

    if (recentExpenseRatio > this.EXPENSE_RATIO_THRESHOLD) {
      insights.push(
        'Has tenido muchos gastos recientemente. Considera revisar tus categorías de gasto más frecuentes.'
      );
    }
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

  private transactionsToDataPoints(transactions: any[], type?: 'income' | 'expense'): DataPoint[] {
    const monthlyData = new Map<string, number>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      if (!monthlyData.has(key)) {
        monthlyData.set(key, 0);
      }

      let amount = transaction.amount;

      // If we are calculating net balance (no type specified), expenses are negative
      if (!type && transaction.type === 'expense') {
        amount = -amount;
      }
      // If type IS specified (e.g. 'expense'), we want the positive magnitude of that type

      monthlyData.set(key, monthlyData.get(key)! + amount);
    });

    const dataPoints: DataPoint[] = [];
    monthlyData.forEach((value, key) => {
      const [year, month] = key.split('-').map(Number);
      dataPoints.push({
        date: new Date(year, month, 1),
        value: type ? value : Math.abs(value), // For net balance, we might want to predict magnitude or keep sign? 
        // Original code used Math.abs(value) which implies predicting magnitude of balance? 
        // Let's stick to original behavior for net balance (Math.abs) but for specific types we definitely want the value.
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
