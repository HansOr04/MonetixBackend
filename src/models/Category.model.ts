import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface para el documento de Categoría
 */
export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  description?: string;
  userId?: mongoose.Types.ObjectId; // Opcional: para categorías personalizadas del usuario
  isDefault: boolean; // true para categorías predeterminadas del sistema
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Mongoose para Categoría
 */
const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la categoría es requerido'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
    },
    type: {
      type: String,
      required: [true, 'El tipo de categoría es requerido'],
      enum: {
        values: ['income', 'expense'],
        message: 'El tipo debe ser "income" o "expense"',
      },
    },
    icon: {
      type: String,
      trim: true,
      default: '💰',
    },
    color: {
      type: String,
      trim: true,
      default: '#6D9C71', // Matcha por defecto
      match: [/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'La descripción no puede exceder 200 caracteres'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null para categorías del sistema
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Índice compuesto para asegurar nombres únicos por usuario
 * Las categorías del sistema (isDefault=true) deben tener nombres únicos globalmente
 */
categorySchema.index({ name: 1, userId: 1, type: 1 }, { unique: true });

/**
 * Middleware pre-save para convertir el nombre a título
 */
categorySchema.pre('save', function (next) {
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
  }
  next();
});

/**
 * Método para obtener una representación limpia de la categoría
 */
categorySchema.methods.toJSON = function () {
  const category = this.toObject();
  return {
    id: category._id,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    description: category.description,
    isDefault: category.isDefault,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

export const Category = mongoose.model<ICategory>('Category', categorySchema);
