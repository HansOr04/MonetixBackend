# Documentación ULTRA Didáctica: category.routes.ts

**Ubicación:** `src/routes/category.routes.ts`

**Propósito:** Este archivo define las **rutas HTTP** para el módulo de categorías. Las categorías organizan las transacciones en grupos lógicos (Comida, Transporte, Salario, etc.). El sistema soporta **categorías del sistema** (predefinidas) y **categorías personalizadas** (creadas por el usuario).

---

## 🎯 ¿Para qué sirve este archivo?

Imagina un sistema de organización:

```
Sin categorías:
- Transacciones sin clasificar
- Difícil analizar gastos
- No hay agrupación lógica

Con categorías:
GET /api/categories → Ver todas (sistema + personalizadas)
POST /api/categories → Crear categoría personalizada
GET /api/categories/stats → Estadísticas por categoría
→ Transacciones organizadas y analizables
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (líneas 1-9)             │
│  ├─ Router de Express                   │
│  ├─ Controlador de categorías           │
│  ├─ Middleware de autenticación         │
│  ├─ Middleware de validación            │
│  └─ Schemas de validación               │
├──────────────────────────────────────────┤
│  INICIALIZACIÓN (línea 11)              │
│  └─ Crear instancia de Router           │
├──────────────────────────────────────────┤
│  RUTAS (líneas 22-87)                   │
│  ├─ GET /stats (estadísticas)           │
│  ├─ GET / (listar categorías)           │
│  ├─ GET /:id (categoría específica)     │
│  ├─ POST / (crear categoría)            │
│  ├─ PUT /:id (actualizar categoría)     │
│  └─ DELETE /:id (eliminar categoría)    │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (línea 89)                 │
│  └─ Exportar router                     │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

### Líneas 1-9: Importaciones

```typescript
import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  filterCategoriesSchema,
} from '../validators/category.validator';
```

**Línea 1: Router**
- Constructor para crear rutas

**Línea 2: categoryController**
- Controlador con la lógica de negocio

**Línea 3: authenticate**
- Middleware de autenticación JWT

**Línea 4: validate**
- Middleware de validación con Joi

**Líneas 5-9: Schemas de validación**
- `createCategorySchema`: Reglas para crear categoría
- `updateCategorySchema`: Reglas para actualizar categoría
- `filterCategoriesSchema`: Reglas para filtrar categorías

---

## 🔷 RUTAS DEFINIDAS

### Ruta 1: GET /stats (Líneas 22-26)

```typescript
/**
 * @route   GET /api/v1/categories/stats
 * @desc    Obtener estadísticas de categorías
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  categoryController.getCategoryStats.bind(categoryController)
);
```

**Endpoint completo:**
```
GET /api/categories/stats
```

**¿Qué hace?**
- Obtiene **estadísticas de gastos por categoría**
- Calcula totales, promedios y porcentajes
- Útil para gráficos y análisis

**Middlewares:**
1. `authenticate`: Verifica JWT

**Ejemplo de request:**
```http
GET /api/categories/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": [
    {
      "category": {
        "id": "507f...",
        "name": "Comida",
        "icon": "🍔",
        "color": "#FF6B6B"
      },
      "total": 1500.00,
      "count": 45,
      "percentage": 35.5,
      "average": 33.33
    },
    {
      "category": {
        "id": "507f...",
        "name": "Transporte",
        "icon": "🚗",
        "color": "#4ECDC4"
      },
      "total": 800.00,
      "count": 20,
      "percentage": 18.9,
      "average": 40.00
    }
  ],
  "totalExpenses": 4230.00
}
```

**Caso de uso:**
```javascript
// Gráfico de pastel de gastos
const { data } = await fetch('/api/categories/stats');
const chartData = data.map(item => ({
  label: item.category.name,
  value: item.total,
  percentage: item.percentage
}));
```

---

### Ruta 2: GET / (Líneas 36-41)

```typescript
/**
 * @route   GET /api/v1/categories
 * @desc    Obtener todas las categorías (del sistema + personalizadas del usuario)
 * @query   type=income|expense - Filtrar por tipo
 * @query   isDefault=true|false - Filtrar por categorías del sistema o personalizadas
 * @query   search=texto - Buscar por nombre
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validate(filterCategoriesSchema),
  categoryController.getAllCategories.bind(categoryController)
);
```

**Endpoint completo:**
```
GET /api/categories
```

**¿Qué hace?**
- Obtiene **todas las categorías** disponibles para el usuario
- Incluye categorías del sistema (isDefault: true)
- Incluye categorías personalizadas del usuario (isDefault: false)
- Soporta filtros

**Query parameters:**
```
?type=expense              // Solo categorías de gastos
?type=income               // Solo categorías de ingresos
?isDefault=true            // Solo categorías del sistema
?isDefault=false           // Solo categorías personalizadas
?search=comida             // Buscar por nombre
```

**Middlewares:**
1. `authenticate`: Verifica JWT
2. `validate(filterCategoriesSchema)`: Valida query params

**Ejemplo de request:**
```http
GET /api/categories?type=expense
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f...",
      "name": "Comida",
      "type": "expense",
      "icon": "🍔",
      "color": "#FF6B6B",
      "description": "Gastos en alimentos y bebidas",
      "isDefault": true
    },
    {
      "id": "507f...",
      "name": "Transporte",
      "type": "expense",
      "icon": "🚗",
      "color": "#4ECDC4",
      "isDefault": true
    },
    {
      "id": "507f...",
      "name": "Gym",
      "type": "expense",
      "icon": "💪",
      "color": "#AA96DA",
      "description": "Membresía y clases",
      "isDefault": false
    }
  ]
}
```

**Categorías del sistema vs personalizadas:**
```javascript
// Categorías del sistema (isDefault: true)
// - Disponibles para TODOS los usuarios
// - No se pueden eliminar
// - Ejemplos: Comida, Transporte, Salario

// Categorías personalizadas (isDefault: false)
// - Creadas por el usuario
// - Solo visibles para ese usuario
// - Se pueden eliminar
// - Ejemplos: Gym, Clases de inglés, Freelance
```

---

### Ruta 3: GET /:id (Líneas 48-52)

```typescript
/**
 * @route   GET /api/v1/categories/:id
 * @desc    Obtener una categoría por ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  categoryController.getCategoryById.bind(categoryController)
);
```

**Endpoint completo:**
```
GET /api/categories/:id
```

**¿Qué hace?**
- Obtiene una **categoría específica** por ID

**Parámetros de ruta:**
- `:id`: ID de la categoría

**Ejemplo de request:**
```http
GET /api/categories/507f191e810c19729de860ea
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "id": "507f191e810c19729de860ea",
    "name": "Comida",
    "type": "expense",
    "icon": "🍔",
    "color": "#FF6B6B",
    "description": "Gastos en alimentos y bebidas",
    "isDefault": true,
    "createdAt": "2025-11-27T...",
    "updatedAt": "2025-11-27T..."
  }
}
```

---

### Ruta 4: POST / (Líneas 59-64)

```typescript
/**
 * @route   POST /api/v1/categories
 * @desc    Crear una nueva categoría personalizada
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(createCategorySchema),
  categoryController.createCategory.bind(categoryController)
);
```

**Endpoint completo:**
```
POST /api/categories
```

**¿Qué hace?**
- Crea una **categoría personalizada** para el usuario

**Middlewares:**
1. `authenticate`: Verifica JWT
2. `validate(createCategorySchema)`: Valida datos

**Schema de validación:**
```typescript
// createCategorySchema
{
  name: Joi.string().min(2).max(50).required(),
  type: Joi.string().valid('income', 'expense').required(),
  icon: Joi.string().optional(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: Joi.string().max(200).optional()
}
```

**Ejemplo de request:**
```http
POST /api/categories
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Gym",
  "type": "expense",
  "icon": "💪",
  "color": "#AA96DA",
  "description": "Membresía y clases de gimnasio"
}
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "id": "507f191e810c19729de860ea",
    "name": "Gym",
    "type": "expense",
    "icon": "💪",
    "color": "#AA96DA",
    "description": "Membresía y clases de gimnasio",
    "isDefault": false,
    "createdAt": "2025-11-27T...",
    "updatedAt": "2025-11-27T..."
  }
}
```

**Validaciones:**
```javascript
// ❌ Nombre muy corto
{ name: 'G', type: 'expense' }
// Error: "name" length must be at least 2 characters

// ❌ Tipo inválido
{ name: 'Gym', type: 'transfer' }
// Error: "type" must be one of [income, expense]

// ❌ Color inválido
{ name: 'Gym', type: 'expense', color: 'red' }
// Error: "color" must match pattern /^#[0-9A-Fa-f]{6}$/
```

---

### Ruta 5: PUT /:id (Líneas 71-76)

```typescript
/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Actualizar una categoría personalizada
 * @access  Private (solo categorías propias)
 */
