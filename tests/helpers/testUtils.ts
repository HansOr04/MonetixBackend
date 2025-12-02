import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

/**
 * Usuario de prueba por defecto
 */
export const testUser = {
    id: new mongoose.Types.ObjectId().toString(),
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
};

/**
 * Usuario admin de prueba
 */
export const testAdmin = {
    id: new mongoose.Types.ObjectId().toString(),
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
};

/**
 * Genera un token JWT para testing
 */
export const generateAuthToken = (userId: string, role: string = 'user'): string => {
    const secret = process.env.JWT_SECRET || 'test-secret-key';

    return jwt.sign(
        {
            id: userId,
            role: role,
        },
        secret,
        { expiresIn: '1h' }
    );
};

/**
 * Crea un ID de categoría de prueba
 */
export const createTestCategoryId = (): string => {
    return new mongoose.Types.ObjectId().toString();
};

/**
 * Crea un ID de transacción de prueba
 */
export const createTestTransactionId = (): string => {
    return new mongoose.Types.ObjectId().toString();
};

/**
 * Crea un ID de predicción de prueba
 */
export const createTestPredictionId = (): string => {
    return new mongoose.Types.ObjectId().toString();
};

/**
 * Espera un tiempo determinado (útil para tests asíncronos)
 */
export const wait = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Genera datos de transacción de prueba
 */
export const createTestTransaction = (overrides: any = {}) => {
    return {
        userId: testUser.id,
        amount: 100,
        type: 'expense',
        category: 'Test Category',
        categoryId: createTestCategoryId(),
        description: 'Test transaction',
        date: new Date(),
        ...overrides,
    };
};

/**
 * Genera múltiples transacciones de prueba
 */
export const createTestTransactions = (count: number, overrides: any = {}) => {
    return Array.from({ length: count }, (_, i) =>
        createTestTransaction({
            amount: 100 + i * 10,
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Un día atrás por cada transacción
            ...overrides,
        })
    );
};
