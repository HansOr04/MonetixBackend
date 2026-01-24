# Documentación ULTRA Didáctica: Prediction.model.ts

**Ubicación:** `src/models/Prediction.model.ts`

**Propósito:** Este archivo define el modelo de datos para las predicciones financieras generadas por machine learning. Es como el "molde" o "plantilla" que determina cómo se guardan las predicciones en MongoDB.

---

## 🎯 ¿Qué es este archivo?

Imagina que las predicciones son como **recetas de cocina guardadas en un libro**:
- El **modelo** es el formato del libro (qué secciones tiene cada receta)
- Cada **predicción guardada** es una receta específica en el libro
- **MongoDB** es la biblioteca donde se guardan todos los libros

Este archivo define:
1. **Qué información** se guarda en cada predicción
2. **Qué reglas** debe cumplir esa información
3. **Cómo se organiza** la información
4. **Cuánto tiempo** se conserva la predicción

---

## 📚 Estructura del Archivo

El archivo tiene 3 partes principales:

```
┌─────────────────────────────────────┐
│  1. INTERFACES (líneas 3-31)       │  ← Define los "tipos" de datos
│     - IPredictionPoint              │
│     - IModelMetadata                │
│     - IPrediction                   │
├─────────────────────────────────────┤
│  2. SCHEMAS (líneas 33-108)        │  ← Define las reglas de validación
│     - predictionPointSchema         │
│     - predictionSchema              │
├─────────────────────────────────────┤
│  3. CONFIGURACIÓN (líneas 110-137) │  ← Índices, middlewares, métodos
│     - Índices                       │
│     - Middleware pre-save           │
│     - Método toJSON                 │
│     - Exportación del modelo        │
└─────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

### Línea 1: Importaciones

```typescript
import mongoose, { Schema, Document } from 'mongoose';
```

**¿Qué hace?**
- Importa las herramientas necesarias de Mongoose
- **`mongoose`**: Librería principal para trabajar con MongoDB
- **`Schema`**: Constructor para crear esquemas (plantillas)
- **`Document`**: Tipo TypeScript para documentos de MongoDB

**Analogía:**
```
mongoose = Caja de herramientas completa
Schema = Plantilla para crear moldes
Document = Tipo de papel especial para escribir
```

---

## 🔷 PARTE 1: INTERFACES (Definición de Tipos)

### Líneas 3-8: Interface IPredictionPoint

```typescript
export interface IPredictionPoint {
  date: Date;
  amount: number;
  lowerBound: number;
  upperBound: number;
}
```

**¿Qué es esto?**
- Define la estructura de **UN SOLO PUNTO** de predicción
- Es como una fila en una tabla de Excel

**Campos explicados:**

| Campo | Tipo | Significado | Ejemplo |
|-------|------|-------------|---------|
| `date` | Date | Fecha del pronóstico | `2025-12-01` |
| `amount` | number | Monto predicho | `1500` |
| `lowerBound` | number | Límite inferior (peor caso) | `1350` |
| `upperBound` | number | Límite superior (mejor caso) | `1650` |

**Ejemplo visual:**

```javascript
// Un punto de predicción
{
  date: new Date('2025-12-01'),
  amount: 1500,        // Predicción: $1500
  lowerBound: 1350,    // Mínimo esperado: $1350
  upperBound: 1650     // Máximo esperado: $1650
}
```

**Interpretación:**
```
📊 Predicción para Diciembre 2025:
   Monto esperado: $1,500
   Rango: $1,350 - $1,650
   
   Significa: "Probablemente gastes $1,500,
              pero podría ser entre $1,350 y $1,650"