router.put(
  '/:id',
  authenticate,
  validate(updateCategorySchema),
  categoryController.updateCategory.bind(categoryController)
);
```

**Endpoint completo:**
```
PUT /api/categories/:id
```

**¿Qué hace?**
- Actualiza una **categoría personalizada**
- Solo puede actualizar categorías propias (isDefault: false)
- No puede actualizar categorías del sistema

**Parámetros de ruta:**
- `:id`: ID de la categoría

**Middlewares:**
1. `authenticate`: Verifica JWT
2. `validate(updateCategorySchema)`: Valida datos

**Ejemplo de request:**
```http
PUT /api/categories/507f191e810c19729de860ea
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Gimnasio",
  "icon": "🏋️",
  "description": "Membresía mensual y clases"
}
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "id": "507f191e810c19729de860ea",
    "name": "Gimnasio",
    "type": "expense",
    "icon": "🏋️",
    "color": "#AA96DA",
    "description": "Membresía mensual y clases",
    "isDefault": false,
    "updatedAt": "2025-11-27T..."
  }
}
```

**Restricciones:**
```javascript
// ❌ Intentar actualizar categoría del sistema
PUT /api/categories/comida_id
// Error: "No se pueden modificar categorías del sistema"

// ❌ Intentar actualizar categoría de otro usuario
PUT /api/categories/otra_categoria_id
// Error: "Categoría no encontrada"
```

---

### Ruta 6: DELETE /:id (Líneas 83-87)

```typescript
/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Eliminar una categoría personalizada
 * @access  Private (solo categorías propias)
 */
