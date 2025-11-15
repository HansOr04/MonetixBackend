import { Request, Response} from "express";
import Joi from "joi";

export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response) => {
        const {error} = schema.validate(req.body, {abortEarly: false, stripUnknown: true});
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors
            });
        }
    }
}