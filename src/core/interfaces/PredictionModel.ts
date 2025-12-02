export interface TimeSeriesData {
  dates: Date[];
  values: number[];
}

export interface PredictionResult {
  date: Date;
  amount: number;
  lowerBound: number;
  upperBound: number;
}

export interface ModelMetadata {
  name: string;
  parameters?: Record<string, any>;
  trainingSamples?: number;
  rSquared?: number;
  mape?: number;
  mae?: number;
  rmse?: number;
  [key: string]: any;
}

export interface IPredictionModel {
  train(data: TimeSeriesData): void;
  
  predict(periods: number): PredictionResult[];
  
  getConfidence(): number;
  
  getMetadata(): ModelMetadata;
}
