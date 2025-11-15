import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { Types, isValidObjectId } from 'mongoose';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extraer parámetros de query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;

    // Construir filtro
    const filter: any = {};
    if (role && (role === 'user' || role === 'admin')) {
      filter.role = role;
    }

    // Calcular offset
    const skip = (page - 1) * limit;

    // Ejecutar query
    const users = await User.find(filter)
      .select('-password')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    // Contar total de documentos
    const total = await User.countDocuments(filter);

    // Calcular total de páginas
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
    });
  }
};
