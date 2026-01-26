# Documentación ULTRA Didáctica: Alert.model.ts

**Ubicación:** `src/models/Alert.model.ts`

**Propósito:** Este archivo define el **modelo de Alertas** del sistema. Las alertas son notificaciones inteligentes generadas automáticamente por el `alertGenerator` para informar al usuario sobre sobregastos, progreso de metas, patrones inusuales y recomendaciones. Es como un asistente financiero que te avisa cuando detecta algo importante.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina un asistente que vigila tus finanzas:

```
Sin alertas:
- Gastas más sin darte cuenta
- Metas se atrasan
- Patrones peligrosos pasan desapercibidos

Con alertas:
- "⚠️ Tus gastos aumentaron 30%"
- "🎯 Tu meta está retrasada"
- "💡 Considera reducir gastos en Comida"
→ Usuario informado y puede actuar
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (línea 1)                │
├──────────────────────────────────────────┤
│  INTERFACE IAlert (líneas 3-13)         │
│  └─ Define estructura TypeScript        │
├──────────────────────────────────────────┤
│  SCHEMA alertSchema (líneas 15-62)      │
│  ├─ userId (referencia a User)          │
│  ├─ type (tipo de alerta)               │
│  ├─ severity (nivel de importancia)     │
│  ├─ message (mensaje)                   │
│  ├─ isRead (leída o no)                 │
│  └─ relatedData (datos adicionales)     │
├──────────────────────────────────────────┤
│  ÍNDICES (líneas 64-66)                 │
│  └─ Optimización de consultas           │
├──────────────────────────────────────────┤
│  MÉTODO toJSON (líneas 68-81)           │
│  └─ Formatear respuesta                 │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (línea 83)                 │
│  └─ Modelo de Mongoose                  │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

## 🔷 INTERFACE IAlert (Líneas 3-13)

```typescript
export interface IAlert extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'overspending' | 'goal_progress' | 'unusual_pattern' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  isRead: boolean;
  relatedData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Campos Explicados

**Línea 4: _id**
```typescript
_id: mongoose.Types.ObjectId;
```
- ID único de MongoDB
- Generado automáticamente
- Ejemplo: `507f191e810c19729de860ea`

---

**Línea 5: userId**
```typescript
userId: mongoose.Types.ObjectId;
```
- Referencia al usuario que recibe la alerta
- Relación con modelo `User`

---

**Línea 6: type**
```typescript
type: 'overspending' | 'goal_progress' | 'unusual_pattern' | 'recommendation';
```

**Tipos de alertas:**

**1. overspending (Sobregasto)**
```javascript
{
  type: 'overspending',
  message: 'Tus gastos han aumentado un 30% en los últimos 30 días'
}
```

**2. goal_progress (Progreso de meta)**
```javascript
{
  type: 'goal_progress',
  message: 'La meta "Vacaciones" está retrasada. Progreso: 40%, esperado: 62%'
}
```

**3. unusual_pattern (Patrón inusual)**
```javascript
{
  type: 'unusual_pattern',
  message: 'Gastos inusuales detectados en la categoría "Entretenimiento"'
}
```

**4. recommendation (Recomendación)**
```javascript
{
  type: 'recommendation',
  message: 'Tu tasa de ahorro es del 5%. Se recomienda ahorrar al menos el 20%'
}
// Generado por: rules-based engine O Gemini AI
```
```

---

**Línea 7: severity**
```typescript
severity: 'info' | 'warning' | 'critical';
```

**Niveles de severidad:**

**1. info (Información)**
```javascript
{
  severity: 'info',
  message: '¡Casi lo logras! La meta está al 95%'
}
// Color: Azul 🔵
// Urgencia: Baja
```

**2. warning (Advertencia)**
```javascript
{
  severity: 'warning',
  message: 'Tus gastos han aumentado un 25%'
}
// Color: Amarillo 🟡
// Urgencia: Media
```

**3. critical (Crítico)**
```javascript
{
  severity: 'critical',
  message: 'La meta "Ahorro" ha expirado. Progreso: 60%'
}
// Color: Rojo 🔴
// Urgencia: Alta
```

---

**Línea 8: message**
```typescript
message: string;
```
- Mensaje descriptivo de la alerta
- Entre 10 y 1000 caracteres
- Ejemplo: `"Tus gastos han aumentado un 30% en los últimos 30 días"`

---

**Línea 9: isRead**
```typescript
isRead: boolean;
```
- Indica si el usuario ya leyó la alerta
- Default: `false`
- Usado para mostrar notificaciones no leídas

**Ejemplo:**
```javascript
// Alerta nueva
{ isRead: false }  // Mostrar badge de notificación

