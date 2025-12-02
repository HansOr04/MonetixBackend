# Documentación ULTRA Didáctica: Goal.model.ts

**Ubicación:** `src/models/Goal.model.ts`

**Propósito:** Este archivo define el **modelo de Metas Financieras** del sistema. Las metas permiten a los usuarios establecer objetivos de ahorro con montos y fechas específicas. El sistema **calcula automáticamente el progreso** y **cambia el estado** cuando se completa. Es como tener un rastreador de objetivos que te muestra qué tan cerca estás de lograr tus metas.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina establecer metas de ahorro:

```
Sin metas:
- Ahorras sin objetivo claro
- No sabes cuánto falta
- Difícil mantener motivación

Con metas:
🎯 Vacaciones: $1,500 / $2,000 (75%)
🎯 Auto nuevo: $5,000 / $20,000 (25%)
🎯 Fondo emergencia: $3,000 / $3,000 (100%) ✅
→ Objetivos claros y progreso visible
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (línea 1)                │
├──────────────────────────────────────────┤
│  INTERFACE IGoal (líneas 3-16)          │
│  └─ Define estructura TypeScript        │
├──────────────────────────────────────────┤
│  SCHEMA goalSchema (líneas 18-91)       │
│  ├─ userId (referencia a User)          │
│  ├─ name (nombre de la meta)            │
│  ├─ targetAmount (monto objetivo)       │
│  ├─ currentAmount (monto actual)        │
│  ├─ targetDate (fecha objetivo)         │
│  ├─ status (active/completed/cancelled) │
│  ├─ description (opcional)              │
│  └─ progress (0-100%)                   │
├──────────────────────────────────────────┤
│  ÍNDICES (líneas 93-94)                 │
│  └─ Optimización de consultas           │
├──────────────────────────────────────────┤
│  MÉTODO calculateProgress (líneas 96-100)│
│  └─ Calcula porcentaje de progreso      │
├──────────────────────────────────────────┤
│  MIDDLEWARE pre-save (líneas 102-110)   │
│  ├─ Actualiza progress                  │
│  └─ Completa meta automáticamente       │
├──────────────────────────────────────────┤
│  MÉTODO toJSON (líneas 112-127)         │
│  └─ Formatear respuesta                 │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (línea 129)                │
│  └─ Modelo de Mongoose                  │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

## 🔷 INTERFACE IGoal (Líneas 3-16)

```typescript
export interface IGoal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  status: 'active' | 'completed' | 'cancelled';
  description?: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  calculateProgress(): number;
}
```

### Campos Explicados

**Línea 6: name**
```typescript
name: string;
```
- Nombre descriptivo de la meta
- Ejemplos: `"Vacaciones"`, `"Auto nuevo"`, `"Fondo de emergencia"`

---

**Línea 7: targetAmount**
```typescript
targetAmount: number;
```
- Monto objetivo a alcanzar
- Debe ser mayor a 0
- Ejemplo: `2000` (quiero ahorrar $2,000)

---

**Línea 8: currentAmount**
```typescript
currentAmount: number;
```
- Monto actual ahorrado
- Default: `0`
- Debe ser ≥ 0
- Ejemplo: `1500` (he ahorrado $1,500)

---

**Línea 9: targetDate**
```typescript
targetDate: Date;
```
- Fecha límite para alcanzar la meta
- Debe ser en el futuro
- Ejemplo: `new Date('2025-12-31')`

---

**Línea 10: status**
```typescript
status: 'active' | 'completed' | 'cancelled';
```

**Estados:**

**1. active (Activa)**
```javascript
{
  status: 'active',
  progress: 75
}
// Meta en progreso
```

**2. completed (Completada)**
```javascript
{
  status: 'completed',
  progress: 100
}
// Meta alcanzada ✅
// Cambia automáticamente cuando progress ≥ 100%
```

**3. cancelled (Cancelada)**
```javascript
{
  status: 'cancelled',
  progress: 50
}
// Usuario canceló la meta
```

---

**Línea 11: description**
```typescript
description?: string;
```
- Descripción opcional de la meta
- Máximo 500 caracteres
- Ejemplo: `"Ahorrar para vacaciones en Europa en verano"`

---

**Línea 12: progress**
```typescript
progress: number;
```
- Porcentaje de progreso (0-100)
- **Calculado automáticamente** en cada guardado
- Fórmula: `(currentAmount / targetAmount) * 100`

**Ejemplo:**
```javascript
targetAmount: 2000
currentAmount: 1500

