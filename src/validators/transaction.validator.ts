import Joi from 'joi';

export const createTransactionSchema = Joi.object({
  categoryId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'El ID de categoría debe ser un ObjectId válido',
      'any.required': 'La categoría es requerida',
    }),

  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'El monto debe ser un número',
      'number.positive': 'El monto debe ser positivo',
      'any.required': 'El monto es requerido',
    }),

  type: Joi.string()
    .valid('income', 'expense')
    .required()
    .messages({
      'any.only': 'El tipo debe ser "income" o "expense"',
      'any.required': 'El tipo es requerido',
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'La descripción no puede exceder 500 caracteres',
    }),

  date: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.base': 'La fecha debe ser válida',
      'date.format': 'La fecha debe estar en formato ISO',
      'date.max': 'La fecha no puede ser futura',
    }),
});

export const updateTransactionSchema = Joi.object({
  categoryId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'El ID de categoría debe ser un ObjectId válido',
    }),

  amount: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'El monto debe ser un número',
      'number.positive': 'El monto debe ser positivo',
    }),

  type: Joi.string()
    .valid('income', 'expense')
    .optional()
    .messages({
      'any.only': 'El tipo debe ser "income" o "expense"',
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'La descripción no puede exceder 500 caracteres',
    }),

  date: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.base': 'La fecha debe ser válida',
      'date.format': 'La fecha debe estar en formato ISO',
      'date.max': 'La fecha no puede ser futura',
    }),
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar',
});

export const filterTransactionsSchema = Joi.object({
  type: Joi.string()
    .valid('income', 'expense')
    .optional()
    .messages({
      'any.only': 'El tipo debe ser "income" o "expense"',
    }),

  categoryId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'El ID de categoría debe ser un ObjectId válido',
    }),

  dateFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'La fecha inicial debe ser válida',
      'date.format': 'La fecha debe estar en formato ISO',
    }),

  dateTo: Joi.date()
    .iso()
    .min(Joi.ref('dateFrom'))
    .optional()
    .messages({
      'date.base': 'La fecha final debe ser válida',
      'date.format': 'La fecha debe estar en formato ISO',
      'date.min': 'La fecha final debe ser posterior a la fecha inicial',
    }),

  minAmount: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'El monto mínimo debe ser un número',
      'number.positive': 'El monto mínimo debe ser positivo',
    }),

  maxAmount: Joi.number()
    .positive()
    .min(Joi.ref('minAmount'))
    .optional()
    .messages({
      'number.base': 'El monto máximo debe ser un número',
      'number.positive': 'El monto máximo debe ser positivo',
      'number.min': 'El monto máximo debe ser mayor al monto mínimo',
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'La página debe ser un número',
      'number.min': 'La página debe ser mayor a 0',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .messages({
      'number.base': 'El límite debe ser un número',
      'number.min': 'El límite debe ser al menos 1',
      'number.max': 'El límite no puede exceder 100',
    }),

  sortBy: Joi.string()
    .valid('date', 'amount', 'createdAt')
    .optional()
    .default('date')
    .messages({
      'any.only': 'Solo se puede ordenar por: date, amount, createdAt',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
    .messages({
      'any.only': 'El orden debe ser "asc" o "desc"',
    }),
});
