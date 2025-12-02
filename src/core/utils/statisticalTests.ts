export class StatisticalTests {
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    return sum / values.length;
  }

  static variance(values: number[]): number {
    if (values.length < 2) return 0;
    const meanValue = this.mean(values);
    const squaredDifferences = values.map(value => Math.pow(value - meanValue, 2));
    const sumSquaredDiff = squaredDifferences.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    return sumSquaredDiff / (values.length - 1); // Sample variance
  }

  static standardDeviation(values: number[]): number {
    return Math.sqrt(this.variance(values));
  }

  static covariance(xValues: number[], yValues: number[]): number {
    if (xValues.length !== yValues.length || xValues.length < 2) {
      throw new Error('Los arrays deben tener la misma longitud y al menos 2 elementos');
    }

    const xMean = this.mean(xValues);
    const yMean = this.mean(yValues);
    let sum = 0;

    for (let i = 0; i < xValues.length; i++) {
      sum += (xValues[i] - xMean) * (yValues[i] - yMean);
    }

    return sum / (xValues.length - 1);
  }

  static correlation(xValues: number[], yValues: number[]): number {
    const xStdDev = this.standardDeviation(xValues);
    const yStdDev = this.standardDeviation(yValues);

    if (xStdDev === 0 || yStdDev === 0) return 0;

    return this.covariance(xValues, yValues) / (xStdDev * yStdDev);
  }

  static rSquared(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) {
      throw new Error('Los arrays deben tener la misma longitud y no estar vacíos');
    }

    const meanActual = this.mean(actual);
    let totalSumSquares = 0;
    let residualSumSquares = 0;

    for (let i = 0; i < actual.length; i++) {
      totalSumSquares += Math.pow(actual[i] - meanActual, 2);
      residualSumSquares += Math.pow(actual[i] - predicted[i], 2);
    }

    if (totalSumSquares === 0) return 1; // Perfect fit if all values are the same

    return 1 - residualSumSquares / totalSumSquares;
  }

  static meanAbsoluteError(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) {
      throw new Error('Los arrays deben tener la misma longitud y no estar vacíos');
    }

    let sumAbsoluteError = 0;
    for (let i = 0; i < actual.length; i++) {
      sumAbsoluteError += Math.abs(actual[i] - predicted[i]);
    }

    return sumAbsoluteError / actual.length;
  }

  static rootMeanSquaredError(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) {
      throw new Error('Los arrays deben tener la misma longitud y no estar vacíos');
    }

    let sumSquaredError = 0;
    for (let i = 0; i < actual.length; i++) {
      sumSquaredError += Math.pow(actual[i] - predicted[i], 2);
    }

    return Math.sqrt(sumSquaredError / actual.length);
  }

  static confidenceInterval(values: number[], confidenceLevel: number = 0.95): { lower: number; upper: number } {
    if (values.length < 2) {
      const val = values.length === 1 ? values[0] : 0;
      return { lower: val, upper: val };
    }

    const meanValue = this.mean(values);
    const stdDev = this.standardDeviation(values);
    const sampleSize = values.length;

    // Aproximación t-student para n > 30, o z-score
    // Para simplificar usamos z-score aproximado
    let zScore = 1.96; // 95%
    if (confidenceLevel === 0.90) zScore = 1.645;
    if (confidenceLevel === 0.99) zScore = 2.576;

    const marginOfError = zScore * (stdDev / Math.sqrt(sampleSize));

    return {
      lower: meanValue - marginOfError,
      upper: meanValue + marginOfError,
    };
  }
}
