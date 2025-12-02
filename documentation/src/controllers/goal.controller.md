# Documentación: goal.controller.ts

**Ubicación:** `src/controllers/goal.controller.ts`

**Propósito:** Este archivo define el controlador de metas financieras que maneja todas las operaciones CRUD (Create, Read, Update, Delete) para las metas de ahorro de los usuarios. Incluye funcionalidades avanzadas como actualización de progreso y proyecciones de cumplimiento.

---

## Análisis Línea por Línea

### Líneas 1-3: Importaciones

```typescript
import { Request, Response } from 'express';
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

#### Línea 2: Importación del modelo Goal
```typescript
import { Goal } from '../models/Goal.model';
```

**¿Qué hace?**
- Importa el modelo `Goal` de Mongoose
- Representa la estructura de metas financieras en MongoDB

**¿Qué es una meta financiera?**
- Objetivo de ahorro con monto y fecha objetivo
- Ejemplos: "Ahorrar $5000 para vacaciones", "Fondo de emergencia $10000"
- Permite hacer seguimiento del progreso hacia objetivos financieros

**Estructura típica de una meta:**
```typescript
interface IGoal {
  _id: ObjectId;
  userId: ObjectId;           // Usuario dueño de la meta
  name: string;               // Nombre de la meta
  targetAmount: number;       // Monto objetivo
  currentAmount: number;      // Monto actual ahorrado
  targetDate: Date;           // Fecha objetivo
  description?: string;       // Descripción opcional
  status: 'active' | 'completed' | 'cancelled';  // Estado
  progress: number;           // Porcentaje de progreso (0-100)
  createdAt: Date;
  updatedAt: Date;
}
```

**Ejemplo de meta:**
```javascript
{
  name: "Vacaciones en Europa",
  targetAmount: 5000,
  currentAmount: 2500,
  targetDate: "2025-12-31",
  status: "active",
  progress: 50  // 50% completado
}
```

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
- Separa las importaciones de la definición de la clase

---

### Línea 5: Declaración de la clase
```typescript
export class GoalController {
```

**¿Qué hace?**
- **`export class`**: Exporta la clase para uso en otros archivos
- **`GoalController`**: Nombre de la clase
- Agrupa todos los métodos relacionados con metas financieras

---

### Líneas 6-32: Método getGoals

```typescript
async getGoals(req: Request, res: Response): Promise<Response> {
```

#### Línea 6: Firma del método
**¿Qué hace?**
- **`async`**: Método asíncrono
- **`getGoals`**: Obtiene todas las metas del usuario
- **`Promise<Response>`**: Retorna una promesa que resuelve a Response

---

#### Línea 7: Inicio del bloque try
```typescript
try {
```

**¿Qué hace?**
- Inicia el manejo de errores con try-catch

---

#### Líneas 8-9: Extracción de parámetros
```typescript
const userId = req.user?.id;
const { status, sortBy = 'targetDate', sortOrder = 'asc' } = req.query;
```

**¿Qué hace?**
- **Línea 8**: Obtiene el ID del usuario autenticado
- **Línea 9**: Extrae parámetros de filtrado y ordenamiento
  - **`status`**: Filtrar por estado (active, completed, cancelled)
  - **`sortBy = 'targetDate'`**: Campo por el cual ordenar (por defecto: fecha objetivo)
  - **`sortOrder = 'asc'`**: Orden ascendente o descendente (por defecto: ascendente)

**¿Qué es sortBy y sortOrder?**
- **sortBy**: Campo de la meta por el cual ordenar
  - Opciones: `targetDate`, `targetAmount`, `progress`, `createdAt`, `name`
- **sortOrder**: Dirección del ordenamiento
  - `'asc'`: Ascendente (menor a mayor, A-Z, más antiguo a más reciente)
  - `'desc'`: Descendente (mayor a menor, Z-A, más reciente a más antiguo)

**Ejemplo de URL:**
```
GET /api/goals?status=active&sortBy=progress&sortOrder=desc
```

Resulta en:
```javascript
status = 'active'
sortBy = 'progress'
sortOrder = 'desc'
// Retorna metas activas ordenadas por progreso (mayor a menor)
```

**Valores por defecto:**
```javascript
// Sin parámetros
GET /api/goals

// Usa valores por defecto
sortBy = 'targetDate'
sortOrder = 'asc'
// Ordena por fecha objetivo, más próximas primero
```

---

#### Línea 10: Línea en blanco
```typescript

```

---

#### Líneas 11-12: Construcción del filtro
```typescript
const filter: any = { userId };
if (status) filter.status = status;
```

**¿Qué hace?**
- **Línea 11**: Crea objeto filtro con userId (siempre filtra por usuario)
- **Línea 12**: Agrega filtro de estado si se proporcionó

**¿Por qué siempre filtrar por userId?**
- **Seguridad**: Los usuarios solo ven sus propias metas
- **Aislamiento de datos**: Previene acceso a metas de otros usuarios

**Ejemplos de filtro:**
```javascript
// Sin filtro de status
filter = { userId: '507f1f77bcf86cd799439011' }

// Con filtro de status
filter = {
  userId: '507f1f77bcf86cd799439011',
  status: 'active'
}
```

**Estados posibles:**
- **`active`**: Meta activa, en progreso
- **`completed`**: Meta completada, objetivo alcanzado
- **`cancelled`**: Meta cancelada por el usuario

---

#### Línea 13: Línea en blanco
```typescript

```

---

#### Líneas 14-15: Construcción del ordenamiento
```typescript
const sort: any = {};
sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
```

**¿Qué hace?**
- **Línea 14**: Crea objeto vacío para el ordenamiento
- **Línea 15**: Agrega el campo de ordenamiento dinámicamente
  - **`sort[sortBy as string]`**: Usa el campo especificado
  - **`sortOrder === 'asc' ? 1 : -1`**: 1 para ascendente, -1 para descendente

**¿Por qué usar notación de corchetes?**
- Permite crear propiedades dinámicamente
- El nombre de la propiedad viene de una variable

**Ejemplo:**
```javascript
// sortBy = 'progress', sortOrder = 'desc'
sort['progress'] = -1
// Resultado: { progress: -1 }

// sortBy = 'targetDate', sortOrder = 'asc'
sort['targetDate'] = 1
// Resultado: { targetDate: 1 }
```

**Operador ternario:**
```javascript
sortOrder === 'asc' ? 1 : -1

// Si sortOrder es 'asc'
sortOrder === 'asc' → true → retorna 1

// Si sortOrder es 'desc'
sortOrder === 'asc' → false → retorna -1
```

**Valores de ordenamiento en MongoDB:**
- **`1`**: Ascendente (menor a mayor)
- **`-1`**: Descendente (mayor a menor)

---

#### Línea 16: Línea en blanco
```typescript

```

---

#### Línea 17: Consulta a la base de datos
```typescript
const goals = await Goal.find(filter).sort(sort).lean();
```

**¿Qué hace?**
- **`Goal.find(filter)`**: Busca todas las metas que coincidan con el filtro
- **`.sort(sort)`**: Ordena los resultados según el objeto sort
- **`.lean()`**: Retorna objetos JavaScript planos (más rápido, menos memoria)

**Ejemplo de consulta:**
```javascript
// filter = { userId: '507f...', status: 'active' }
// sort = { progress: -1 }

const goals = await Goal.find({
  userId: '507f1f77bcf86cd799439011',
  status: 'active'
}).sort({ progress: -1 }).lean();

// Retorna metas activas del usuario, ordenadas por progreso descendente
```

**Resultado:**
```javascript
[
  { name: 'Fondo emergencia', progress: 75, targetAmount: 10000, ... },
  { name: 'Vacaciones', progress: 50, targetAmount: 5000, ... },
  { name: 'Auto nuevo', progress: 25, targetAmount: 20000, ... }
]
```

---

#### Línea 18: Línea en blanco
```typescript

```

---

#### Líneas 19-23: Respuesta exitosa
```typescript
return res.status(200).json({
  success: true,
  data: goals,
  total: goals.length,
});
```

**¿Qué hace?**
- **`res.status(200)`**: Código 200 (OK)
- **`success: true`**: Indica éxito
- **`data: goals`**: Array de metas encontradas
- **`total: goals.length`**: Número total de metas

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f191e810c19729de860ea",
      "name": "Vacaciones en Europa",
      "targetAmount": 5000,
      "currentAmount": 2500,
      "targetDate": "2025-12-31T00:00:00.000Z",
      "status": "active",
      "progress": 50,
      "description": "Viaje de 2 semanas",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-11-27T16:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Fondo de emergencia",
      "targetAmount": 10000,
      "currentAmount": 7500,
      "targetDate": "2026-06-30T00:00:00.000Z",
      "status": "active",
      "progress": 75
    }
  ],
  "total": 2
}
```

**Uso en el frontend:**
```javascript
// Obtener metas activas ordenadas por progreso
const response = await fetch('/api/goals?status=active&sortBy=progress&sortOrder=desc');
const { data, total } = await response.json();

// Mostrar en la UI
data.forEach(goal => {
  renderGoalCard(goal);
  renderProgressBar(goal.progress);
});
```

---

#### Líneas 24-31: Manejo de errores
```typescript
} catch (error) {
  console.error('Error al obtener metas:', error);
  return res.status(500).json({
    success: false,
    message: 'Error al obtener metas',
    error: error instanceof Error ? error.message : 'Error desconocido',
  });
}
```

**¿Qué hace?**
- Captura errores de la consulta
- Log del error en la consola
- Respuesta 500 (Internal Server Error)

---

### Líneas 34-67: Método getGoalById

```typescript
async getGoalById(req: Request, res: Response): Promise<Response> {
```

**¿Qué hace?**
- Obtiene una meta específica por su ID
- Similar a métodos anteriores en otros controladores

#### Líneas 36-37: Extracción de parámetros
```typescript
const { id } = req.params;
const userId = req.user?.id;
```

**¿Qué hace?**
- **`id`**: ID de la meta desde la URL
- **`userId`**: ID del usuario autenticado

**Ejemplo:**
```
GET /api/goals/507f1f77bcf86cd799439011
req.params.id = '507f1f77bcf86cd799439011'
```

---

#### Líneas 39-44: Validación del ID
```typescript
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: 'ID de meta inválido',
  });
}
```

**¿Qué hace?**
- Valida que el ID tenga formato de ObjectId de MongoDB
- Retorna 400 (Bad Request) si es inválido

---

#### Línea 46: Búsqueda de la meta
```typescript
const goal = await Goal.findOne({ _id: id, userId }).lean();
```

**¿Qué hace?**
- Busca la meta por ID Y userId
- **Seguridad**: Solo puede ver sus propias metas

---

#### Líneas 48-53: Meta no encontrada
```typescript
if (!goal) {
  return res.status(404).json({
    success: false,
    message: 'Meta no encontrada',
  });
}
```

**¿Qué hace?**
- Verifica si la meta existe
- Retorna 404 (Not Found) si no existe

---

#### Líneas 55-58: Respuesta exitosa
```typescript
return res.status(200).json({
  success: true,
  data: goal,
});
```

**¿Qué hace?**
- Retorna la meta encontrada

---

### Líneas 69-98: Método createGoal

```typescript
async createGoal(req: Request, res: Response): Promise<Response> {
```

#### Líneas 71-72: Extracción de datos
```typescript
const userId = req.user?.id;
const { name, targetAmount, targetDate, description, currentAmount } = req.body;
```

**¿Qué hace?**
- Extrae el ID del usuario
- Extrae los datos de la nueva meta del body

**Ejemplo de request:**
```json
POST /api/goals
Content-Type: application/json

{
  "name": "Vacaciones en Europa",
  "targetAmount": 5000,
  "targetDate": "2025-12-31",
  "description": "Viaje de 2 semanas por Europa",
  "currentAmount": 500
}
```

---

#### Líneas 74-81: Creación de la meta
```typescript
const goal = new Goal({
  userId,
  name,
  targetAmount,
  targetDate,
  description,
  currentAmount: currentAmount || 0,
});
```

**¿Qué hace?**
- **`new Goal()`**: Crea una nueva instancia del modelo
- **`userId`**: ID del usuario que crea la meta
- **`name`**: Nombre de la meta
- **`targetAmount`**: Monto objetivo
- **`targetDate`**: Fecha objetivo
- **`description`**: Descripción opcional
- **`currentAmount: currentAmount || 0`**: Monto actual, por defecto 0

**¿Por qué currentAmount por defecto 0?**
- Al crear una meta, generalmente se empieza desde cero
- El usuario puede especificar un monto inicial si ya tiene ahorros

**Ejemplo:**
```javascript
// Sin currentAmount
currentAmount = undefined
currentAmount || 0 = 0

// Con currentAmount
currentAmount = 500
currentAmount || 0 = 500
```

**Campos calculados automáticamente:**
El modelo puede tener middlewares que calculan automáticamente:
- **`status`**: 'active' por defecto
- **`progress`**: `(currentAmount / targetAmount) * 100`
- **`createdAt`**: Fecha actual
- **`updatedAt`**: Fecha actual

---

#### Línea 83: Guardado en la base de datos
```typescript
await goal.save();
```

**¿Qué hace?**
- Guarda la meta en MongoDB
- Ejecuta validaciones del esquema
- Ejecuta middlewares (cálculo de progress, etc.)

---

#### Líneas 85-89: Respuesta exitosa
```typescript
return res.status(201).json({
  success: true,
  message: 'Meta creada exitosamente',
  data: goal,
});
```

**¿Qué hace?**
- **`res.status(201)`**: Código 201 (Created)
- Retorna la meta creada con todos sus campos

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Meta creada exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f191e810c19729de860ea",
    "name": "Vacaciones en Europa",
    "targetAmount": 5000,
    "currentAmount": 500,
    "targetDate": "2025-12-31T00:00:00.000Z",
    "description": "Viaje de 2 semanas por Europa",
    "status": "active",
    "progress": 10,
    "createdAt": "2025-11-27T16:00:00.000Z",
    "updatedAt": "2025-11-27T16:00:00.000Z"
  }
}
```

---

### Líneas 100-138: Método updateGoal

```typescript
async updateGoal(req: Request, res: Response): Promise<Response> {
```

#### Líneas 102-104: Extracción de datos
```typescript
const { id } = req.params;
const userId = req.user?.id;
const updateData = req.body;
```

**¿Qué hace?**
- **`id`**: ID de la meta a actualizar
- **`userId`**: ID del usuario autenticado
- **`updateData`**: Objeto con los campos a actualizar

**Ejemplo de request:**
```json
PUT /api/goals/507f1f77bcf86cd799439013
Content-Type: application/json

{
  "name": "Vacaciones en Europa y Asia",
  "targetAmount": 7000,
  "description": "Viaje extendido de 3 semanas"
}
```

---

#### Líneas 106-111: Validación del ID
```typescript
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: 'ID de meta inválido',
  });
}
```

**¿Qué hace?**
- Valida el formato del ID

---

#### Líneas 113-116: Actualización de la meta
```typescript
const goal = await Goal.findOneAndUpdate({ _id: id, userId }, updateData, {
  new: true,
  runValidators: true,
});
```

**¿Qué hace?**
- **`Goal.findOneAndUpdate()`**: Busca y actualiza en una operación
- **Primer parámetro** `{ _id: id, userId }`: Filtro (solo sus propias metas)
- **Segundo parámetro** `updateData`: Datos a actualizar
- **Tercer parámetro**: Opciones
  - **`new: true`**: Retorna el documento actualizado (no el original)
  - **`runValidators: true`**: Ejecuta validaciones del esquema

**¿Qué es runValidators?**
- Por defecto, `findOneAndUpdate` NO ejecuta validaciones
- `runValidators: true` asegura que los datos sean válidos

**Ejemplo:**
```javascript
// Sin runValidators
await Goal.findOneAndUpdate(
  { _id: id },
  { targetAmount: -1000 }  // ❌ Valor inválido, pero se guarda
);

