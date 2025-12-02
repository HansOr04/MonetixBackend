import { Request, Response, NextFunction } from 'express';

export const requiredAdmin = (request: Request, response: Response, next: NextFunction): void => {
    try {
        const user = request.user;
        if (!user) {
            response.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
            return;
        }
        if (user.role !== 'admin') {
            response.status(403).json({
                success: false,
                message: 'Acceso degenado'
            });
            return;
        }

        next();

    } catch (error) {
        console.error('Error en verificacion de admin', error);
        response.status(500).json({
            success: false,
            message: 'Error en verificar permisos'
        });
    }
};
