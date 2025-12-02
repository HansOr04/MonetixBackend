import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (request: Request, response: Response, next: NextFunction): void => {
    const dataToValidate = source === 'query' ? request.query : source === 'params' ? request.params : request.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      response.status(400).json({
        success: false,
        message: 'Error de validación',
        errors,
      });
      return;
    }

    // Para query y params, no podemos reasignar directamente porque son readonly
    // En su lugar, simplemente continuamos - la validación ya pasó
    if (source === 'body') {
      request.body = value;
    }

    next();
  };
};