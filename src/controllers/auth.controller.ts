import { Request, Response } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { User } from '../models/User.model';
import { Types } from 'mongoose';

const getJwtSecret = (): Secret => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  return secret as Secret;
};

export const login = async (request: Request, response: Response): Promise<void> => {
  try {
    const { email, password } = request.body;

    const user = await User.findOne({ email });

    if (!user) {
      response.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      response.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: (user._id as Types.ObjectId).toString(),
        role: user.role
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    response.status(200).json({
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
    response.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
    });
  }
};

export const register = async (request: Request, response: Response): Promise<void> => {
  try {
    const { email, password, name, role } = request.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      response.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
      return;
    }

    const user = new User({
      email,
      password,
      name,
      role: role || 'user',
    });

    await user.save();

    const token = jwt.sign(
      {
        userId: (user._id as Types.ObjectId).toString(),
        role: user.role
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    response.status(201).json({
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
    response.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
    });
  }
};

export const getCurrentUser = async (request: Request, response: Response): Promise<void> => {
  try {
    const user = request.user;

    if (!user) {
      response.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }

    response.status(200).json({
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
    response.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
    });
  }
};