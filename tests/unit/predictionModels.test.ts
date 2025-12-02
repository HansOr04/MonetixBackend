import { LinearRegressionModel } from '../../src/core/models/LinearRegression';
import { TimeSeriesData } from '../../src/core/interfaces/PredictionModel';

/**
 * Tests unitarios para el modelo de regresión lineal
 */

describe('LinearRegressionModel Unit Tests', () => {
    // Datos de prueba con tendencia lineal clara
    const createLinearTrendData = (): TimeSeriesData => {
        const dates: Date[] = [];
        const values: number[] = [];
        const baseDate = new Date('2024-01-01');

        // Crear 36 meses de datos con tendencia lineal creciente
        // y = 100 + 10*x (base + incremento mensual)
        for (let i = 0; i < 36; i++) {
            const date = new Date(baseDate);
            date.setMonth(date.getMonth() + i);
            dates.push(date);

            // Valor = 100 + 10*mes + ruido pequeño
            const value = 100 + (10 * i) + (Math.random() * 5 - 2.5);
            values.push(value);
        }

        return { dates, values };
    };

    // Datos de prueba estables (sin tendencia)
    const createStableData = (): TimeSeriesData => {
        const dates: Date[] = [];
        const values: number[] = [];
        const baseDate = new Date('2024-01-01');

        for (let i = 0; i < 36; i++) {
            const date = new Date(baseDate);
            date.setMonth(date.getMonth() + i);
            dates.push(date);

            // Valor constante con ruido pequeño
            const value = 500 + (Math.random() * 20 - 10);
            values.push(value);
        }

        return { dates, values };
    };

    // Datos de prueba con tendencia decreciente
    const createDecreasingTrendData = (): TimeSeriesData => {
        const dates: Date[] = [];
        const values: number[] = [];
        const baseDate = new Date('2024-01-01');

        for (let i = 0; i < 36; i++) {
            const date = new Date(baseDate);
            date.setMonth(date.getMonth() + i);
            dates.push(date);

            // Valor decreciente
            const value = 1000 - (15 * i) + (Math.random() * 5 - 2.5);
            values.push(Math.max(0, value)); // Evitar valores negativos
        }

        return { dates, values };
    };

    describe('Model Training', () => {
        let model: LinearRegressionModel;

        beforeEach(() => {
            model = new LinearRegressionModel();
        });

        it('should train successfully with sufficient data', () => {
            const data = createLinearTrendData();

            expect(() => {
                model.train(data);
            }).not.toThrow();
        });

        it('should throw error with insufficient data (less than 2 points)', () => {
            const data = {
                dates: [new Date()],
                values: [100]
            };

            expect(() => {
                model.train(data);
            }).toThrow('Se necesitan al menos 2 puntos de datos');
        });

        it('should throw error with exactly 1 data point', () => {
            const data = {
                dates: [new Date()],
                values: [100]
            };

            expect(() => {
                model.train(data);
            }).toThrow();
        });

        it('should train with minimum data (2 points)', () => {
            const data = {
                dates: [new Date('2024-01-01'), new Date('2024-02-01')],
                values: [100, 200]
            };

            expect(() => {
                model.train(data);
            }).not.toThrow();
        });
    });

    describe('Predictions', () => {
        let model: LinearRegressionModel;

        beforeEach(() => {
            model = new LinearRegressionModel();
        });

        it('should throw error when predicting before training', () => {
            expect(() => {
                model.predict(3);
            }).toThrow('El modelo debe ser entrenado antes de hacer predicciones');
        });

        it('should predict increasing values for upward trend', () => {
            const data = createLinearTrendData();
            model.train(data);

            const predictions = model.predict(3);

            expect(predictions).toHaveLength(3);
            expect(predictions[0].amount).toBeGreaterThan(data.values[data.values.length - 1]);
            expect(predictions[1].amount).toBeGreaterThan(predictions[0].amount);
            expect(predictions[2].amount).toBeGreaterThan(predictions[1].amount);
        });

        it('should predict decreasing values for downward trend', () => {
            const data = createDecreasingTrendData();
            model.train(data);

            const predictions = model.predict(3);

            expect(predictions).toHaveLength(3);
            // Para tendencia decreciente, cada predicción debería ser menor
            expect(predictions[1].amount).toBeLessThan(predictions[0].amount);
            expect(predictions[2].amount).toBeLessThan(predictions[1].amount);
        });

        it('should predict stable values for stable data', () => {
            const data = createStableData();
            model.train(data);

            const predictions = model.predict(3);
            const avgValue = data.values.reduce((a, b) => a + b, 0) / data.values.length;

            expect(predictions).toHaveLength(3);
            predictions.forEach(pred => {
                // Las predicciones deberían estar cerca del promedio
                const deviation = Math.abs(pred.amount - avgValue) / avgValue;
                expect(deviation).toBeLessThan(0.3); // Menos del 30% de desviación
            });
        });

        it('should provide prediction intervals (bounds)', () => {
            const data = createLinearTrendData();
            model.train(data);

            const predictions = model.predict(3);

            predictions.forEach(pred => {
                expect(pred.lowerBound).toBeLessThan(pred.amount);
                expect(pred.upperBound).toBeGreaterThan(pred.amount);
                expect(pred.lowerBound).toBeGreaterThanOrEqual(0); // No negative values
            });
        });

        it('should return predictions with dates', () => {
            const data = createLinearTrendData();
            model.train(data);

            const predictions = model.predict(3);

            predictions.forEach(pred => {
                expect(pred.date).toBeInstanceOf(Date);
            });
        });

        it('should predict correct number of periods', () => {
            const data = createLinearTrendData();
            model.train(data);

            const predictions1 = model.predict(1);
            const predictions6 = model.predict(6);
            const predictions12 = model.predict(12);

            expect(predictions1).toHaveLength(1);
            expect(predictions6).toHaveLength(6);
            expect(predictions12).toHaveLength(12);
        });

        it('should have increasing uncertainty for future predictions', () => {
            const data = createLinearTrendData();
            model.train(data);

            const predictions = model.predict(6);

            // La incertidumbre (ancho del intervalo) debería aumentar con el tiempo
            const interval1 = predictions[0].upperBound - predictions[0].lowerBound;
            const interval6 = predictions[5].upperBound - predictions[5].lowerBound;

            expect(interval6).toBeGreaterThan(interval1);
        });
    });

    describe('Model Confidence', () => {
        let model: LinearRegressionModel;

        beforeEach(() => {
            model = new LinearRegressionModel();
        });

        it('should have reasonable confidence (0-1)', () => {
            const data = createLinearTrendData();
            model.train(data);

            const confidence = model.getConfidence();

            expect(confidence).toBeGreaterThanOrEqual(0);
            expect(confidence).toBeLessThanOrEqual(1);
        });

        it('should have high confidence for linear data', () => {
            const data = createLinearTrendData();
            model.train(data);

            const confidence = model.getConfidence();

            // Para datos lineales, la confianza debería ser alta
            expect(confidence).toBeGreaterThan(0.7);
        });

        it('should return confidence as a number', () => {
            const data = createLinearTrendData();
            model.train(data);

            const confidence = model.getConfidence();

            expect(typeof confidence).toBe('number');
            expect(isNaN(confidence)).toBe(false);
        });
    });

    describe('Model Metadata', () => {
        let model: LinearRegressionModel;

        beforeEach(() => {
            model = new LinearRegressionModel();
        });

        it('should return metadata with model parameters', () => {
            const data = createLinearTrendData();
            model.train(data);

            const metadata = model.getMetadata();

            expect(metadata.name).toBe('Linear Regression');
            expect(metadata.parameters).toBeDefined();
            expect(metadata.trainingSamples).toBe(36);
        });

        it('should include R-squared in metadata', () => {
            const data = createLinearTrendData();
            model.train(data);

            const metadata = model.getMetadata();

            expect(metadata.rSquared).toBeDefined();
            expect(typeof metadata.rSquared).toBe('number');
        });

        it('should include MAE and RMSE in metadata', () => {
            const data = createLinearTrendData();
            model.train(data);

            const metadata = model.getMetadata();

            expect(metadata.mae).toBeDefined();
            expect(metadata.rmse).toBeDefined();
            expect(typeof metadata.mae).toBe('number');
            expect(typeof metadata.rmse).toBe('number');
        });

        it('should include coefficients in metadata', () => {
            const data = createLinearTrendData();
            model.train(data);

            const metadata = model.getMetadata();

            expect(metadata.parameters?.intercept).toBeDefined();
            expect(metadata.parameters?.coefficients).toBeDefined();
            expect(Array.isArray(metadata.parameters?.coefficients)).toBe(true);
        });
    });

    describe('Prediction Accuracy', () => {
        it('should predict within reasonable error margin for linear trend', () => {
            const data = createLinearTrendData();
            const model = new LinearRegressionModel();

            model.train(data);
            const predictions = model.predict(3);

            // Para datos lineales perfectos, el error debería ser < 15%
            const expectedNext = data.values[data.values.length - 1] + 10; // Incremento de 10
            const errorMargin = 0.20; // 20% de margen

            const actualPrediction = predictions[0].amount;
            const error = Math.abs(actualPrediction - expectedNext) / expectedNext;

            expect(error).toBeLessThan(errorMargin);
        });

        it('should handle stable data correctly', () => {
            const data = createStableData();
            const model = new LinearRegressionModel();

            model.train(data);
            const predictions = model.predict(3);

            const avgValue = data.values.reduce((a, b) => a + b, 0) / data.values.length;

            // Las predicciones deberían estar cerca del promedio
            predictions.forEach(pred => {
                const deviation = Math.abs(pred.amount - avgValue) / avgValue;
                expect(deviation).toBeLessThan(0.25); // Menos del 25% de desviación
            });
        });

        it('should not produce negative predictions', () => {
            const data = createLinearTrendData();
            const model = new LinearRegressionModel();

            model.train(data);
            const predictions = model.predict(12);

            predictions.forEach(pred => {
                expect(pred.amount).toBeGreaterThanOrEqual(0);
                expect(pred.lowerBound).toBeGreaterThanOrEqual(0);
            });
        });
    });
});
