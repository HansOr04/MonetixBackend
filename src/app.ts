import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

const app = express();


app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());


app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API de Monetix funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
    },
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de usuarios
app.use('/api/users', userRoutes);

// Ruta no encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Manejo de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
});

export default app;