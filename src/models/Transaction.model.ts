import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ID de usuario es requerido'],
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es requerida'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'El monto es requerido'],
      min: [0.01, 'El monto debe ser mayor a 0'],
      validate: {
        validator: function (value: number) {
          return value > 0;
        },
        message: 'El monto debe ser un número positivo',
      },
    },
    type: {
      type: String,
      required: [true, 'El tipo de transacción es requerido'],
      enum: {
        values: ['income', 'expense'],
        message: 'El tipo debe ser "income" o "expense"',
      },
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    date: {
      type: Date,
      required: [true, 'La fecha es requerida'],
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });

transactionSchema.methods.toJSON = function () {
  const transaction = this.toObject();
  return {
    id: transaction._id,
    userId: transaction.userId,
    categoryId: transaction.categoryId,
    amount: transaction.amount,
    type: transaction.type,
    description: transaction.description,
    date: transaction.date,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
};

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
