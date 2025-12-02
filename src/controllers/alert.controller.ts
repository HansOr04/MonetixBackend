import { Request, Response } from 'express';
import { Alert } from '../models/Alert.model';
import { alertGenerator } from '../core/alertGenerator';
import mongoose from 'mongoose';

export class AlertController {
  async getAlerts(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id;
      const { isRead, severity, type } = request.query;

      const filter: any = { userId };
      if (isRead !== undefined) filter.isRead = isRead === 'true';
      if (severity) filter.severity = severity;
      if (type) filter.type = type;

      const alerts = await Alert.find(filter).sort({ createdAt: -1 }).lean();

      return response.status(200).json({
        success: true,
        data: alerts,
        total: alerts.length,
      });
    } catch (error) {
      console.error('Error al obtener alertas:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al obtener alertas',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getAlertById(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const userId = request.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({
          success: false,
          message: 'ID de alerta inválido',
        });
      }

      const alert = await Alert.findOne({ _id: id, userId }).lean();

      if (!alert) {
        return response.status(404).json({
          success: false,
          message: 'Alerta no encontrada',
        });
      }

      return response.status(200).json({
        success: true,
        data: alert,
      });
    } catch (error) {
      console.error('Error al obtener alerta:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al obtener alerta',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async markAsRead(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const userId = request.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({
          success: false,
          message: 'ID de alerta inválido',
        });
      }

      const alert = await Alert.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true },
        { new: true }
      );

      if (!alert) {
        return response.status(404).json({
          success: false,
          message: 'Alerta no encontrada',
        });
      }

      return response.status(200).json({
        success: true,
        message: 'Alerta marcada como leída',
        data: alert,
      });
    } catch (error) {
      console.error('Error al marcar alerta como leída:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al marcar alerta como leída',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async markAllAsRead(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id;

      const result = await Alert.updateMany({ userId, isRead: false }, { isRead: true });

      return response.status(200).json({
        success: true,
        message: 'Todas las alertas marcadas como leídas',
        data: {
          modifiedCount: result.modifiedCount,
        },
      });
    } catch (error) {
      console.error('Error al marcar todas las alertas como leídas:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al marcar todas las alertas como leídas',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async deleteAlert(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const userId = request.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({
          success: false,
          message: 'ID de alerta inválido',
        });
      }

      const alert = await Alert.findOneAndDelete({ _id: id, userId });

      if (!alert) {
        return response.status(404).json({
          success: false,
          message: 'Alerta no encontrada',
        });
      }

      return response.status(200).json({
        success: true,
        message: 'Alerta eliminada exitosamente',
        data: {
          id: alert._id,
        },
      });
    } catch (error) {
      console.error('Error al eliminar alerta:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al eliminar alerta',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getUnreadCount(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id;

      const count = await Alert.countDocuments({ userId, isRead: false });

      return response.status(200).json({
        success: true,
        data: {
          unreadCount: count,
        },
      });
    } catch (error) {
      console.error('Error al obtener contador de alertas:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al obtener contador de alertas',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async generateAlerts(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id;

      await alertGenerator.runAllChecks(userId!);

      return response.status(200).json({
        success: true,
        message: 'Alertas generadas exitosamente',
      });
    } catch (error) {
      console.error('Error al generar alertas:', error);
      return response.status(500).json({
        success: false,
        message: 'Error al generar alertas',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}

export const alertController = new AlertController();
