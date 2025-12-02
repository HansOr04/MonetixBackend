import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para autorizar roles específicos
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
    return (request: Request, response: Response, next: NextFunction): void => {
        if (!request.user) {
            response.status(401).json({
                success: false,
                message: 'No autenticado',
            });
            return;
        }

        if (!allowedRoles.includes(request.user.role)) {
            response.status(403).json({
                success: false,
                message: 'No tienes permisos para acceder a este recurso',
            });
            return;
        }

        next();
    };
};
