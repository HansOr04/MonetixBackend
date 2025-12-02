import {
  IPredictionModel,
  TimeSeriesData,
  PredictionResult,
  ModelMetadata,
} from '../interfaces/PredictionModel';
import { StatisticalTests } from '../utils/statisticalTests';

export class LinearRegressionModel implements IPredictionModel {
  private coefficients: number[] = [];
  private intercept: number = 0;
  private rSquared: number = 0;
  private trainedValues: number[] = [];
  private trainedDates: Date[] = [];
  private mae: number = 0;
  private rmse: number = 0;
  private lastValue: number = 0;
  private lastDate: Date = new Date();

  train(data: TimeSeriesData): void {
    if (data.values.length < 2) {
      throw new Error('Se necesitan al menos 2 puntos de datos para entrenar el modelo');
    }

    this.trainedValues = [...data.values];
    this.trainedDates = [...data.dates];
    this.lastValue = data.values[data.values.length - 1];
    this.lastDate = data.dates[data.dates.length - 1];

    const n = data.values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data.values;

    const X = this.createDesignMatrix(x);
    const beta = this.computeCoefficients(X, y);

    this.intercept = beta[0];
    this.coefficients = beta.slice(1);

    const predictions = this.predictFromX(x);
    this.rSquared = StatisticalTests.rSquared(y, predictions);
    this.mae = StatisticalTests.mae(y, predictions);
    this.rmse = StatisticalTests.rmse(y, predictions);
  }

  predict(periods: number): PredictionResult[] {
    if (this.trainedValues.length === 0) {
      throw new Error('El modelo debe ser entrenado antes de hacer predicciones');
    }

    const results: PredictionResult[] = [];
    const n = this.trainedValues.length;
    const confidenceInterval = StatisticalTests.confidenceInterval(this.trainedValues, 0.95);
    const intervalWidth = confidenceInterval.upper - confidenceInterval.lower;

    for (let i = 1; i <= periods; i++) {
      const x = n + i - 1;
      const predicted = this.predictValue(x);

      const uncertainty = intervalWidth * Math.sqrt(1 + i / n);
      const lowerBound = Math.max(0, predicted - uncertainty);
      const upperBound = predicted + uncertainty;

      const date = new Date(this.lastDate);
      date.setMonth(date.getMonth() + i);

      results.push({
        date,
        amount: Math.max(0, predicted),
        lowerBound,
        upperBound,
      });
    }

    return results;
  }

  getConfidence(): number {
    return Math.max(0, Math.min(1, this.rSquared));
  }

  getMetadata(): ModelMetadata {
    return {
      name: 'Linear Regression',
      parameters: {
        intercept: this.intercept,
        coefficients: this.coefficients,
      },
      trainingSamples: this.trainedValues.length,
      rSquared: this.rSquared,
      mae: this.mae,
      rmse: this.rmse,
      complexity: 'O(n³)',
    };
  }

  private createDesignMatrix(x: number[]): number[][] {
    const n = x.length;
    const X: number[][] = [];

    for (let i = 0; i < n; i++) {
      X.push([1, x[i], x[i] * x[i]]);
    }

    return X;
  }

  private computeCoefficients(X: number[][], y: number[]): number[] {
    const XtX = this.multiplyMatrices(this.transpose(X), X);
    const Xty = this.multiplyMatrixVector(this.transpose(X), y);

    const XtX_inv = this.inverseMatrix(XtX);
    const beta = this.multiplyMatrixVector(XtX_inv, Xty);

    return beta;
  }

  private transpose(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: number[][] = [];

    for (let j = 0; j < cols; j++) {
      result[j] = [];
      for (let i = 0; i < rows; i++) {
        result[j][i] = matrix[i][j];
      }
    }

    return result;
  }

  private multiplyMatrices(A: number[][], B: number[][]): number[][] {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    const result: number[][] = [];

    for (let i = 0; i < rowsA; i++) {
      result[i] = [];
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }

    return result;
  }

  private multiplyMatrixVector(A: number[][], v: number[]): number[] {
    const result: number[] = [];

    for (let i = 0; i < A.length; i++) {
      let sum = 0;
      for (let j = 0; j < v.length; j++) {
        sum += A[i][j] * v[j];
      }
      result[i] = sum;
    }

    return result;
  }

  private inverseMatrix(matrix: number[][]): number[][] {
    const n = matrix.length;
    const augmented: number[][] = [];

    for (let i = 0; i < n; i++) {
      augmented[i] = [...matrix[i]];
      for (let j = 0; j < n; j++) {
        augmented[i].push(i === j ? 1 : 0);
      }
    }

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }

      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-10) {
        throw new Error('Matriz singular, no se puede invertir');
      }

      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }

      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }

    const inverse: number[][] = [];
    for (let i = 0; i < n; i++) {
      inverse[i] = augmented[i].slice(n);
    }

    return inverse;
  }

  private predictValue(x: number): number {
    let result = this.intercept;
    result += this.coefficients[0] * x;
    result += this.coefficients[1] * x * x;
    return result;
  }

  private predictFromX(x: number[]): number[] {
    return x.map(xi => this.predictValue(xi));
  }
}
