# Documentación: category.controller.ts

**Ubicación:** `src/controllers/category.controller.ts`

**Propósito:** Este archivo define el controlador de categorías que maneja todas las operaciones CRUD (Create, Read, Update, Delete) para categorías de transacciones. Gestiona tanto categorías predeterminadas del sistema como categorías personalizadas creadas por los usuarios.

---

## Análisis Línea por Línea

### Líneas 1-3: Importaciones

```typescript
import { Request, Response } from 'express';
import { Category, ICategory } from '../models/Category.model';
import mongoose from 'mongoose';
```

#### Línea 1: Importación de tipos de Express
```typescript
import { Request, Response } from 'express';
```

**¿Qué hace?**
- Importa los tipos `Request` y `Response` de Express
- Misma función que en controladores anteriores
- Proporciona tipado TypeScript para solicitudes y respuestas HTTP

---

#### Línea 2: Importación del modelo Category
```typescript
import { Category, ICategory } from '../models/Category.model';
```

**¿Qué hace?**
- **`Category`**: Modelo de Mongoose para categorías
- **`ICategory`**: Interface TypeScript que define la estructura de una categoría
- Importación con destructuring de múltiples exports

**¿Qué es una categoría?**
- Clasificación para transacciones (ej: "Comida", "Transporte", "Salario")
- Puede ser de tipo `income` (ingreso) o `expense` (gasto)
- Tiene propiedades como nombre, icono, color, descripción

**Estructura típica de ICategory:**
```typescript
interface ICategory {
  _id: ObjectId;
  name: string;           // Nombre de la categoría
  type: 'income' | 'expense';  // Tipo de transacción
  icon: string;           // Emoji o icono
  color: string;          // Color en formato hex
  description?: string;   // Descripción opcional
  userId?: ObjectId;      // ID del usuario (si es personalizada)
  isDefault: boolean;     // Si es categoría del sistema
  createdAt: Date;
  updatedAt: Date;
}
```

**Diferencia entre categorías del sistema y personalizadas:**
- **Sistema (isDefault: true)**: Categorías predefinidas disponibles para todos los usuarios
  - Ejemplos: "Comida", "Transporte", "Salario", "Entretenimiento"
  - No se pueden modificar ni eliminar
- **Personalizadas (isDefault: false)**: Creadas por usuarios específicos
  - Ejemplos: "Freelance", "Inversiones", "Mascotas"
  - Solo visibles para el usuario que las creó
  - Se pueden modificar y eliminar

---

#### Línea 3: Importación de Mongoose
```typescript
import mongoose from 'mongoose';
```

**¿Qué hace?**
- Importa Mongoose para validación de ObjectIds
- Usado en `mongoose.Types.ObjectId.isValid(id)`

---

### Línea 4: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa las importaciones de la documentación JSDoc

---

### Líneas 5-7: Comentario JSDoc de la clase
```typescript
/**
 * Controlador para gestión de categorías
 */
```

**¿Qué hace?**
- **JSDoc**: Sistema de documentación para JavaScript/TypeScript
- Comentario de documentación que describe la clase
- Aparece en el autocompletado de IDEs

**¿Por qué usar JSDoc?**
- Mejora la experiencia de desarrollo
- Proporciona documentación inline
- Genera documentación automática con herramientas

---

### Línea 8: Declaración de la clase
```typescript
export class CategoryController {
```

**¿Qué hace?**
- **`export class`**: Exporta la clase para uso en otros archivos
- **`CategoryController`**: Nombre de la clase
- Agrupa todos los métodos relacionados con categorías

---

### Líneas 9-58: Método getAllCategories

```typescript
/**
 * Obtener todas las categorías
 * GET /api/v1/categories
 */
async getAllCategories(req: Request, res: Response): Promise<Response> {
```

#### Líneas 9-12: Comentario JSDoc del método
```typescript
/**
 * Obtener todas las categorías
 * GET /api/v1/categories
 */
```

**¿Qué hace?**
- Documenta el propósito del método
- Especifica la ruta HTTP asociada
- Indica el método HTTP (GET)

---

#### Línea 13: Firma del método
```typescript
async getAllCategories(req: Request, res: Response): Promise<Response> {
```

**¿Qué hace?**
- **`async`**: Método asíncrono
- **`getAllCategories`**: Nombre descriptivo del método
- **`Promise<Response>`**: Retorna una promesa que resuelve a Response

---

#### Línea 14: Inicio del bloque try
```typescript
try {
```

**¿Qué hace?**
- Inicia el manejo de errores con try-catch

---

#### Líneas 15-16: Extracción de parámetros
```typescript
const userId = req.user?.id;
const { type, isDefault, search } = req.query;
```

**¿Qué hace?**
- **Línea 15**: Obtiene el ID del usuario autenticado
- **Línea 16**: Extrae parámetros de filtrado de la query string
  - **`type`**: Filtrar por tipo ('income' o 'expense')
  - **`isDefault`**: Filtrar por categorías del sistema o personalizadas
  - **`search`**: Búsqueda por nombre

**Ejemplo de URL:**
```
GET /api/categories?type=expense&search=comida
```

Resulta en:
```javascript
type = 'expense'
isDefault = undefined
search = 'comida'
```

---

#### Línea 17: Línea en blanco
```typescript

```
**¿Qué hace?**
- Mejora la legibilidad separando la extracción de parámetros de la construcción del filtro

---

#### Línea 18: Comentario
```typescript
// Construir filtro dinámico
```

