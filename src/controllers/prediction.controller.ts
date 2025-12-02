import { Request, Response } from 'express';
import { predictionEngine } from '../core/PredictionEngine';
import { Prediction } from '../models/Prediction.model';

export class PredictionController {
  async generatePrediction(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id;
      const { modelType, periods = 6, type } = request.body;

      const prediction = await predictionEngine.predict(userId!, modelType, periods, type);

      return response.status(200).json({
        success: true,
        message: 'Predicción generada exitosamente',
        data: prediction,
      });
    } catch (error) {
      console.error('Error al generar predicción:', error);

      if (error instanceof Error && error.message.includes('al menos 30')) {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return response.status(500).json({
        success: false,
        message: 'Error al generar predicción',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getPredictions(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id;
      const { modelType, limit = 10 } = request.query;

      const filter: any = { userId };
      if (modelType) filter.modelType = modelType;

      const predictions = await Prediction.find(filter)
        .sort({ generatedAt: -1 })
        .limit(Number(limit))
        .lean();

      return response.status(200).json({
        success: true,
        data: predictions,
        total: predictions.length,
      });
    } catch (error) {
      console.error('Error al obtener predicciones:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al obtener predicciones',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }



  async getInsights(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id;

      const insights = await predictionEngine.generateInsights(userId!);

      return response.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error) {
      console.error('Error al generar insights:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al generar insights',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}

export const predictionController = new PredictionController();
