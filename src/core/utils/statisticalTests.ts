export class StatisticalTests {
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  static variance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.mean(values);
    const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
    return this.mean(squaredDiffs);
  }

  static standardDeviation(values: number[]): number {
    return Math.sqrt(this.variance(values));
  }

  static covariance(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const meanX = this.mean(x);
    const meanY = this.mean(y);

    let sum = 0;
    for (let i = 0; i < x.length; i++) {
      sum += (x[i] - meanX) * (y[i] - meanY);
    }

    return sum / x.length;
  }

  static correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const cov = this.covariance(x, y);
    const stdX = this.standardDeviation(x);
    const stdY = this.standardDeviation(y);

    if (stdX === 0 || stdY === 0) return 0;

    return cov / (stdX * stdY);
  }

  static confidenceInterval(
    values: number[],
    confidenceLevel: number = 0.95
  ): { lower: number; upper: number; mean: number } {
    if (values.length === 0) {
      return { lower: 0, upper: 0, mean: 0 };
    }

    const avg = this.mean(values);
    const std = this.standardDeviation(values);
    const n = values.length;

    const zScores: { [key: number]: number } = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };

    const z = zScores[confidenceLevel] || 1.96;
    const marginOfError = z * (std / Math.sqrt(n));

    return {
      lower: avg - marginOfError,
      upper: avg + marginOfError,
      mean: avg,
    };
  }

  static movingAverage(values: number[], window: number): number[] {
    if (window <= 0 || window > values.length) return values;

    const result: number[] = [];

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(values.length, i + Math.ceil(window / 2));
      const windowValues = values.slice(start, end);
      result.push(this.mean(windowValues));
    }

    return result;
  }

  static exponentialSmoothing(values: number[], alpha: number = 0.3): number[] {
    if (values.length === 0) return [];
    if (alpha < 0 || alpha > 1) alpha = 0.3;

    const result: number[] = [values[0]];

    for (let i = 1; i < values.length; i++) {
      const smoothed = alpha * values[i] + (1 - alpha) * result[i - 1];
      result.push(smoothed);
    }

    return result;
  }

  static rSquared(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) return 0;

    const meanActual = this.mean(actual);
    let ssTotal = 0;
    let ssResidual = 0;

    for (let i = 0; i < actual.length; i++) {
      ssTotal += Math.pow(actual[i] - meanActual, 2);
      ssResidual += Math.pow(actual[i] - predicted[i], 2);
    }

    if (ssTotal === 0) return 0;

    return 1 - ssResidual / ssTotal;
  }

  static mape(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) return 0;

    let sum = 0;
    let count = 0;

    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== 0) {
        sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
        count++;
      }
    }

    return count > 0 ? (sum / count) * 100 : 0;
  }

  static mae(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) return 0;

    let sum = 0;
    for (let i = 0; i < actual.length; i++) {
      sum += Math.abs(actual[i] - predicted[i]);
    }

    return sum / actual.length;
  }

  static rmse(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) return 0;

    let sum = 0;
    for (let i = 0; i < actual.length; i++) {
      sum += Math.pow(actual[i] - predicted[i], 2);
    }

    return Math.sqrt(sum / actual.length);
  }

  static linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
    if (x.length !== y.length || x.length === 0) {
      return { slope: 0, intercept: 0 };
    }

    const n = x.length;
    const meanX = this.mean(x);
    const meanY = this.mean(y);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
      denominator += Math.pow(x[i] - meanX, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;

    return { slope, intercept };
  }

  static autocorrelation(values: number[], lag: number): number {
    if (lag <= 0 || lag >= values.length) return 0;

    const n = values.length;
    const mean = this.mean(values);
    
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    return denominator !== 0 ? numerator / denominator : 0;
  }

  static median(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  static percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    if (p < 0 || p > 100) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}