**¿Qué hace?**
- Comentario que explica la siguiente sección de código
- Indica que el filtro se construye dinámicamente según los parámetros

---

#### Líneas 19-24: Construcción del filtro base
```typescript
const filter: any = {
  $or: [
    { isDefault: true }, // Categorías del sistema
    { userId: userId }, // Categorías personalizadas del usuario
  ],
};
```

**¿Qué hace?**
- **`const filter: any`**: Objeto que se pasará a `Category.find()`
- **`$or`**: Operador de MongoDB que funciona como OR lógico
- **Lógica**: Mostrar categorías que sean del sistema O del usuario actual

**¿Qué es $or en MongoDB?**
- Operador que retorna documentos que cumplan AL MENOS UNA de las condiciones
- Similar al operador `||` en JavaScript

**Ejemplo de filtro:**
```javascript
{
  $or: [
    { isDefault: true },      // Todas las categorías del sistema
    { userId: '507f1f77...' } // Categorías del usuario específico
  ]
}
```

**¿Por qué usar $or?**
- Los usuarios deben ver:
  1. Categorías predeterminadas del sistema (disponibles para todos)
  2. Sus propias categorías personalizadas
- No deben ver categorías personalizadas de otros usuarios

**Resultado:**
```javascript
// Usuario ve:
[
  { name: 'Comida', isDefault: true },        // Sistema
  { name: 'Transporte', isDefault: true },    // Sistema
  { name: 'Salario', isDefault: true },       // Sistema
  { name: 'Freelance', userId: '507f...', isDefault: false }  // Personalizada
]
```

---

#### Línea 25: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa el filtro base de los filtros adicionales

---

#### Línea 26: Comentario
```typescript
// Filtrar por tipo si se especifica
```

**¿Qué hace?**
- Explica el siguiente bloque de código

---

#### Líneas 27-29: Filtro por tipo
```typescript
if (type && (type === 'income' || type === 'expense')) {
  filter.type = type;
}
```

**¿Qué hace?**
- **`if (type && ...)`**: Verifica si se proporcionó el parámetro `type`
- **`type === 'income' || type === 'expense'`**: Valida que sea un valor válido
- **`filter.type = type`**: Agrega el filtro de tipo al objeto

**¿Por qué validar los valores?**
- **Seguridad**: Previene inyección de valores inválidos
- **Integridad**: Solo acepta valores que existen en el esquema
- **Prevención de errores**: Evita consultas con valores incorrectos

**Ejemplo:**
```javascript
// URL: ?type=expense
filter = {
  $or: [...],
  type: 'expense'  // Solo categorías de gastos
}

// URL: ?type=invalid
filter = {
  $or: [...]  // No agrega el filtro (valor inválido)
}
```

**Resultado de la consulta:**
```javascript
// Solo categorías de tipo 'expense'
[
  { name: 'Comida', type: 'expense', isDefault: true },
  { name: 'Transporte', type: 'expense', isDefault: true },
  { name: 'Entretenimiento', type: 'expense', isDefault: false, userId: '507f...' }
]
```

---

#### Línea 30: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa los diferentes filtros

---

#### Línea 31: Comentario
```typescript
// Filtrar por isDefault si se especifica
```

**¿Qué hace?**
- Explica el filtro por categorías del sistema vs personalizadas

---

#### Líneas 32-35: Filtro por isDefault
```typescript
if (isDefault !== undefined) {
  filter.isDefault = isDefault === 'true';
  delete filter.$or; // Si filtramos por isDefault, removemos el $or
}
```

**¿Qué hace?**
- **Línea 32**: Verifica si se proporcionó el parámetro `isDefault`
- **Línea 33**: Convierte el string a booleano y agrega al filtro
  - `'true'` → `true`
  - `'false'` → `false`
- **Línea 34**: Elimina el operador `$or` del filtro

**¿Por qué eliminar $or?**
- Si el usuario pide explícitamente categorías del sistema (`isDefault=true`), no necesitamos el `$or`
- El `$or` era para mostrar sistema + personalizadas
- Con `isDefault` explícito, solo queremos un tipo específico

**Ejemplo:**
```javascript
// URL: ?isDefault=true
filter = {
  isDefault: true  // Solo categorías del sistema
  // $or fue eliminado
}

// URL: ?isDefault=false
filter = {
  isDefault: false  // Solo categorías personalizadas
  // $or fue eliminado
}
```

**Nota importante:**
Si `isDefault=false`, el filtro solo mostrará categorías personalizadas, pero sin el filtro de `userId`, mostraría categorías personalizadas de TODOS los usuarios. Esto podría ser un bug de seguridad.

**Mejora sugerida:**
```typescript
if (isDefault !== undefined) {
  filter.isDefault = isDefault === 'true';
  delete filter.$or;
  
  // Si busca categorías personalizadas, agregar filtro de userId
  if (filter.isDefault === false) {
    filter.userId = userId;
  }
}
```

---

#### Línea 36: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa los filtros

---

#### Línea 37: Comentario
```typescript
// Búsqueda por nombre si se especifica
```

**¿Qué hace?**
- Explica el filtro de búsqueda por nombre

---

#### Líneas 38-40: Filtro de búsqueda
```typescript
if (search && typeof search === 'string') {
  filter.name = { $regex: search, $options: 'i' };
}
```