router.delete(
  '/:id',
  authenticate,
  categoryController.deleteCategory.bind(categoryController)
);
```

**Endpoint completo:**
```
DELETE /api/categories/:id
```

**¿Qué hace?**
- Elimina una **categoría personalizada**
- Solo puede eliminar categorías propias (isDefault: false)
- No puede eliminar categorías del sistema

**Parámetros de ruta:**
- `:id`: ID de la categoría

**Ejemplo de request:**
```http
DELETE /api/categories/507f191e810c19729de860ea
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "message": "Categoría eliminada correctamente"
}
```

**Restricciones:**
```javascript
// ❌ Intentar eliminar categoría del sistema
DELETE /api/categories/comida_id
// Error: "No se pueden eliminar categorías del sistema"

// ❌ Intentar eliminar categoría de otro usuario
DELETE /api/categories/otra_categoria_id
// Error: "Categoría no encontrada"

// ❌ Intentar eliminar categoría con transacciones
DELETE /api/categories/gym_id
// Error: "No se puede eliminar una categoría con transacciones asociadas"
```

---

## 📊 Resumen de Rutas

| Método | Ruta | Descripción | Auth | Validación |
|--------|------|-------------|------|------------|
| GET | `/stats` | Estadísticas por categoría | ✅ | - |
| GET | `/` | Listar categorías | ✅ | filterCategoriesSchema |
| GET | `/:id` | Categoría específica | ✅ | - |
| POST | `/` | Crear categoría | ✅ | createCategorySchema |
| PUT | `/:id` | Actualizar categoría | ✅ | updateCategorySchema |
| DELETE | `/:id` | Eliminar categoría | ✅ | - |

**Todas las rutas requieren autenticación** ✅

---

## 🎯 Flujo de Uso

### 1. Obtener Categorías Disponibles

```javascript
// Al cargar formulario de transacción
const fetchCategories = async (type) => {
  const response = await fetch(`/api/categories?type=${type}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { data } = await response.json();
  setCategoryOptions(data);
};

// Uso
fetchCategories('expense');  // Para gastos
fetchCategories('income');   // Para ingresos
```

---

### 2. Crear Categoría Personalizada

```javascript
const createCategory = async (categoryData) => {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });
  
  const { data } = await response.json();
  return data;
};

// Uso
const newCategory = await createCategory({
  name: 'Gym',
  type: 'expense',
  icon: '💪',
  color: '#AA96DA'
});
```

---

### 3. Obtener Estadísticas

```javascript
const fetchStats = async () => {
  const response = await fetch('/api/categories/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { data } = await response.json();
  
  // Crear gráfico
  const chartData = data.map(item => ({
    name: item.category.name,
    value: item.total,
    percentage: item.percentage,
    color: item.category.color
  }));
  
  renderPieChart(chartData);
};
```

---

## 🔐 Seguridad

### 1. Validación de Pertenencia

```javascript
// En el controlador
const category = await Category.findOne({
  _id: categoryId,
  $or: [
    { isDefault: true },        // Categoría del sistema
    { userId: req.user.id }     // Categoría del usuario
  ]
});

if (!category) {
  return res.status(404).json({
    message: 'Categoría no encontrada'
  });
}
```

### 2. Protección de Categorías del Sistema

```javascript
// No permitir modificar/eliminar categorías del sistema
if (category.isDefault) {
  return res.status(400).json({
    message: 'No se pueden modificar categorías del sistema'
  });
}
```

### 3. Validación de Duplicados

```javascript
// No permitir categorías duplicadas por usuario
const existing = await Category.findOne({
  name: categoryData.name,
  userId: req.user.id,
  type: categoryData.type
});

if (existing) {
  return res.status(400).json({
    message: 'Ya tienes una categoría con ese nombre'
  });
}
```

---

## ✅ Mejores Prácticas

### 1. Filtrar por Tipo

```javascript
// Obtener solo categorías de gastos
const expenseCategories = await fetch('/api/categories?type=expense');

// Obtener solo categorías de ingresos
const incomeCategories = await fetch('/api/categories?type=income');
```

### 2. Mostrar Categorías del Sistema Primero

```javascript
const { data } = await fetch('/api/categories');

// Ordenar: sistema primero, luego personalizadas
const sorted = data.sort((a, b) => {
  if (a.isDefault && !b.isDefault) return -1;
  if (!a.isDefault && b.isDefault) return 1;
  return a.name.localeCompare(b.name);
});
```

### 3. Validar Antes de Eliminar

```javascript
const deleteCategory = async (categoryId) => {
  // Verificar si tiene transacciones
  const hasTransactions = await checkTransactions(categoryId);
  
  if (hasTransactions) {
    showWarning('Esta categoría tiene transacciones asociadas');
    const confirmed = await confirmDialog('¿Deseas continuar?');
    if (!confirmed) return;
  }
  
  await fetch(`/api/categories/${categoryId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

---

## 📝 Resumen

**Propósito:**
- Definir rutas para gestión de categorías
- Soportar categorías del sistema y personalizadas

**Rutas principales:**
- `GET /stats`: Estadísticas por categoría
- `GET /`: Listar categorías (sistema + personalizadas)
- `POST /`: Crear categoría personalizada
- `PUT /:id`: Actualizar categoría personalizada
- `DELETE /:id`: Eliminar categoría personalizada

**Tipos de categorías:**
- **Sistema** (isDefault: true): Predefinidas, no se pueden eliminar
- **Personalizadas** (isDefault: false): Creadas por usuario, se pueden eliminar

**Seguridad:**
- Todas las rutas requieren autenticación
- Solo acceso a categorías propias o del sistema
- No se pueden modificar/eliminar categorías del sistema

**Validación:**
- createCategorySchema: name, type, icon, color
- updateCategorySchema: campos opcionales
- filterCategoriesSchema: query params

---

¡Documentación completa de las rutas de categorías! Este es el sistema de organización de transacciones. 📁🎨

