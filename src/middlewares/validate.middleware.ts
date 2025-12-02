import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = source === 'query' ? req.query : source === 'params' ? req.params : req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors,
      });
      return;
    }

    // Para query y params, no podemos reasignar directamente porque son readonly
    // En su lugar, simplemente continuamos - la validación ya pasó
    if (source === 'body') {
      req.body = value;
    }

    next();
  };
};