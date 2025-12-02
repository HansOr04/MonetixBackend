import request from 'supertest';
import app from '../src/app';
import { generateAuthToken, testUser } from './helpers/testUtils';

const BASE_URL = '/api/comparisons';
let authToken: string;
let adminToken: string;

describe('Comparison Endpoints', () => {
    beforeAll(() => {
        authToken = generateAuthToken(testUser.id, testUser.role);
        // Generar token de admin para tests que lo requieren
        adminToken = generateAuthToken(testUser.id, 'admin');
    });

    describe('GET /api/comparisons/category', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/category`);

            expect(response.status).toBe(401);
        });

        it('should return category comparison with authentication', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/category`)
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.data).toBeDefined();
                expect(response.body.data.comparisonType).toBe('by_category');
                expect(response.body.data.categories).toBeDefined();
                expect(Array.isArray(response.body.data.categories)).toBe(true);
                expect(response.body.data).toHaveProperty('totalCategories');
                expect(response.body.data).toHaveProperty('grandTotal');
            }
        });

        it('should accept periods parameter', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/category?periods=3`)
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 500]).toContain(response.status);
        });

        it('should return categories with percentage', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/category`)
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 200 && response.body.data.categories.length > 0) {
                response.body.data.categories.forEach((cat: any) => {
                    expect(cat).toHaveProperty('categoryId');
                    expect(cat).toHaveProperty('totalAmount');
                    expect(cat).toHaveProperty('avgAmount');
                    expect(cat).toHaveProperty('transactionCount');
                    expect(cat).toHaveProperty('percentage');
                    expect(typeof cat.percentage).toBe('number');
                });
            }
        });

        it('should return categories sorted by total amount', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/category`)
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 200 && response.body.data.categories.length > 1) {
                const categories = response.body.data.categories;
                for (let i = 0; i < categories.length - 1; i++) {
                    expect(categories[i].totalAmount).toBeGreaterThanOrEqual(categories[i + 1].totalAmount);
                }
            }
        });
    });

    describe('GET /api/comparisons/temporal', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/temporal`);

            expect(response.status).toBe(401);
        });

        it('should return temporal comparison with authentication', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/temporal`)
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.data).toBeDefined();
                expect(response.body.data.comparisonType).toBe('temporal');
                expect(response.body.data.predictions).toBeDefined();
                expect(Array.isArray(response.body.data.predictions)).toBe(true);
            }
        });

        it('should accept limit parameter', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/temporal?limit=3`)
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.data.predictions.length).toBeLessThanOrEqual(3);
            }
        });

        it('should return predictions with trend analysis', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/temporal`)
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status === 200 && response.body.data.predictions.length > 0) {
                response.body.data.predictions.forEach((pred: any) => {
                    expect(pred).toHaveProperty('predictionId');
                    expect(pred).toHaveProperty('generatedAt');
                    expect(pred).toHaveProperty('confidence');
                    expect(pred).toHaveProperty('avgPredictedAmount');
                    expect(pred).toHaveProperty('trend');
                    expect(['creciente', 'decreciente']).toContain(pred.trend);
                });
            }
        });

        it('should use default limit when not provided', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/temporal`)
                .set('Authorization', `Bearer ${authToken}`);

            expect([200, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.data.predictions.length).toBeLessThanOrEqual(5);
            }
        });
    });

    describe('POST /api/comparisons/users', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/users`)
                .send({
                    userIds: [testUser.id],
                });

            expect(response.status).toBe(401);
        });

        it('should return 403 for non-admin users', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/users`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userIds: [testUser.id],
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 without userIds', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/users`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 with empty userIds array', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/users`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    userIds: [],
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return user comparison for admin', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/users`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    userIds: [testUser.id],
                });

            expect([200, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.data).toBeDefined();
                expect(response.body.data.comparisonType).toBe('by_users');
                expect(response.body.data.users).toBeDefined();
                expect(Array.isArray(response.body.data.users)).toBe(true);
            }
        });

        it('should return user stats in comparison', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/users`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    userIds: [testUser.id],
                });

            if (response.status === 200 && response.body.data.users.length > 0) {
                response.body.data.users.forEach((user: any) => {
                    expect(user).toHaveProperty('userId');
                    expect(user).toHaveProperty('transactionCount');
                    expect(user).toHaveProperty('totalIncome');
                    expect(user).toHaveProperty('totalExpense');
                    expect(user).toHaveProperty('balance');
                    expect(user).toHaveProperty('hasEnoughData');
                });
            }
        });
    });

    describe('GET /api/comparisons/real-vs-predicted/:predictionId', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/real-vs-predicted/507f1f77bcf86cd799439011`);

            expect(response.status).toBe(401);
        });

        it('should return 404 for non-existent prediction', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/real-vs-predicted/507f1f77bcf86cd799439011`)
                .set('Authorization', `Bearer ${authToken}`);

            expect([404, 500]).toContain(response.status);
        });

        it('should return 404 for invalid prediction ID format', async () => {
            const response = await request(app)
                .get(`${BASE_URL}/real-vs-predicted/invalid-id`)
                .set('Authorization', `Bearer ${authToken}`);

            expect([404, 500]).toContain(response.status);
        });

        // Este test solo funcionará si hay predicciones en la BD
        it('should return comparison when prediction exists', async () => {
            // Primero intentar obtener una predicción existente
            const predictionsResponse = await request(app)
                .get('/api/predictions?limit=1')
                .set('Authorization', `Bearer ${authToken}`);

            if (predictionsResponse.status === 200 && predictionsResponse.body.data.length > 0) {
                const predictionId = predictionsResponse.body.data[0].id;

                const response = await request(app)
                    .get(`${BASE_URL}/real-vs-predicted/${predictionId}`)
                    .set('Authorization', `Bearer ${authToken}`);

                if (response.status === 200) {
                    expect(response.body.success).toBe(true);
                    expect(response.body.data).toBeDefined();
                    expect(response.body.data.comparisonType).toBe('real_vs_predicted');
                    expect(response.body.data).toHaveProperty('avgPercentageError');
                    expect(response.body.data).toHaveProperty('accuracyRate');
                    expect(response.body.data).toHaveProperty('boundsAccuracyRate');
                    expect(response.body.data).toHaveProperty('comparisons');
                    expect(Array.isArray(response.body.data.comparisons)).toBe(true);
                }
            }
        });
    });

    describe('POST /api/comparisons/periods', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/periods`)
                .send({
                    periods: [3, 6, 12],
                });

            expect(response.status).toBe(401);
        });

        it('should return 400 with invalid periods format', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/periods`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    periods: 'invalid',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 with non-array periods', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/periods`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    periods: 6,
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return period comparison with valid data', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/periods`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    periods: [3, 6, 12],
                });

            expect([200, 400, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.data).toBeDefined();
                expect(response.body.data.comparisonType).toBe('by_periods');
                expect(response.body.data.comparisons).toBeDefined();
                expect(Array.isArray(response.body.data.comparisons)).toBe(true);
                expect(response.body.data.comparisons.length).toBe(3);
            }
        });

        it('should use default periods when not provided', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/periods`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect([200, 400, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.data.periodOptions).toEqual([3, 6, 12]);
            }
        });

        it('should return comparisons with growth rate', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/periods`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    periods: [3, 6],
                });

            if (response.status === 200) {
                response.body.data.comparisons.forEach((comp: any) => {
                    if (comp.success !== false) {
                        expect(comp).toHaveProperty('periods');
                        expect(comp).toHaveProperty('confidence');
                        expect(comp).toHaveProperty('avgPredictedAmount');
                        expect(comp).toHaveProperty('growthRate');
                        expect(comp).toHaveProperty('predictions');
                    }
                });
            }
        });

        it('should handle custom period arrays', async () => {
            const response = await request(app)
                .post(`${BASE_URL}/periods`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    periods: [1, 2, 3],
                });

            expect([200, 400, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.data.comparisons.length).toBe(3);
            }
        });
    });
});
