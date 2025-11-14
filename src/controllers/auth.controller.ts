import { Request, Response } from 'express';
import jwt  from 'jsonwebtoken';
import { User } from '../models/User.model';

export const login = async (req: Request, res: Response): Promise<void> => {
    try{
        const{email, password} = req.body;
        const user = await User.findOne({email});

        if(!user) {
            res.status(401).json({
                success: false,
                message: 'Credenciales invalidas',
            });
            return;
        }
         const isPasswordValid = await user.comparePassword(password);

         if(!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Credenciales invalidas',
            });
            return;
         }
         const token = jwt.sign({
            userId: user._id,
            role: user.role
         },
         process.env.JWT_SECRET || 'secret',
         {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
         }
        );
        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
        });
    }catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesion',
        });
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try{
        const {email,password,name,role} = req.body;
        const existingUser = await User.findOne({email});

        if(existingUser) {
            res.status(400).json({
                succes:false,
                message: 'El email ya esta registrado',
            });
            return;
        }
        const user = new User({
            email,
            password,
            name,
            role: role || 'user,'
        });
        await user.save();

        const token = jwt.sign({
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET || 'secret',
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
        }
    );

    res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: {
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        },
    });
    }catch(error){
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
        });
    }
};

export const getCurrentUuser = async (req: Request, res: Response): Promise<void> => {
    try{
        const user = (req as any).user;

        res.status(200).json({
            success: true,
            data: {
                user:{
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
        });
    }catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            succes: false,
            message: 'Error al obtener usuario',
        });
    }
};
