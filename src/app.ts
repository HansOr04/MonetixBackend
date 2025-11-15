import express, {Request, Response, NextFunction} from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'ruta front',
    credentials: true,
}));

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'API Monetix correctamente'
    });
});

app.use('/api/auth', authRoutes);

app.use((res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error: ', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servido'
    });
});

export default app;