**¿Qué hace?**
- **Línea 38**: Verifica que `search` exista y sea un string
- **Línea 39**: Agrega un filtro de expresión regular al nombre
  - **`$regex`**: Operador de MongoDB para búsqueda con expresiones regulares
  - **`search`**: Patrón a buscar
  - **`$options: 'i'`**: Case-insensitive (ignora mayúsculas/minúsculas)

**¿Qué es $regex?**
- Operador de MongoDB para búsqueda de patrones
- Similar a `String.prototype.match()` en JavaScript
- Permite búsquedas parciales y con patrones

**Ejemplo:**
```javascript
// URL: ?search=com
filter.name = { $regex: 'com', $options: 'i' }

// Encuentra:
'Comida'      ✓ (contiene 'com')
'Comercio'    ✓ (contiene 'com')
'Transporte'  ✗ (no contiene 'com')
```

**¿Por qué `$options: 'i'`?**
- **Case-insensitive**: No distingue entre mayúsculas y minúsculas
- Mejora la experiencia de usuario
- `'COM'`, `'com'`, `'Com'` encuentran lo mismo

**Ejemplo completo:**
```javascript
// URL: ?search=COMI
filter.name = { $regex: 'COMI', $options: 'i' }

// Encuentra:
'Comida'   ✓
'comida'   ✓
'COMIDA'   ✓
```

**Nota de seguridad:**
Las expresiones regulares pueden ser vulnerables a ataques de denegación de servicio (ReDoS). En producción, se debería sanitizar el input:
```typescript
// Escapar caracteres especiales de regex
const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
filter.name = { $regex: escapedSearch, $options: 'i' };
```

---

#### Línea 41: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la construcción del filtro de la consulta

---

#### Línea 42: Consulta a la base de datos
```typescript
const categories = await Category.find(filter).sort({ type: 1, name: 1 });
```

**¿Qué hace?**
- **`Category.find(filter)`**: Busca todas las categorías que coincidan con el filtro
- **`.sort({ type: 1, name: 1 })`**: Ordena los resultados
  - **`type: 1`**: Ordena por tipo ascendente (expense antes que income alfabéticamente)
  - **`name: 1`**: Luego ordena por nombre ascendente (A-Z)
  - **`1`**: Orden ascendente
  - **`-1`**: Sería orden descendente

**¿Por qué ordenar?**
- **UX mejorada**: Resultados consistentes y predecibles
- **Agrupación**: Categorías del mismo tipo aparecen juntas
- **Alfabético**: Fácil de encontrar categorías por nombre

**Ejemplo de orden:**
```javascript
// Sin sort
[
  { name: 'Salario', type: 'income' },
  { name: 'Comida', type: 'expense' },
  { name: 'Freelance', type: 'income' },
  { name: 'Transporte', type: 'expense' }
]

// Con sort({ type: 1, name: 1 })
[
  { name: 'Comida', type: 'expense' },      // expense, alfabético
  { name: 'Transporte', type: 'expense' },  // expense, alfabético
  { name: 'Freelance', type: 'income' },    // income, alfabético
  { name: 'Salario', type: 'income' }       // income, alfabético
]
```

**Orden de clasificación:**
1. Primero por `type` (expense < income alfabéticamente)
2. Luego por `name` dentro de cada tipo

---

#### Línea 43: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la consulta de la respuesta

---

#### Líneas 44-49: Respuesta exitosa
```typescript
return res.status(200).json({
  success: true,
  message: 'Categorías obtenidas exitosamente',
  data: categories,
  total: categories.length,
});
```

**¿Qué hace?**
- **`res.status(200)`**: Código 200 (OK)
- **`success: true`**: Indica éxito
- **`message`**: Mensaje descriptivo
- **`data: categories`**: Array de categorías encontradas
- **`total: categories.length`**: Número total de categorías

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Categorías obtenidas exitosamente",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Comida",
      "type": "expense",
      "icon": "🍔",
      "color": "#FF6B6B",
      "isDefault": true
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Salario",
      "type": "income",
      "icon": "💰",
      "color": "#51CF66",
      "isDefault": true
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Freelance",
      "type": "income",
      "icon": "💻",
      "color": "#4DABF7",
      "isDefault": false,
      "userId": "507f191e810c19729de860ea"
    }
  ],
  "total": 3
}
```

---

#### Líneas 50-57: Manejo de errores
```typescript
} catch (error) {
  console.error('Error al obtener categorías:', error);
  return res.status(500).json({
    success: false,
    message: 'Error al obtener categorías',
    error: error instanceof Error ? error.message : 'Error desconocido',
  });
}
```

**¿Qué hace?**
- Captura errores de la consulta
- Log del error
- Respuesta 500 (Internal Server Error)

---

#### Línea 58: Cierre del método
```typescript
}
```

**¿Qué hace?**
- Cierra el método `getAllCategories`

---

### Líneas 60-102: Método getCategoryById

```typescript
/**
 * Obtener una categoría por ID
 * GET /api/v1/categories/:id
 */
