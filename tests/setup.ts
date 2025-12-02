import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configurar timeout para tests
jest.setTimeout(30000);

// Mock de console para tests más limpios (opcional)
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
};

// Conectar a MongoDB antes de todos los tests
beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI_TEST || process.env.MONGO_URI || 'mongodb://localhost:27017/monetix-test';

    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to test database');
    } catch (error) {
        console.error('Error connecting to test database:', error);
    }
});

// Limpiar y desconectar después de todos los tests
afterAll(async () => {
    try {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        console.log('Disconnected from test database');
    } catch (error) {
        console.error('Error disconnecting from test database:', error);
    }
});

// Limpieza entre tests deshabilitada para permitir tests de integración
// Los datos se mantienen durante toda la suite de tests
// Si necesitas limpiar entre tests específicos, hazlo manualmente en el test
/*
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});
*/
