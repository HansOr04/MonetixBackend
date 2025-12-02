import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  status: 'active' | 'completed' | 'cancelled';
  description?: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  calculateProgress(): number;
}

const goalSchema = new Schema<IGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID de usuario es requerido'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre de la meta es requerido'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'El monto objetivo es requerido'],
      min: [0.01, 'El monto objetivo debe ser mayor a 0'],
      validate: {
        validator: function (value: number) {
          return value > 0;
        },
        message: 'El monto objetivo debe ser positivo',
      },
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'El monto actual no puede ser negativo'],
      validate: {
        validator: function (value: number) {
          return value >= 0;
        },
        message: 'El monto actual debe ser mayor o igual a 0',
      },
    },
    targetDate: {
      type: Date,
      required: [true, 'La fecha objetivo es requerida'],
      validate: {
        validator: function (value: Date) {
          return value > new Date();
        },
        message: 'La fecha objetivo debe ser en el futuro',
      },
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'cancelled'],
        message: 'El estado debe ser "active", "completed" o "cancelled"',
      },
      default: 'active',
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, targetDate: 1 });

goalSchema.methods.calculateProgress = function (): number {
  if (this.targetAmount <= 0) return 0;
  const progress = (this.currentAmount / this.targetAmount) * 100;
  return Math.min(Math.round(progress * 100) / 100, 100);
};

goalSchema.pre('save', function (next) {
  this.progress = this.calculateProgress();
  
  if (this.progress >= 100 && this.status === 'active') {
    this.status = 'completed';
  }
  
  next();
});

goalSchema.methods.toJSON = function () {
  const goal = this.toObject();
  return {
    id: goal._id,
    userId: goal.userId,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    targetDate: goal.targetDate,
    status: goal.status,
    description: goal.description,
    progress: goal.progress,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
};

export const Goal = mongoose.model<IGoal>('Goal', goalSchema);
