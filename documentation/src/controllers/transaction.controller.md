# Documentación: transaction.controller.ts

**Ubicación:** `src/controllers/transaction.controller.ts`

**Propósito:** Este archivo define el controlador de transacciones que maneja todas las operaciones CRUD para transacciones financieras (ingresos y gastos). Incluye funcionalidades avanzadas como filtrado complejo, paginación, estadísticas agregadas, y análisis por categoría y período.

---

## Análisis Línea por Línea

### Líneas 1-5: Importaciones

```typescript
import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction.model';
import { Category } from '../models/Category.model';
import { Goal } from '../models/Goal.model';
import mongoose from 'mongoose';
```

#### Línea 1: Importación de tipos de Express
```typescript
import { Request, Response } from 'express';
```

**¿Qué hace?**
- Importa los tipos `Request` y `Response` de Express
- Proporciona tipado TypeScript para solicitudes y respuestas HTTP

---

#### Línea 2: Importación del modelo Transaction
```typescript
import { Transaction } from '../models/Transaction.model';
```

**¿Qué hace?**
- Importa el modelo `Transaction` de Mongoose
- Representa la estructura de transacciones financieras en MongoDB

**Estructura típica de una transacción:**
```typescript
interface ITransaction {
  _id: ObjectId;
  userId: ObjectId;
  categoryId: ObjectId;
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Ejemplo de transacción:**
```javascript
{
  userId: '507f191e810c19729de860ea',
  categoryId: '507f1f77bcf86cd799439011',
  amount: 50.00,
  type: 'expense',
  description: 'Almuerzo en restaurante',
  date: '2025-11-27T12:00:00.000Z'
}
```

---

#### Línea 3: Importación del modelo Category
```typescript
import { Category } from '../models/Category.model';
```

**¿Qué hace?**
- Importa el modelo `Category`
- Usado para validar que la categoría existe antes de crear/actualizar transacciones

---

#### Línea 4: Importación del modelo Goal
```typescript
import { Goal } from '../models/Goal.model';
```

**¿Qué hace?**
- Importa el modelo `Goal`
- Usado para actualizar automáticamente el progreso de metas cuando hay ingresos

---

#### Línea 5: Importación de Mongoose
```typescript
import mongoose from 'mongoose';
```

**¿Qué hace?**
- Importa Mongoose para validación de ObjectIds y operaciones de agregación

---

### Línea 7: Declaración de la clase
```typescript
export class TransactionController {
```

**¿Qué hace?**
- Exporta la clase que agrupa todos los métodos relacionados con transacciones

---

### Líneas 8-72: Método getTransactions

```typescript
async getTransactions(req: Request, res: Response): Promise<Response> {
```

Este es el método más complejo del controlador, con múltiples filtros y paginación.

#### Líneas 10-22: Extracción de parámetros
```typescript
const userId = req.user?.id;
const {
  type,
  categoryId,
  dateFrom,
  dateTo,
  minAmount,
  maxAmount,
  page = 1,
  limit = 20,
  sortBy = 'date',
  sortOrder = 'desc',
} = req.query;
```

**¿Qué hace?**
- Extrae múltiples parámetros de filtrado y paginación
- **`type`**: Filtrar por tipo (income/expense)
- **`categoryId`**: Filtrar por categoría específica
- **`dateFrom`**: Fecha inicial del rango
- **`dateTo`**: Fecha final del rango
- **`minAmount`**: Monto mínimo
- **`maxAmount`**: Monto máximo
- **`page = 1`**: Página actual (por defecto 1)
- **`limit = 20`**: Transacciones por página (por defecto 20)
- **`sortBy = 'date'`**: Campo de ordenamiento (por defecto fecha)
- **`sortOrder = 'desc'`**: Orden descendente (más recientes primero)

**Ejemplo de URL con todos los filtros:**
```
GET /api/transactions?type=expense&categoryId=507f...&dateFrom=2025-11-01&dateTo=2025-11-30&minAmount=10&maxAmount=100&page=2&limit=10&sortBy=amount&sortOrder=desc
```

---

#### Líneas 24-39: Construcción del filtro
```typescript
const filter: any = { userId };

if (type) filter.type = type;
if (categoryId) filter.categoryId = categoryId;

if (dateFrom || dateTo) {
  filter.date = {};
  if (dateFrom) filter.date.$gte = new Date(dateFrom as string);
  if (dateTo) filter.date.$lte = new Date(dateTo as string);
}

if (minAmount || maxAmount) {
  filter.amount = {};
  if (minAmount) filter.amount.$gte = parseFloat(minAmount as string);
  if (maxAmount) filter.amount.$lte = parseFloat(maxAmount as string);
}
```

**¿Qué hace?**
- Construye un objeto de filtro dinámico para MongoDB

**Filtro por tipo y categoría (líneas 26-27):**
```javascript
// Solo gastos
filter = { userId: '507f...', type: 'expense' }

// Solo de categoría específica
filter = { userId: '507f...', categoryId: '507f...' }
```

**Filtro por rango de fechas (líneas 29-33):**
```typescript
if (dateFrom || dateTo) {
  filter.date = {};
  if (dateFrom) filter.date.$gte = new Date(dateFrom as string);
  if (dateTo) filter.date.$lte = new Date(dateTo as string);
}
```

**¿Qué es $gte y $lte?**
- **`$gte`**: Greater Than or Equal (mayor o igual)
- **`$lte`**: Less Than or Equal (menor o igual)
- Operadores de MongoDB para rangos

**Ejemplo:**
```javascript
// Transacciones de noviembre 2025
filter.date = {
  $gte: new Date('2025-11-01'),
  $lte: new Date('2025-11-30')
}

// MongoDB busca: date >= 2025-11-01 AND date <= 2025-11-30
```

**Filtro por rango de montos (líneas 35-39):**
```typescript
if (minAmount || maxAmount) {
  filter.amount = {};
  if (minAmount) filter.amount.$gte = parseFloat(minAmount as string);
  if (maxAmount) filter.amount.$lte = parseFloat(maxAmount as string);
}
```

**¿Por qué parseFloat?**
- Los query params son strings
- `parseFloat()` convierte string a número decimal
- `'50.99'` → `50.99`

**Ejemplo:**
```javascript
// Transacciones entre $10 y $100
filter.amount = {
  $gte: 10,
  $lte: 100
}
```

**Filtro completo ejemplo:**
```javascript
{
  userId: '507f191e810c19729de860ea',
  type: 'expense',
  categoryId: '507f1f77bcf86cd799439011',
  date: {
    $gte: new Date('2025-11-01'),
    $lte: new Date('2025-11-30')
  },
  amount: {
    $gte: 10,
    $lte: 100
  }
}
```

---

#### Líneas 41-43: Paginación y ordenamiento
```typescript
const skip = (Number(page) - 1) * Number(limit);
const sort: any = {};
sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
```

**¿Qué es skip?**
- Número de documentos a saltar para la paginación
- Fórmula: `(página - 1) * límite`

**Ejemplos de paginación:**
```javascript
// Página 1, límite 20
skip = (1 - 1) * 20 = 0  // Mostrar del 1 al 20

// Página 2, límite 20
skip = (2 - 1) * 20 = 20  // Mostrar del 21 al 40

// Página 3, límite 20
skip = (3 - 1) * 20 = 40  // Mostrar del 41 al 60
```

**Construcción del ordenamiento:**
```javascript
// Ordenar por fecha descendente
sort = { date: -1 }

// Ordenar por monto ascendente
sort = { amount: 1 }
```

---

#### Líneas 45-50: Consulta con populate
```typescript
const transactions = await Transaction.find(filter)
  .sort(sort)
  .skip(skip)
  .limit(Number(limit))
  .populate('categoryId', 'name type icon color')
  .lean();
```

**¿Qué hace?**
- **`.find(filter)`**: Busca transacciones que coincidan
- **`.sort(sort)`**: Ordena resultados
- **`.skip(skip)`**: Salta documentos para paginación
- **`.limit(Number(limit))`**: Limita número de resultados
- **`.populate('categoryId', 'name type icon color')`**: Rellena datos de categoría
- **`.lean()`**: Retorna objetos planos

**¿Qué es populate?**
- Método de Mongoose para "rellenar" referencias
- Reemplaza el ID de categoría con el documento completo
- Similar a un JOIN en SQL

**Sin populate:**
```javascript
{
  _id: '507f...',
  categoryId: '507f1f77bcf86cd799439011',  // Solo el ID
  amount: 50,
  type: 'expense'
}
```

**Con populate:**
```javascript
{
  _id: '507f...',
  categoryId: {  // Documento completo de categoría
    _id: '507f1f77bcf86cd799439011',
    name: 'Comida',
    type: 'expense',
    icon: '🍔',
    color: '#FF6B6B'
  },
  amount: 50,
  type: 'expense'
}
```

**Segundo parámetro de populate:**
- Especifica qué campos incluir
- `'name type icon color'`: Solo estos campos
- Optimiza la respuesta (no incluye campos innecesarios)

---

#### Línea 52: Conteo total
```typescript
const total = await Transaction.countDocuments(filter);
```

**¿Qué hace?**
- Cuenta el total de documentos que coinciden con el filtro
- Necesario para calcular el número total de páginas

**¿Por qué una consulta separada?**
- `.find()` con `.limit()` solo retorna los documentos de la página actual
- Necesitamos el total para la paginación

---

#### Líneas 54-63: Respuesta con paginación
```typescript
return res.status(200).json({
  success: true,
  data: transactions,
  pagination: {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / Number(limit)),
  },
});
```

**¿Qué hace?**
- Retorna transacciones con información de paginación
- **`pages`**: Número total de páginas
  - `Math.ceil()`: Redondea hacia arriba
  - `Math.ceil(45 / 20) = 3` páginas

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f...",
      "categoryId": {
        "name": "Comida",
        "type": "expense",
        "icon": "🍔",
        "color": "#FF6B6B"
      },
      "amount": 50,
      "type": "expense",
      "description": "Almuerzo",
      "date": "2025-11-27T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

**Uso en el frontend:**
```javascript
// Cargar página 2
const response = await fetch('/api/transactions?page=2&limit=20');
const { data, pagination } = await response.json();

// Renderizar paginación
renderPagination(pagination.page, pagination.pages);
```

---

### Líneas 111-163: Método createTransaction

```typescript
async createTransaction(req: Request, res: Response): Promise<Response> {
```

#### Líneas 113-114: Extracción de datos
```typescript
const userId = req.user?.id;
const { categoryId, amount, type, description, date } = req.body;
```

**Ejemplo de request:**
```json
POST /api/transactions
{
  "categoryId": "507f1f77bcf86cd799439011",
  "amount": 50.00,
  "type": "expense",
  "description": "Almuerzo en restaurante",
  "date": "2025-11-27T12:00:00.000Z"
}
```

---

#### Líneas 116-126: Validación de categoría
```typescript
const category = await Category.findOne({
  _id: categoryId,
  $or: [{ isDefault: true }, { userId }],
});

if (!category) {
  return res.status(404).json({
    success: false,
    message: 'Categoría no encontrada',
  });
}
```

**¿Qué hace?**
- Verifica que la categoría existe
- Verifica que el usuario tiene acceso a la categoría
  - Categorías del sistema (isDefault: true)
  - Categorías propias del usuario

**¿Por qué validar la categoría?**
- **Integridad referencial**: Asegura que la categoría existe
- **Seguridad**: Previene usar categorías de otros usuarios
- **UX**: Mensaje claro si la categoría no existe

---

#### Líneas 128-135: Creación de la transacción
```typescript
const transaction = new Transaction({
  userId,
  categoryId,
  amount,
  type,
  description,
  date: date || new Date(),
});
```

**¿Qué hace?**
- Crea nueva instancia del modelo Transaction
- **`date: date || new Date()`**: Usa fecha proporcionada o fecha actual

---

#### Línea 137: Guardado en BD
```typescript
await transaction.save();
```

**¿Qué hace?**
- Guarda la transacción en MongoDB
- Ejecuta validaciones del esquema

---

#### Líneas 139-144: Actualización automática de metas
```typescript
if (type === 'income') {
  await Goal.updateMany(
    { userId, status: 'active' },
    { $inc: { currentAmount: amount } }
  );
}
```

**¿Qué hace?**
- Si la transacción es un ingreso, actualiza automáticamente las metas activas
- **`$inc`**: Operador de MongoDB que incrementa un valor
- **`{ $inc: { currentAmount: amount } }`**: Incrementa currentAmount por el monto del ingreso

**¿Por qué solo para ingresos?**
- Las metas son de ahorro (acumular dinero)
- Los ingresos contribuyen a las metas
- Los gastos no afectan directamente las metas de ahorro

**Ejemplo:**
```javascript
// Usuario recibe salario de $2000
type = 'income'
amount = 2000

// Todas las metas activas se actualizan
Meta "Vacaciones": currentAmount += 2000
Meta "Fondo emergencia": currentAmount += 2000
Meta "Auto nuevo": currentAmount += 2000
```

**¿Qué es updateMany?**
- Actualiza múltiples documentos a la vez
- Más eficiente que actualizar uno por uno

---

#### Líneas 146-148: Populate de la transacción creada
```typescript
const populatedTransaction = await Transaction.findById(transaction._id)
  .populate('categoryId', 'name type icon color')
  .lean();
```

**¿Qué hace?**
- Busca la transacción recién creada
- Rellena los datos de la categoría
- Retorna objeto plano

**¿Por qué hacer esto?**
- La transacción guardada solo tiene el ID de categoría
- El frontend necesita los datos completos de la categoría
- Evita una petición adicional del cliente

---

#### Líneas 150-154: Respuesta exitosa
```typescript
return res.status(201).json({
  success: true,
  message: 'Transacción creada exitosamente',
  data: populatedTransaction,
});
```

**¿Qué hace?**
- **`res.status(201)`**: Código 201 (Created)
- Retorna la transacción con categoría poblada

---

### Líneas 260-304: Método getStatistics

```typescript
async getStatistics(req: Request, res: Response): Promise<Response> {
```

Este método usa agregación de MongoDB para calcular estadísticas.

#### Líneas 264-274: Pipeline de agregación
```typescript
const stats = await Transaction.aggregate([
  { $match: { userId: new mongoose.Types.ObjectId(userId) } },
  {
    $group: {
      _id: '$type',
      total: { $sum: '$amount' },
      count: { $sum: 1 },
      avg: { $avg: '$amount' },
    },
  },
]);
```

**¿Qué es aggregate?**
- Método de MongoDB para operaciones complejas de procesamiento de datos
- Similar a GROUP BY en SQL
- Procesa documentos en etapas (pipeline)

**Etapa 1: $match (línea 265)**
```typescript
{ $match: { userId: new mongoose.Types.ObjectId(userId) } }
```
- Filtra transacciones del usuario
- Similar a WHERE en SQL

**¿Por qué new mongoose.Types.ObjectId(userId)?**
- En agregación, necesitamos convertir el string a ObjectId
- En `.find()` Mongoose lo hace automáticamente
- En `.aggregate()` debemos hacerlo manualmente

**Etapa 2: $group (líneas 267-273)**
```typescript
{
  $group: {
    _id: '$type',
    total: { $sum: '$amount' },
    count: { $sum: 1 },
    avg: { $avg: '$amount' },
  },
}
```

**¿Qué hace?**
- Agrupa transacciones por tipo (income/expense)
- Calcula agregaciones para cada grupo

**Operadores de agregación:**
- **`$sum: '$amount'`**: Suma todos los montos
- **`$sum: 1`**: Cuenta documentos (1 por cada documento)
- **`$avg: '$amount'`**: Promedio de montos

**Resultado del aggregate:**
```javascript
[
  {
    _id: 'income',
    total: 5000,
    count: 10,
    avg: 500
  },
  {
    _id: 'expense',
    total: 3000,
    count: 25,
    avg: 120
  }
]
```

---

#### Líneas 276-277: Extracción de estadísticas
```typescript
const incomeStats = stats.find(s => s._id === 'income') || { total: 0, count: 0, avg: 0 };
const expenseStats = stats.find(s => s._id === 'expense') || { total: 0, count: 0, avg: 0 };
```

**¿Qué hace?**
- Busca las estadísticas de ingresos y gastos
- Proporciona valores por defecto si no existen

**¿Por qué valores por defecto?**
- Usuario nuevo puede no tener ingresos o gastos
- Previene errores al acceder a propiedades undefined

---

#### Líneas 279-295: Respuesta con estadísticas
```typescript
return res.status(200).json({
  success: true,
  data: {
    income: {
      total: incomeStats.total,
      count: incomeStats.count,
      average: incomeStats.avg,
    },
    expense: {
      total: expenseStats.total,
      count: expenseStats.count,
      average: expenseStats.avg,
    },
    balance: incomeStats.total - expenseStats.total,
    totalTransactions: incomeStats.count + expenseStats.count,
  },
});
```

**¿Qué hace?**
- **`balance`**: Diferencia entre ingresos y gastos
- **`totalTransactions`**: Total de transacciones

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "income": {
      "total": 5000,
      "count": 10,
      "average": 500
    },
    "expense": {
      "total": 3000,
      "count": 25,
      "average": 120
    },
    "balance": 2000,
    "totalTransactions": 35
  }
}
```

**Uso en el frontend:**
```javascript
// Dashboard con estadísticas
const { data } = await fetch('/api/transactions/statistics').then(r => r.json());

showBalance(data.balance);
showIncomeTotal(data.income.total);
showExpenseTotal(data.expense.total);
renderChart(data);
```

---

### Líneas 306-354: Método getByCategory

```typescript
async getByCategory(req: Request, res: Response): Promise<Response> {
```

Este método usa un pipeline de agregación más complejo con $lookup.

#### Líneas 310-340: Pipeline de agregación complejo
```typescript
const byCategory = await Transaction.aggregate([
  { $match: { userId: new mongoose.Types.ObjectId(userId) } },
  {
    $group: {
      _id: { categoryId: '$categoryId', type: '$type' },
      total: { $sum: '$amount' },
      count: { $sum: 1 },
    },
  },
  {
    $lookup: {
      from: 'categories',
      localField: '_id.categoryId',
      foreignField: '_id',
      as: 'category',
    },
  },
  { $unwind: '$category' },
  {
    $project: {
      categoryId: '$_id.categoryId',
      categoryName: '$category.name',
      type: '$_id.type',
      icon: '$category.icon',
      color: '$category.color',
      total: 1,
      count: 1,
    },
  },
  { $sort: { total: -1 } },
]);
```

**Etapa 1: $match**
- Filtra transacciones del usuario

**Etapa 2: $group (líneas 312-318)**
```typescript
{
  $group: {
    _id: { categoryId: '$categoryId', type: '$type' },
    total: { $sum: '$amount' },
    count: { $sum: 1 },
  },
}
```
- Agrupa por categoría Y tipo
- Calcula total y conteo por grupo

**Etapa 3: $lookup (líneas 319-326)**
```typescript
{
  $lookup: {
    from: 'categories',
    localField: '_id.categoryId',
    foreignField: '_id',
    as: 'category',
  },
}
```

**¿Qué es $lookup?**
- Operador de agregación similar a LEFT JOIN en SQL
- Une documentos de diferentes colecciones

**Parámetros:**
- **`from`**: Colección a unir ('categories')
- **`localField`**: Campo local ('_id.categoryId')
- **`foreignField`**: Campo en la otra colección ('_id')
- **`as`**: Nombre del campo resultado ('category')

**Resultado después de $lookup:**
```javascript
{
  _id: { categoryId: ObjectId('507f...'), type: 'expense' },
  total: 500,
  count: 10,
  category: [  // Array con documentos coincidentes
    {
      _id: ObjectId('507f...'),
      name: 'Comida',
      icon: '🍔',
      color: '#FF6B6B'
    }
  ]
}
```

**Etapa 4: $unwind (línea 327)**
```typescript
{ $unwind: '$category' }
```

**¿Qué es $unwind?**
- Descompone un array en documentos individuales
- Convierte `category: [...]` en `category: {...}`

**Antes de $unwind:**
```javascript
category: [{ name: 'Comida', ... }]
```

**Después de $unwind:**
```javascript
category: { name: 'Comida', ... }
```

**Etapa 5: $project (líneas 328-338)**
```typescript
{
  $project: {
    categoryId: '$_id.categoryId',
    categoryName: '$category.name',
    type: '$_id.type',
    icon: '$category.icon',
    color: '$category.color',
    total: 1,
    count: 1,
  },
}
```

**¿Qué es $project?**
- Selecciona y transforma campos
- Similar a SELECT en SQL
- Crea estructura de salida deseada

**Transformación:**
```javascript
// Antes
{
  _id: { categoryId: '507f...', type: 'expense' },
  total: 500,
  count: 10,
  category: { name: 'Comida', icon: '🍔', color: '#FF6B6B' }
}

// Después
{
  categoryId: '507f...',
  categoryName: 'Comida',
  type: 'expense',
  icon: '🍔',
  color: '#FF6B6B',
  total: 500,
  count: 10
}
```

**Etapa 6: $sort (línea 339)**
```typescript
{ $sort: { total: -1 } }
```
- Ordena por total descendente
- Categorías con más gasto primero

**Resultado final:**
```json
[
  {
    "categoryId": "507f...",
    "categoryName": "Comida",
    "type": "expense",
    "icon": "🍔",
    "color": "#FF6B6B",
    "total": 500,
    "count": 10
  },
  {
    "categoryId": "507f...",
    "categoryName": "Transporte",
    "type": "expense",
    "icon": "🚗",
    "color": "#4DABF7",
    "total": 300,
    "count": 8
  }
]
```

---

### Líneas 356-399: Método getByPeriod

```typescript
async getByPeriod(req: Request, res: Response): Promise<Response> {
```

#### Líneas 358-373: Selección de agrupación por período
```typescript
const { period = 'month' } = req.query;

let groupBy: any;
switch (period) {
  case 'day':
    groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    break;
  case 'week':
    groupBy = { $isoWeek: '$date' };
    break;
  case 'month':
  default:
    groupBy = { $dateToString: { format: '%Y-%m', date: '$date' } };
    break;
}
```

**¿Qué hace?**
- Selecciona cómo agrupar según el período solicitado

**Opciones de agrupación:**

**Por día:**
```typescript
groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
// Resultado: '2025-11-27'
```

**Por semana:**
```typescript
groupBy = { $isoWeek: '$date' }
// Resultado: 48 (semana del año)
```

**Por mes:**
```typescript
groupBy = { $dateToString: { format: '%Y-%m', date: '$date' } }
// Resultado: '2025-11'
```

**¿Qué es $dateToString?**
- Operador de MongoDB que formatea fechas
- `format`: Patrón de formato
  - `%Y`: Año (2025)
  - `%m`: Mes (01-12)
  - `%d`: Día (01-31)

---

#### Líneas 375-385: Pipeline de agregación por período
```typescript
const byPeriod = await Transaction.aggregate([
  { $match: { userId: new mongoose.Types.ObjectId(userId) } },
  {
    $group: {
      _id: { period: groupBy, type: '$type' },
      total: { $sum: '$amount' },
      count: { $sum: 1 },
    },
  },
  { $sort: { '_id.period': 1 } },
]);
```

**¿Qué hace?**
- Agrupa transacciones por período y tipo
- Calcula total y conteo
- Ordena por período ascendente

**Resultado ejemplo (por mes):**
```json
[
  {
    "_id": { "period": "2025-09", "type": "expense" },
    "total": 1200,
    "count": 15
  },
  {
    "_id": { "period": "2025-09", "type": "income" },
    "total": 2500,
    "count": 5
  },
  {
    "_id": { "period": "2025-10", "type": "expense" },
    "total": 1350,
    "count": 18
  },
  {
    "_id": { "period": "2025-10", "type": "income" },
    "total": 2500,
    "count": 5
  }
]
```

**Uso en el frontend:**
```javascript
// Gráfico de gastos mensuales
const { data } = await fetch('/api/transactions/by-period?period=month').then(r => r.json());

const expenses = data.filter(d => d._id.type === 'expense');
const income = data.filter(d => d._id.type === 'income');

renderLineChart(expenses, income);
```

---

### Líneas 402-403: Exportación

```typescript
export const transactionController = new TransactionController();
```

**¿Qué hace?**
- Crea y exporta una instancia del controlador (patrón Singleton)

---

## Resumen de Métodos

| Método | Ruta | Descripción | Características |
|--------|------|-------------|-----------------|
| `getTransactions` | GET /transactions | Obtiene transacciones con filtros | Paginación, múltiples filtros, populate |
| `getTransactionById` | GET /transactions/:id | Obtiene una transacción | Populate de categoría |
| `createTransaction` | POST /transactions | Crea transacción | Valida categoría, actualiza metas |
| `updateTransaction` | PUT /transactions/:id | Actualiza transacción | Valida categoría |
| `deleteTransaction` | DELETE /transactions/:id | Elimina transacción | Hard delete |
| `getStatistics` | GET /transactions/statistics | Estadísticas agregadas | Agregación MongoDB |
| `getByCategory` | GET /transactions/by-category | Gastos por categoría | $lookup, $unwind |
| `getByPeriod` | GET /transactions/by-period | Gastos por período | Agrupación temporal |

---

## Conceptos Clave

### 1. Filtros Disponibles

| Filtro | Tipo | Ejemplo | Operador MongoDB |
|--------|------|---------|------------------|
| `type` | String | `?type=expense` | Igualdad |
| `categoryId` | ObjectId | `?categoryId=507f...` | Igualdad |
| `dateFrom` | Date | `?dateFrom=2025-11-01` | `$gte` |
| `dateTo` | Date | `?dateTo=2025-11-30` | `$lte` |
| `minAmount` | Number | `?minAmount=10` | `$gte` |
| `maxAmount` | Number | `?maxAmount=100` | `$lte` |

### 2. Operadores de Agregación

| Operador | Descripción | Ejemplo |
|----------|-------------|---------|
| `$match` | Filtra documentos | `{ $match: { userId: '507f...' } }` |
| `$group` | Agrupa y calcula | `{ $group: { _id: '$type', total: { $sum: '$amount' } } }` |
| `$lookup` | Join entre colecciones | `{ $lookup: { from: 'categories', ... } }` |
| `$unwind` | Descompone arrays | `{ $unwind: '$category' }` |
| `$project` | Selecciona campos | `{ $project: { name: 1, total: 1 } }` |
| `$sort` | Ordena resultados | `{ $sort: { total: -1 } }` |

### 3. Populate vs $lookup

| Aspecto | Populate | $lookup |
|---------|----------|---------|
| **Uso** | Consultas normales | Agregaciones |
| **Sintaxis** | `.populate('field')` | `{ $lookup: { ... } }` |
| **Performance** | Múltiples queries | Single query |
| **Flexibilidad** | Limitada | Muy flexible |

---

## Mejores Prácticas Implementadas

✅ **Paginación**: Evita cargar demasiados datos  
✅ **Populate**: Incluye datos de categoría automáticamente  
✅ **Filtros múltiples**: Búsqueda flexible y potente  
✅ **Validación de categoría**: Integridad referencial  
✅ **Actualización automática de metas**: Lógica de negocio integrada  
✅ **Agregaciones eficientes**: Cálculos en la base de datos  
✅ **Ordenamiento dinámico**: Flexibilidad en la presentación  

---

## Posibles Mejoras

### 1. Soft delete
```typescript
// En lugar de eliminar permanentemente
await Transaction.findByIdAndUpdate(id, { deletedAt: new Date() });

// Modificar filtros para excluir eliminadas
const filter = { userId, deletedAt: null };
```

### 2. Búsqueda por texto
```typescript
// Agregar índice de texto en el modelo
transactionSchema.index({ description: 'text' });

// Buscar en descripciones
if (search) {
  filter.$text = { $search: search };
}
```

### 3. Exportar a CSV
```typescript
async exportToCSV(req: Request, res: Response) {
  const transactions = await Transaction.find({ userId });
  const csv = this.convertToCSV(transactions);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
  res.send(csv);
}
```

### 4. Transacciones recurrentes
```typescript
interface IRecurringTransaction {
  frequency: 'daily' | 'weekly' | 'monthly';
  nextDate: Date;
  endDate?: Date;
}

// Cron job para crear transacciones automáticamente
```

### 5. Adjuntos/Recibos
```typescript
interface ITransaction {
  // ... campos existentes
  attachments: Array<{
    url: string;
    type: 'image' | 'pdf';
    uploadedAt: Date;
  }>;
}
```

---

## Casos de Uso

### 1. Lista de transacciones con filtros
```javascript
// Gastos de noviembre en categoría Comida
const response = await fetch(
  '/api/transactions?type=expense&categoryId=507f...&dateFrom=2025-11-01&dateTo=2025-11-30&page=1&limit=20'
);
```

### 2. Dashboard con estadísticas
```javascript
const stats = await fetch('/api/transactions/statistics').then(r => r.json());
showBalance(stats.data.balance);
```

### 3. Gráfico de gastos por categoría
```javascript
const byCategory = await fetch('/api/transactions/by-category').then(r => r.json());
renderPieChart(byCategory.data);
```

### 4. Gráfico de tendencias mensuales
```javascript
const byPeriod = await fetch('/api/transactions/by-period?period=month').then(r => r.json());
renderLineChart(byPeriod.data);
```
