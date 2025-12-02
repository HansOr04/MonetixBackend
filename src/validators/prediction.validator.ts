import Joi from 'joi';

export const generatePredictionSchema = Joi.object({
  modelType: Joi.string()
    .valid('linear_regression')
    .required()
    .messages({
      'any.only': 'El tipo de modelo debe ser: linear_regression',
      'any.required': 'El tipo de modelo es requerido',
    }),

  periods: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional()
    .default(6)
    .messages({
      'number.base': 'Los períodos deben ser un número',
      'number.integer': 'Los períodos deben ser un número entero',
      'number.min': 'Debe predecir al menos 1 período',
      'number.max': 'No se pueden predecir más de 12 períodos',
    }),

  type: Joi.string()
    .valid('income', 'expense', 'net')
    .optional()
    .messages({
      'any.only': 'El tipo debe ser: income, expense o net',
    }),
});

export const comparePredictionsSchema = Joi.object({
  periods: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .optional()
    .default(6)
    .messages({
      'number.base': 'Los períodos deben ser un número',
      'number.integer': 'Los períodos deben ser un número entero',
      'number.min': 'Debe predecir al menos 1 período',
      'number.max': 'No se pueden predecir más de 12 períodos',
    }),
});

export const filterPredictionsSchema = Joi.object({
  modelType: Joi.string()
    .valid('linear_regression')
    .optional()
    .messages({
      'any.only': 'El tipo de modelo debe ser: linear_regression',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .messages({
      'number.base': 'El límite debe ser un número',
      'number.min': 'El límite debe ser al menos 1',
      'number.max': 'El límite no puede exceder 50',
    }),
});
