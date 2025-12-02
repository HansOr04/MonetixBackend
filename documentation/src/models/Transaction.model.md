# Documentación ULTRA Didáctica: Transaction.model.ts

**Ubicación:** `src/models/Transaction.model.ts`

**Propósito:** Este archivo define el **modelo de Transacciones** del sistema. Las transacciones son el **núcleo** de la aplicación financiera - cada ingreso y gasto se registra como una transacción. Este modelo es la base para análisis, predicciones, alertas y estadísticas. Es como el libro de contabilidad donde se registra cada movimiento de dinero.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina un registro financiero:

```
Sin transacciones:
- No hay historial de gastos
- No se puede analizar patrones
- No hay datos para predicciones

Con transacciones:
📝 2025-11-27: -$50 (Comida) "Almuerzo"
📝 2025-11-26: +$2000 (Salario) "Pago mensual"
📝 2025-11-25: -$30 (Transporte) "Uber"
→ Historial completo para análisis
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (línea 1)                │
├──────────────────────────────────────────┤
│  INTERFACE ITransaction (líneas 3-13)   │
│  └─ Define estructura TypeScript        │
├──────────────────────────────────────────┤
│  SCHEMA transactionSchema (líneas 15-65)│
│  ├─ userId (referencia a User)          │
│  ├─ categoryId (referencia a Category)  │
│  ├─ amount (monto)                      │
│  ├─ type (income/expense)               │
│  ├─ description (opcional)              │
│  └─ date (fecha)                        │
├──────────────────────────────────────────┤
│  ÍNDICES (líneas 67-69)                 │
│  └─ Optimización de consultas           │
├──────────────────────────────────────────┤
│  MÉTODO toJSON (líneas 71-84)           │
│  └─ Formatear respuesta                 │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (línea 86)                 │
│  └─ Modelo de Mongoose                  │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

## 🔷 INTERFACE ITransaction (Líneas 3-13)

```typescript
export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Campos Explicados

**Línea 5: userId**
```typescript
userId: mongoose.Types.ObjectId;
```
- Referencia al usuario dueño de la transacción
- Cada transacción pertenece a un usuario específico

---

**Línea 6: categoryId**
```typescript
categoryId: mongoose.Types.ObjectId;
```
- Referencia a la categoría de la transacción
- Ejemplos: Comida, Transporte, Salario, etc.

---

**Línea 7: amount**
```typescript
amount: number;
```
- Monto de la transacción
- Siempre positivo (el signo lo da el `type`)
- Ejemplo: `50.00`, `2000.00`

---

**Línea 8: type**
```typescript
type: 'income' | 'expense';
```

**Tipos:**

**income (Ingreso)**
```javascript
{
  type: 'income',
  amount: 2000,
  categoryId: 'salario'
}
// +$2000 (ingreso)
```

**expense (Gasto)**
```javascript
{
  type: 'expense',
  amount: 50,
  categoryId: 'comida'
}
// -$50 (gasto)
```

---

**Línea 9: description**
```typescript
description?: string;
```
- Descripción opcional de la transacción
- Máximo 500 caracteres
- Ejemplos: `"Almuerzo con cliente"`, `"Pago mensual"`

---

**Línea 10: date**
```typescript
date: Date;
```
- Fecha de la transacción
- Default: fecha actual
- Puede ser fecha pasada (registro retroactivo)

---

## 🔶 SCHEMA transactionSchema (Líneas 15-65)

### Líneas 17-22: userId

```typescript
userId: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: [true, 'El ID de usuario es requerido'],
  index: true,
},
```

**ref: 'User'**
- Referencia al modelo `User`
- Permite `populate()` para obtener datos del usuario

**Ejemplo de populate:**
```javascript
const transaction = await Transaction.findById(id).populate('userId', 'email name');
// {
//   _id: '507f...',
//   userId: {
//     _id: '507f...',
//     email: 'user@example.com',
//     name: 'John Doe'
//   },
//   amount: 50,
//   ...
// }
```