progress = (1500 / 2000) * 100 = 75%
```

---

**Línea 15: calculateProgress()**
```typescript
calculateProgress(): number;
```
- Método para calcular el progreso
- Retorna número entre 0 y 100

---

## 🔶 SCHEMA goalSchema (Líneas 18-91)

### Líneas 20-25: userId

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

**index: true**
- Optimiza consultas por `userId`

---

### Líneas 26-32: name

```typescript
name: {
  type: String,
  required: [true, 'El nombre de la meta es requerido'],
  trim: true,
  minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
  maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
},
```

**Validaciones:**

**minlength: 3**
```javascript
// ❌ Muy corto
name: 'PC'  // 2 caracteres
// Error: El nombre debe tener al menos 3 caracteres

// ✅ Válido
name: 'Auto'  // 4 caracteres
```

**maxlength: 100**
```javascript
// ❌ Muy largo
name: 'A'.repeat(101)  // 101 caracteres
// Error: El nombre no puede exceder 100 caracteres
```

---

### Líneas 33-43: targetAmount

```typescript
targetAmount: {
  type: Number,
  required: [true, 'El monto objetivo es requerido'],
  min: [0.01, 'El monto objetivo debe ser mayor a 0'],
  validate: {
    validator: function (value: number) {
      return value > 0;
    },
    message: 'El monto objetivo debe ser positivo',
  },
},
```

**Validaciones:**

**min: 0.01**
```javascript
// ❌ Cero o negativo
targetAmount: 0
// Error: El monto objetivo debe ser mayor a 0

// ✅ Válido
targetAmount: 100
```

**Validador personalizado:**
```javascript
validator: function (value: number) {
  return value > 0;
}

// Asegura que el valor sea estrictamente positivo
```

---

### Líneas 44-54: currentAmount

```typescript
currentAmount: {
  type: Number,
  default: 0,
  min: [0, 'El monto actual no puede ser negativo'],
  validate: {
    validator: function (value: number) {
      return value >= 0;
    },
    message: 'El monto actual debe ser mayor o igual a 0',
  },
},
```

**default: 0**
```javascript
// Al crear meta sin especificar currentAmount
await Goal.create({
  name: 'Vacaciones',
  targetAmount: 2000,
  targetDate: new Date('2025-12-31')
});

// Resultado
{
  currentAmount: 0  // ← Default aplicado
}
```

**Validación:**
```javascript
// ❌ Negativo
currentAmount: -100
// Error: El monto actual no puede ser negativo

// ✅ Válido
currentAmount: 0
currentAmount: 1500
```

---

### Líneas 55-65: targetDate

```typescript
targetDate: {
  type: Date,
  required: [true, 'La fecha objetivo es requerida'],
  validate: {
    validator: function (value: Date) {
      return value > new Date();
    },
    message: 'La fecha objetivo debe ser en el futuro',
  },
  index: true,
},
```

**Validador personalizado:**
```javascript
validator: function (value: Date) {
  return value > new Date();
}

// Asegura que la fecha sea futura
```

**Ejemplo:**
```javascript
// Hoy: 2025-11-27

// ❌ Fecha pasada
targetDate: new Date('2025-11-20')
// Error: La fecha objetivo debe ser en el futuro

// ❌ Fecha de hoy
targetDate: new Date('2025-11-27')
// Error: La fecha objetivo debe ser en el futuro

// ✅ Fecha futura
targetDate: new Date('2025-12-31')
```

---

### Líneas 66-74: status

```typescript
status: {
  type: String,
  enum: {
    values: ['active', 'completed', 'cancelled'],
    message: 'El estado debe ser "active", "completed" o "cancelled"',
  },
  default: 'active',
  index: true,
},
```

**default: 'active'**
```javascript
// Al crear meta
await Goal.create({
  name: 'Vacaciones',
  targetAmount: 2000,
  targetDate: new Date('2025-12-31')
});

