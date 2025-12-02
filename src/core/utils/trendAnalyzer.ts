import { StatisticalTests } from './statisticalTests';

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  slope: number;
}

export interface SeasonalityAnalysis {
  hasSeasonality: boolean;
  period?: number;
  strength?: number;
}

export interface ChangePoint {
  index: number;
  date?: Date;
  significance: number;
}

export interface TimeSeriesDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
}

export class TrendAnalyzer {
  static detectTrend(values: number[]): TrendAnalysis {
    if (values.length < 3) {
      return {
        direction: 'stable',
        strength: 0,
        slope: 0,
      };
    }

    const x = Array.from({ length: values.length }, (_, i) => i);
    const { slope, intercept } = StatisticalTests.linearRegression(x, values);

    const predictions = x.map(xi => slope * xi + intercept);
    const rSquared = StatisticalTests.rSquared(values, predictions);

    const threshold = 0.01 * StatisticalTests.mean(values);

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < threshold) {
      direction = 'stable';
    } else {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    return {
      direction,
      strength: Math.abs(rSquared),
      slope,
    };
  }

  static calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;

    const firstValue = values[0];
    const lastValue = values[values.length - 1];

    if (firstValue === 0) return 0;

    const growthRate = ((lastValue - firstValue) / firstValue) * 100;
    return growthRate;
  }

  static detectSeasonality(values: number[], maxPeriod: number = 12): SeasonalityAnalysis {
    if (values.length < maxPeriod * 2) {
      return { hasSeasonality: false };
    }

    let maxCorrelation = 0;
    let bestPeriod = 0;

    for (let period = 2; period <= Math.min(maxPeriod, Math.floor(values.length / 2)); period++) {
      const correlation = StatisticalTests.autocorrelation(values, period);

      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }

    const threshold = 0.3;
    const hasSeasonality = maxCorrelation > threshold;

    if (hasSeasonality) {
      return {
        hasSeasonality: true,
        period: bestPeriod,
        strength: maxCorrelation,
      };
    }

    return { hasSeasonality: false };
  }

  static findChangePoints(values: number[]): ChangePoint[] {
    if (values.length < 10) return [];

    const changePoints: ChangePoint[] = [];
    const windowSize = Math.max(5, Math.floor(values.length / 10));

    for (let i = windowSize; i < values.length - windowSize; i++) {
      const before = values.slice(Math.max(0, i - windowSize), i);
      const after = values.slice(i, Math.min(values.length, i + windowSize));

      const meanBefore = StatisticalTests.mean(before);
      const meanAfter = StatisticalTests.mean(after);

      const stdBefore = StatisticalTests.standardDeviation(before);
      const stdAfter = StatisticalTests.standardDeviation(after);

      const pooledStd = Math.sqrt((stdBefore ** 2 + stdAfter ** 2) / 2);

      if (pooledStd === 0) continue;

      const significance = Math.abs(meanAfter - meanBefore) / pooledStd;

      if (significance > 2.0) {
        changePoints.push({
          index: i,
          significance,
        });
      }
    }

    return changePoints.sort((a, b) => b.significance - a.significance);
  }

  static decomposeTimeSeries(values: number[], period: number = 12): TimeSeriesDecomposition {
    if (values.length < period * 2) {
      return {
        trend: values,
        seasonal: Array(values.length).fill(0),
        residual: Array(values.length).fill(0),
      };
    }

    const trend = this.extractTrend(values, period);
    const detrended = values.map((val, i) => val - trend[i]);
    const seasonal = this.extractSeasonal(detrended, period);
    const residual = values.map((val, i) => val - trend[i] - seasonal[i]);

    return { trend, seasonal, residual };
  }

  private static extractTrend(values: number[], period: number): number[] {
    const windowSize = period % 2 === 0 ? period : period;
    return StatisticalTests.movingAverage(values, windowSize);
  }

  private static extractSeasonal(detrended: number[], period: number): number[] {
    const seasonalPattern: number[] = Array(period).fill(0);
    const counts: number[] = Array(period).fill(0);

    for (let i = 0; i < detrended.length; i++) {
      const seasonIndex = i % period;
      seasonalPattern[seasonIndex] += detrended[i];
      counts[seasonIndex]++;
    }

    for (let i = 0; i < period; i++) {
      if (counts[i] > 0) {
        seasonalPattern[i] /= counts[i];
      }
    }

    const meanSeasonal = StatisticalTests.mean(seasonalPattern);
    for (let i = 0; i < period; i++) {
      seasonalPattern[i] -= meanSeasonal;
    }

    const seasonal: number[] = [];
    for (let i = 0; i < detrended.length; i++) {
      seasonal.push(seasonalPattern[i % period]);
    }

    return seasonal;
  }

  static calculateDerivative(values: number[]): number[] {
    if (values.length < 2) return [];

    const derivative: number[] = [];

    for (let i = 0; i < values.length - 1; i++) {
      derivative.push(values[i + 1] - values[i]);
    }

    return derivative;
  }

  static calculateVelocity(values: number[]): number {
    if (values.length < 2) return 0;

    const derivative = this.calculateDerivative(values);
    return StatisticalTests.mean(derivative);
  }

  static calculateAcceleration(values: number[]): number {
    if (values.length < 3) return 0;

    const firstDerivative = this.calculateDerivative(values);
    const secondDerivative = this.calculateDerivative(firstDerivative);

    return StatisticalTests.mean(secondDerivative);
  }

  static identifyOutlierPeriods(values: number[]): number[] {
    if (values.length < 4) return [];

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = StatisticalTests.percentile(values, 25);
    const q3 = StatisticalTests.percentile(values, 75);
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outlierIndices: number[] = [];
    values.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outlierIndices.push(index);
      }
    });

    return outlierIndices;
  }

  static smoothSeries(values: number[], alpha: number = 0.3): number[] {
    return StatisticalTests.exponentialSmoothing(values, alpha);
  }
}
