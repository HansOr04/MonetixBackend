import { Request, Response } from 'express';
import { comparisonService } from '../services/comparison.service';

export class ComparisonController {
    /**
     * Compara datos por categoría (Período actual vs anterior)
     */
    async compareByCategory(request: Request, response: Response): Promise<Response> {
        try {
            const userId = request.user?.id;
            const { categoryId } = request.query;

            if (!categoryId) {
                return response.status(400).json({
                    success: false,
                    message: 'El ID de la categoría es requerido',
                });
            }

            const comparison = await comparisonService.compareByCategory(userId!, categoryId as string);

            return response.status(200).json({
                success: true,
                message: 'Comparación por categoría realizada exitosamente',
                data: comparison,
            });
        } catch (error) {
            console.error('Error al comparar por categoría:', error);
            return response.status(500).json({
                success: false,
                message: 'Error al comparar por categoría',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }

    /**
     * Compara datos temporales (Ingresos vs Gastos por período)
     */
    async compareByTime(request: Request, response: Response): Promise<Response> {
        try {
            const userId = request.user?.id;
            const { period = 'month' } = request.query;

            const comparison = await comparisonService.compareByTime(userId!, period as 'month' | 'quarter' | 'year');

            return response.status(200).json({
                success: true,
                message: 'Comparación temporal realizada exitosamente',
                data: comparison,
            });
        } catch (error) {
            console.error('Error al comparar temporalmente:', error);
            return response.status(500).json({
                success: false,
                message: 'Error al comparar temporalmente',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }

    /**
     * Compara entre usuarios (solo admin)
     */
    async compareByUsers(request: Request, response: Response): Promise<Response> {
        try {
            // Verificar que el usuario sea admin
            if (request.user?.role !== 'admin') {
                return response.status(403).json({
                    success: false,
                    message: 'No tienes permisos para realizar esta acción',
                });
            }

            const { userIds } = request.body;

            if (!Array.isArray(userIds) || userIds.length === 0) {
                return response.status(400).json({
                    success: false,
                    message: 'Debes proporcionar un array de IDs de usuarios',
                });
            }

            const comparison = await comparisonService.compareByUsers(userIds);

            return response.status(200).json({
                success: true,
                message: 'Comparación entre usuarios realizada exitosamente',
                data: comparison,
            });
        } catch (error) {
            console.error('Error al comparar usuarios:', error);
            return response.status(500).json({
                success: false,
                message: 'Error al comparar usuarios',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }

    /**
     * Compara datos reales vs predicciones
     */
    async compareRealVsPredicted(request: Request, response: Response): Promise<Response> {
        try {
            const userId = request.user?.id;
            const { predictionId } = request.params;

            if (!predictionId) {
                return response.status(400).json({
                    success: false,
                    message: 'El ID de predicción es requerido',
                });
            }

            const comparison = await comparisonService.compareRealVsPredicted(userId!, predictionId);

            return response.status(200).json({
                success: true,
                message: 'Comparación de datos reales vs predicciones realizada exitosamente',
                data: comparison,
            });
        } catch (error) {
            console.error('Error al comparar real vs predicho:', error);

            if (error instanceof Error && error.message.includes('no encontrada')) {
                return response.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            return response.status(500).json({
                success: false,
                message: 'Error al comparar datos reales vs predicciones',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }

    /**
     * Compara predicciones con diferentes períodos
     */
    async compareByPeriods(request: Request, response: Response): Promise<Response> {
        try {
            const userId = request.user?.id;
            const { periods = [3, 6, 12] } = request.body;

            if (!Array.isArray(periods)) {
                return response.status(400).json({
                    success: false,
                    message: 'Los períodos deben ser un array de números',
                });
            }

            const comparison = await comparisonService.compareByPeriods(userId!, periods);

            return response.status(200).json({
                success: true,
                message: 'Comparación por períodos realizada exitosamente',
                data: comparison,
            });
        } catch (error) {
            console.error('Error al comparar por períodos:', error);
            return response.status(500).json({
                success: false,
                message: 'Error al comparar por períodos',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }
    /**
     * Compara dos categorías específicas
     */
    async compareCategories(request: Request, response: Response): Promise<Response> {
        try {
            const userId = request.user?.id;
            const { categoryAId, categoryBId, period = 'month' } = request.body;

            if (!categoryAId || !categoryBId) {
                return response.status(400).json({
                    success: false,
                    message: 'Se requieren los IDs de ambas categorías',
                });
            }

            const comparison = await comparisonService.compareCategories(
                userId!,
                categoryAId,
                categoryBId,
                period as 'month' | 'quarter' | 'year'
            );

            return response.status(200).json({
                success: true,
                message: 'Comparación entre categorías realizada exitosamente',
                data: comparison,
            });
        } catch (error) {
            console.error('Error al comparar categorías:', error);
            return response.status(500).json({
                success: false,
                message: 'Error al comparar categorías',
                error: error instanceof Error ? error.message : 'Error desconocido',
            });
        }
    }
}

export const comparisonController = new ComparisonController();