// Resultado
{
  status: 'active'  // ← Default aplicado
}
```

**enum:**
- Solo permite: `'active'`, `'completed'`, `'cancelled'`

---

### Líneas 75-79: description

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

---

### Líneas 80-85: progress

```typescript
progress: {
  type: Number,
  default: 0,
  min: 0,
  max: 100,
},
```

**Rango:**
- Mínimo: 0
- Máximo: 100

**Actualizado automáticamente:**
- Se calcula en el middleware `pre-save`
- No es necesario especificarlo manualmente

---

## 🔸 ÍNDICES (Líneas 93-94)

```typescript
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, targetDate: 1 });
```

### Índice 1: userId + status

```typescript
{ userId: 1, status: 1 }
```

**Optimiza consulta:**
```javascript
// Obtener metas activas del usuario
Goal.find({
  userId: '507f...',
  status: 'active'
});
```

---

### Índice 2: userId + targetDate

```typescript
{ userId: 1, targetDate: 1 }
```

**Optimiza consulta:**
```javascript
// Obtener metas del usuario ordenadas por fecha
Goal.find({
  userId: '507f...'
}).sort({ targetDate: 1 });
```

---

## 🔹 MÉTODO calculateProgress (Líneas 96-100)

```typescript
goalSchema.methods.calculateProgress = function (): number {
  if (this.targetAmount <= 0) return 0;
  const progress = (this.currentAmount / this.targetAmount) * 100;
  return Math.min(Math.round(progress * 100) / 100, 100);
};
```

**¿Qué hace?**
1. Verifica que `targetAmount` sea válido
2. Calcula porcentaje: `(actual / objetivo) * 100`
3. Redondea a 2 decimales
4. Limita a máximo 100

**Paso a paso:**

**Línea 97: Validar targetAmount**
```javascript
if (this.targetAmount <= 0) return 0;

// Previene división por cero
```

**Línea 98: Calcular progreso**
```javascript
const progress = (this.currentAmount / this.targetAmount) * 100;

// Ejemplo:
currentAmount = 1500
targetAmount = 2000

progress = (1500 / 2000) * 100 = 75
```

**Línea 99: Redondear y limitar**
```javascript
Math.round(progress * 100) / 100  // Redondea a 2 decimales
Math.min(..., 100)                 // Máximo 100

// Ejemplo 1: Progreso normal
progress = 75.6789
Math.round(75.6789 * 100) / 100 = 75.68
Math.min(75.68, 100) = 75.68

// Ejemplo 2: Progreso > 100%
progress = 125
Math.round(125 * 100) / 100 = 125
Math.min(125, 100) = 100  // ← Limitado a 100
```

---

## 🔺 MIDDLEWARE pre-save (Líneas 102-110)

```typescript
goalSchema.pre('save', function (next) {
  this.progress = this.calculateProgress();
  
  if (this.progress >= 100 && this.status === 'active') {
    this.status = 'completed';
  }
  
  next();
});
```

**¿Qué hace?**
1. Calcula y actualiza el progreso automáticamente
2. Si progreso ≥ 100% y meta activa, la completa automáticamente

### Flujo

**Caso 1: Meta en progreso**
```javascript
// Antes de guardar
{
  currentAmount: 1500,
  targetAmount: 2000,
  status: 'active',
  progress: 0  // Valor anterior
}

// Middleware ejecuta
this.progress = this.calculateProgress()  // 75

// Después de guardar
{
  currentAmount: 1500,
  targetAmount: 2000,
  status: 'active',
  progress: 75  // ← Actualizado automáticamente
}
```

---

**Caso 2: Meta completada**
```javascript
// Antes de guardar
{
  currentAmount: 2000,
  targetAmount: 2000,
  status: 'active',
  progress: 75  // Valor anterior
}

// Middleware ejecuta
this.progress = this.calculateProgress()  // 100
this.progress >= 100 && this.status === 'active'  // true
this.status = 'completed'  // ← Cambia automáticamente

// Después de guardar
{
  currentAmount: 2000,
  targetAmount: 2000,
  status: 'completed',  // ← Cambiado automáticamente
  progress: 100         // ← Actualizado automáticamente
}
```

---

**Caso 3: Meta excede objetivo**
```javascript
// Antes de guardar
{
  currentAmount: 2500,
  targetAmount: 2000,
  status: 'active'
}

// Middleware ejecuta
this.progress = this.calculateProgress()  // 100 (limitado)
this.status = 'completed'

