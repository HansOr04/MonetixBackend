import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { Alert } from '../models/Alert.model';
import { AlertOrchestrator } from '../core/alerts/AlertOrchestrator';
import { AlertType } from '../core/alerts/interfaces/IAlertChecker';
import mongoose from 'mongoose';

@injectable()
export class AlertController {
  constructor(
    @inject(Symbol.for('AlertOrchestrator')) private alertOrchestrator: AlertOrchestrator
  ) {}

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
      return this.handleError(error, response, 'Error al obtener alertas');
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
      return this.handleError(error, response, 'Error al obtener alerta');
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
      return this.handleError(error, response, 'Error al marcar alerta como leída');
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
      return this.handleError(error, response, 'Error al marcar todas las alertas como leídas');
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
      return this.handleError(error, response, 'Error al eliminar alerta');
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
      return this.handleError(error, response, 'Error al obtener contador de alertas');
    }
  }

  /**
   * Generar alertas usando el nuevo AlertOrchestrator
   * POST /api/v1/alerts/generate
   */
  async generateAlerts(request: Request, response: Response): Promise<Response> {
    try {
      const userId = request.user?.id!;
      const { type } = request.query;

      if (type) {
        // Ejecutar checker específico
        await this.alertOrchestrator.runSpecificCheck(userId, type as AlertType);

        return response.status(200).json({
          success: true,
          message: `Alertas de tipo "${type}" generadas exitosamente`,
        });
      } else {
        // Ejecutar todos los checkers
        await this.alertOrchestrator.runAllChecks(userId);

        return response.status(200).json({
          success: true,
          message: 'Todas las alertas generadas exitosamente',
        });
      }
    } catch (error) {
      return this.handleError(error, response, 'Error al generar alertas');
    }
  }

  /**
   * Obtener tipos de alertas disponibles
   * GET /api/v1/alerts/types
   */
  async getAvailableTypes(request: Request, response: Response): Promise<Response> {
    try {
      const types = this.alertOrchestrator.getAvailableTypes();

      return response.status(200).json({
        success: true,
        data: types,
      });
    } catch (error) {
      return this.handleError(error, response, 'Error al obtener tipos de alertas');
    }
  }

  // ========== HELPER METHODS ==========

  private handleError(error: unknown, response: Response, defaultMessage: string): Response {
    console.error(defaultMessage, error);

    const message = error instanceof Error ? error.message : 'Error desconocido';

    return response.status(500).json({
      success: false,
      message: defaultMessage,
      error: message,
    });
  }
}

// Exportar instancia desde contenedor
import { container } from '../config/container';
container.bind<AlertController>(Symbol.for('AlertController')).to(AlertController);

export const alertController = container.get<AlertController>(Symbol.for('AlertController'));
