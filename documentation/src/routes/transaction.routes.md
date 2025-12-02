# Documentación ULTRA Didáctica: transaction.routes.ts

**Ubicación:** `src/routes/transaction.routes.ts`

**Propósito:** Este archivo define las **rutas de transacciones** - el **corazón del sistema financiero**. Las transacciones son cada ingreso y gasto registrado. Estas rutas permiten crear, leer, actualizar, eliminar y analizar transacciones. Es como el **libro de contabilidad digital** donde se registra cada movimiento de dinero.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina un registro financiero:

```
Sin rutas de transacciones:
- No hay forma de registrar gastos
- No hay historial financiero
- No hay datos para análisis

Con rutas de transacciones:
POST /transactions → Registrar gasto/ingreso
GET /transactions → Ver historial
GET /statistics → Análisis y métricas
→ Control total de finanzas
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (líneas 1-9)             │
│  ├─ Router de Express                   │
│  ├─ Controlador de transacciones        │
│  ├─ Middleware de autenticación         │
│  ├─ Middleware de validación            │
│  └─ Schemas de validación               │
├──────────────────────────────────────────┤
│  INICIALIZACIÓN (línea 11)              │
│  └─ Crear instancia de Router           │
├──────────────────────────────────────────┤
│  RUTAS (líneas 13-62)                   │
│  ├─ GET /statistics (estadísticas)      │
│  ├─ GET /by-category (por categoría)    │
│  ├─ GET /by-period (por período)        │
│  ├─ GET / (listar transacciones)        │
│  ├─ GET /:id (transacción específica)   │
│  ├─ POST / (crear transacción)          │
│  ├─ PUT /:id (actualizar transacción)   │
│  └─ DELETE /:id (eliminar transacción)  │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (línea 64)                 │
│  └─ Exportar router                     │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

### Líneas 1-9: Importaciones

```typescript
import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createTransactionSchema,
  updateTransactionSchema,
  filterTransactionsSchema,
} from '../validators/transaction.validator';
```

**Schemas de validación:**
- `createTransactionSchema`: Reglas para crear transacción
- `updateTransactionSchema`: Reglas para actualizar transacción
- `filterTransactionsSchema`: Reglas para filtrar transacciones

---

## 🔷 RUTAS DEFINIDAS

### Ruta 1: GET /statistics (Líneas 13-17)

```typescript
router.get(
  '/statistics',
  authenticate,
  transactionController.getStatistics.bind(transactionController)
);
```

**Endpoint completo:**
```
GET /api/transactions/statistics
```

**¿Qué hace?**
- Obtiene **estadísticas financieras** del usuario
- Calcula totales, promedios, balance
- Muestra tendencias y métricas clave

**Query parameters:**
```
?startDate=2025-11-01    // Fecha inicio
?endDate=2025-11-30      // Fecha fin
```

**Ejemplo de request:**
```http
GET /api/transactions/statistics?startDate=2025-11-01&endDate=2025-11-30
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-11-01",
      "end": "2025-11-30"
    },
    "income": {
      "total": 3000.00,
      "count": 2,
      "average": 1500.00
    },
    "expense": {
      "total": 2200.00,
      "count": 65,
      "average": 33.85
    },
    "balance": 800.00,
    "savingsRate": 26.67,
    "totalTransactions": 67,
    "trends": {
      "dailyAverage": 73.33,
      "topCategory": {
        "name": "Comida",
        "total": 800.00
      }
    }
  }
}
```

**Caso de uso:**
```javascript
// Dashboard principal
const { data } = await fetch('/api/transactions/statistics');
displayBalance(data.balance);
displaySavingsRate(data.savingsRate);
```

---

### Ruta 2: GET /by-category (Líneas 19-23)

```typescript
router.get(
  '/by-category',
  authenticate,
  transactionController.getByCategory.bind(transactionController)
);
```

**Endpoint completo:**
```
GET /api/transactions/by-category
```

**¿Qué hace?**
- Agrupa **transacciones por categoría**
- Calcula totales y porcentajes por categoría
- Útil para gráficos de pastel

**Query parameters:**
```
?startDate=2025-11-01
?endDate=2025-11-30
?type=expense              // Solo gastos o ingresos
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
      "total": 800.00,
      "count": 25,
      "percentage": 36.36,
      "transactions": [...]
    },
    {
      "category": {
        "id": "507f...",
        "name": "Transporte",
        "icon": "🚗",
        "color": "#4ECDC4"
      },
      "total": 600.00,
      "count": 20,
      "percentage": 27.27,
      "transactions": [...]
    }
  ],
  "total": 2200.00
}
```

---

### Ruta 3: GET /by-period (Líneas 25-29)

```typescript
router.get(
  '/by-period',
  authenticate,
  transactionController.getByPeriod.bind(transactionController)
);
```

**Endpoint completo:**
```
GET /api/transactions/by-period
```

**¿Qué hace?**
- Agrupa **transacciones por período de tiempo**
- Calcula totales por día/semana/mes
- Útil para gráficos de líneas

**Query parameters:**
```
?period=day|week|month|year
?startDate=2025-11-01
?endDate=2025-11-30
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2025-11-01",
      "income": 0.00,
      "expense": 85.00,
      "balance": -85.00,
      "count": 3
    },
    {
      "period": "2025-11-02",
      "income": 0.00,
      "expense": 120.00,
      "balance": -120.00,
      "count": 5
    }
  ]
}
```

---

### Ruta 4: GET / (Líneas 31-36)

```typescript
router.get(
  '/',
  authenticate,
  validate(filterTransactionsSchema, 'query'),
  transactionController.getTransactions.bind(transactionController)
);
```

**Endpoint completo:**
```
GET /api/transactions
```

**¿Qué hace?**
- Obtiene **lista de transacciones** del usuario
- Soporta filtros, ordenamiento y paginación

**Query parameters:**
```
?type=income|expense       // Filtrar por tipo
?categoryId=507f...        // Filtrar por categoría
?startDate=2025-11-01      // Fecha inicio
?endDate=2025-11-30        // Fecha fin
?page=1                    // Paginación
?limit=20                  // Resultados por página
?sort=-date                // Ordenar (- = descendente)
```

**Ejemplo de request:**
```http
GET /api/transactions?type=expense&page=1&limit=20&sort=-date
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f...",
      "userId": "507f...",
      "categoryId": {
        "id": "507f...",
        "name": "Comida",
        "icon": "🍔",
        "color": "#FF6B6B"
      },
      "amount": 50.00,
      "type": "expense",
      "description": "Almuerzo",
      "date": "2025-11-27T12:00:00Z",
      "createdAt": "2025-11-27T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### Ruta 5: GET /:id (Líneas 38-42)