**index: true**
- Optimiza consultas por `userId`
- Esencial para filtrar transacciones del usuario

---

### Líneas 23-28: categoryId

```typescript
categoryId: {
  type: Schema.Types.ObjectId,
  ref: 'Category',
  required: [true, 'La categoría es requerida'],
  index: true,
},
```

**ref: 'Category'**
- Referencia al modelo `Category`
- Permite `populate()` para obtener datos de la categoría

**Ejemplo de populate:**
```javascript
const transaction = await Transaction.findById(id).populate('categoryId');
// {
//   _id: '507f...',
//   categoryId: {
//     _id: '507f...',
//     name: 'Comida',
//     icon: '🍔',
//     color: '#FF6B6B'
//   },
//   amount: 50,
//   ...
// }
```

**¿Por qué es requerida?**
- Todas las transacciones deben estar categorizadas
- Permite análisis por categoría
- Facilita reportes y estadísticas

---

### Líneas 29-39: amount

```typescript
amount: {
  type: Number,
  required: [true, 'El monto es requerido'],
  min: [0.01, 'El monto debe ser mayor a 0'],
  validate: {
    validator: function (value: number) {
      return value > 0;
    },
    message: 'El monto debe ser un número positivo',
  },
},
```

**Validaciones:**

**min: 0.01**
```javascript
// ❌ Cero
amount: 0
// Error: El monto debe ser mayor a 0

// ❌ Negativo
amount: -50
// Error: El monto debe ser mayor a 0

// ✅ Válido
amount: 0.01  // Mínimo permitido
amount: 50.00
amount: 2000.00
```

**Validador personalizado:**
```javascript
validator: function (value: number) {
  return value > 0;
}

// Asegura que el monto sea estrictamente positivo
// Doble validación para mayor seguridad
```

**¿Por qué siempre positivo?**
```javascript
// El signo lo determina el tipo
{ type: 'income', amount: 2000 }   // +$2000
{ type: 'expense', amount: 50 }    // -$50

// NO se guarda como:
{ type: 'expense', amount: -50 }   // ❌ Incorrecto
```

---

### Líneas 40-48: type

```typescript
type: {
  type: String,
  required: [true, 'El tipo de transacción es requerido'],
  enum: {
    values: ['income', 'expense'],
    message: 'El tipo debe ser "income" o "expense"',
  },
  index: true,
},
```

**enum:**
- Solo permite `'income'` o `'expense'`

**Ejemplo de error:**
```javascript
await Transaction.create({
  userId: '507f...',
  categoryId: '507f...',
  amount: 50,
  type: 'transfer'  // ❌ No está en enum
});

// Error: El tipo debe ser "income" o "expense"
```

**index: true**
- Optimiza consultas por tipo
- Útil para filtrar solo ingresos o solo gastos

---

### Líneas 49-53: description

```typescript
description: {
  type: String,
  trim: true,
  maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
},
```

**Opcional:**
- No es `required`
- Puede ser `undefined`

**trim: true**
```javascript
// Entrada
description: '  Almuerzo con cliente  '

// Guardado
description: 'Almuerzo con cliente'  // Sin espacios extra
```

**maxlength: 500**
```javascript
// ❌ Muy largo
description: 'A'.repeat(501)  // 501 caracteres
// Error: La descripción no puede exceder 500 caracteres
```

---

### Líneas 54-59: date

```typescript
date: {
  type: Date,
  required: [true, 'La fecha es requerida'],
  default: Date.now,
  index: true,
},
```

**default: Date.now**
```javascript
// Sin especificar fecha
await Transaction.create({
  userId: '507f...',
  categoryId: '507f...',
  amount: 50,
  type: 'expense'
  // date no especificado
});

// Resultado
{
  date: new Date()  // ← Fecha actual automática
}
```