// Con runValidators
await Goal.findOneAndUpdate(
  { _id: id },
  { targetAmount: -1000 },  // ❌ Lanza error de validación
  { runValidators: true }
);
```

**Diferencia entre new: true y new: false:**
```javascript
// Meta antes de actualizar
{ name: 'Vacaciones', targetAmount: 5000 }

// Actualización
{ targetAmount: 7000 }

// Con new: false (default)
// Retorna el documento ANTES de actualizar
{ name: 'Vacaciones', targetAmount: 5000 }

// Con new: true
// Retorna el documento DESPUÉS de actualizar
{ name: 'Vacaciones', targetAmount: 7000 }
```

---

#### Líneas 118-123: Meta no encontrada
```typescript
if (!goal) {
  return res.status(404).json({
    success: false,
    message: 'Meta no encontrada',
  });
}
```

**¿Qué hace?**
- Verifica si la meta existe
- Retorna 404 si no existe o no pertenece al usuario

---

#### Líneas 125-129: Respuesta exitosa
```typescript
return res.status(200).json({
  success: true,
  message: 'Meta actualizada exitosamente',
  data: goal,
});
```

**¿Qué hace?**
- Retorna la meta actualizada

---

### Líneas 140-177: Método deleteGoal

```typescript
async deleteGoal(req: Request, res: Response): Promise<Response> {
```

**¿Qué hace?**
- Elimina una meta específica
- Similar a métodos de eliminación anteriores

#### Línea 152: Eliminación de la meta
```typescript
const goal = await Goal.findOneAndDelete({ _id: id, userId });
```

**¿Qué hace?**
- **`findOneAndDelete()`**: Busca y elimina en una operación
- Retorna el documento eliminado
- Solo puede eliminar sus propias metas

---

#### Líneas 161-168: Respuesta exitosa
```typescript
return res.status(200).json({
  success: true,
  message: 'Meta eliminada exitosamente',
  data: {
    id: goal._id,
    name: goal.name,
  },
});
```

**¿Qué hace?**
- Confirma la eliminación
- Retorna el ID y nombre de la meta eliminada

---

### Líneas 179-217: Método updateProgress

```typescript
async updateProgress(req: Request, res: Response): Promise<Response> {
```

**¿Qué hace?**
- Actualiza el progreso de una meta
- Método especializado para actualizar solo el monto actual

#### Líneas 181-183: Extracción de datos
```typescript
const { id } = req.params;
const userId = req.user?.id;
const { currentAmount } = req.body;
```

**¿Qué hace?**
- **`id`**: ID de la meta
- **`userId`**: ID del usuario
- **`currentAmount`**: Nuevo monto actual ahorrado

**Ejemplo de request:**
```json
PATCH /api/goals/507f1f77bcf86cd799439013/progress
Content-Type: application/json

{
  "currentAmount": 3000
}
```

**¿Por qué un método separado para actualizar progreso?**
- **Frecuencia**: El progreso se actualiza más frecuentemente que otros campos
- **Simplicidad**: Endpoint específico para una acción común
- **Validación**: Puede tener validaciones específicas para el monto

---

#### Línea 192: Búsqueda de la meta
```typescript
const goal = await Goal.findOne({ _id: id, userId });
```

**¿Qué hace?**
- Busca la meta por ID y userId
- **Nota**: No usa `.lean()` porque necesitamos modificar el documento

---

#### Líneas 194-199: Meta no encontrada
```typescript
if (!goal) {
  return res.status(404).json({
    success: false,
    message: 'Meta no encontrada',
  });
}
```

**¿Qué hace?**
- Verifica si la meta existe

---

#### Líneas 201-202: Actualización del progreso
```typescript
goal.currentAmount = currentAmount;
await goal.save();
```

**¿Qué hace?**
- **Línea 201**: Actualiza el monto actual
- **Línea 202**: Guarda los cambios en la base de datos

**¿Qué sucede al guardar?**
El modelo puede tener middlewares que:
1. Recalculan el `progress`: `(currentAmount / targetAmount) * 100`
2. Actualizan el `status`:
   - Si `progress >= 100` → `status = 'completed'`
   - Si `progress < 100` → `status = 'active'`
3. Actualizan `updatedAt` automáticamente

**Ejemplo de middleware en el modelo:**
```typescript
// En Goal.model.ts
goalSchema.pre('save', function(next) {
  // Calcular progreso
  this.progress = (this.currentAmount / this.targetAmount) * 100;
  
  // Actualizar estado
  if (this.progress >= 100) {
    this.status = 'completed';
  }
  
  next();
});
```

**Flujo completo:**
```javascript
// Meta antes
{
  currentAmount: 2500,
  targetAmount: 5000,
  progress: 50,
  status: 'active'
}

// Actualización
goal.currentAmount = 5000;
await goal.save();  // Ejecuta middleware

// Meta después
{
  currentAmount: 5000,
  targetAmount: 5000,
  progress: 100,
  status: 'completed'  // ← Actualizado automáticamente
}
```

---

#### Líneas 204-208: Respuesta exitosa
```typescript
return res.status(200).json({
  success: true,
  message: 'Progreso actualizado exitosamente',
  data: goal,
});
```

**¿Qué hace?**
- Retorna la meta con el progreso actualizado

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Progreso actualizado exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Vacaciones en Europa",
    "targetAmount": 5000,
    "currentAmount": 3000,
    "progress": 60,
    "status": "active",
    "targetDate": "2025-12-31T00:00:00.000Z"
  }
}
```

---

### Líneas 219-279: Método getProjection

```typescript
async getProjection(req: Request, res: Response): Promise<Response> {
```

**¿Qué hace?**
- Calcula proyecciones y predicciones sobre el cumplimiento de la meta
- Analiza si el usuario va por buen camino para alcanzar la meta
- Proporciona métricas útiles para toma de decisiones

**¿Qué es una proyección?**
- Análisis predictivo basado en el progreso actual
- Responde preguntas como:
  - ¿Voy por buen camino?
  - ¿Cuánto necesito ahorrar diariamente?
  - ¿Alcanzaré la meta a tiempo?

---

#### Líneas 221-222: Extracción de parámetros
```typescript
const { id } = req.params;
const userId = req.user?.id;
```

**¿Qué hace?**
- Extrae el ID de la meta y el ID del usuario

---

#### Líneas 224-229: Validación del ID
```typescript
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: 'ID de meta inválido',
  });
}
```

**¿Qué hace?**
- Valida el formato del ID

---

#### Línea 231: Búsqueda de la meta
```typescript
const goal = await Goal.findOne({ _id: id, userId }).lean();
```

**¿Qué hace?**
- Busca la meta por ID y userId

---

#### Líneas 233-238: Meta no encontrada
```typescript
if (!goal) {
  return res.status(404).json({
    success: false,
    message: 'Meta no encontrada',
  });
}
```

**¿Qué hace?**
- Verifica si la meta existe

---

#### Líneas 240-242: Obtención de timestamps
```typescript
const now = Date.now();
const targetTime = goal.targetDate.getTime();
const createdTime = goal.createdAt.getTime();
```

**¿Qué hace?**
- **`now`**: Timestamp actual en milisegundos
- **`targetTime`**: Timestamp de la fecha objetivo
- **`createdTime`**: Timestamp de cuando se creó la meta

**¿Qué es Date.now() y getTime()?**
- **`Date.now()`**: Retorna el timestamp actual (milisegundos desde 1970-01-01)
- **`.getTime()`**: Convierte un objeto Date a timestamp

**Ejemplo:**
```javascript
now = 1732723200000           // 2025-11-27 16:00:00
targetTime = 1735689600000    // 2025-12-31 00:00:00
createdTime = 1704067200000   // 2025-01-01 00:00:00
```

**¿Por qué usar timestamps?**
- Facilita cálculos matemáticos
- Los timestamps son números, fáciles de restar y comparar

---

#### Líneas 244-246: Cálculo de días
```typescript
const totalDays = Math.ceil((targetTime - createdTime) / (1000 * 60 * 60 * 24));
const elapsedDays = Math.ceil((now - createdTime) / (1000 * 60 * 60 * 24));
const remainingDays = Math.ceil((targetTime - now) / (1000 * 60 * 60 * 24));
```

**¿Qué hace?**
- **Línea 244**: Calcula días totales desde creación hasta fecha objetivo
- **Línea 245**: Calcula días transcurridos desde creación hasta ahora
- **Línea 246**: Calcula días restantes desde ahora hasta fecha objetivo

**¿Cómo funciona el cálculo?**
```javascript
// Diferencia en milisegundos
targetTime - createdTime = 31622400000 ms

// Convertir a días
1000 ms = 1 segundo
60 segundos = 1 minuto
60 minutos = 1 hora
24 horas = 1 día

1000 * 60 * 60 * 24 = 86400000 ms por día

31622400000 / 86400000 = 365.5 días

// Math.ceil redondea hacia arriba
Math.ceil(365.5) = 366 días
```

**¿Por qué Math.ceil?**
- **Redondeo hacia arriba**: Asegura que no subestimemos el tiempo
- `Math.ceil(0.1)` → `1` (cuenta como 1 día completo)
- `Math.ceil(5.9)` → `6`

**Ejemplo con fechas reales:**
```javascript
// Meta creada: 2025-01-01
// Fecha objetivo: 2025-12-31
// Hoy: 2025-11-27

totalDays = 365 días      // De enero a diciembre
elapsedDays = 331 días    // De enero a noviembre
remainingDays = 34 días   // De noviembre a diciembre
```

---

#### Línea 248: Cálculo de progreso esperado
```typescript
const expectedProgress = (elapsedDays / totalDays) * 100;
```

**¿Qué hace?**
- Calcula qué porcentaje de progreso DEBERÍA tener en este punto
- Basado en el tiempo transcurrido

**¿Cómo funciona?**
```javascript
// Si han pasado 331 de 365 días
elapsedDays / totalDays = 331 / 365 = 0.907
0.907 * 100 = 90.7%

// Debería tener ~91% de progreso
```

**Interpretación:**
- Si la meta es de 365 días y han pasado 331 días
- Deberías tener aproximadamente 91% del dinero ahorrado
- Esto asume ahorro constante y lineal

---

#### Línea 249: Obtención del progreso actual
```typescript
const currentProgress = goal.progress;
```

**¿Qué hace?**
- Obtiene el progreso real actual de la meta
- Calculado como `(currentAmount / targetAmount) * 100`

**Ejemplo:**
```javascript
// Meta: $5000, Actual: $3000
currentProgress = (3000 / 5000) * 100 = 60%
```

---

#### Línea 251: Cálculo de monto faltante
```typescript
const amountNeeded = goal.targetAmount - goal.currentAmount;
```

**¿Qué hace?**
- Calcula cuánto dinero falta para alcanzar la meta

**Ejemplo:**
```javascript
targetAmount = 5000
currentAmount = 3000
amountNeeded = 5000 - 3000 = 2000
// Faltan $2000 para completar la meta
```

---

#### Línea 252: Cálculo de tasa diaria necesaria
```typescript
const dailyRateNeeded = remainingDays > 0 ? amountNeeded / remainingDays : 0;
```

**¿Qué hace?**
- Calcula cuánto dinero se debe ahorrar DIARIAMENTE para alcanzar la meta
- Si no quedan días, retorna 0

**¿Por qué verificar remainingDays > 0?**
- Previene división por cero
- Si la fecha objetivo ya pasó, no tiene sentido calcular tasa diaria

**Ejemplo:**
```javascript
amountNeeded = 2000
remainingDays = 34

dailyRateNeeded = 2000 / 34 = 58.82
// Necesita ahorrar ~$59 por día
```

**Casos especiales:**
```javascript
// Meta ya vencida
remainingDays = -10
dailyRateNeeded = 0  // No se puede calcular

// Meta completada
amountNeeded = 0
dailyRateNeeded = 0 / 34 = 0  // No necesita ahorrar más
```

---

#### Línea 254: Predicción de cumplimiento
```typescript
const willAchieve = remainingDays > 0 && currentProgress >= expectedProgress * 0.8;
```

**¿Qué hace?**
- Predice si el usuario ALCANZARÁ la meta
- Basado en dos condiciones:
  1. Aún hay tiempo (remainingDays > 0)
  2. El progreso actual es al menos 80% del progreso esperado

**¿Por qué 80% del progreso esperado?**
- Margen de tolerancia del 20%
- Si estás al 80% de donde deberías estar, aún es alcanzable
- Permite cierta flexibilidad

**Ejemplos:**
```javascript
// Caso 1: Va bien encaminado
remainingDays = 34
currentProgress = 60
expectedProgress = 90.7
currentProgress >= expectedProgress * 0.8
60 >= 72.56  // false
willAchieve = false  // ❌ No va por buen camino

// Caso 2: Va muy bien
remainingDays = 34
currentProgress = 85
expectedProgress = 90.7
85 >= 72.56  // true
willAchieve = true  // ✅ Sí alcanzará la meta

// Caso 3: Meta vencida
remainingDays = -10
willAchieve = false  // ❌ Ya pasó la fecha
```

**Lógica del operador &&:**
```javascript
remainingDays > 0 && currentProgress >= expectedProgress * 0.8

// Ambas condiciones deben ser true
true && true = true   // ✅ Alcanzará la meta
true && false = false // ❌ No va por buen camino
false && true = false // ❌ Meta vencida
false && false = false // ❌ Meta vencida y atrasado
```

---

#### Líneas 256-270: Respuesta con proyección
```typescript
return res.status(200).json({
  success: true,
  data: {
    goalId: goal._id,
    goalName: goal.name,
    currentProgress: goal.progress,
    expectedProgress,
    onTrack: currentProgress >= expectedProgress * 0.9,
    willAchieve,
    amountNeeded,
    dailyRateNeeded,
    daysRemaining: Math.max(0, remainingDays),
    projectedCompletionDate: willAchieve ? goal.targetDate : null,
  },
});
```

**¿Qué hace?**
- Retorna un análisis completo de la proyección de la meta

**Campos de la respuesta:**
- **`goalId`**: ID de la meta
- **`goalName`**: Nombre de la meta
- **`currentProgress`**: Progreso actual (%)
- **`expectedProgress`**: Progreso esperado según tiempo transcurrido (%)
- **`onTrack`**: Si va por buen camino (90% del esperado)
- **`willAchieve`**: Si se predice que alcanzará la meta
- **`amountNeeded`**: Dinero faltante
- **`dailyRateNeeded`**: Ahorro diario necesario
- **`daysRemaining`**: Días restantes (mínimo 0)
- **`projectedCompletionDate`**: Fecha de completación proyectada

**¿Qué es onTrack?**
```typescript
onTrack: currentProgress >= expectedProgress * 0.9
```
- Indicador de si va "por buen camino"
- Más estricto que `willAchieve` (90% vs 80%)
- Sirve para mostrar alertas tempranas

**Diferencia entre onTrack y willAchieve:**
```javascript
// Escenario: 85% de progreso, 90.7% esperado
currentProgress = 85
expectedProgress = 90.7

onTrack = 85 >= 81.63  // true ✅ Va bien
willAchieve = 85 >= 72.56  // true ✅ Alcanzará

// Escenario: 75% de progreso, 90.7% esperado
currentProgress = 75

onTrack = 75 >= 81.63  // false ⚠️ Alerta: va atrasado
willAchieve = 75 >= 72.56  // true ✅ Aún puede alcanzar
```

**¿Por qué Math.max(0, remainingDays)?**
```typescript
daysRemaining: Math.max(0, remainingDays)
```
- Si la meta ya venció, `remainingDays` es negativo
- `Math.max(0, -10)` → `0`
- Evita mostrar días negativos al usuario

**¿Por qué projectedCompletionDate condicional?**
```typescript
projectedCompletionDate: willAchieve ? goal.targetDate : null
```
- Si se predice que alcanzará la meta → muestra la fecha objetivo
- Si NO se predice que alcanzará → `null` (no hay fecha proyectada)

**Ejemplo de respuesta completa:**
```json
{
  "success": true,
  "data": {
    "goalId": "507f1f77bcf86cd799439013",
    "goalName": "Vacaciones en Europa",
    "currentProgress": 60,
    "expectedProgress": 90.7,
    "onTrack": false,
    "willAchieve": false,
    "amountNeeded": 2000,
    "dailyRateNeeded": 58.82,
    "daysRemaining": 34,
    "projectedCompletionDate": null
  }
}
```

**Interpretación para el usuario:**
```
⚠️ Alerta: Vas atrasado en tu meta "Vacaciones en Europa"

📊 Progreso actual: 60%
📈 Progreso esperado: 90.7%
💰 Falta: $2,000
📅 Días restantes: 34
💵 Necesitas ahorrar: $58.82 por día

❌ Con el ritmo actual, NO alcanzarás la meta a tiempo.
💡 Aumenta tu ahorro diario para ponerte al día.
```

---

### Líneas 280-283: Exportación

```typescript
}

export const goalController = new GoalController();
```

#### Línea 280: Cierre de la clase
```typescript
}
```

**¿Qué hace?**
- Cierra la clase `GoalController`

---

#### Línea 282: Creación y exportación de instancia
```typescript
export const goalController = new GoalController();
```

**¿Qué hace?**
- Crea una instancia de la clase
- Exporta la instancia (patrón Singleton)

**Uso en las rutas:**
```typescript
// En routes/goal.routes.ts
import { goalController } from '../controllers/goal.controller';

router.get('/goals', authMiddleware, goalController.getGoals);
router.get('/goals/:id', authMiddleware, goalController.getGoalById);
router.post('/goals', authMiddleware, goalController.createGoal);
router.put('/goals/:id', authMiddleware, goalController.updateGoal);
router.delete('/goals/:id', authMiddleware, goalController.deleteGoal);
router.patch('/goals/:id/progress', authMiddleware, goalController.updateProgress);
router.get('/goals/:id/projection', authMiddleware, goalController.getProjection);
```

---

## Resumen de Métodos

| Método | Ruta | Descripción | Retorna |
|--------|------|-------------|---------|
| `getGoals` | GET /goals | Obtiene todas las metas con filtros y ordenamiento | Array de metas |
| `getGoalById` | GET /goals/:id | Obtiene una meta específica | Una meta |
| `createGoal` | POST /goals | Crea una nueva meta | Meta creada |
| `updateGoal` | PUT /goals/:id | Actualiza una meta | Meta actualizada |
| `deleteGoal` | DELETE /goals/:id | Elimina una meta | Confirmación |
| `updateProgress` | PATCH /goals/:id/progress | Actualiza el progreso de una meta | Meta con progreso actualizado |
| `getProjection` | GET /goals/:id/projection | Calcula proyecciones de cumplimiento | Análisis predictivo |

---

## Conceptos Clave

### 1. Estados de una Meta

| Estado | Descripción | Cuándo se aplica |
|--------|-------------|------------------|
| `active` | Meta activa, en progreso | `progress < 100` y fecha no vencida |
| `completed` | Meta completada | `progress >= 100` |
| `cancelled` | Meta cancelada por el usuario | Usuario cancela manualmente |

### 2. Cálculos Importantes

| Cálculo | Fórmula | Propósito |
|---------|---------|-----------|
| **Progress** | `(currentAmount / targetAmount) * 100` | Porcentaje completado |
| **Expected Progress** | `(elapsedDays / totalDays) * 100` | Progreso esperado según tiempo |
| **Daily Rate Needed** | `amountNeeded / remainingDays` | Ahorro diario necesario |
| **On Track** | `currentProgress >= expectedProgress * 0.9` | Si va por buen camino |
| **Will Achieve** | `currentProgress >= expectedProgress * 0.8` | Si alcanzará la meta |

### 3. Conversión de Tiempo

```javascript
// Milisegundos a días
const days = milliseconds / (1000 * 60 * 60 * 24);

// Desglose:
1000 ms = 1 segundo
60 segundos = 1 minuto
60 minutos = 1 hora
24 horas = 1 día
```

---

## Seguridad Implementada

✅ **Autenticación**: Todos los métodos requieren usuario autenticado  
✅ **Aislamiento de datos**: Usuarios solo ven/modifican sus propias metas  
✅ **Validación de IDs**: Verificación de ObjectIds antes de consultar  
✅ **Validación de esquema**: `runValidators: true` en actualizaciones  

---

## Mejores Prácticas Implementadas

✅ **Ordenamiento dinámico**: Permite ordenar por diferentes campos  
✅ **Valores por defecto**: `currentAmount` por defecto 0  
✅ **Operaciones atómicas**: `findOneAndUpdate`, `findOneAndDelete`  
✅ **Validación de entrada**: Verificación de IDs y datos  
✅ **Cálculos matemáticos**: Proyecciones y predicciones  
✅ **Manejo de edge cases**: División por cero, fechas vencidas  

---

## Posibles Mejoras

### 1. Validación de fechas
```typescript
// Validar que targetDate sea futura
if (new Date(targetDate) <= new Date()) {
  return res.status(400).json({
    message: 'La fecha objetivo debe ser futura'
  });
}
```

### 2. Validación de montos
```typescript
// Validar que currentAmount no exceda targetAmount
if (currentAmount > goal.targetAmount) {
  return res.status(400).json({
    message: 'El monto actual no puede exceder el monto objetivo'
  });
}
```

### 3. Historial de progreso
```typescript
// Guardar historial de actualizaciones
interface ProgressHistory {
  date: Date;
  amount: number;
  progress: number;
}

goalSchema.add({
  progressHistory: [ProgressHistory]
});

// Al actualizar progreso
goal.progressHistory.push({
  date: new Date(),
  amount: currentAmount,
  progress: (currentAmount / goal.targetAmount) * 100
});
```

### 4. Notificaciones automáticas
```typescript
// Enviar alertas basadas en proyección
if (!onTrack) {
  await alertGenerator.createAlert({
    userId,
    type: 'goal_behind_schedule',
    message: `Vas atrasado en tu meta "${goal.name}"`
  });
}
```

### 5. Paginación en getGoals
```typescript
const { page = 1, limit = 10 } = req.query;
const skip = (Number(page) - 1) * Number(limit);

const goals = await Goal.find(filter)
  .sort(sort)
  .skip(skip)
  .limit(Number(limit))
  .lean();
```

### 6. Proyecciones más avanzadas
```typescript
// Considerar tasa de ahorro histórica
const averageMonthlySavings = calculateAverageSavings(goal.progressHistory);
const projectedMonths = amountNeeded / averageMonthlySavings;
const realisticCompletionDate = addMonths(new Date(), projectedMonths);
```

---

## Casos de Uso

### 1. Dashboard de Metas
```javascript
// Mostrar todas las metas activas ordenadas por progreso
const response = await fetch('/api/goals?status=active&sortBy=progress&sortOrder=desc');
const { data } = await response.json();

data.forEach(goal => {
  renderGoalCard(goal);
  renderProgressBar(goal.progress);
});
```

### 2. Actualización de Progreso
```javascript
// Usuario agrega $500 a su meta
const response = await fetch(`/api/goals/${goalId}/progress`, {
  method: 'PATCH',
  body: JSON.stringify({
    currentAmount: goal.currentAmount + 500
  })
});

if (response.data.status === 'completed') {
  showCelebration('¡Meta completada! 🎉');
}
```

### 3. Análisis de Proyección
```javascript
// Obtener proyección de la meta
const projection = await fetch(`/api/goals/${goalId}/projection`);

if (!projection.data.onTrack) {
  showAlert({
    title: 'Vas atrasado',
    message: `Necesitas ahorrar $${projection.data.dailyRateNeeded.toFixed(2)} por día`,
    type: 'warning'
  });
}
```

### 4. Crear Meta con Wizard
```javascript
// Wizard de creación de meta
const goalData = {
  name: 'Fondo de emergencia',
  targetAmount: 10000,
  targetDate: '2026-12-31',
  description: '6 meses de gastos',
  currentAmount: 1000  // Ya tengo algo ahorrado
};

const response = await fetch('/api/goals', {
  method: 'POST',
  body: JSON.stringify(goalData)
});

navigateTo(`/goals/${response.data._id}`);
```
