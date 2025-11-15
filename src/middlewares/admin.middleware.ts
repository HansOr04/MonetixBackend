import { Request, Response, NextFunction} from 'express';

export const requiredAdmin = (req: Request, res: Response, next: NextFunction): void => {
    try{
        const user = req.user;
        if(!user){
            res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
            return;
        }
        if(user.role !== 'admin'){
            res.status(403).json({
                success: false,
                message: 'Acceso degenado'
            });
            return;
        }

        next();

    }catch(error){
        console.error('Error en verificacion de admin', error);
        res.status(500).json({
            success: false,
                message: 'Error en verificar permisos'
        });
    }
};