async getCategoryById(req: Request, res: Response): Promise<Response> {
```

#### Líneas 60-63: Comentario JSDoc
**¿Qué hace?**
- Documenta el método
- Especifica la ruta con parámetro `:id`

---

#### Líneas 66-67: Extracción de parámetros
```typescript
const { id } = req.params;
const userId = req.user?.id;
```

**¿Qué hace?**
- **`req.params.id`**: ID de la categoría desde la URL
- **`req.user?.id`**: ID del usuario autenticado

**Ejemplo:**
```
GET /api/categories/507f1f77bcf86cd799439011
req.params.id = '507f1f77bcf86cd799439011'
```

---

#### Líneas 69-75: Validación del ID
```typescript
// Validar ObjectId
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: 'ID de categoría inválido',
  });
}
```

**¿Qué hace?**
- Valida que el ID tenga formato de ObjectId de MongoDB
- Retorna error 400 si es inválido

**¿Por qué validar?**
- Previene errores al consultar con IDs inválidos
- Proporciona feedback claro al cliente

---

#### Líneas 77-80: Búsqueda de la categoría
```typescript
const category = await Category.findOne({
  _id: id,
  $or: [{ isDefault: true }, { userId: userId }],
});
```

**¿Qué hace?**
- **`_id: id`**: Busca por el ID específico
- **`$or`**: La categoría debe ser del sistema O del usuario actual

**¿Por qué usar $or aquí?**
- **Seguridad**: El usuario solo puede ver:
  1. Categorías del sistema (disponibles para todos)
  2. Sus propias categorías personalizadas
- No puede ver categorías personalizadas de otros usuarios

**Ejemplo:**
```javascript
// Usuario A intenta ver categoría personalizada de Usuario B
const category = await Category.findOne({
  _id: '507f1f77bcf86cd799439011',
  $or: [
    { isDefault: true },
    { userId: 'userA_id' }
  ]
});

// Si la categoría pertenece a userB y no es del sistema
// category = null (no encontrada)
```

---

#### Líneas 82-87: Manejo de categoría no encontrada
```typescript
if (!category) {
  return res.status(404).json({
    success: false,
    message: 'Categoría no encontrada',
  });
}
```

**¿Qué hace?**
- Verifica si la categoría existe
- Retorna 404 (Not Found) si no existe

**¿Cuándo ocurre?**
- El ID no existe en la base de datos
- La categoría pertenece a otro usuario (y no es del sistema)

---

#### Líneas 89-93: Respuesta exitosa
```typescript
return res.status(200).json({
  success: true,
  message: 'Categoría obtenida exitosamente',
  data: category,
});
```

**¿Qué hace?**
- Retorna la categoría encontrada

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Categoría obtenida exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Comida",
    "type": "expense",
    "icon": "🍔",
    "color": "#FF6B6B",
    "description": "Gastos en alimentos y bebidas",
    "isDefault": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Líneas 104-162: Método createCategory

```typescript
/**
 * Crear una nueva categoría
 * POST /api/v1/categories
 */