**Registro retroactivo:**
```javascript
// Registrar transacción de ayer
await Transaction.create({
  userId: '507f...',
  categoryId: '507f...',
  amount: 50,
  type: 'expense',
  date: new Date('2025-11-26')  // Fecha específica
});
```

**index: true**
- Optimiza consultas por fecha
- Esencial para ordenar cronológicamente

---

### Líneas 61-64: Opciones del Schema

```typescript
{
  timestamps: true,
  versionKey: false,
}
```

**timestamps: true**
- Agrega automáticamente `createdAt` y `updatedAt`

**versionKey: false**
- No incluye campo `__v` (versión de Mongoose)

---

## 🔸 ÍNDICES (Líneas 67-69)

```typescript
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
```

### ¿Por qué múltiples índices?

**Cada índice optimiza consultas específicas**

### Índice 1: userId + date

```typescript
{ userId: 1, date: -1 }
```

**Optimiza:**
```javascript
// Transacciones del usuario, más recientes primero
Transaction.find({
  userId: '507f...'
}).sort({ date: -1 });
```

**Valores:**
- `1`: Orden ascendente
- `-1`: Orden descendente

---

### Índice 2: userId + categoryId

```typescript
{ userId: 1, categoryId: 1 }
```

**Optimiza:**
```javascript
// Transacciones del usuario en categoría específica
Transaction.find({
  userId: '507f...',
  categoryId: '507f...'
});
```

**Caso de uso:**
```javascript
// Ver todos los gastos en "Comida"
Transaction.find({
  userId: '507f...',
  categoryId: 'comida_id'
});
```

---

### Índice 3: userId + type + date

```typescript
{ userId: 1, type: 1, date: -1 }
```

**Optimiza:**
```javascript
// Solo ingresos del usuario, más recientes primero
Transaction.find({
  userId: '507f...',
  type: 'income'
}).sort({ date: -1 });

// Solo gastos del usuario, más recientes primero
Transaction.find({
  userId: '507f...',
  type: 'expense'
}).sort({ date: -1 });
```

---

## 🔹 MÉTODO toJSON (Líneas 71-84)

```typescript
transactionSchema.methods.toJSON = function () {
  const transaction = this.toObject();
  return {
    id: transaction._id,
    userId: transaction.userId,
    categoryId: transaction.categoryId,
    amount: transaction.amount,
    type: transaction.type,
    description: transaction.description,
    date: transaction.date,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
};
```

**¿Qué hace?**
- Personaliza la respuesta JSON
- Renombra `_id` a `id`

**Transformación:**
```javascript
// Documento en MongoDB
{
  _id: ObjectId('507f191e810c19729de860ea'),
  userId: ObjectId('507f191e810c19729de860eb'),
  categoryId: ObjectId('507f191e810c19729de860ec'),
  amount: 50,
  type: 'expense',
  description: 'Almuerzo',
  date: ISODate('2025-11-27T...'),
  createdAt: ISODate('2025-11-27T...'),
  updatedAt: ISODate('2025-11-27T...')
}

// Respuesta JSON
{
  "id": "507f191e810c19729de860ea",
  "userId": "507f191e810c19729de860eb",
  "categoryId": "507f191e810c19729de860ec",
  "amount": 50,
  "type": "expense",
  "description": "Almuerzo",
  "date": "2025-11-27T...",
  "createdAt": "2025-11-27T...",
  "updatedAt": "2025-11-27T..."
}
```

---

## 🎯 Ejemplos Completos

### Ejemplo 1: Crear Gasto

```javascript
const transaction = await Transaction.create({
  userId: '507f191e810c19729de860ea',
  categoryId: '507f191e810c19729de860eb',  // Comida
  amount: 50.00,
  type: 'expense',
  description: 'Almuerzo con cliente',
  date: new Date('2025-11-27')
});

console.log(transaction);
// {
//   id: '507f...',
//   userId: '507f...',
//   categoryId: '507f...',
//   amount: 50,
//   type: 'expense',
//   description: 'Almuerzo con cliente',
//   date: '2025-11-27T...',
//   createdAt: '2025-11-27T...',
//   updatedAt: '2025-11-27T...'
// }
```

