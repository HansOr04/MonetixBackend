import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para autorizar roles específicos
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'No autenticado',
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'No tienes permisos para acceder a este recurso',
            });
            return;
        }

        next();
    };
};
