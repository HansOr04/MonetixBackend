import { IAlert } from '../../models/Alert.model';
import { CreateAlertDTO, UpdateAlertDTO, AlertFilter } from '../../dtos/alert.dto';

export interface IAlertRepository {
  // Búsqueda y consulta
  findById(id: string): Promise<IAlert | null>;
  findByUser(userId: string, filter?: AlertFilter): Promise<IAlert[]>;
  findUnreadByUser(userId: string): Promise<IAlert[]>;

  // CRUD
  create(data: CreateAlertDTO): Promise<IAlert>;
  update(id: string, userId: string, data: UpdateAlertDTO): Promise<IAlert | null>;
  delete(id: string, userId: string): Promise<boolean>;
  deleteMany(userId: string, filter?: AlertFilter): Promise<number>;

  // Operaciones especiales
  markAsRead(id: string, userId: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<number>;
  dismiss(id: string, userId: string): Promise<boolean>;

  // Utilidades
  countByUser(userId: string, filter?: AlertFilter): Promise<number>;
}