async createCategory(req: Request, res: Response): Promise<Response> {
```

#### Líneas 110-111: Extracción de datos
```typescript
const userId = req.user?.id;
const { name, type, icon, color, description } = req.body;
```

**¿Qué hace?**
- Extrae el ID del usuario autenticado
- Extrae los datos de la nueva categoría del body

**Ejemplo de request:**
```json
POST /api/categories
Content-Type: application/json

{
  "name": "Mascotas",
  "type": "expense",
  "icon": "🐶",
  "color": "#FFA94D",
  "description": "Gastos relacionados con mascotas"
}
```

---

#### Línea 113: Comentario
```typescript
// Verificar si ya existe una categoría con el mismo nombre y tipo para este usuario
```

**¿Qué hace?**
- Explica la validación de duplicados

---

#### Líneas 114-118: Verificación de duplicados
```typescript
const existingCategory = await Category.findOne({
  name: { $regex: new RegExp(`^${name}$`, 'i') },
  type,
  $or: [{ isDefault: true }, { userId: userId }],
});
```

**¿Qué hace?**
- Busca si ya existe una categoría con el mismo nombre y tipo
- **`$regex: new RegExp(`^${name}$`, 'i')`**: Búsqueda exacta case-insensitive
  - **`^`**: Inicio del string
  - **`$`**: Fin del string
  - **`i`**: Case-insensitive
- **`type`**: Mismo tipo (income o expense)
- **`$or`**: En categorías del sistema o del usuario

**¿Por qué búsqueda exacta?**
- `^${name}$` asegura que sea exactamente ese nombre
- Sin `^` y `$`, "Comida" coincidiría con "Comida Rápida"

**Ejemplo:**
```javascript
// Usuario intenta crear "Comida"
name = "Comida"

// Regex: /^Comida$/i
// Coincide con:
'Comida'   ✓
'comida'   ✓
'COMIDA'   ✓

// NO coincide con:
'Comida Rápida'  ✗
'Mi Comida'      ✗
```

**¿Por qué verificar duplicados?**
- **UX**: Evita confusión con categorías duplicadas
- **Integridad**: Mantiene datos limpios
- **Prevención**: No tiene sentido tener dos categorías "Comida" de tipo "expense"

---

#### Líneas 120-125: Manejo de duplicado
```typescript
if (existingCategory) {
  return res.status(409).json({
    success: false,
    message: `Ya existe una categoría "${name}" de tipo "${type}"`,
  });
}
```

**¿Qué hace?**
- **`res.status(409)`**: Código 409 (Conflict - conflicto)
- Mensaje descriptivo indicando el problema

**¿Por qué 409?**
- **409 (Conflict)**: El recurso ya existe
- Más específico que 400 (Bad Request)
- Indica claramente que es un problema de duplicado

---

#### Línea 127: Comentario
```typescript
// Crear nueva categoría
```

**¿Qué hace?**
- Indica el inicio de la creación

---

#### Líneas 128-136: Creación de la categoría
```typescript
const category = new Category({
  name,
  type,
  icon: icon || '💰',
  color: color || '#6D9C71',
  description,
  userId: userId,
  isDefault: false,
});
```

**¿Qué hace?**
- **`new Category()`**: Crea una nueva instancia del modelo
- **`name`**: Nombre proporcionado por el usuario
- **`type`**: Tipo (income o expense)
- **`icon: icon || '💰'`**: Icono proporcionado o emoji por defecto
- **`color: color || '#6D9C71'`**: Color proporcionado o verde por defecto
- **`description`**: Descripción opcional
- **`userId: userId`**: ID del usuario que la creó
- **`isDefault: false`**: Siempre false (categorías personalizadas)

**¿Por qué valores por defecto?**
- **UX mejorada**: El usuario no está obligado a proporcionar icono y color
- **Consistencia**: Todas las categorías tienen icono y color
- **Flexibilidad**: El usuario puede personalizarlos si quiere

**Valores por defecto:**
- **Icono**: 💰 (emoji de dinero)
- **Color**: #6D9C71 (verde)

**Ejemplo de categoría creada:**
```javascript
{
  name: 'Mascotas',
  type: 'expense',
  icon: '🐶',
  color: '#FFA94D',
  description: 'Gastos relacionados con mascotas',
  userId: '507f191e810c19729de860ea',
  isDefault: false
}
```

---

#### Línea 138: Guardado en la base de datos
```typescript
await category.save();
```

**¿Qué hace?**
- **`category.save()`**: Guarda la categoría en MongoDB
- Ejecuta validaciones del esquema
- Genera `_id`, `createdAt`, `updatedAt` automáticamente

---

#### Líneas 140-144: Respuesta exitosa
```typescript
return res.status(201).json({
  success: true,
  message: 'Categoría creada exitosamente',
  data: category,
});
```

**¿Qué hace?**
- **`res.status(201)`**: Código 201 (Created)
- Retorna la categoría creada con todos sus campos

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Categoría creada exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Mascotas",
    "type": "expense",
    "icon": "🐶",
    "color": "#FFA94D",
    "description": "Gastos relacionados con mascotas",
    "userId": "507f191e810c19729de860ea",
    "isDefault": false,
    "createdAt": "2025-11-27T16:00:00.000Z",
    "updatedAt": "2025-11-27T16:00:00.000Z"
  }
}
```

---

#### Líneas 145-161: Manejo de errores
```typescript
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
```

**¿Qué hace?**
- **Líneas 149-154**: Manejo específico de error de duplicado
  - **`code === 11000`**: Código de error de MongoDB para índice único duplicado
  - Aunque ya validamos arriba, MongoDB también tiene índices únicos
- **Líneas 156-160**: Manejo genérico de errores

**¿Qué es el código 11000?**
- Error de MongoDB cuando se viola un índice único
- Ocurre si el modelo tiene un índice único en `name + type + userId`

**Ejemplo de índice único en el modelo:**
```typescript
// En Category.model.ts
categorySchema.index({ name: 1, type: 1, userId: 1 }, { unique: true });
```

---

### Líneas 164-240: Método updateCategory

```typescript
/**
 * Actualizar una categoría
 * PUT /api/v1/categories/:id
 */
async updateCategory(req: Request, res: Response): Promise<Response> {
```

#### Líneas 170-172: Extracción de datos
```typescript
const { id } = req.params;
const userId = req.user?.id;
const updateData = req.body;
```

**¿Qué hace?**
- **`id`**: ID de la categoría a actualizar
- **`userId`**: ID del usuario autenticado
- **`updateData`**: Objeto con los campos a actualizar

**Ejemplo de request:**
```json
PUT /api/categories/507f1f77bcf86cd799439014
Content-Type: application/json

{
  "name": "Mascotas y Veterinaria",
  "color": "#FF6B6B"
}
```

---

#### Líneas 174-180: Validación del ID
```typescript
// Validar ObjectId
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: 'ID de categoría inválido',
  });
}
```

**¿Qué hace?**
- Valida el formato del ID
- Similar a métodos anteriores

---

#### Línea 182: Comentario
```typescript
// Buscar la categoría
```

---

#### Líneas 183-186: Búsqueda de la categoría
```typescript
const category = await Category.findOne({
  _id: id,
  userId: userId, // Solo puede actualizar categorías propias
});
```

**¿Qué hace?**
- Busca la categoría por ID Y userId
- **Importante**: NO usa `$or` como en `getCategoryById`
- Solo puede actualizar sus propias categorías personalizadas

**¿Por qué solo userId?**
- **Seguridad**: Los usuarios no pueden modificar:
  1. Categorías del sistema (isDefault: true)
  2. Categorías de otros usuarios
- Solo pueden modificar sus propias categorías personalizadas

---

#### Líneas 188-193: Categoría no encontrada
```typescript
if (!category) {
  return res.status(404).json({
    success: false,
    message: 'Categoría no encontrada o no tienes permiso para modificarla',
  });
}
```

**¿Qué hace?**
- Verifica si la categoría existe
- Mensaje que indica que puede ser por no existir o no tener permiso

---

#### Línea 195: Comentario
```typescript
// No permitir actualizar categorías del sistema
```

---

#### Líneas 196-201: Validación de categorías del sistema
```typescript
if (category.isDefault) {
  return res.status(403).json({
    success: false,
    message: 'No puedes modificar categorías predeterminadas del sistema',
  });
}
```

**¿Qué hace?**
- **`if (category.isDefault)`**: Verifica si es categoría del sistema
- **`res.status(403)`**: Código 403 (Forbidden - prohibido)
- Mensaje claro indicando que no se pueden modificar categorías del sistema

**¿Por qué 403?**
- **403 (Forbidden)**: El usuario está autenticado pero no tiene permiso
- Diferente de 401 (Unauthorized) que indica falta de autenticación

**¿Cuándo ocurriría esto?**
En teoría, nunca debería ocurrir porque la búsqueda en línea 183 solo busca por `userId`, no por `isDefault: true`. Pero es una validación de seguridad adicional por si el código cambia.

---

#### Línea 203: Comentario
```typescript
// Si se está cambiando el nombre o tipo, verificar que no exista otra categoría con esos valores
```

---

#### Líneas 204-221: Validación de duplicados al actualizar
```typescript
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
```

**¿Qué hace?**
- **Línea 204**: Verifica si se está actualizando el nombre o tipo
- **Líneas 205-206**: Determina qué nombre y tipo verificar
  - Si se proporciona nuevo nombre, usa ese; si no, usa el actual
  - Si se proporciona nuevo tipo, usa ese; si no, usa el actual
- **Líneas 208-213**: Busca si existe otra categoría con esos valores
  - **`_id: { $ne: id }`**: Excluye la categoría actual de la búsqueda
    - `$ne` = "not equal" (no igual)
  - **`name`**: Búsqueda exacta case-insensitive
  - **`type`**: Tipo a verificar
  - **`userId`**: Solo en categorías del usuario
- **Líneas 215-220**: Retorna error si existe duplicado

**¿Por qué `$ne: id`?**
- Excluye la categoría que estamos actualizando
- Sin esto, siempre encontraría la categoría actual como "duplicado"

**Ejemplo:**
```javascript
// Actualizando categoría "Mascotas" (id: '507f...014')
// Cambiando nombre a "Comida"

// Busca:
{
  _id: { $ne: '507f...014' },  // Excluye la categoría actual
  name: /^Comida$/i,
  type: 'expense',
  userId: '507f...ea'
}

// Si ya existe "Comida" de tipo "expense"
// existingCategory = { _id: '507f...011', name: 'Comida', ... }
// Retorna error 409
```

---

#### Línea 223: Comentario
```typescript
// Actualizar la categoría
```

---

#### Líneas 224-225: Actualización de la categoría
```typescript
Object.assign(category, updateData);
await category.save();
```

**¿Qué hace?**
- **`Object.assign(category, updateData)`**: Copia las propiedades de `updateData` a `category`
- **`category.save()`**: Guarda los cambios en la base de datos

**¿Qué es Object.assign?**
- Método de JavaScript que copia propiedades de un objeto a otro
- Sobrescribe propiedades existentes
- No elimina propiedades que no están en el objeto fuente

**Ejemplo:**
```javascript
// category actual
category = {
  _id: '507f...014',
  name: 'Mascotas',
  type: 'expense',
  icon: '🐶',
  color: '#FFA94D'
}

// updateData
updateData = {
  name: 'Mascotas y Veterinaria',
  color: '#FF6B6B'
}

// Después de Object.assign
category = {
  _id: '507f...014',
  name: 'Mascotas y Veterinaria',  // Actualizado
  type: 'expense',                  // Sin cambios
  icon: '🐶',                       // Sin cambios
  color: '#FF6B6B'                  // Actualizado
}
```

**Alternativa con findOneAndUpdate:**
```typescript
// Más eficiente (una sola operación)
const category = await Category.findOneAndUpdate(
  { _id: id, userId: userId },
  updateData,
  { new: true }
);
```

---

#### Líneas 227-231: Respuesta exitosa
```typescript
return res.status(200).json({
  success: true,
  message: 'Categoría actualizada exitosamente',
  data: category,
});
```

**¿Qué hace?**
- Retorna la categoría actualizada

---

### Líneas 242-302: Método deleteCategory

```typescript
/**
 * Eliminar una categoría (soft delete)
 * DELETE /api/v1/categories/:id
 */
async deleteCategory(req: Request, res: Response): Promise<Response> {
```

#### Línea 243: Comentario en JSDoc
```typescript
* Eliminar una categoría (soft delete)
```

**¿Qué es soft delete?**
- **Soft delete**: Marcar como eliminado sin borrar físicamente
- **Hard delete**: Eliminar permanentemente de la base de datos

**Nota:** El comentario dice "soft delete" pero el código hace hard delete (línea 284). Esto podría ser una inconsistencia.

---

#### Líneas 248-249: Extracción de parámetros
```typescript
const { id } = req.params;
const userId = req.user?.id;
```

**¿Qué hace?**
- Extrae el ID de la categoría y el ID del usuario

---

#### Líneas 251-257: Validación del ID
```typescript
// Validar ObjectId
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: 'ID de categoría inválido',
  });
}
```

**¿Qué hace?**
- Valida el formato del ID

---

#### Línea 259: Comentario
```typescript
// Buscar la categoría
```

---

#### Líneas 260-263: Búsqueda de la categoría
```typescript
const category = await Category.findOne({
  _id: id,
  userId: userId,
});
```

**¿Qué hace?**
- Busca la categoría por ID y userId
- Solo puede eliminar sus propias categorías

---

#### Líneas 265-270: Categoría no encontrada
```typescript
if (!category) {
  return res.status(404).json({
    success: false,
    message: 'Categoría no encontrada o no tienes permiso para eliminarla',
  });
}
```

**¿Qué hace?**
- Verifica si la categoría existe
- Mensaje que indica que puede ser por no existir o no tener permiso

---

#### Línea 272: Comentario
```typescript
// No permitir eliminar categorías del sistema
```

---

#### Líneas 273-278: Validación de categorías del sistema
```typescript
if (category.isDefault) {
  return res.status(403).json({
    success: false,
    message: 'No puedes eliminar categorías predeterminadas del sistema',
  });
}
```

**¿Qué hace?**
- Verifica si es categoría del sistema
- Retorna 403 (Forbidden) si intenta eliminar una categoría del sistema

---

#### Líneas 280-281: Comentario TODO
```typescript
// TODO: En el futuro, verificar si hay transacciones asociadas
// y manejar la eliminación apropiadamente (soft delete o reasignar)
```

**¿Qué hace?**
- Comentario que indica funcionalidad pendiente
- **Problema**: Si se elimina una categoría que tiene transacciones asociadas, esas transacciones quedarían huérfanas

**Mejora sugerida:**
```typescript
// Verificar si hay transacciones asociadas
const transactionCount = await Transaction.countDocuments({ categoryId: id });

if (transactionCount > 0) {
  return res.status(409).json({
    success: false,
    message: `No se puede eliminar la categoría porque tiene ${transactionCount} transacciones asociadas`,
  });
}
```

**O implementar soft delete:**
```typescript
// Marcar como eliminada en lugar de borrar
await Category.findByIdAndUpdate(id, { deletedAt: new Date() });
```

---

#### Línea 283: Comentario
```typescript
// Eliminar la categoría
```

---

#### Línea 284: Eliminación de la categoría
```typescript
await Category.deleteOne({ _id: id });
```

**¿Qué hace?**
- **`Category.deleteOne()`**: Elimina permanentemente el documento de MongoDB
- **Hard delete**: Eliminación física, no se puede recuperar

**Alternativas:**
```typescript
// Alternativa 1: findByIdAndDelete (retorna el documento eliminado)
const deletedCategory = await Category.findByIdAndDelete(id);

// Alternativa 2: Soft delete
await Category.findByIdAndUpdate(id, { deletedAt: new Date() });
```

---

#### Líneas 286-293: Respuesta exitosa
```typescript
return res.status(200).json({
  success: true,
  message: 'Categoría eliminada exitosamente',
  data: {
    id: category._id,
    name: category.name,
  },
});
```

**¿Qué hace?**
- Confirma la eliminación
- Retorna el ID y nombre de la categoría eliminada

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Categoría eliminada exitosamente",
  "data": {
    "id": "507f1f77bcf86cd799439014",
    "name": "Mascotas"
  }
}
```

---

### Líneas 304-350: Método getCategoryStats

```typescript
/**
 * Obtener estadísticas de categorías
 * GET /api/v1/categories/stats
 */