---

### Ejemplo 2: Crear Ingreso

```javascript
const transaction = await Transaction.create({
  userId: '507f191e810c19729de860ea',
  categoryId: '507f191e810c19729de860ec',  // Salario
  amount: 2000.00,
  type: 'income',
  description: 'Pago mensual',
  date: new Date('2025-11-27')
});

console.log(transaction);
// {
//   id: '507f...',
//   amount: 2000,
//   type: 'income',
//   description: 'Pago mensual',
//   ...
// }
```

---

### Ejemplo 3: Obtener Transacciones del Usuario

```javascript
const transactions = await Transaction.find({
  userId: '507f191e810c19729de860ea'
})
.sort({ date: -1 })  // Más recientes primero
.limit(10)
.populate('categoryId', 'name icon color');

console.log(transactions);
// [
//   {
//     id: '507f...',
//     amount: 50,
//     type: 'expense',
//     categoryId: {
//       name: 'Comida',
//       icon: '🍔',
//       color: '#FF6B6B'
//     },
//     date: '2025-11-27T...'
//   },
//   ...
// ]
```

---

### Ejemplo 4: Filtrar por Tipo

```javascript
// Solo gastos
const expenses = await Transaction.find({
  userId: '507f191e810c19729de860ea',
  type: 'expense'
})
.sort({ date: -1 });

// Solo ingresos
const incomes = await Transaction.find({
  userId: '507f191e810c19729de860ea',
  type: 'income'
})
.sort({ date: -1 });
```

---

### Ejemplo 5: Filtrar por Categoría

```javascript
const foodExpenses = await Transaction.find({
  userId: '507f191e810c19729de860ea',
  categoryId: 'comida_id',
  type: 'expense'
})
.sort({ date: -1 });

console.log(`Total en comida: ${foodExpenses.length} transacciones`);
```

---

### Ejemplo 6: Filtrar por Rango de Fechas

```javascript
const startDate = new Date('2025-11-01');
const endDate = new Date('2025-11-30');

const monthTransactions = await Transaction.find({
  userId: '507f191e810c19729de860ea',
  date: {
    $gte: startDate,  // Mayor o igual
    $lte: endDate     // Menor o igual
  }
})
.sort({ date: -1 });

console.log(`Transacciones de noviembre: ${monthTransactions.length}`);
```

---

### Ejemplo 7: Calcular Balance

```javascript
const transactions = await Transaction.find({
  userId: '507f191e810c19729de860ea'
});

let balance = 0;
transactions.forEach(t => {
  if (t.type === 'income') {
    balance += t.amount;
  } else {
    balance -= t.amount;
  }
});

console.log(`Balance: $${balance.toFixed(2)}`);
```

---

### Ejemplo 8: Estadísticas por Categoría

```javascript
const stats = await Transaction.aggregate([
  {
    $match: {
      userId: mongoose.Types.ObjectId('507f...'),
      type: 'expense'
    }
  },
  {
    $group: {
      _id: '$categoryId',
      total: { $sum: '$amount' },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { total: -1 }
  }
]);

console.log(stats);
// [
//   { _id: 'comida_id', total: 500, count: 15 },
//   { _id: 'transporte_id', total: 300, count: 10 },
//   ...
// ]
```

---

## 📊 Casos de Uso del Sistema

### 1. Dashboard Principal

