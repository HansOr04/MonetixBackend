import { Request, Response } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { User } from '../models/User.model';
import { Types } from 'mongoose';

// Función helper para obtener el JWT_SECRET
const getJwtSecret = (): Secret => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  return secret as Secret;
};

// LOGIN
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Buscar usuario por email
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
      return;
    }

    // 2. Verificar password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
      return;
    }

    // 3. Generar JWT
    const token = jwt.sign(
      { 
        userId: (user._id as Types.ObjectId).toString(), 
        role: user.role 
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // 4. Retornar respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: (user._id as Types.ObjectId).toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
    });
  }
};

// REGISTRO
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    // 1. Verificar si el email ya existe
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
      return;
    }

    // 2. Crear nuevo usuario
    const user = new User({
      email,
      password,
      name,
      role: role || 'user',
    });

    await user.save();

    // 3. Generar JWT
    const token = jwt.sign(
      { 
        userId: (user._id as Types.ObjectId).toString(), 
        role: user.role 
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // 4. Retornar respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        token,
        user: {
          id: (user._id as Types.ObjectId).toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
    });
  }
};

// OBTENER USUARIO ACTUAL
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: (user._id as Types.ObjectId).toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
    });
  }
};