import { injectable } from 'inversify';
import mongoose from 'mongoose';
import { Alert, IAlert } from '../models/Alert.model';
import { IAlertRepository } from './interfaces/IAlertRepository';
import { CreateAlertDTO, UpdateAlertDTO, AlertFilter } from '../dtos/alert.dto';

@injectable()
export class MongoAlertRepository implements IAlertRepository {
  async findById(id: string): Promise<IAlert | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Alert.findById(id).lean() as unknown as IAlert | null;
  }

  async findByUser(userId: string, filter?: AlertFilter): Promise<IAlert[]> {
    const mongoFilter = this.buildFilter(userId, filter);
    return Alert.find(mongoFilter).sort({ createdAt: -1 }).lean() as unknown as IAlert[];
  }

  async findUnreadByUser(userId: string): Promise<IAlert[]> {
    return Alert.find({
      userId,
      isRead: false,
      isDismissed: false,
    })
      .sort({ createdAt: -1 })
      .lean() as unknown as IAlert[];
  }

  async create(data: CreateAlertDTO): Promise<IAlert> {
    const alert = new Alert({
      userId: data.userId,
      type: data.type,
      severity: data.severity,
      message: data.message,
      relatedData: data.relatedData,
      isRead: false,
      isDismissed: false,
    });

    await alert.save();
    return alert.toObject();
  }

  async update(id: string, userId: string, data: UpdateAlertDTO): Promise<IAlert | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Alert.findOneAndUpdate(
      { _id: id, userId },
      data,
      { new: true, runValidators: true }
    ).lean() as unknown as IAlert | null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const result = await Alert.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  }

  async deleteMany(userId: string, filter?: AlertFilter): Promise<number> {
    const mongoFilter = this.buildFilter(userId, filter);
    const result = await Alert.deleteMany(mongoFilter);
    return result.deletedCount;
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const result = await Alert.updateOne(
      { _id: id, userId },
      { isRead: true }
    );

    return result.modifiedCount > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await Alert.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return result.modifiedCount;
  }

  async dismiss(id: string, userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const result = await Alert.updateOne(
      { _id: id, userId },
      { isDismissed: true }
    );

    return result.modifiedCount > 0;
  }

  async countByUser(userId: string, filter?: AlertFilter): Promise<number> {
    const mongoFilter = this.buildFilter(userId, filter);
    return Alert.countDocuments(mongoFilter);
  }

  // Helper methods privados
  private buildFilter(userId: string, filter?: AlertFilter): any {
    const mongoFilter: any = { userId };

    if (!filter) return mongoFilter;

    if (filter.type) {
      mongoFilter.type = filter.type;
    }

    if (filter.severity) {
      mongoFilter.severity = filter.severity;
    }

    if (filter.isRead !== undefined) {
      mongoFilter.isRead = filter.isRead;
    }

    if (filter.isDismissed !== undefined) {
      mongoFilter.isDismissed = filter.isDismissed;
    }

    return mongoFilter;
  }
}