```javascript
// Obtener últimas 10 transacciones
const recent = await Transaction.find({ userId })
  .sort({ date: -1 })
  .limit(10)
  .populate('categoryId');

// Calcular balance del mes
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const monthTransactions = await Transaction.find({
  userId,
  date: { $gte: monthStart }
});

const monthBalance = monthTransactions.reduce((sum, t) => {
  return sum + (t.type === 'income' ? t.amount : -t.amount);
}, 0);
```

---

### 2. Análisis de Gastos

```javascript
// Gastos por categoría del mes
const expensesByCategory = await Transaction.aggregate([
  {
    $match: {
      userId: mongoose.Types.ObjectId(userId),
      type: 'expense',
      date: { $gte: monthStart }
    }
  },
  {
    $group: {
      _id: '$categoryId',
      total: { $sum: '$amount' }
    }
  },
  {
    $lookup: {
      from: 'categories',
      localField: '_id',
      foreignField: '_id',
      as: 'category'
    }
  }
]);
```

---

### 3. Predicciones de ML

```javascript
// Obtener datos históricos para entrenar modelo
const historicalData = await Transaction.find({
  userId,
  type: 'expense'
})
.sort({ date: 1 })  // Orden cronológico
.select('amount date categoryId');

// Agrupar por mes para predicciones
const monthlyData = groupByMonth(historicalData);
const predictions = await predictionEngine.predict(userId, 'linear_regression', 6);
```

---

### 4. Alertas Automáticas

```javascript
// Detectar sobregasto
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const recentExpenses = await Transaction.find({
  userId,
  type: 'expense',
  date: { $gte: thirtyDaysAgo }
});

const recentTotal = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
const recentAvg = recentTotal / 30;

if (recentAvg > previousAvg * 1.2) {
  await Alert.create({
    userId,
    type: 'overspending',
    message: `Gastos aumentaron ${increasePercent}%`
  });
}
```

---

## ✅ Mejores Prácticas

### 1. Siempre Filtrar por Usuario

```javascript
// ❌ Incorrecto: Obtiene TODAS las transacciones
const transactions = await Transaction.find();

// ✅ Correcto: Solo del usuario autenticado
const transactions = await Transaction.find({
  userId: req.user.id
});
```

### 2. Usar Populate para Categorías

```javascript
// ❌ Solo IDs
const transactions = await Transaction.find({ userId });
// categoryId: '507f...'

// ✅ Con datos de categoría
const transactions = await Transaction.find({ userId })
  .populate('categoryId', 'name icon color');
// categoryId: { name: 'Comida', icon: '🍔', color: '#FF6B6B' }
```

### 3. Ordenar por Fecha

```javascript
// ✅ Más recientes primero
Transaction.find({ userId }).sort({ date: -1 });

// ✅ Más antiguas primero (cronológico)
Transaction.find({ userId }).sort({ date: 1 });
```

### 4. Validar Pertenencia

```javascript
// Verificar que la transacción pertenece al usuario
const transaction = await Transaction.findOne({
  _id: transactionId,
  userId: req.user.id
});

if (!transaction) {
  return res.status(404).json({
    message: 'Transacción no encontrada'
  });
}
```

---

## 📝 Resumen

**Propósito:**
- Registrar todos los movimientos financieros
- Base para análisis, predicciones y alertas

**Tipos:**
- `income`: Ingresos (positivo)
- `expense`: Gastos (negativo)

**Campos clave:**
- `userId`: Usuario dueño
- `categoryId`: Categoría de la transacción
- `amount`: Monto (siempre positivo)
- `type`: income o expense
- `description`: Descripción opcional
- `date`: Fecha de la transacción

**Validaciones:**
- amount > 0
- type: solo 'income' o 'expense'
- categoryId y userId requeridos

**Índices:**
- userId + date (transacciones cronológicas)
- userId + categoryId (por categoría)
- userId + type + date (por tipo)

**Relaciones:**
- Pertenece a User (userId)
- Pertenece a Category (categoryId)

---

¡Documentación completa del modelo de Transacciones! Este es el corazón del sistema financiero. 💰📊