```typescript
router.get(
  '/:id',
  authenticate,
  transactionController.getTransactionById.bind(transactionController)
);
```

**Endpoint completo:**
```
GET /api/transactions/:id
```

**¿Qué hace?**
- Obtiene una **transacción específica** por ID

**Ejemplo de request:**
```http
GET /api/transactions/507f191e810c19729de860ea
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "id": "507f191e810c19729de860ea",
    "categoryId": {
      "id": "507f...",
      "name": "Comida",
      "icon": "🍔"
    },
    "amount": 50.00,
    "type": "expense",
    "description": "Almuerzo con cliente",
    "date": "2025-11-27T12:00:00Z"
  }
}
```

---

### Ruta 6: POST / (Líneas 44-49)

```typescript
router.post(
  '/',
  authenticate,
  validate(createTransactionSchema),
  transactionController.createTransaction.bind(transactionController)
);
```

**Endpoint completo:**
```
POST /api/transactions
```

**¿Qué hace?**
- Crea una **nueva transacción** (ingreso o gasto)

**Schema de validación:**
```typescript
{
  categoryId: Joi.string().required(),
  amount: Joi.number().min(0.01).required(),
  type: Joi.string().valid('income', 'expense').required(),
  description: Joi.string().max(500).optional(),
  date: Joi.date().optional()
}
```