async getCategoryStats(req: Request, res: Response): Promise<Response> {
```

#### Línea 310: Obtención del userId
```typescript
const userId = req.user?.id;
```

**¿Qué hace?**
- Extrae el ID del usuario autenticado

---

#### Líneas 312-314: Conteo total de categorías
```typescript
const totalCategories = await Category.countDocuments({
  $or: [{ isDefault: true }, { userId: userId }],
});
```

**¿Qué hace?**
- **`countDocuments()`**: Método de Mongoose que cuenta documentos
- Cuenta categorías del sistema + personalizadas del usuario

**Ejemplo:**
```javascript
// Usuario tiene acceso a:
// - 10 categorías del sistema
// - 3 categorías personalizadas
totalCategories = 13
```

---

#### Líneas 316-319: Conteo de categorías de ingreso
```typescript
const incomeCategories = await Category.countDocuments({
  type: 'income',
  $or: [{ isDefault: true }, { userId: userId }],
});
```

**¿Qué hace?**
- Cuenta solo categorías de tipo 'income'
- Del sistema + personalizadas del usuario

---

#### Líneas 321-324: Conteo de categorías de gasto
```typescript
const expenseCategories = await Category.countDocuments({
  type: 'expense',
  $or: [{ isDefault: true }, { userId: userId }],
});
```

**¿Qué hace?**
- Cuenta solo categorías de tipo 'expense'

---

#### Líneas 326-329: Conteo de categorías personalizadas
```typescript
const customCategories = await Category.countDocuments({
  userId: userId,
  isDefault: false,
});
```

**¿Qué hace?**
- Cuenta solo las categorías personalizadas del usuario
- No incluye categorías del sistema

---

#### Líneas 331-341: Respuesta con estadísticas
```typescript
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
```

**¿Qué hace?**
- **`total`**: Total de categorías disponibles
- **`income`**: Categorías de ingreso
- **`expense`**: Categorías de gasto
- **`custom`**: Categorías personalizadas del usuario
- **`default`**: Categorías del sistema (calculado como total - custom)

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "total": 13,
    "income": 5,
    "expense": 8,
    "custom": 3,
    "default": 10
  }
}
```

**Uso en el frontend:**
```javascript
// Mostrar estadísticas en el dashboard
<div>
  <p>Total de categorías: {stats.total}</p>
  <p>Ingresos: {stats.income}</p>
  <p>Gastos: {stats.expense}</p>
  <p>Personalizadas: {stats.custom}</p>
</div>
```

---

### Líneas 351-355: Exportación

```typescript
}

// Exportar instancia del controlador
export const categoryController = new CategoryController();
```

#### Línea 351: Cierre de la clase
```typescript
}
```

**¿Qué hace?**
- Cierra la clase `CategoryController`

---

#### Línea 353: Comentario
```typescript
// Exportar instancia del controlador
```

**¿Qué hace?**
- Explica la exportación

---

#### Línea 354: Creación y exportación de instancia
```typescript
export const categoryController = new CategoryController();
```

**¿Qué hace?**
- Crea una instancia de la clase
- Exporta la instancia (patrón Singleton)

**Uso en las rutas:**
```typescript
// En routes/category.routes.ts
import { categoryController } from '../controllers/category.controller';

router.get('/categories', authMiddleware, categoryController.getAllCategories);
router.post('/categories', authMiddleware, categoryController.createCategory);
```

---

## Resumen de Métodos

| Método | Ruta | Descripción | Retorna |
|--------|------|-------------|---------|
| `getAllCategories` | GET /categories | Obtiene todas las categorías con filtros opcionales | Array de categorías |
| `getCategoryById` | GET /categories/:id | Obtiene una categoría específica | Una categoría |
| `createCategory` | POST /categories | Crea una nueva categoría personalizada | Categoría creada |
| `updateCategory` | PUT /categories/:id | Actualiza una categoría personalizada | Categoría actualizada |
| `deleteCategory` | DELETE /categories/:id | Elimina una categoría personalizada | Confirmación |
| `getCategoryStats` | GET /categories/stats | Obtiene estadísticas de categorías | Estadísticas |

---

## Conceptos Clave

### 1. Categorías del Sistema vs Personalizadas

| Aspecto | Sistema (isDefault: true) | Personalizadas (isDefault: false) |
|---------|---------------------------|-----------------------------------|
| **Visibilidad** | Todos los usuarios | Solo el usuario que la creó |
| **Modificación** | No se pueden modificar | Se pueden modificar |
| **Eliminación** | No se pueden eliminar | Se pueden eliminar |
| **Ejemplos** | Comida, Transporte, Salario | Freelance, Mascotas, Inversiones |

### 2. Operadores de MongoDB Usados

| Operador | Descripción | Ejemplo |
|----------|-------------|---------|
| `$or` | OR lógico | `{ $or: [{ isDefault: true }, { userId: '123' }] }` |
| `$regex` | Búsqueda con expresiones regulares | `{ name: { $regex: 'com', $options: 'i' } }` |
| `$ne` | No igual (not equal) | `{ _id: { $ne: '507f...' } }` |

### 3. Códigos HTTP Usados

| Código | Nombre | Uso en este controlador |
|--------|--------|-------------------------|
| 200 | OK | Operación exitosa (GET, PUT, DELETE) |
| 201 | Created | Categoría creada exitosamente |
| 400 | Bad Request | ID inválido |
| 403 | Forbidden | Intento de modificar/eliminar categoría del sistema |
| 404 | Not Found | Categoría no encontrada |
| 409 | Conflict | Categoría duplicada |
| 500 | Internal Server Error | Error del servidor |

---

## Seguridad Implementada

✅ **Autorización**: Usuarios solo pueden modificar/eliminar sus propias categorías  
✅ **Protección de sistema**: Categorías del sistema no se pueden modificar/eliminar  
✅ **Validación de IDs**: Verificación de ObjectIds antes de consultar  
✅ **Aislamiento de datos**: Filtrado por userId en todas las operaciones  
✅ **Validación de duplicados**: Previene categorías duplicadas  

---

## Mejores Prácticas Implementadas

✅ **Comentarios JSDoc**: Documentación de métodos y rutas  
✅ **Validación de entrada**: Verificación de tipos y valores  
✅ **Mensajes descriptivos**: Errores claros y específicos  
✅ **Valores por defecto**: Icono y color por defecto  
✅ **Búsqueda case-insensitive**: Mejor experiencia de usuario  
✅ **Ordenamiento**: Resultados ordenados por tipo y nombre  

---

## Posibles Mejoras

### 1. Verificar transacciones antes de eliminar
```typescript
const transactionCount = await Transaction.countDocuments({ categoryId: id });
if (transactionCount > 0) {
  return res.status(409).json({
    message: `No se puede eliminar. Hay ${transactionCount} transacciones asociadas`
  });
}
```

### 2. Implementar soft delete
```typescript
// Agregar campo deletedAt al modelo
await Category.findByIdAndUpdate(id, { deletedAt: new Date() });

// Modificar queries para excluir eliminadas
const filter = { deletedAt: null, ... };
```

### 3. Paginación en getAllCategories
```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 20;
const skip = (page - 1) * limit;

const categories = await Category.find(filter)
  .sort({ type: 1, name: 1 })
  .skip(skip)
  .limit(limit);
```

### 4. Validación con biblioteca dedicada
```typescript
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['income', 'expense']),
  icon: z.string().emoji().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  description: z.string().max(200).optional()
});
```

### 5. Sanitización de regex
```typescript
// Prevenir ReDoS attacks
const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
filter.name = { $regex: escapedSearch, $options: 'i' };
```

### 6. Caché de categorías del sistema
```typescript
// Las categorías del sistema no cambian frecuentemente
const systemCategories = await redis.get('system_categories');
if (!systemCategories) {
  const categories = await Category.find({ isDefault: true });
  await redis.set('system_categories', JSON.stringify(categories), 'EX', 3600);
}
```
