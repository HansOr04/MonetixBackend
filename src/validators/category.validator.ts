import Joi from "joi";

export const createCategorySchema = Joi.object({
    name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .required()
    .messages({
        'string.base': 'El nombre debe ser un texto',
        'string.empty': 'El nombre no puede estar vacio',
        'string.min': 'El nombre debe de contener al menos 2 caracteres',
        'string.max': 'El nombre no puede excederse de 50 caracteres',
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
        'string.max': 'El icono no puede excederse de 10 caracteres',
    }),

    color: Joi.string()
    .trim()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
        'string.base': 'El color debe de ser un texto',
        'string.pattern.base': 'El colo debe de ser un codigo hexadecimal valido',
    }),

    descripcion: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('')
    .messages({
        'string.base': 'La descripcion debe ser un texto',
        'string.max': 'La descripcion no puede excederse de 200 caracteres',
    }),
});

export const updateCategorySchema = Joi.object({
    name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
        'string.base': 'El nombre debe ser un texto',
        'string.min': 'El nombre debe de contener al menos 2 caracteres',
        'string.max': 'El nombre no puede excederse de los 50 caracteres',
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
        'string.max': 'El icono no puede excederse de 10 caracteres',
    }),

    color: Joi.string()
    .trim()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
        'string.base': 'El color debe de ser un texto',
        'string.pattern.base': 'El colo debe de ser un codigo hexadecimal valido',
    }),

    descripcion: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('')
    .messages({
        'string.base': 'La descripcion debe ser un texto',
        'string.max': 'La descripcion no puede excederse de 200 caracteres',
    }),
}).min(1).messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
});

export const filterCategoriesSchame = Joi.object({
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
        'string.base': 'El termino de busqueda debe ser un texto',
        'string.min': 'El termino de busqueda debe tener al menos 1 caracter',
    }),
});

