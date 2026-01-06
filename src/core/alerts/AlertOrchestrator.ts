import { injectable, multiInject } from 'inversify';
import { IAlertChecker, AlertType } from './interfaces/IAlertChecker';

@injectable()
export class AlertOrchestrator {
  private checkers: Map<AlertType, IAlertChecker>;

  constructor(@multiInject(Symbol.for('IAlertChecker')) checkers: IAlertChecker[]) {
    this.checkers = new Map();
    checkers.forEach((checker) => {
      this.checkers.set(checker.getType(), checker);
    });
  }

  /**
   * Ejecuta todos los checkers de alertas
   */
  async runAllChecks(userId: string): Promise<void> {
    const checkPromises = Array.from(this.checkers.values()).map((checker) =>
      checker.check(userId).catch((error) => {
        console.error(`Error en ${checker.getName()}:`, error);
        // No lanzar error para que otros checkers continúen
      })
    );

    await Promise.all(checkPromises);
  }

  /**
   * Ejecuta un checker específico
   */
  async runSpecificCheck(userId: string, type: AlertType): Promise<void> {
    const checker = this.checkers.get(type);

    if (!checker) {
      throw new Error(`No existe checker para el tipo: ${type}`);
    }

    await checker.check(userId);
  }

  /**
   * Obtiene todos los tipos de alertas disponibles
   */
  getAvailableTypes(): AlertType[] {
    return Array.from(this.checkers.keys());
  }
}
