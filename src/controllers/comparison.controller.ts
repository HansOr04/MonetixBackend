import { Request, Response } from 'express';
import { comparisonService } from '../services/comparison.service';

export class ComparisonController {
    /**
     * Compara datos por categoría
     */
    async compareByCategory(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.id;
            const { periods = 6 } = req.query;

            const comparison = await comparisonService.compareByCategory(userId!, Number(periods));

            return res.status(200).json({
                success: true,
                message: 'Comparación por categoría realizada exitosamente',
                data: comparison,
            });
        } catch (error) {
            console.error('Error al comparar por categoría:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al comparar por categoría',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }

    /**
     * Compara predicciones temporales
     */
    async compareByTime(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.id;
            const { limit = 5 } = req.query;

            const comparison = await comparisonService.compareByTime(userId!, Number(limit));

            return res.status(200).json({
                success: true,
                message: 'Comparación temporal realizada exitosamente',
                data: comparison,
            });
        } catch (error) {
            console.error('Error al comparar temporalmente:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al comparar temporalmente',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }

    /**
     * Compara entre usuarios (solo admin)
     */
    async compareByUsers(req: Request, res: Response): Promise<Response> {
        try {
            // Verificar que el usuario sea admin
            if (req.user?.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para realizar esta acción',
                });
            }

            const { userIds } = req.body;

            if (!Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes proporcionar un array de IDs de usuarios',
                });
            }

            const comparison = await comparisonService.compareByUsers(userIds);

            return res.status(200).json({
                success: true,
                message: 'Comparación entre usuarios realizada exitosamente',
                data: comparison,
            });
        } catch (error) {
            console.error('Error al comparar usuarios:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al comparar usuarios',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }

    /**
     * Compara datos reales vs predicciones
     */
    async compareRealVsPredicted(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.id;
            const { predictionId } = req.params;

            if (!predictionId) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID de predicción es requerido',
                });
            }

            const comparison = await comparisonService.compareRealVsPredicted(userId!, predictionId);

            return res.status(200).json({
                success: true,
                message: 'Comparación de datos reales vs predicciones realizada exitosamente',
                data: comparison,
            });
        } catch (error) {
            console.error('Error al comparar real vs predicho:', error);

            if (error instanceof Error && error.message.includes('no encontrada')) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al comparar datos reales vs predicciones',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }

    /**
     * Compara predicciones con diferentes períodos
     */
    async compareByPeriods(req: Request, res: Response): Promise<Response> {
        try {
            const userId = req.user?.id;
            const { periods = [3, 6, 12] } = req.body;

            if (!Array.isArray(periods)) {
                return res.status(400).json({
                    success: false,
                    message: 'Los períodos deben ser un array de números',
                });
            }

            const comparison = await comparisonService.compareByPeriods(userId!, periods);

            return res.status(200).json({
                success: true,
                message: 'Comparación por períodos realizada exitosamente',
                data: comparison,
            });
        } catch (error) {
            console.error('Error al comparar por períodos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al comparar por períodos',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }
}

export const comparisonController = new ComparisonController();