**Ejemplo de request:**
```http
POST /api/transactions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "categoryId": "507f191e810c19729de860ea",
  "amount": 50.00,
  "type": "expense",
  "description": "Almuerzo con cliente",
  "date": "2025-11-27T12:00:00Z"
}
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "id": "507f...",
    "categoryId": "507f...",
    "amount": 50.00,
    "type": "expense",
    "description": "Almuerzo con cliente",
    "date": "2025-11-27T12:00:00Z",
    "createdAt": "2025-11-27T12:00:00Z"
  }
}
```

---

### Ruta 7: PUT /:id (Líneas 51-56)

```typescript
router.put(
  '/:id',
  authenticate,
  validate(updateTransactionSchema),
  transactionController.updateTransaction.bind(transactionController)
);
```

**Endpoint completo:**
```
PUT /api/transactions/:id
```

**¿Qué hace?**
- Actualiza una **transacción existente**

**Ejemplo de request:**
```http
PUT /api/transactions/507f191e810c19729de860ea
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "amount": 55.00,
  "description": "Almuerzo con cliente (actualizado)"
}
```

---

### Ruta 8: DELETE /:id (Líneas 58-62)

```typescript
router.delete(
  '/:id',
  authenticate,
  transactionController.deleteTransaction.bind(transactionController)
);
```

**Endpoint completo:**
```
DELETE /api/transactions/:id
```

**¿Qué hace?**
- Elimina una **transacción**

**Ejemplo de request:**
```http
DELETE /api/transactions/507f191e810c19729de860ea
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 Resumen de Rutas

| Método | Ruta | Descripción | Validación |
|--------|------|-------------|------------|
| GET | `/statistics` | Estadísticas | - |
| GET | `/by-category` | Por categoría | - |
| GET | `/by-period` | Por período | - |
| GET | `/` | Listar | filterTransactionsSchema |
| GET | `/:id` | Específica | - |
| POST | `/` | Crear | createTransactionSchema |
| PUT | `/:id` | Actualizar | updateTransactionSchema |
| DELETE | `/:id` | Eliminar | - |

**Todas las rutas requieren autenticación** ✅

---

## 🎯 Flujo Completo de Uso

```javascript
// 1. Crear transacción
const newTransaction = await fetch('/api/transactions', {
  method: 'POST',
  body: JSON.stringify({
    categoryId: '507f...',
    amount: 50,
    type: 'expense',
    description: 'Almuerzo'
  })
});

// 2. Listar transacciones
const transactions = await fetch('/api/transactions?page=1&limit=20');

// 3. Ver estadísticas
const stats = await fetch('/api/transactions/statistics');

// 4. Actualizar transacción
await fetch(`/api/transactions/${id}`, {
  method: 'PUT',
  body: JSON.stringify({ amount: 55 })
});

// 5. Eliminar transacción
await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
```

---

## ✅ Mejores Prácticas

### 1. Filtrar por Fecha

```javascript
const startDate = new Date('2025-11-01').toISOString();
const endDate = new Date('2025-11-30').toISOString();

const response = await fetch(
  `/api/transactions?startDate=${startDate}&endDate=${endDate}`
);
```

### 2. Paginación

```javascript
const loadMore = async (page) => {
  const response = await fetch(`/api/transactions?page=${page}&limit=20`);
  const { data, pagination } = await response.json();
  
  setTransactions(prev => [...prev, ...data]);
  setHasMore(pagination.page < pagination.pages);
};
```

### 3. Validar Antes de Enviar

```javascript
const createTransaction = async (data) => {
  if (data.amount <= 0) {
    showError('El monto debe ser mayor a 0');
    return;
  }
  
  if (!data.categoryId) {
    showError('Selecciona una categoría');
    return;
  }
  
  await fetch('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};
```

---

## 📝 Resumen

**Propósito:**
- Definir rutas para gestión de transacciones
- CORE del sistema financiero

**Rutas principales:**
- `POST /`: Crear transacción
- `GET /`: Listar transacciones
- `GET /statistics`: Estadísticas
- `GET /by-category`: Agrupar por categoría
- `PUT /:id`: Actualizar
- `DELETE /:id`: Eliminar

**Características:**
- Filtros avanzados
- Paginación
- Estadísticas en tiempo real
- Agrupación por categoría y período

---

¡Documentación completa de las rutas de transacciones! Este es el corazón del sistema financiero. 💰📊