// Después de guardar
{
  currentAmount: 2500,
  targetAmount: 2000,
  status: 'completed',
  progress: 100  // ← Limitado a 100
}
```

---

## 🔻 MÉTODO toJSON (Líneas 112-127)

```typescript
goalSchema.methods.toJSON = function () {
  const goal = this.toObject();
  return {
    id: goal._id,
    userId: goal.userId,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    targetDate: goal.targetDate,
    status: goal.status,
    description: goal.description,
    progress: goal.progress,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
};
```

**¿Qué hace?**
- Personaliza la respuesta JSON
- Renombra `_id` a `id`

---

## 🎯 Ejemplos Completos

### Ejemplo 1: Crear Meta

```javascript
const goal = await Goal.create({
  userId: '507f191e810c19729de860ea',
  name: 'Vacaciones en Europa',
  targetAmount: 2000,
  currentAmount: 0,
  targetDate: new Date('2025-12-31'),
  description: 'Ahorrar para viaje de verano'
});

console.log(goal);
// {
//   id: '507f...',
//   userId: '507f...',
//   name: 'Vacaciones en Europa',
//   targetAmount: 2000,
//   currentAmount: 0,
//   targetDate: '2025-12-31T...',
//   status: 'active',        // ← Default
//   description: 'Ahorrar para viaje de verano',
//   progress: 0,             // ← Calculado automáticamente
//   createdAt: '2025-11-27T...',
//   updatedAt: '2025-11-27T...'
// }
```

---

### Ejemplo 2: Actualizar Progreso

```javascript
// Obtener meta
const goal = await Goal.findById('507f...');

// Actualizar monto actual
goal.currentAmount = 1500;
await goal.save();

// Resultado
console.log(goal.progress);  // 75 (calculado automáticamente)
console.log(goal.status);    // 'active'
```

---

### Ejemplo 3: Completar Meta Automáticamente

```javascript
// Meta casi completa
const goal = await Goal.findById('507f...');
console.log(goal.currentAmount);  // 1900
console.log(goal.targetAmount);   // 2000
console.log(goal.status);         // 'active'

// Alcanzar objetivo
goal.currentAmount = 2000;
await goal.save();

// Resultado
console.log(goal.progress);  // 100
console.log(goal.status);    // 'completed' ← Cambiado automáticamente
```

---

### Ejemplo 4: Obtener Metas Activas

```javascript
const activeGoals = await Goal.find({
  userId: '507f191e810c19729de860ea',
  status: 'active'
})
.sort({ targetDate: 1 });

console.log(activeGoals);
// [
//   { name: 'Fondo emergencia', progress: 60, targetDate: '2025-12-15' },
//   { name: 'Vacaciones', progress: 75, targetDate: '2025-12-31' },
//   { name: 'Auto nuevo', progress: 25, targetDate: '2026-06-30' }
// ]
```

---

### Ejemplo 5: Cancelar Meta

```javascript
await Goal.findByIdAndUpdate(
  '507f...',
  { status: 'cancelled' }
);
```

---

## 📊 Ciclo de Vida de una Meta

```
1. Creación
   ↓
   status: 'active'
   progress: 0%
   
2. Progreso
   ↓
   currentAmount aumenta
   progress se actualiza automáticamente
   
3. Completada (automático)
   ↓
   progress >= 100%
   status cambia a 'completed'
   
4. Cancelada (manual)
   ↓
   Usuario cancela
   status cambia a 'cancelled'
```

---

## ✅ Mejores Prácticas

### 1. No Actualizar progress Manualmente

```javascript
// ❌ Incorrecto
goal.progress = 75;
await goal.save();

// ✅ Correcto: Actualizar currentAmount
goal.currentAmount = 1500;
await goal.save();
// progress se calcula automáticamente
```

### 2. Validar Fecha Futura

```javascript
// ✅ Validar antes de crear
const targetDate = new Date('2025-12-31');
if (targetDate <= new Date()) {
  return res.status(400).json({
    message: 'La fecha debe ser en el futuro'
  });
}

await Goal.create({ ..., targetDate });
```

### 3. Incrementar currentAmount

```javascript
// ✅ Incrementar monto
const goal = await Goal.findById(goalId);
goal.currentAmount += amount;
await goal.save();
// progress se actualiza automáticamente
```

---

## 📝 Resumen

**Propósito:**
- Gestionar metas financieras de ahorro
- Calcular progreso automáticamente
- Completar metas automáticamente

**Campos clave:**
- `name`: Nombre de la meta
- `targetAmount`: Monto objetivo (> 0)
- `currentAmount`: Monto actual (≥ 0)
- `targetDate`: Fecha límite (futura)
- `status`: active, completed, cancelled
- `progress`: 0-100% (calculado automáticamente)

**Automatizaciones:**
- `progress` se calcula en cada guardado
- `status` cambia a 'completed' cuando progress ≥ 100%

**Validaciones:**
- targetAmount > 0
- currentAmount ≥ 0
- targetDate > hoy

**Índices:**
- userId + status
- userId + targetDate

---

¡Documentación completa del modelo de Metas! Este es el sistema de objetivos financieros con progreso automático. 🎯💰

