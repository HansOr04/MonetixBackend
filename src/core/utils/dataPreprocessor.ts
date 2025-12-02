import { TimeSeriesData } from '../interfaces/PredictionModel';

export interface DataPoint {
  date: Date;
  value: number;
}

export class DataPreprocessor {
  static cleanData(data: DataPoint[]): DataPoint[] {
    return data.filter(point => {
      return (
        point.date instanceof Date &&
        !isNaN(point.date.getTime()) &&
        typeof point.value === 'number' &&
        !isNaN(point.value) &&
        isFinite(point.value) &&
        point.value >= 0
      );
    });
  }

  static normalizeData(values: number[]): { normalized: number[]; min: number; max: number } {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range === 0) {
      return {
        normalized: values.map(() => 0.5),
        min,
        max,
      };
    }

    const normalized = values.map(value => (value - min) / range);
    return { normalized, min, max };
  }

  static denormalize(normalizedValues: number[], min: number, max: number): number[] {
    const range = max - min;
    return normalizedValues.map(value => value * range + min);
  }

  static detectOutliers(values: number[]): number[] {
    if (values.length < 4) return [];

    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);

    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
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

  static fillMissingDates(data: DataPoint[]): DataPoint[] {
    if (data.length === 0) return [];

    const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
    const result: DataPoint[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      result.push(sorted[i]);

      const currentDate = new Date(sorted[i].date);
      const nextDate = new Date(sorted[i + 1].date);
      const daysDiff = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > 1) {
        const interpolatedValue = (sorted[i].value + sorted[i + 1].value) / 2;

        for (let j = 1; j < daysDiff; j++) {
          const newDate = new Date(currentDate);
          newDate.setDate(newDate.getDate() + j);
          result.push({
            date: newDate,
            value: interpolatedValue,
          });
        }
      }
    }

    result.push(sorted[sorted.length - 1]);
    return result;
  }

  static aggregateByPeriod(
    data: DataPoint[],
    period: 'day' | 'week' | 'month'
  ): DataPoint[] {
    if (data.length === 0) return [];

    const groups = new Map<string, number[]>();

    data.forEach(point => {
      let key: string;
      const date = new Date(point.date);

      switch (period) {
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          break;
        case 'week':
          const weekNumber = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${weekNumber}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth()}`;
          break;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(point.value);
    });

    const result: DataPoint[] = [];
    groups.forEach((values, key) => {
      const sum = values.reduce((acc, val) => acc + val, 0);
      const avg = sum / values.length;

      let date: Date;
      const parts = key.split('-');

      if (period === 'week') {
        const year = parseInt(parts[0]);
        const week = parseInt(parts[1].substring(1));
        date = this.getDateFromWeek(year, week);
      } else {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = period === 'day' ? parseInt(parts[2]) : 1;
        date = new Date(year, month, day);
      }

      result.push({ date, value: avg });
    });

    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  static toTimeSeries(data: DataPoint[]): TimeSeriesData {
    const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
    return {
      dates: sorted.map(point => point.date),
      values: sorted.map(point => point.value),
    };
  }

  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private static getDateFromWeek(year: number, week: number): Date {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
  }

  static removeOutliers(data: DataPoint[]): DataPoint[] {
    const values = data.map(d => d.value);
    const outlierIndices = this.detectOutliers(values);
    const outlierSet = new Set(outlierIndices);

    return data.filter((_, index) => !outlierSet.has(index));
  }

  static validateMinimumData(data: DataPoint[], minPoints: number = 30): boolean {
    return data.length >= minPoints;
  }
}
