export type AlertType = 'overspending' | 'goal_progress' | 'unusual_pattern' | 'recommendation';

export interface IAlertChecker {
  /**
   * Ejecuta el chequeo de alertas para un usuario
   * @param userId - ID del usuario
   */
  check(userId: string): Promise<void>;

  /**
   * Retorna el tipo de alerta que este checker maneja
   */
  getType(): AlertType;

  /**
   * Retorna el nombre descriptivo del checker
   */
  getName(): string;
}
