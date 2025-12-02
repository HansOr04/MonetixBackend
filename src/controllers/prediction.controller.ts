import { Request, Response } from 'express';
import { predictionEngine } from '../core/PredictionEngine';
import { Prediction } from '../models/Prediction.model';

export class PredictionController {
  async generatePrediction(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { modelType, periods = 6 } = req.body;

      const prediction = await predictionEngine.predict(userId!, modelType, periods);

      return res.status(200).json({
        success: true,
        message: 'Predicción generada exitosamente',
        data: prediction,
      });
    } catch (error) {
      console.error('Error al generar predicción:', error);

      if (error instanceof Error && error.message.includes('al menos 30')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error al generar predicción',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getPredictions(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { modelType, limit = 10 } = req.query;

      const filter: any = { userId };
      if (modelType) filter.modelType = modelType;

      const predictions = await Prediction.find(filter)
        .sort({ generatedAt: -1 })
        .limit(Number(limit))
        .lean();

      return res.status(200).json({
        success: true,
        data: predictions,
        total: predictions.length,
      });
    } catch (error) {
      console.error('Error al obtener predicciones:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener predicciones',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }



  async getInsights(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      const insights = await predictionEngine.generateInsights(userId!);

      return res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error) {
      console.error('Error al generar insights:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al generar insights',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}

export const predictionController = new PredictionController();
