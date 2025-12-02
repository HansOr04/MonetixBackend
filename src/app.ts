import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import categoriesRoutes from './routes/category.routes';
import transactionRoutes from './routes/transaction.routes';
import goalRoutes from './routes/goal.routes';
import predictionRoutes from './routes/prediction.routes';
import alertRoutes from './routes/alert.routes';
import comparisonRoutes from './routes/comparison.routes';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log simple de peticiones
app.use((request: Request, response: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);
  next();
});

app.get('/', (request: Request, response: Response) => {
  response.json({
    success: true,
    message: 'API de Monetix funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      categories: '/api/categories',
      transactions: '/api/transactions',
      goals: '/api/goals',
      predictions: '/api/predictions',
      alerts: '/api/alerts',
      comparisons: '/api/comparisons',
    },
  });
});

// Rutas de administración
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoriesRoutes);

// Rutas del core
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/comparisons', comparisonRoutes);

app.use((request: Request, response: Response) => {
  response.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

app.use((err: Error, request: Request, response: Response, next: NextFunction) => {
  console.error('Error:', err);
  response.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
});

export default app;