// Alerta leída
{ isRead: true }   // No mostrar badge
```

---

**Línea 10: relatedData**
```typescript
relatedData?: Record<string, any>;
```
- Datos adicionales relacionados con la alerta
- Opcional (?)
- Tipo flexible (cualquier objeto)

**Ejemplos:**

**Sobregasto:**
```javascript
relatedData: {
  recentAverage: 104,
  previousAverage: 80,
  increasePercent: 30,
  period: '30 días'
}
```

**Meta:**
```javascript
relatedData: {
  goalId: '507f...',
  goalName: 'Vacaciones',
  currentProgress: 40,
  expectedProgress: 62.6,
  daysRemaining: 20
}
```

**Patrón inusual:**
```javascript
relatedData: {
  categoryId: '507f...',
  categoryName: 'Entretenimiento',
  averageAmount: 50,
  unusualExpenses: [200, 180],
  unusualCount: 2
}
```

---

**Líneas 11-12: timestamps**
```typescript
createdAt: Date;
updatedAt: Date;
```
- Agregados automáticamente por Mongoose
- `createdAt`: Cuándo se creó la alerta
- `updatedAt`: Última modificación

---

## 🔶 SCHEMA alertSchema (Líneas 15-62)

### Líneas 17-22: userId

```typescript
userId: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: [true, 'El ID de usuario es requerido'],
  index: true,
},
```

**Campos:**

**type: Schema.Types.ObjectId**
- Tipo de dato: ObjectId de MongoDB

**ref: 'User'**
- Referencia al modelo `User`
- Permite hacer `populate()` para obtener datos del usuario

**required: true**
- Campo obligatorio
- No se puede crear alerta sin usuario

**index: true**
- Crea índice en este campo
- Optimiza consultas por `userId`

**Ejemplo de populate:**
```javascript
const alert = await Alert.findById(id).populate('userId', 'email name');
// {
//   _id: '507f...',
//   userId: {
//     _id: '507f...',
//     email: 'user@example.com',
//     name: 'John Doe'
//   },
//   type: 'overspending',
//   ...
// }
```

---

### Líneas 23-31: type

```typescript
type: {
  type: String,
  required: [true, 'El tipo de alerta es requerido'],
  enum: {
    values: ['overspending', 'goal_progress', 'unusual_pattern', 'recommendation'],
    message: 'El tipo debe ser: overspending, goal_progress, unusual_pattern o recommendation',
  },
  index: true,
},
```

**enum:**
- Solo permite valores específicos
- Si se intenta otro valor, lanza error

**Ejemplo de error:**
```javascript
await Alert.create({
  userId: '507f...',
  type: 'invalid_type',  // ❌ No está en enum
  severity: 'info',
  message: 'Test'
});

// Error: El tipo debe ser: overspending, goal_progress, unusual_pattern o recommendation
```

---

### Líneas 32-40: severity

```typescript
severity: {
  type: String,
  required: [true, 'La severidad es requerida'],
  enum: {
    values: ['info', 'warning', 'critical'],
    message: 'La severidad debe ser: info, warning o critical',
  },
  index: true,
},
```

**Validación similar a `type`**

**Uso en UI:**
```javascript
// Mapeo de severidad a colores
const severityColors = {
  info: 'blue',
  warning: 'yellow',
  critical: 'red'
};

// Mapeo a iconos
const severityIcons = {
  info: 'ℹ️',
  warning: '⚠️',
  critical: '🚨'
};
```

---

### Líneas 41-47: message

```typescript
message: {
  type: String,
  required: [true, 'El mensaje es requerido'],
  trim: true,
  minlength: [10, 'El mensaje debe tener al menos 10 caracteres'],
  maxlength: [1000, 'El mensaje no puede exceder 1000 caracteres'],
},
```

**Validaciones:**

**trim: true**
```javascript
// Entrada
message: '  Tus gastos aumentaron  '

