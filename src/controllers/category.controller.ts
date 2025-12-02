import { Request, Response } from 'express';
import { Category, ICategory } from '../models/Category.model';
import mongoose from 'mongoose';

/**
 * Controlador para gestión de categorías
 */
export class CategoryController {
  /**
   * Obtener todas las categorías
   * GET /api/v1/categories
   */
  async getAllCategories(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { type, isDefault, search } = req.query;

      // Construir filtro dinámico
      const filter: any = {
        $or: [
          { isDefault: true }, // Categorías del sistema
          { userId: userId }, // Categorías personalizadas del usuario
        ],
      };

      // Filtrar por tipo si se especifica
      if (type && (type === 'income' || type === 'expense')) {
        filter.type = type;
      }

      // Filtrar por isDefault si se especifica
      if (isDefault !== undefined) {
        filter.isDefault = isDefault === 'true';
        delete filter.$or; // Si filtramos por isDefault, removemos el $or
      }

      // Búsqueda por nombre si se especifica
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

  /**
   * Obtener una categoría por ID
   * GET /api/v1/categories/:id
   */
  async getCategoryById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Validar ObjectId
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

  /**
   * Crear una nueva categoría
   * POST /api/v1/categories
   */
  async createCategory(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { name, type, icon, color, description } = req.body;

      // Verificar si ya existe una categoría con el mismo nombre y tipo para este usuario
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

      // Crear nueva categoría
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

      // Error de duplicado (aunque ya lo manejamos arriba)
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

  /**
   * Actualizar una categoría
   * PUT /api/v1/categories/:id
   */
  async updateCategory(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      // Validar ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido',
        });
      }

      // Buscar la categoría
      const category = await Category.findOne({
        _id: id,
        userId: userId, // Solo puede actualizar categorías propias
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada o no tienes permiso para modificarla',
        });
      }

      // No permitir actualizar categorías del sistema
      if (category.isDefault) {
        return res.status(403).json({
          success: false,
          message: 'No puedes modificar categorías predeterminadas del sistema',
        });
      }

      // Si se está cambiando el nombre o tipo, verificar que no exista otra categoría con esos valores
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

      // Actualizar la categoría
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

  /**
   * Eliminar una categoría (soft delete)
   * DELETE /api/v1/categories/:id
   */
  async deleteCategory(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Validar ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de categoría inválido',
        });
      }

      // Buscar la categoría
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

      // No permitir eliminar categorías del sistema
      if (category.isDefault) {
        return res.status(403).json({
          success: false,
          message: 'No puedes eliminar categorías predeterminadas del sistema',
        });
      }

      // TODO: En el futuro, verificar si hay transacciones asociadas
      // y manejar la eliminación apropiadamente (soft delete o reasignar)

      // Eliminar la categoría
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

  /**
   * Obtener estadísticas de categorías
   * GET /api/v1/categories/stats
   */
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

// Exportar instancia del controlador
export const categoryController = new CategoryController();
