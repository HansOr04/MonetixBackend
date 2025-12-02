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

    const sortedValues = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sortedValues.length * 0.25);
    const q3Index = Math.floor(sortedValues.length * 0.75);

    const firstQuartile = sortedValues[q1Index];
    const thirdQuartile = sortedValues[q3Index];
    const interquartileRange = thirdQuartile - firstQuartile;

    const lowerBound = firstQuartile - 1.5 * interquartileRange;
    const upperBound = thirdQuartile + 1.5 * interquartileRange;

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

    const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
    const result: DataPoint[] = [];

    for (let i = 0; i < sortedData.length - 1; i++) {
      result.push(sortedData[i]);

      const currentDate = new Date(sortedData[i].date);
      const nextDate = new Date(sortedData[i + 1].date);
      const daysDifference = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDifference > 1) {
        const interpolatedValue = (sortedData[i].value + sortedData[i + 1].value) / 2;

        for (let j = 1; j < daysDifference; j++) {
          const newDate = new Date(currentDate);
          newDate.setDate(newDate.getDate() + j);
          result.push({
            date: newDate,
            value: interpolatedValue,
          });
        }
      }
    }

    result.push(sortedData[sortedData.length - 1]);
    return result;
  }

  static aggregateByPeriod(
    data: DataPoint[],
    period: 'day' | 'week' | 'month'
  ): DataPoint[] {
    if (data.length === 0) return [];

    const groupedData = new Map<string, number[]>();

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

      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      groupedData.get(key)!.push(point.value);
    });

    const result: DataPoint[] = [];
    groupedData.forEach((values, key) => {
      const sum = values.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
      const average = sum / values.length;

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

      result.push({ date, value: average });
    });

    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  static toTimeSeries(data: DataPoint[]): TimeSeriesData {
    const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
    return {
      dates: sortedData.map(point => point.date),
      values: sortedData.map(point => point.value),
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
    const simpleDate = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simpleDate.getDay();
    const isoWeekStart = simpleDate;
    if (dayOfWeek <= 4) isoWeekStart.setDate(simpleDate.getDate() - simpleDate.getDay() + 1);
    else isoWeekStart.setDate(simpleDate.getDate() + 8 - simpleDate.getDay());
    return isoWeekStart;
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
