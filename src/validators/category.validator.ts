import Joi from 'joi';

/**
 * Schema de validación para crear una categoría
 */
export const createCategorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.base': 'El nombre debe ser un texto',
      'string.empty': 'El nombre no puede estar vacío',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 50 caracteres',
      'any.required': 'El nombre es requerido',
    }),

  type: Joi.string()
    .valid('income', 'expense')
    .required()
    .messages({
      'string.base': 'El tipo debe ser un texto',
      'any.only': 'El tipo debe ser "income" o "expense"',
      'any.required': 'El tipo es requerido',
    }),

  icon: Joi.string()
    .trim()
    .max(10)
    .optional()
    .messages({
      'string.base': 'El icono debe ser un texto',
      'string.max': 'El icono no puede exceder 10 caracteres',
    }),

  color: Joi.string()
    .trim()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
      'string.base': 'El color debe ser un texto',
      'string.pattern.base': 'El color debe ser un código hexadecimal válido (ej: #6D9C71)',
    }),

  description: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.base': 'La descripción debe ser un texto',
      'string.max': 'La descripción no puede exceder 200 caracteres',
    }),
});

/**
 * Schema de validación para actualizar una categoría
 * Todos los campos son opcionales
 */
export const updateCategorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.base': 'El nombre debe ser un texto',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 50 caracteres',
    }),

  type: Joi.string()
    .valid('income', 'expense')
    .optional()
    .messages({
      'string.base': 'El tipo debe ser un texto',
      'any.only': 'El tipo debe ser "income" o "expense"',
    }),

  icon: Joi.string()
    .trim()
    .max(10)
    .optional()
    .allow('')
    .messages({
      'string.base': 'El icono debe ser un texto',
      'string.max': 'El icono no puede exceder 10 caracteres',
    }),

  color: Joi.string()
    .trim()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
      'string.base': 'El color debe ser un texto',
      'string.pattern.base': 'El color debe ser un código hexadecimal válido (ej: #6D9C71)',
    }),

  description: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.base': 'La descripción debe ser un texto',
      'string.max': 'La descripción no puede exceder 200 caracteres',
    }),
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar',
});

/**
 * Schema de validación para filtros de búsqueda de categorías
 */
export const filterCategoriesSchema = Joi.object({
  type: Joi.string()
    .valid('income', 'expense')
    .optional()
    .messages({
      'string.base': 'El tipo debe ser un texto',
      'any.only': 'El tipo debe ser "income" o "expense"',
    }),

  isDefault: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isDefault debe ser un valor booleano',
    }),

  search: Joi.string()
    .trim()
    .min(1)
    .optional()
    .messages({
      'string.base': 'El término de búsqueda debe ser un texto',
      'string.min': 'El término de búsqueda debe tener al menos 1 caracter',
    }),
});
