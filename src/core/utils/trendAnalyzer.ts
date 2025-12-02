import { StatisticalTests } from './statisticalTests';

export class TrendAnalyzer {
  static calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const correlation = StatisticalTests.correlation(xValues, values);

    if (correlation > 0.3) return 'increasing';
    if (correlation < -0.3) return 'decreasing';
    return 'stable';
  }

  static calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;

    const first = values[0];
    const last = values[values.length - 1];

    if (first === 0) return last > 0 ? 100 : 0;

    return ((last - first) / first) * 100;
  }

  static detectSeasonality(values: number[], period: number): boolean {
    if (values.length < period * 2) return false;

    const correlations: number[] = [];

    // Autocorrelation at lag = period
    // Simplified check: compare segments
    const segments = Math.floor(values.length / period);

    for (let i = 0; i < segments - 1; i++) {
      const segment1 = values.slice(i * period, (i + 1) * period);
      const segment2 = values.slice((i + 1) * period, (i + 2) * period);

      const correlation = StatisticalTests.correlation(segment1, segment2);
      correlations.push(correlation);
    }

    const avgCorrelation = StatisticalTests.mean(correlations);
    return avgCorrelation > 0.6;
  }
}
