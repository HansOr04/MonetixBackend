import { Request, Response } from 'express';
import { Category, ICategory } from '../models/Category.model';
import mongoose from 'mongoose';


export class CategoryController {
 
  async getAllCategories(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { type, isDefault, search } = req.query;

      const filter: any = {
        $or: [
          { isDefault: true }, 
          { userId: userId }, 
        ],
      };

      if (type && (type === 'income' || type === 'expense')) {
        filter.type = type;
      }

      if (isDefault !== undefined) {
        filter.isDefault = isDefault === 'true';
        delete filter.$or; 
      }

      if (search && typeof search === 'string') {
        filter.name = { $regex: search, $options: 'i' };
      }

      const categories = await Category.find(filter).sort({ type: 1, name: 1 });

      return res.status(200).json({
        success: true,
        message: 'Categorías obtenidas exitosamente',
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener categorías',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getCategoryById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido',
        });
      }

      const category = await Category.findOne({
        _id: id,
        $or: [{ isDefault: true }, { userId: userId }],
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Categoría obtenida exitosamente',
        data: category,
      });
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener categoría',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async createCategory(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { name, type, icon, color, description } = req.body;

      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        type,
        $or: [{ isDefault: true }, { userId: userId }],
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: `Ya existe una categoría "${name}" de tipo "${type}"`,
        });
      }

      const category = new Category({
        name,
        type,
        icon: icon || '💰',
        color: color || '#6D9C71',
        description,
        userId: userId,
        isDefault: false,
      });

      await category.save();

      return res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: category,
      });
    } catch (error) {
      console.error('Error al crear categoría:', error);

      if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre y tipo',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error al crear categoría',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

 
  async updateCategory(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido',
        });
      }

      const category = await Category.findOne({
        _id: id,
        userId: userId, 
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada o no tienes permiso para modificarla',
        });
      }

      if (category.isDefault) {
        return res.status(403).json({
          success: false,
          message: 'No puedes modificar categorías predeterminadas del sistema',
        });
      }

      if (updateData.name || updateData.type) {
        const checkName = updateData.name || category.name;
        const checkType = updateData.type || category.type;

        const existingCategory = await Category.findOne({
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${checkName}$`, 'i') },
          type: checkType,
          userId: userId,
        });

        if (existingCategory) {
          return res.status(409).json({
            success: false,
            message: `Ya existe otra categoría "${checkName}" de tipo "${checkType}"`,
          });
        }
      }

      Object.assign(category, updateData);
      await category.save();

      return res.status(200).json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: category,
      });
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar categoría',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async deleteCategory(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido',
        });
      }

      const category = await Category.findOne({
        _id: id,
        userId: userId,
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada o no tienes permiso para eliminarla',
        });
      }

      if (category.isDefault) {
        return res.status(403).json({
          success: false,
          message: 'No puedes eliminar categorías predeterminadas del sistema',
        });
      }

      await Category.deleteOne({ _id: id });

      return res.status(200).json({
        success: true,
        message: 'Categoría eliminada exitosamente',
        data: {
          id: category._id,
          name: category.name,
        },
      });
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar categoría',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }


  async getCategoryStats(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      const totalCategories = await Category.countDocuments({
        $or: [{ isDefault: true }, { userId: userId }],
      });

      const incomeCategories = await Category.countDocuments({
        type: 'income',
        $or: [{ isDefault: true }, { userId: userId }],
      });

      const expenseCategories = await Category.countDocuments({
        type: 'expense',
        $or: [{ isDefault: true }, { userId: userId }],
      });

      const customCategories = await Category.countDocuments({
        userId: userId,
        isDefault: false,
      });

      return res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: {
          total: totalCategories,
          income: incomeCategories,
          expense: expenseCategories,
          custom: customCategories,
          default: totalCategories - customCategories,
        },
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}

export const categoryController = new CategoryController();