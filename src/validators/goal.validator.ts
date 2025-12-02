import Joi from 'joi';

export const createGoalSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.base': 'El nombre debe ser un texto',
      'string.empty': 'El nombre no puede estar vacío',
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'any.required': 'El nombre es requerido',
    }),

  targetAmount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'El monto objetivo debe ser un número',
      'number.positive': 'El monto objetivo debe ser positivo',
      'any.required': 'El monto objetivo es requerido',
    }),

  targetDate: Joi.date()
    .iso()
    .greater('now')
    .required()
    .messages({
      'date.base': 'La fecha objetivo debe ser válida',
      'date.format': 'La fecha debe estar en formato ISO',
      'date.greater': 'La fecha objetivo debe ser en el futuro',
      'any.required': 'La fecha objetivo es requerida',
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.base': 'La descripción debe ser un texto',
      'string.max': 'La descripción no puede exceder 500 caracteres',
    }),

  currentAmount: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .default(0)
    .messages({
      'number.base': 'El monto actual debe ser un número',
      'number.min': 'El monto actual no puede ser negativo',
    }),
});

export const updateGoalSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .optional()
    .messages({
      'string.base': 'El nombre debe ser un texto',
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
    }),

  targetAmount: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'El monto objetivo debe ser un número',
      'number.positive': 'El monto objetivo debe ser positivo',
    }),

  targetDate: Joi.date()
    .iso()
    .greater('now')
    .optional()
    .messages({
      'date.base': 'La fecha objetivo debe ser válida',
      'date.format': 'La fecha debe estar en formato ISO',
      'date.greater': 'La fecha objetivo debe ser en el futuro',
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.base': 'La descripción debe ser un texto',
      'string.max': 'La descripción no puede exceder 500 caracteres',
    }),

  status: Joi.string()
    .valid('active', 'completed', 'cancelled')
    .optional()
    .messages({
      'any.only': 'El estado debe ser: active, completed o cancelled',
    }),
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar',
});

export const updateProgressSchema = Joi.object({
  currentAmount: Joi.number()
    .min(0)
    .precision(2)
    .required()
    .messages({
      'number.base': 'El monto actual debe ser un número',
      'number.min': 'El monto actual no puede ser negativo',
      'any.required': 'El monto actual es requerido',
    }),
});

export const filterGoalsSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'completed', 'cancelled')
    .optional()
    .messages({
      'any.only': 'El estado debe ser: active, completed o cancelled',
    }),

  sortBy: Joi.string()
    .valid('targetDate', 'targetAmount', 'progress', 'createdAt')
    .optional()
    .default('targetDate')
    .messages({
      'any.only': 'Solo se puede ordenar por: targetDate, targetAmount, progress, createdAt',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('asc')
    .messages({
      'any.only': 'El orden debe ser "asc" o "desc"',
    }),
});
