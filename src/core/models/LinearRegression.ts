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
  private meanAbsoluteError: number = 0;
  private rootMeanSquaredError: number = 0;
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

    const sampleSize = data.values.length;
    const xValues = Array.from({ length: sampleSize }, (_, i) => i);
    const yValues = data.values;

    const designMatrix = this.createDesignMatrix(xValues);
    const beta = this.computeCoefficients(designMatrix, yValues);

    this.intercept = beta[0];
    this.coefficients = beta.slice(1);

    const predictions = this.predictFromX(xValues);
    this.rSquared = StatisticalTests.rSquared(yValues, predictions);
    this.meanAbsoluteError = StatisticalTests.meanAbsoluteError(yValues, predictions);
    this.rootMeanSquaredError = StatisticalTests.rootMeanSquaredError(yValues, predictions);
  }

  predict(periods: number): PredictionResult[] {
    if (this.trainedValues.length === 0) {
      throw new Error('El modelo debe ser entrenado antes de hacer predicciones');
    }

    const results: PredictionResult[] = [];
    const sampleSize = this.trainedValues.length;
    const confidenceInterval = StatisticalTests.confidenceInterval(this.trainedValues, 0.95);
    const intervalWidth = confidenceInterval.upper - confidenceInterval.lower;

    for (let i = 1; i <= periods; i++) {
      const xValue = sampleSize + i - 1;
      const predicted = this.predictValue(xValue);

      const uncertainty = intervalWidth * Math.sqrt(1 + i / sampleSize);
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
      meanAbsoluteError: this.meanAbsoluteError,
      rootMeanSquaredError: this.rootMeanSquaredError,
      complexity: 'O(n³)',
    };
  }

  private createDesignMatrix(xValues: number[]): number[][] {
    const sampleSize = xValues.length;
    const designMatrix: number[][] = [];

    for (let i = 0; i < sampleSize; i++) {
      designMatrix.push([1, xValues[i], xValues[i] * xValues[i]]);
    }

    return designMatrix;
  }

  private computeCoefficients(designMatrix: number[][], yValues: number[]): number[] {
    const matrixTransposed = this.transpose(designMatrix);
    const XtX = this.multiplyMatrices(matrixTransposed, designMatrix);
    const Xty = this.multiplyMatrixVector(matrixTransposed, yValues);

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

  private multiplyMatrices(matrixA: number[][], matrixB: number[][]): number[][] {
    const rowsA = matrixA.length;
    const colsA = matrixA[0].length;
    const colsB = matrixB[0].length;
    const result: number[][] = [];

    for (let i = 0; i < rowsA; i++) {
      result[i] = [];
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += matrixA[i][k] * matrixB[k][j];
        }
        result[i][j] = sum;
      }
    }

    return result;
  }

  private multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
    const result: number[] = [];

    for (let i = 0; i < matrix.length; i++) {
      let sum = 0;
      for (let j = 0; j < vector.length; j++) {
        sum += matrix[i][j] * vector[j];
      }
      result[i] = sum;
    }

    return result;
  }

  private inverseMatrix(matrix: number[][]): number[][] {
    const size = matrix.length;
    const augmented: number[][] = [];

    for (let i = 0; i < size; i++) {
      augmented[i] = [...matrix[i]];
      for (let j = 0; j < size; j++) {
        augmented[i].push(i === j ? 1 : 0);
      }
    }

    for (let i = 0; i < size; i++) {
      let maxRow = i;
      for (let k = i + 1; k < size; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }

      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-10) {
        throw new Error('Matriz singular, no se puede invertir');
      }

      for (let j = 0; j < 2 * size; j++) {
        augmented[i][j] /= pivot;
      }

      for (let k = 0; k < size; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * size; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }

    const inverse: number[][] = [];
    for (let i = 0; i < size; i++) {
      inverse[i] = augmented[i].slice(size);
    }

    return inverse;
  }

  private predictValue(xValue: number): number {
    let result = this.intercept;
    result += this.coefficients[0] * xValue;
    result += this.coefficients[1] * xValue * xValue;
    return result;
  }

  private predictFromX(xValues: number[]): number[] {
    return xValues.map(xi => this.predictValue(xi));
  }
}
