import Joi from "joi";

export const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email debe de ser Valido',
        'any.required': 'Email requerido',
    }),
    password: Joi.string().min(8).required().messages({
        'string.min': 'Contraseña minima de 8 caracteres',
        'any.required': 'Contraseña requerida'
    }),
});

export const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email debe de ser Valido',
        'any.required': 'Email requerido',
    }),
    password: Joi.string().min(8).required().messages({
        'string.min': 'Contraseña minima de 8 caracteres',
        'any.required': 'Contraseña requerida'
    }),
    name: Joi.string().min(3).max(50).required().messages({
        'string.min': 'Nombre minimo de 3 caracteres',
        'string.max': 'Nombre maximo de 50 caracteres',
        'any.required': 'Nombre requerido'
    }),
    role: Joi.string().valid('user', 'admin').default('user').messages({
        'any.online': 'El role debe de ser user o admin'
    })
});