```

**¿Por qué límites inferior y superior?**
- Las predicciones no son exactas al 100%
- Los límites muestran el **rango de confianza**
- Es como decir "entre 20°C y 25°C" en lugar de "exactamente 22.5°C"

---

### Líneas 10-19: Interface IModelMetadata

```typescript
export interface IModelMetadata {
  name: string;
  parameters?: Record<string, any>;
  training_samples?: number;
  r_squared?: number;
  mape?: number;
  mae?: number;
  rmse?: number;
  [key: string]: any;
}
```

**¿Qué es esto?**
- Información **sobre el modelo** que generó la predicción
- Es como la "ficha técnica" del algoritmo de machine learning

**Campos explicados:**

| Campo | Tipo | Significado | Ejemplo |
|-------|------|-------------|---------|
| `name` | string | Nombre del modelo | `"Linear Regression"` |
| `parameters` | object | Configuración del modelo | `{ slope: 0.5 }` |
| `training_samples` | number | Datos usados para entrenar | `120` |
| `r_squared` | number | Calidad del ajuste (0-1) | `0.85` |
| `mape` | number | Error porcentual promedio | `5.3` |
| `mae` | number | Error absoluto promedio | `75.5` |
| `rmse` | number | Error cuadrático medio | `95.2` |

**¿Qué significa el `?` después del nombre?**
```typescript
parameters?: Record<string, any>
```
- El `?` significa **OPCIONAL**
- Puede estar presente o no
- Si no está, su valor es `undefined`

**¿Qué es `Record<string, any>`?**
```typescript
Record<string, any>
```
- Es un objeto con:
  - **Claves (keys)**: strings
  - **Valores (values)**: cualquier tipo (any)

**Ejemplo:**
```javascript
parameters: {
  slope: 0.5,           // number
  intercept: 100,       // number
  learning_rate: 0.01   // number
}
```

**¿Qué es `[key: string]: any`?**
```typescript
[key: string]: any;
```
- **Índice de firma** (index signature)
- Permite agregar **cualquier propiedad adicional**
- Hace el objeto flexible

**Ejemplo:**
```javascript
metadata: {
  name: "Linear Regression",
  mape: 5.3,
  // Propiedades adicionales permitidas:
  custom_metric: 0.95,
  algorithm_version: "2.0",
  anything_else: "allowed"
}
```

**Métricas de precisión explicadas:**

**R² (R-squared):**
```
Valor: 0 a 1
0.85 = 85% de precisión
Interpretación: "El modelo explica el 85% de la variación en los datos"
```

**MAPE (Mean Absolute Percentage Error):**
```
Valor: Porcentaje
5.3 = Error del 5.3%
Interpretación: "En promedio, la predicción se equivoca en un 5.3%"
```

**MAE (Mean Absolute Error):**
```
Valor: En unidades (dólares)
75.5 = Error de $75.50
Interpretación: "En promedio, la predicción se equivoca en $75.50"
```

**RMSE (Root Mean Square Error):**
```
Valor: En unidades (dólares)
95.2 = Error de $95.20
Interpretación: "Error cuadrático medio de $95.20"
(Penaliza errores grandes más que MAE)
```

---

### Líneas 21-31: Interface IPrediction

```typescript
export interface IPrediction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  modelType: 'linear_regression';
  predictions: IPredictionPoint[];
  alerts: string[]; // <-- Nuevo campo para alertas IA
  confidence: number;
  metadata: IModelMetadata;
  generatedAt: Date;
  expiresAt: Date;
  createdAt: Date;
}
```

**¿Qué es esto?**
- Define la estructura **COMPLETA** de una predicción
- Es la interface principal del modelo

**¿Qué es `extends Document`?**
```typescript
extends Document
```
- **Herencia** de TypeScript
- `IPrediction` hereda todas las propiedades de `Document`
- `Document` incluye métodos de Mongoose como `.save()`, `.remove()`, etc.

**Campos explicados:**

| Campo | Tipo | Significado | Ejemplo |
|-------|------|-------------|---------|
| `_id` | ObjectId | ID único de la predicción | `507f1f77bcf86cd799439011` |
| `userId` | ObjectId | ID del usuario | `507f191e810c19729de860ea` |
| `modelType` | string | Tipo de modelo usado | `'linear_regression'` |
| `predictions` | array | Array de puntos de predicción | `[{...}, {...}]` |
| `confidence` | number | Nivel de confianza (0-1) | `0.85` |
| `metadata` | object | Información del modelo | `{ name: "...", ... }` |
| `generatedAt` | Date | Cuándo se generó | `2025-11-27T16:00:00Z` |
| `expiresAt` | Date | Cuándo expira | `2025-11-28T16:00:00Z` |
| `createdAt` | Date | Cuándo se guardó en BD | `2025-11-27T16:00:00Z` |

**¿Qué es `IPredictionPoint[]`?**
```typescript
predictions: IPredictionPoint[]
```
- `[]` significa **ARRAY** (lista)
- Array de objetos tipo `IPredictionPoint`

**Ejemplo completo de una predicción:**

```javascript
{
  _id: ObjectId('507f1f77bcf86cd799439011'),
  userId: ObjectId('507f191e810c19729de860ea'),
  modelType: 'linear_regression',
  
  predictions: [
    {
      date: new Date('2025-12-01'),
      amount: 1500,
      lowerBound: 1350,
      upperBound: 1650
    },
    {
      date: new Date('2026-01-01'),
      amount: 1550,
      lowerBound: 1400,
      upperBound: 1700
    },
    {
      date: new Date('2026-02-01'),
      amount: 1600,
      lowerBound: 1450,
      upperBound: 1750
    }
  ],
  
  confidence: 0.85,
  
  metadata: {
    name: 'Linear Regression',
    training_samples: 120,
    r_squared: 0.85,
    mape: 5.3,
    mae: 75.5,
    rmse: 95.2
  },
  
  generatedAt: new Date('2025-11-27T16:00:00Z'),
  expiresAt: new Date('2025-11-28T16:00:00Z'),
  createdAt: new Date('2025-11-27T16:00:00Z')
}
```

---

## 🔶 PARTE 2: SCHEMAS (Reglas de Validación)

### Líneas 33-53: Schema de PredictionPoint

```typescript
const predictionPointSchema = new Schema<IPredictionPoint>(
  {
    date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    lowerBound: {
      type: Number,
      required: true,
    },
    upperBound: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);
```

**¿Qué es un Schema?**
- Es como un **contrato** o **conjunto de reglas**
- Define qué campos son obligatorios
- Define qué tipo de datos acepta cada campo
- MongoDB rechazará datos que no cumplan las reglas

**Diferencia entre Interface y Schema:**

```
┌─────────────────────────────────────┐
│ INTERFACE (TypeScript)              │
│ - Solo en tiempo de desarrollo      │
│ - Ayuda al programador              │
│ - No existe en runtime              │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ SCHEMA (Mongoose)                   │
│ - Existe en runtime                 │
│ - Valida datos reales               │
│ - Protege la base de datos          │
└─────────────────────────────────────┘
```

**Campos del schema:**

#### date (líneas 35-38)
```typescript
date: {
  type: Date,
  required: true,
}
```
- **`type: Date`**: Solo acepta fechas
- **`required: true`**: Es obligatorio

**Ejemplo de validación:**
```javascript
// ✅ Válido
{ date: new Date('2025-12-01') }

// ❌ Inválido - falta el campo
{ amount: 1500 }
// Error: "date is required"

// ❌ Inválido - tipo incorrecto
{ date: "2025-12-01" }  // String en lugar de Date
// Error: "date must be a Date"
```

#### amount (líneas 39-42)
```typescript
amount: {
  type: Number,
  required: true,
}
```
- **`type: Number`**: Solo acepta números
- **`required: true`**: Es obligatorio

#### lowerBound y upperBound (líneas 43-50)
- Misma estructura que `amount`
- Representan los límites del rango de confianza

**Opción especial (línea 52):**
```typescript
{ _id: false }
```

**¿Qué significa `{ _id: false }`?**
- Por defecto, Mongoose agrega un `_id` a cada subdocumento
- `{ _id: false }` **desactiva** esto
- Los puntos de predicción NO tendrán su propio `_id`

**¿Por qué desactivar _id?**
- Los puntos son parte de la predicción, no entidades independientes
- No necesitan identificador único propio
- Ahorra espacio en la base de datos

**Ejemplo:**

```javascript
// Con _id: true (default)
predictions: [
  { _id: '507f...', date: ..., amount: 1500 },  // ← Tiene _id innecesario
  { _id: '507f...', date: ..., amount: 1550 }
]

// Con _id: false
predictions: [
  { date: ..., amount: 1500 },  // ← Sin _id
  { date: ..., amount: 1550 }
]
```

---

### Líneas 55-108: Schema Principal de Prediction

```typescript
const predictionSchema = new Schema<IPrediction>(
  {
    // ... campos ...
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
```

**Estructura:**
- **Primer parámetro**: Definición de campos
- **Segundo parámetro**: Opciones del schema

#### Campo userId (líneas 57-62)

```typescript
userId: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: [true, 'El ID de usuario es requerido'],
  index: true,
},
```

**Explicación campo por campo:**

**`type: Schema.Types.ObjectId`**
- Tipo especial de Mongoose para IDs
- 24 caracteres hexadecimales
- Ejemplo: `507f1f77bcf86cd799439011`

**`ref: 'User'`**
- **Referencia** al modelo User
- Permite hacer **populate** (rellenar datos del usuario)
- Es como una "llave foránea" en SQL

**Ejemplo de populate:**
```javascript
// Sin populate
{
  userId: ObjectId('507f191e810c19729de860ea')
}

// Con populate
{
  userId: {
    _id: ObjectId('507f191e810c19729de860ea'),
    email: 'user@example.com',
    name: 'Juan Pérez'
  }
}
```

**`required: [true, 'El ID de usuario es requerido']`**
- **Array de 2 elementos**:
  1. `true`: El campo es obligatorio
  2. `'El ID...'`: Mensaje de error personalizado

**Ejemplo:**
```javascript
// ❌ Intento de guardar sin userId
const prediction = new Prediction({
  modelType: 'linear_regression',
  // userId falta
});
await prediction.save();
// Error: "El ID de usuario es requerido"
```

**`index: true`**
- Crea un **índice** en este campo
- Los índices aceleran las búsquedas

**¿Qué es un índice?**
```
Sin índice:
MongoDB busca en TODOS los documentos (lento)
Buscar userId='507f...' → Revisa 1,000,000 documentos

Con índice:
MongoDB usa el índice (rápido)
Buscar userId='507f...' → Encuentra en milisegundos
```

**Analogía:**
```
Índice = Índice de un libro
Sin índice = Leer todo el libro para encontrar una palabra
Con índice = Ir directo a la página correcta
```

---

#### Campo modelType (líneas 63-71)

```typescript
modelType: {
  type: String,
  required: [true, 'El tipo de modelo es requerido'],
  enum: {
    values: ['linear_regression'],
    message: 'El tipo de modelo debe ser: linear_regression',
  },
  index: true,
},
```

**`enum`** (líneas 66-69):
```typescript
enum: {
  values: ['linear_regression'],
  message: 'El tipo de modelo debe ser: linear_regression',
}
```

**¿Qué es enum?**
- **Enumeración**: Lista de valores permitidos
- Solo acepta valores de la lista
- Rechaza cualquier otro valor

**Ejemplo:**
```javascript
// ✅ Válido
{ modelType: 'linear_regression' }

// ❌ Inválido
{ modelType: 'random_forest' }
// Error: "El tipo de modelo debe ser: linear_regression"

// ❌ Inválido
{ modelType: 'ARIMA' }
// Error: "El tipo de modelo debe ser: linear_regression"
```

**¿Por qué solo 'linear_regression'?**
- El sistema actualmente solo soporta regresión lineal
- En el futuro se pueden agregar más modelos:
```typescript
values: ['linear_regression', 'arima', 'holt_winters']
```

---

#### Campo predictions (líneas 72-81)

```typescript
predictions: {
  type: [predictionPointSchema],
  required: [true, 'Las predicciones son requeridas'],
  validate: {
    validator: function (value: IPredictionPoint[]) {
      return value.length > 0;
    },
    message: 'Debe haber al menos una predicción',
  },
},
```

**`type: [predictionPointSchema]`**
- Array de subdocumentos
- Cada elemento debe cumplir con `predictionPointSchema`

**`validate`** (líneas 75-80):
```typescript
validate: {
  validator: function (value: IPredictionPoint[]) {
    return value.length > 0;
  },
  message: 'Debe haber al menos una predicción',
}
```

**¿Qué es validate?**
- **Validación personalizada**
- Función que retorna `true` (válido) o `false` (inválido)

**Explicación:**
```javascript
validator: function (value: IPredictionPoint[]) {
  return value.length > 0;
}
```
- `value`: El array de predicciones
- `value.length > 0`: Verifica que haya al menos 1 elemento
- Retorna `true` si hay elementos, `false` si está vacío

**Ejemplo:**
```javascript
// ✅ Válido
predictions: [
  { date: ..., amount: 1500, ... }
]
// value.length = 1 > 0 → true

// ❌ Inválido
predictions: []
// value.length = 0 > 0 → false
// Error: "Debe haber al menos una predicción"
```

---

#### Campo confidence (líneas 82-87)

```typescript
confidence: {
  type: Number,
  required: [true, 'El nivel de confianza es requerido'],
  min: [0, 'La confianza debe estar entre 0 y 1'],
  max: [1, 'La confianza debe estar entre 0 y 1'],
},
```

**`min` y `max`:**
```typescript
min: [0, 'La confianza debe estar entre 0 y 1']
max: [1, 'La confianza debe estar entre 0 y 1']
```

**¿Qué hacen?**
- **`min: 0`**: Valor mínimo permitido
- **`max: 1`**: Valor máximo permitido
- Segundo elemento: Mensaje de error

**Ejemplo:**
```javascript
// ✅ Válido
{ confidence: 0.85 }  // 85% de confianza

// ✅ Válido (límites)
{ confidence: 0 }     // 0% de confianza
{ confidence: 1 }     // 100% de confianza

// ❌ Inválido
{ confidence: 1.5 }
// Error: "La confianza debe estar entre 0 y 1"

// ❌ Inválido
{ confidence: -0.2 }
// Error: "La confianza debe estar entre 0 y 1"
```

**Interpretación de confidence:**
```
0.95 = 95% de confianza (muy confiable)
0.85 = 85% de confianza (confiable)
0.70 = 70% de confianza (moderado)
0.50 = 50% de confianza (poco confiable)
```

---

#### Campo metadata (líneas 88-92)

```typescript
metadata: {
  type: Schema.Types.Mixed,
  required: true,
  default: {},
},
```

**`Schema.Types.Mixed`:**
- Tipo **flexible** que acepta cualquier estructura
- Puede ser objeto, array, string, número, etc.
- No tiene validación de estructura

**`default: {}`:**
- Valor por defecto: objeto vacío
- Si no se proporciona, usa `{}`

**Ejemplo:**
```javascript
// Puede tener cualquier estructura
metadata: {
  name: 'Linear Regression',
  custom_field: 'anything',
  nested: {
    deep: {
      value: 123
    }
  },
  array: [1, 2, 3]
}
```

---

#### Campo generatedAt (líneas 93-97)

```typescript
generatedAt: {
  type: Date,
  default: Date.now,
  index: true,
},
```

**`default: Date.now`:**
- Valor por defecto: Fecha actual
- `Date.now` es una **función**
- Mongoose la ejecuta al crear el documento

**Importante:**
```typescript
default: Date.now     // ✅ Correcto (función)
default: Date.now()   // ❌ Incorrecto (valor fijo)
```

**¿Por qué `Date.now` sin paréntesis?**
```javascript
// Con paréntesis (INCORRECTO)
default: Date.now()
// Se ejecuta UNA VEZ al definir el schema
// Todas las predicciones tendrían la misma fecha

// Sin paréntesis (CORRECTO)
default: Date.now
// Mongoose ejecuta la función cada vez que crea un documento
// Cada predicción tiene su propia fecha
```

---

#### Campo expiresAt (líneas 98-102)

```typescript
expiresAt: {
  type: Date,
  required: true,
  index: true,
},
alerts: {
  type: [String],
  default: [],
},
```

**¿Para qué sirve expiresAt?**
- Define cuándo expira la predicción
- Usado por MongoDB para **auto-eliminación**
- Las predicciones antiguas se borran automáticamente

---

#### Opciones del Schema (líneas 104-107)

```typescript
{
  timestamps: true,
  versionKey: false,
}
```

**`timestamps: true`:**
- Agrega automáticamente:
  - `createdAt`: Cuándo se creó el documento
  - `updatedAt`: Cuándo se actualizó por última vez
- Mongoose los gestiona automáticamente

**Ejemplo:**
```javascript
// Al crear
const prediction = await Prediction.create({ ... });
// Mongoose agrega:
// createdAt: 2025-11-27T16:00:00Z
// updatedAt: 2025-11-27T16:00:00Z

// Al actualizar
await prediction.save();
// Mongoose actualiza:
// updatedAt: 2025-11-27T17:30:00Z
```

**`versionKey: false`:**
- Por defecto, Mongoose agrega campo `__v` (versión)
- `versionKey: false` lo desactiva
- Ahorra espacio en la base de datos

**Ejemplo:**
```javascript
// Con versionKey: true (default)
{
  _id: '507f...',
  userId: '507f...',
  __v: 0  // ← Campo de versión
}

// Con versionKey: false
{
  _id: '507f...',
  userId: '507f...'
  // Sin __v
}
```

---

## 🔸 PARTE 3: CONFIGURACIÓN AVANZADA

### Línea 110: Índice Compuesto

```typescript
predictionSchema.index({ userId: 1, modelType: 1, generatedAt: -1 });
```

**¿Qué es un índice compuesto?**
- Índice que combina **múltiples campos**
- Optimiza consultas que filtran por esos campos

**Explicación de los números:**
- **`1`**: Orden ascendente (A→Z, 0→9, antiguo→reciente)
- **`-1`**: Orden descendente (Z→A, 9→0, reciente→antiguo)

**Este índice optimiza consultas como:**
```javascript
// Buscar predicciones de un usuario con modelo específico
Prediction.find({
  userId: '507f...',
  modelType: 'linear_regression'
}).sort({ generatedAt: -1 });

// El índice hace esta consulta MUY rápida
```

**Analogía:**
```
Índice compuesto = Índice de libro organizado por:
1. Capítulo (userId)
2. Sección (modelType)
3. Página (generatedAt)

Encontrar algo es mucho más rápido
```

---

### Línea 111: Índice TTL (Time To Live)

```typescript
predictionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

**¿Qué es un índice TTL?**
- **Time To Live**: Tiempo de vida
- MongoDB **elimina automáticamente** documentos expirados
- Es como un temporizador de autodestrucción

**`{ expireAfterSeconds: 0 }`:**
- `0` significa: eliminar inmediatamente cuando `expiresAt` pasa
- MongoDB revisa cada 60 segundos

**Ejemplo:**
```javascript
// Predicción creada el 27 de noviembre
{
  expiresAt: new Date('2025-11-28T16:00:00Z')  // Expira en 24 horas
}

// El 28 de noviembre a las 16:00
// MongoDB automáticamente elimina esta predicción
```

**¿Por qué auto-eliminar predicciones?**
- Las predicciones se vuelven obsoletas con el tiempo
- Ahorra espacio en la base de datos
- Datos más recientes son más precisos

---

### Líneas 113-120: Middleware pre-save

```typescript
predictionSchema.pre('save', function (next) {
  if (!this.expiresAt) {
    const oneDayFromNow = new Date();
    oneDayFromNow.setHours(oneDayFromNow.getHours() + 24);
    this.expiresAt = oneDayFromNow;
  }
  next();
});
```

**¿Qué es un middleware pre-save?**
- Función que se ejecuta **ANTES** de guardar
- Permite modificar el documento antes de guardarlo
- Es como un "gancho" (hook) en el proceso de guardado

**Flujo:**
```
1. prediction.save() llamado
2. ↓
3. Middleware pre-save se ejecuta
4. ↓
5. Documento se guarda en MongoDB
```

**Línea por línea:**

**Línea 114:**
```typescript
if (!this.expiresAt) {
```
- Verifica si `expiresAt` NO está definido
- `this` se refiere al documento que se está guardando

**Líneas 115-116:**
```typescript
const oneDayFromNow = new Date();
oneDayFromNow.setHours(oneDayFromNow.getHours() + 24);
```
- Crea fecha actual
- Agrega 24 horas

**Ejemplo:**
```javascript
// Ahora: 27 de noviembre, 16:00
const oneDayFromNow = new Date();
// oneDayFromNow = 2025-11-27T16:00:00Z

oneDayFromNow.setHours(oneDayFromNow.getHours() + 24);
// oneDayFromNow = 2025-11-28T16:00:00Z (24 horas después)
```

**Línea 117:**
```typescript
this.expiresAt = oneDayFromNow;
```
- Asigna la fecha de expiración
- Si no se proporcionó, usa 24 horas desde ahora

**Línea 119:**
```typescript
next();
```
- Continúa con el proceso de guardado
- **IMPORTANTE**: Siempre llamar `next()` en middlewares

**Ejemplo completo:**
```javascript
// Crear predicción SIN expiresAt
const prediction = new Prediction({
  userId: '507f...',
  modelType: 'linear_regression',
  // expiresAt NO proporcionado
});

await prediction.save();
// Middleware se ejecuta
// expiresAt se establece automáticamente a 24 horas desde ahora

console.log(prediction.expiresAt);
// 2025-11-28T16:00:00Z
```

---

### Líneas 122-135: Método toJSON

```typescript
predictionSchema.methods.toJSON = function () {
  const prediction = this.toObject();
  return {
    id: prediction._id,
    userId: prediction.userId,
    modelType: prediction.modelType,
    predictions: prediction.predictions,
    confidence: prediction.confidence,
    metadata: prediction.metadata,
    generatedAt: prediction.generatedAt,
    expiresAt: prediction.expiresAt,
    createdAt: prediction.createdAt,
  };
};
```

**¿Qué es toJSON?**
- Método que se ejecuta cuando el documento se convierte a JSON
- Se llama automáticamente al hacer `res.json(prediction)`
- Permite personalizar la respuesta

**¿Cuándo se ejecuta?**
```javascript
// En el controlador
res.json(prediction);
// ↓
// Mongoose llama automáticamente a toJSON()
// ↓
// Retorna el objeto personalizado
```

**¿Qué hace este método?**

**Línea 123:**
```typescript
const prediction = this.toObject();
```
- Convierte el documento de Mongoose a objeto JavaScript plano
- `this` es el documento de Mongoose

**Líneas 124-134:**
```typescript
return {
  id: prediction._id,
  // ... otros campos
};
```
- Retorna objeto con campos seleccionados
- **Nota**: Cambia `_id` a `id`

**Transformación:**
```javascript
// Documento original en MongoDB
{
  _id: ObjectId('507f...'),  // ← MongoDB usa _id
  userId: ObjectId('507f...'),
  __v: 0,  // ← Campo interno de Mongoose
  // ... otros campos
}

// Después de toJSON()
{
  id: '507f...',  // ← Cambiado a 'id' (más amigable)
  userId: '507f...',
  // Sin __v
  // ... otros campos
}
```

**¿Por qué personalizar toJSON?**
1. **Renombrar campos**: `_id` → `id` (más estándar en APIs REST)
2. **Excluir campos**: No incluir `__v` o campos internos
3. **Formato consistente**: Todas las respuestas tienen la misma estructura

---

### Línea 137: Exportación del Modelo

```typescript
export const Prediction = mongoose.model<IPrediction>('Prediction', predictionSchema);
```

**¿Qué hace esta línea?**
- Crea el **modelo** de Mongoose
- Exporta para usar en otros archivos

**Parámetros:**
- **`'Prediction'`**: Nombre del modelo
  - MongoDB creará colección llamada `predictions` (plural, minúsculas)
- **`predictionSchema`**: El schema definido anteriormente
- **`<IPrediction>`**: Tipo TypeScript

**Uso del modelo:**
```javascript
// En otros archivos
import { Prediction } from './models/Prediction.model';

// Crear predicción
const prediction = new Prediction({ ... });
await prediction.save();

// Buscar predicciones
const predictions = await Prediction.find({ userId: '507f...' });

// Actualizar
await Prediction.findByIdAndUpdate(id, { ... });

// Eliminar
await Prediction.findByIdAndDelete(id);
```

---

## 📊 Resumen Visual

### Estructura de una Predicción Completa

```javascript
{
  // ═══════════════════════════════════════
  // IDENTIFICACIÓN
  // ═══════════════════════════════════════
  id: '507f1f77bcf86cd799439011',
  userId: '507f191e810c19729de860ea',
  modelType: 'linear_regression',
  
  // ═══════════════════════════════════════
  // PREDICCIONES (Array de puntos)
  // ═══════════════════════════════════════
  predictions: [
    {
      date: '2025-12-01T00:00:00.000Z',
      amount: 1500,
      lowerBound: 1350,
      upperBound: 1650
    },
    {
      date: '2026-01-01T00:00:00.000Z',
      amount: 1550,
      lowerBound: 1400,
      upperBound: 1700
    },
    {
      date: '2026-02-01T00:00:00.000Z',
      amount: 1600,
      lowerBound: 1450,
      upperBound: 1750
    }
  ],
  
  // ═══════════════════════════════════════
  // MÉTRICAS DE CALIDAD
  // ═══════════════════════════════════════
  confidence: 0.85,  // 85% de confianza
  
  metadata: {
    name: 'Linear Regression',
    training_samples: 120,
    r_squared: 0.85,
    mape: 5.3,
    mae: 75.5,
    rmse: 95.2
  },
  
  // ═══════════════════════════════════════
  // FECHAS
  // ═══════════════════════════════════════
  generatedAt: '2025-11-27T16:00:00.000Z',
  expiresAt: '2025-11-28T16:00:00.000Z',
  createdAt: '2025-11-27T16:00:00.000Z'
}
```

---

## 🎓 Conceptos Clave Resumidos

### 1. Interfaces vs Schemas

| Aspecto | Interface | Schema |
|---------|-----------|--------|
| **Lenguaje** | TypeScript | JavaScript |
| **Cuándo existe** | Solo en desarrollo | En runtime |
| **Propósito** | Ayuda al programador | Valida datos reales |
| **Ejemplo** | `interface IPrediction` | `predictionSchema` |

### 2. Tipos de Validación

| Validación | Ejemplo | Propósito |
|------------|---------|-----------|
| **required** | `required: true` | Campo obligatorio |
| **type** | `type: Number` | Tipo de dato |
| **min/max** | `min: 0, max: 1` | Rango numérico |
| **enum** | `enum: ['linear_regression']` | Valores permitidos |
| **validate** | `validator: function() {}` | Lógica personalizada |

### 3. Índices

| Tipo | Sintaxis | Propósito |
|------|----------|-----------|
| **Simple** | `index: true` | Acelera búsquedas por 1 campo |
| **Compuesto** | `index({ a: 1, b: 1 })` | Acelera búsquedas por múltiples campos |
| **TTL** | `index({ date: 1 }, { expireAfterSeconds: 0 })` | Auto-eliminación |

### 4. Middlewares

| Tipo | Cuándo se ejecuta | Uso |
|------|-------------------|-----|
| **pre-save** | Antes de guardar | Modificar documento |
| **post-save** | Después de guardar | Logging, notificaciones |
| **pre-remove** | Antes de eliminar | Limpieza |

---

## 🚀 Casos de Uso

### 1. Crear Predicción

```javascript
const prediction = new Prediction({
  userId: '507f191e810c19729de860ea',
  modelType: 'linear_regression',
  predictions: [
    {
      date: new Date('2025-12-01'),
      amount: 1500,
      lowerBound: 1350,
      upperBound: 1650
    }
  ],
  confidence: 0.85,
  metadata: {
    name: 'Linear Regression',
    mape: 5.3
  }
  // expiresAt se establece automáticamente (24 horas)
});

await prediction.save();
```

### 2. Buscar Predicciones de un Usuario

```javascript
const predictions = await Prediction.find({
  userId: '507f191e810c19729de860ea'
})
.sort({ generatedAt: -1 })
.limit(10);
```

### 3. Obtener Última Predicción

```javascript
const latestPrediction = await Prediction.findOne({
  userId: '507f191e810c19729de860ea',
  modelType: 'linear_regression'
})
.sort({ generatedAt: -1 });
```

---

## ✅ Checklist de Validaciones

Al guardar una predicción, Mongoose verifica:

- ✅ `userId` existe y es ObjectId válido
- ✅ `modelType` es 'linear_regression'
- ✅ `predictions` es un array no vacío
- ✅ Cada punto tiene `date`, `amount`, `lowerBound`, `upperBound`
- ✅ `confidence` está entre 0 y 1
- ✅ `metadata` existe
- ✅ Si no hay `expiresAt`, se establece en 24 horas

---

¡Documentación completa! Este modelo es la base para almacenar todas las predicciones de machine learning del sistema. 🎉
