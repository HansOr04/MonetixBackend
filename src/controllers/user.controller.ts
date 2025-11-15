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

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validar que sea un ObjectId válido
    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'ID de usuario inválido',
      });
      return;
    }

    // Buscar usuario
    const user = await User.findById(id).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
    });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
      return;
    }

    // Crear nuevo usuario
    const user = new User({
      email,
      password,
      name,
      role: role || 'user',
    });

    await user.save();

    // Obtener usuario sin password
    const userWithoutPassword = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
    });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, name, role } = req.body;

    // Validar que sea un ObjectId válido
    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'ID de usuario inválido',
      });
      return;
    }

    // Si se actualiza el email, verificar que no exista en otro usuario
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: id },
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'El email ya está en uso por otro usuario',
        });
        return;
      }
    }

    // Construir objeto de actualización solo con campos presentes
    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
    });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validar que sea un ObjectId válido
    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'ID de usuario inválido',
      });
      return;
    }

    // Buscar usuario a eliminar
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    // Si es admin, verificar que no sea el último
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });

      if (adminCount === 1) {
        res.status(400).json({
          success: false,
          message: 'No se puede eliminar el último administrador del sistema',
        });
        return;
      }
    }

    // Eliminar usuario
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
    });
  }
};