// Guardado
message: 'Tus gastos aumentaron'  // Sin espacios extra
```

**minlength: 10**
```javascript
// ❌ Muy corto
message: 'Alerta'  // 6 caracteres
// Error: El mensaje debe tener al menos 10 caracteres

// ✅ Válido
message: 'Tus gastos aumentaron'  // 23 caracteres
```

**maxlength: 1000**
```javascript
// ❌ Muy largo
message: 'A'.repeat(1001)  // 1001 caracteres
// Error: El mensaje no puede exceder 1000 caracteres
```

---

### Líneas 48-52: isRead

```typescript
isRead: {
  type: Boolean,
  default: false,
  index: true,
},
```

**default: false**
- Todas las alertas nuevas son no leídas
- No es necesario especificar al crear

**Ejemplo:**
```javascript
// Crear alerta
await Alert.create({
  userId: '507f...',
  type: 'overspending',
  severity: 'warning',
  message: 'Gastos aumentaron'
  // isRead no especificado
});

// Resultado
{
  isRead: false  // ← Default aplicado
}
```

**Marcar como leída:**
```javascript
await Alert.findByIdAndUpdate(alertId, { isRead: true });
```

---

### Líneas 53-56: relatedData

```typescript
relatedData: {
  type: Schema.Types.Mixed,
  default: {},
},
```

**Schema.Types.Mixed:**
- Tipo flexible
- Puede ser cualquier objeto
- No tiene validación de estructura

**default: {}**
- Si no se proporciona, es objeto vacío

**Ejemplo:**
```javascript
// Sin relatedData
await Alert.create({
  userId: '507f...',
  type: 'overspending',
  severity: 'warning',
  message: 'Gastos aumentaron'
});
// relatedData = {}

// Con relatedData
await Alert.create({
  userId: '507f...',
  type: 'overspending',
  severity: 'warning',
  message: 'Gastos aumentaron',
  relatedData: {
    increasePercent: 30,
    period: '30 días'
  }
});
```

---

### Líneas 58-61: Opciones del Schema

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

## 🔸 ÍNDICES (Líneas 64-66)

```typescript
alertSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
alertSchema.index({ userId: 1, type: 1, severity: 1 });
alertSchema.index({ userId: 1, severity: 1, createdAt: -1 });
```

### ¿Qué son los índices?

**Analogía:**
```
Índice = Índice de un libro
Sin índice: Leer todo el libro para encontrar un tema
Con índice: Ir directo a la página
```

### Índice 1: userId + isRead + createdAt

```typescript
alertSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
```

**Optimiza consulta:**
```javascript
// Obtener alertas no leídas del usuario, más recientes primero
Alert.find({
  userId: '507f...',
  isRead: false
}).sort({ createdAt: -1 });
```

**Valores:**
- `1`: Orden ascendente
- `-1`: Orden descendente

---

### Índice 2: userId + type + severity

```typescript
alertSchema.index({ userId: 1, type: 1, severity: 1 });
```

**Optimiza consulta:**
```javascript
// Obtener alertas críticas de sobregasto del usuario
Alert.find({
  userId: '507f...',
  type: 'overspending',
  severity: 'critical'
});
```

---

### Índice 3: userId + severity + createdAt

```typescript
alertSchema.index({ userId: 1, severity: 1, createdAt: -1 });
```

**Optimiza consulta:**
```javascript
// Obtener alertas críticas del usuario, más recientes primero
Alert.find({
  userId: '507f...',
  severity: 'critical'
}).sort({ createdAt: -1 });
```

---

## 🔹 MÉTODO toJSON (Líneas 68-81)

```typescript
alertSchema.methods.toJSON = function () {
  const alert = this.toObject();
  return {
    id: alert._id,
    userId: alert.userId,
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    isRead: alert.isRead,
    relatedData: alert.relatedData,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
  };
};
```

**¿Qué hace?**
- Personaliza la respuesta JSON
- Renombra `_id` a `id`
- Excluye `__v` (ya excluido con `versionKey: false`)

**Transformación:**
```javascript
// Documento en MongoDB
{
  _id: ObjectId('507f191e810c19729de860ea'),
  userId: ObjectId('507f191e810c19729de860eb'),
  type: 'overspending',
  severity: 'warning',
  message: 'Gastos aumentaron',
  isRead: false,
  relatedData: { increasePercent: 30 },
  createdAt: ISODate('2025-11-27T...'),
  updatedAt: ISODate('2025-11-27T...')
}

