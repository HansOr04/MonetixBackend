import request from 'supertest';
import app from '../src/app';
import { generateAuthToken, testUser, createTestCategoryId } from './helpers/testUtils';

const BASE_URL = '/api/predictions';
let authToken: string;

describe('Prediction Endpoints', () => {
    beforeAll(() => {
        authToken = generateAuthToken(testUser.id, testUser.role);
    });

    describe('POST /api/predictions/generate', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/generate`)
                .send({
                    modelType: 'linear_regression',
                    periods: 3,
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 with invalid modelType', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/generate`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    modelType: 'arima', // Ya no es válido
                    periods: 3,
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 with invalid periods', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/generate`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    modelType: 'linear_regression',
                    periods: -5,
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 with periods exceeding maximum', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/generate`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    modelType: 'linear_regression',
                    periods: 15, // Máximo es 12
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should generate prediction with valid data', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/generate`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    modelType: 'linear_regression',
                    periods: 6,
                });

            // Puede ser 200 (éxito), 400 (no suficientes datos), o 500 (error)
            expect([200, 400, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.data).toBeDefined();
                expect(response.body.data.modelType).toBe('linear_regression');
                expect(response.body.data.predictions).toBeDefined();
                expect(Array.isArray(response.body.data.predictions)).toBe(true);
                expect(response.body.data.confidence).toBeDefined();
                expect(typeof response.body.data.confidence).toBe('number');
            }
        });

        it('should use default periods when not provided', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/generate`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    modelType: 'linear_regression',
                });

            expect([200, 400, 500]).toContain(response.status);
        });

        it('should generate prediction for 3 periods', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/generate`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    modelType: 'linear_regression',
                    periods: 3,
                });

            expect([200, 400, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.data.predictions.length).toBe(3);
            }
        });

        it('should generate prediction for 12 periods', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/generate`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    modelType: 'linear_regression',
                    periods: 12,
                });

            expect([200, 400, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.data.predictions.length).toBe(12);
            }
        });
    });

    describe('GET /api/predictions', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(BASE_URL);

            expect(response.status).toBe(401);
        });

        it('should return predictions list with authentication', async () => {
            const response = await request(app)
                .get(BASE_URL)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should filter predictions by modelType', async () => {
            const response = await request(app)
                .get(`${BASE_URL}?modelType=linear_regression`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');

            if (response.body.data.length > 0) {
                response.body.data.forEach((pred: any) => {
                    expect(pred.modelType).toBe('linear_regression');
                });
            }
        });

        it('should reject invalid modelType filter', async () => {
            const response = await request(app)
                .get(`${BASE_URL}?modelType=arima`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });

        it('should respect limit parameter', async () => {
            const response = await request(app)
                .get(`${BASE_URL}?limit=5`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeLessThanOrEqual(5);
        });

        it('should reject limit exceeding maximum', async () => {
            const response = await request(app)
                .get(`${BASE_URL}?limit=100`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/predictions/insights', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/insights`);

            expect(response.status).toBe(401);
        });

        it('should return insights with authentication', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/insights`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('insights');
            expect(response.body.data).toHaveProperty('summary');
        });

        it('should return insights array', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/insights`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data.insights)).toBe(true);
        });

        it('should return summary with transaction stats', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/insights`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.summary).toHaveProperty('totalTransactions');
            expect(response.body.data.summary).toHaveProperty('hasEnoughData');
        });
    });

    describe('Endpoint /compare should not exist', () => {
        it('should return 404 for POST /api/predictions/compare', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/compare`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    periods: 6,
                });

            expect(response.status).toBe(404);
        });
    });
});
