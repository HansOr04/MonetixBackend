import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'overspending' | 'goal_progress' | 'unusual_pattern' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  isRead: boolean;
  relatedData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID de usuario es requerido'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'El tipo de alerta es requerido'],
      enum: {
        values: ['overspending', 'goal_progress', 'unusual_pattern', 'recommendation'],
        message: 'El tipo debe ser: overspending, goal_progress, unusual_pattern o recommendation',
      },
      index: true,
    },
    severity: {
      type: String,
      required: [true, 'La severidad es requerida'],
      enum: {
        values: ['info', 'warning', 'critical'],
        message: 'La severidad debe ser: info, warning o critical',
      },
      index: true,
    },
    message: {
      type: String,
      required: [true, 'El mensaje es requerido'],
      trim: true,
      minlength: [10, 'El mensaje debe tener al menos 10 caracteres'],
      maxlength: [1000, 'El mensaje no puede exceder 1000 caracteres'],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedData: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

alertSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
alertSchema.index({ userId: 1, type: 1, severity: 1 });
alertSchema.index({ userId: 1, severity: 1, createdAt: -1 });

alertSchema.methods.toJSON = function () {
  const alert = this.toObject();
  return {
    id: alert._id,
    userId: alert.userId,
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    isRead: alert.isRead,
    relatedData: alert.relatedData,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
  };
};

export const Alert = mongoose.model<IAlert>('Alert', alertSchema);