// Respuesta JSON (después de toJSON)
{
  "id": "507f191e810c19729de860ea",
  "userId": "507f191e810c19729de860eb",
  "type": "overspending",
  "severity": "warning",
  "message": "Gastos aumentaron",
  "isRead": false,
  "relatedData": { "increasePercent": 30 },
  "createdAt": "2025-11-27T...",
  "updatedAt": "2025-11-27T..."
}
```

---

## 🎯 Ejemplos Completos

### Ejemplo 1: Crear Alerta de Sobregasto

```javascript
const alert = await Alert.create({
  userId: '507f191e810c19729de860ea',
  type: 'overspending',
  severity: 'warning',
  message: 'Tus gastos han aumentado un 30% en los últimos 30 días. Gasto diario promedio: $104.00 (antes: $80.00)',
  relatedData: {
    recentAverage: 104,
    previousAverage: 80,
    increasePercent: 30,
    period: '30 días'
  }
});

console.log(alert);
// {
//   id: '507f...',
//   userId: '507f...',
//   type: 'overspending',
//   severity: 'warning',
//   message: 'Tus gastos han aumentado...',
//   isRead: false,
//   relatedData: { ... },
//   createdAt: '2025-11-27T...',
//   updatedAt: '2025-11-27T...'
// }
```

---

### Ejemplo 2: Obtener Alertas No Leídas

```javascript
const unreadAlerts = await Alert.find({
  userId: '507f191e810c19729de860ea',
  isRead: false
})
.sort({ createdAt: -1 })
.limit(10);

console.log(`Tienes ${unreadAlerts.length} alertas no leídas`);
```

---

### Ejemplo 3: Marcar Alerta como Leída

```javascript
await Alert.findByIdAndUpdate(
  '507f191e810c19729de860ea',
  { isRead: true }
);
```

---

### Ejemplo 4: Obtener Alertas Críticas

```javascript
const criticalAlerts = await Alert.find({
  userId: '507f191e810c19729de860ea',
  severity: 'critical',
  isRead: false
})
.sort({ createdAt: -1 });

console.log(`Tienes ${criticalAlerts.length} alertas críticas`);
```

---

### Ejemplo 5: Filtrar por Tipo

```javascript
const goalAlerts = await Alert.find({
  userId: '507f191e810c19729de860ea',
  type: 'goal_progress'
})
.sort({ createdAt: -1 });
```

---

## 📊 Resumen de Tipos y Severidades

### Tabla de Combinaciones Comunes

| Tipo | Severidad | Ejemplo |
|------|-----------|---------|
| overspending | warning | Gastos aumentaron 25% |
| overspending | critical | Gastos aumentaron 60% |
| goal_progress | info | Meta al 95% |
| goal_progress | warning | Meta retrasada |
| goal_progress | critical | Meta expirada |
| unusual_pattern | info | Transacciones altas detectadas |
| unusual_pattern | warning | Gastos inusuales en categoría |
| recommendation | info | Tasa de ahorro baja |

---

## 📝 Resumen

**Propósito:**
- Almacenar alertas generadas automáticamente
- Notificar al usuario sobre eventos importantes

**Tipos de alertas:**
- `overspending`: Sobregasto detectado
- `goal_progress`: Progreso de metas
- `unusual_pattern`: Patrones inusuales
- `recommendation`: Recomendaciones

**Severidades:**
- `info`: Información (azul)
- `warning`: Advertencia (amarillo)
- `critical`: Crítico (rojo)

**Campos clave:**
- `userId`: Usuario que recibe la alerta
- `type`: Tipo de alerta
- `severity`: Nivel de importancia
- `message`: Mensaje descriptivo
- `isRead`: Si fue leída
- `relatedData`: Datos adicionales

**Índices:**
- Optimizan consultas por usuario, tipo, severidad y fecha

---

¡Documentación completa del modelo de Alertas! Este es el sistema de notificaciones inteligentes del sistema. 🚨📬

