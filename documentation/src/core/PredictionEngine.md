# Documentación ULTRA Didáctica: PredictionEngine.ts

**Ubicación:** `src/core/PredictionEngine.ts`

**Propósito:** Este archivo es el **"director de orquesta"** del sistema de machine learning. Coordina todos los componentes (preprocesamiento, modelos, caché, base de datos) para generar predicciones financieras y insights inteligentes. Es el cerebro central del sistema de predicciones.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina que quieres predecir tus gastos futuros:

```
❌ Sin PredictionEngine:
- Tienes que obtener transacciones manualmente
- Limpiar datos tú mismo
- Entrenar el modelo
- Guardar resultados
- Gestionar caché
→ Complejo y propenso a errores

✅ Con PredictionEngine:
predictionEngine.predict(userId, 'linear_regression', 6)
→ ¡Listo! Predicciones para 6 meses
```

**El motor hace TODO automáticamente:**
1. ✅ Obtiene transacciones de la BD
2. ✅ Limpia y preprocesa datos
3. ✅ Entrena el modelo
4. ✅ Genera predicciones
5. ✅ Guarda en BD
6. ✅ Cachea resultados
7. ✅ Retorna predicciones

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  PATRÓN SINGLETON (líneas 8-19)         │
│  ├─ instance (privada)                  │
│  ├─ cache (Map)                         │
│  ├─ constructor privado                 │
│  └─ getInstance()                       │
├──────────────────────────────────────────┤
│  MÉTODOS PÚBLICOS (líneas 21-162)      │
│  ├─ predict()           → Predicciones  │
│  ├─ generateInsights()  → Insights      │
│  └─ invalidateCache()   → Limpiar caché │
├──────────────────────────────────────────┤
│  MÉTODOS PRIVADOS (líneas 164-213)     │
│  ├─ transactionsToDataPoints()          │
│  ├─ getModel()                          │
│  ├─ getFromCache()                      │
│  └─ setCache()                          │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (líneas 216-217)          │
│  └─ predictionEngine (instancia única)  │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

## 🔷 PATRÓN SINGLETON (Líneas 8-19)

### ¿Qué es el Patrón Singleton?

**Definición:**
- Garantiza que solo exista **UNA instancia** de la clase
- Proporciona un punto de acceso global

### Líneas 14-19: getInstance()

```typescript
static getInstance(): PredictionEngine {
  if (!PredictionEngine.instance) {
    PredictionEngine.instance = new PredictionEngine();
  }
  return PredictionEngine.instance;
}
```

**¿Qué hace?**
- Si no existe instancia, la crea
- Si ya existe, retorna la existente
- Garantiza una sola instancia

---

## 🤖 INTEGRACIÓN CON IA (Nuevo)

El `PredictionEngine` ahora colabora con `GeminiService` para enriquecer las predicciones con inteligencia artificial generativa.

### Flujo de Alertas IA:

1.  **Extracción de Datos**: `PredictionEngine` toma los datos mensuales procesados.
2.  **Consulta a Gemini**: Llama a `geminiService.generateFinancialAlerts(monthlyData)`.
3.  **Generación**: La IA analiza tendencias (gastos altos, ahorros bajos) y escribe consejos en lenguaje natural.
4.  **Persistencia**: Las recomendaciones se guardan en la colección `Alerts` de MongoDB con tipo `recommendation`.

Esto transforma una predicción numérica simple en un asesoramiento accionable.

---

## 🔶 MÉTODO predict (Líneas 21-81)

```typescript
async predict(
  userId: string,
  modelType: 'linear_regression',
  periods: number = 6
): Promise<any> {
```

**¿Qué hace?**
- Método principal que genera predicciones
- Orquesta todo el pipeline de ML

**Parámetros:**
- **`userId`**: ID del usuario
- **`modelType`**: Tipo de modelo (actualmente solo 'linear_regression')
- **`periods`**: Cuántos períodos predecir (default: 6 meses)

### Pipeline Completo

```
1. Verificar caché
2. Obtener transacciones
3. Validar datos suficientes
4. Preprocesar datos
5. Entrenar modelo
6. Generar predicciones
7. Guardar en BD
8. Cachear resultado
9. Retornar predicciones
```

---

### Parte 1: Verificar Caché (Líneas 26-30)

```typescript
const cacheKey = `${userId}-${modelType}-${periods}`;
const cached = this.getFromCache(cacheKey);
if (cached) {
  return cached;
}
```

**¿Qué hace?**
- Crea clave única para esta predicción
- Busca en caché
- Si existe y es válida, retorna inmediatamente

**Ejemplo:**
```javascript
userId = '507f191e810c19729de860ea'
modelType = 'linear_regression'
periods = 6

cacheKey = '507f191e810c19729de860ea-linear_regression-6'

// Si está en caché:
cached = {
  predictions: [...],
  confidence: 0.95,
  metadata: {...}
}

// Retorna inmediatamente (sin procesar nada) ⚡
```

**Ventaja:**
```
Sin caché: 5 segundos
Con caché: 0.001 segundos
Mejora: 5000x más rápido
```

---

### Parte 2: Obtener Transacciones (Líneas 32-38)

```typescript
const transactions = await Transaction.find({ userId })
  .sort({ date: 1 })
  .lean();

if (transactions.length < 30) {
  throw new Error('Se necesitan al menos 30 transacciones para generar predicciones');
}
```

**¿Qué hace?**
- Obtiene todas las transacciones del usuario
- **`.sort({ date: 1 })`**: Ordena por fecha ascendente (más antiguas primero)
- **`.lean()`**: Retorna objetos planos (más rápido)
- Valida mínimo 30 transacciones

**¿Por qué mínimo 30?**
```
Con 5 transacciones: Predicción poco confiable
Con 30 transacciones: Predicción razonable
Con 100+ transacciones: Predicción muy confiable
```

---

### Parte 3: Preprocesar Datos (Líneas 40-43)

```typescript
const dataPoints = this.transactionsToDataPoints(transactions);
const cleanedData = DataPreprocessor.cleanData(dataPoints);
const aggregatedData = DataPreprocessor.aggregateByPeriod(cleanedData, 'month');
const timeSeriesData = DataPreprocessor.toTimeSeries(aggregatedData);
```

**Pipeline de preprocesamiento:**

**1. Convertir a DataPoints:**
```javascript
transactions = [
  { date: '2025-01-15', amount: 100, type: 'expense' },
  { date: '2025-01-20', amount: 50, type: 'expense' },
  { date: '2025-02-10', amount: 150, type: 'expense' }
]

dataPoints = [
  { date: '2025-01-01', value: 150 },  // Suma de enero
  { date: '2025-02-01', value: 150 }   // Suma de febrero
]
```

**2. Limpiar datos:**
```javascript
cleanedData = dataPoints.filter(válidos)
// Elimina NaN, negativos, fechas inválidas
```

**3. Agregar por mes:**
```javascript
aggregatedData = [
  { date: '2025-01-01', value: 150 },
  { date: '2025-02-01', value: 150 }
]
// Ya está agregado por mes
```

**4. Convertir a serie temporal:**
```javascript
timeSeriesData = {
  dates: [Date('2025-01-01'), Date('2025-02-01')],
  values: [150, 150]
}
// Formato que el modelo entiende
```

---

### Parte 4: Entrenar y Predecir (Líneas 45-50)

```typescript
const model = this.getModel(modelType);
model.train(timeSeriesData);

const predictions = model.predict(periods);
const confidence = model.getConfidence();
const metadata = model.getMetadata();
```

**¿Qué hace?**

**1. Obtener modelo:**
```javascript
model = new LinearRegressionModel()
```

**2. Entrenar:**
```javascript
model.train({
  dates: [...],
  values: [150, 150, 200, 250, ...]
})
// Modelo aprende el patrón
```

**3. Predecir:**
```javascript
predictions = model.predict(6)
// [
//   { date: '2025-12-01', amount: 300, lowerBound: 250, upperBound: 350 },
//   { date: '2026-01-01', amount: 320, lowerBound: 270, upperBound: 370 },
//   ...
// ]
```

**4. Obtener métricas:**
```javascript
confidence = 0.95  // 95% de confianza
metadata = {
  name: 'Linear Regression',
  rSquared: 0.95,
  mae: 25.5,
  rmse: 30.2
}
```

---

### Parte 5: Guardar en BD (Líneas 52-67)

```typescript
const predictionDoc = new Prediction({
  userId,
  modelType,
  predictions: predictions.map(p => ({
    date: p.date,
    amount: p.amount,
    lowerBound: p.lowerBound,
    upperBound: p.upperBound,
  })),
  confidence,
  metadata,
  generatedAt: new Date(),
  expiresAt: new Date(Date.now() + this.CACHE_TTL),
});

await predictionDoc.save();
```

**¿Qué hace?**
- Crea documento de predicción
- **`expiresAt`**: Fecha de expiración (24 horas)
- Guarda en MongoDB

**¿Por qué guardar en BD?**
1. **Historial**: Ver predicciones pasadas
2. **Auditoría**: Qué se predijo y cuándo
3. **Análisis**: Comparar predicciones vs realidad
4. **TTL**: MongoDB auto-elimina después de 24h

---

### Parte 6: Cachear y Retornar (Líneas 69-80)

```typescript
const result = {
  id: predictionDoc._id,
  userId: predictionDoc.userId,
  modelType: predictionDoc.modelType,
  predictions: predictionDoc.predictions,
  confidence: predictionDoc.confidence,
  metadata: predictionDoc.metadata,
  generatedAt: predictionDoc.generatedAt,
};

this.setCache(cacheKey, result);
return result;
```

**¿Qué hace?**
- Construye objeto de respuesta
- Guarda en caché (para próximas llamadas)
- Retorna resultado

---

## 🔸 MÉTODO generateInsights (Líneas 85-152)

```typescript
async generateInsights(userId: string): Promise<any> {
```

**¿Qué hace?**
- Genera **insights inteligentes** sobre las finanzas
- Analiza patrones y da recomendaciones

### Parte 1: Validar Datos (Líneas 86-98)

```typescript
const transactions = await Transaction.find({ userId })
  .sort({ date: 1 })
  .lean();

if (transactions.length < 10) {
  return {
    insights: ['Necesitas más transacciones para generar insights significativos'],
    summary: {
      totalTransactions: transactions.length,
      hasEnoughData: false,
    },
  };
}
```

**¿Por qué mínimo 10?**
- Con pocas transacciones, los insights no son confiables
- Retorna mensaje amigable en lugar de error

---

### Parte 2: Calcular Estadísticas (Líneas 103-109)

```typescript
const incomeTransactions = transactions.filter(t => t.type === 'income');
const expenseTransactions = transactions.filter(t => t.type === 'expense');

const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
const avgIncome = incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0;
const avgExpense = expenseTransactions.length > 0 ? totalExpense / expenseTransactions.length : 0;
```

**Ejemplo:**
```javascript
incomeTransactions = [
  { amount: 2000 },
  { amount: 2000 }
]

expenseTransactions = [
  { amount: 500 },
  { amount: 600 },
  { amount: 700 }
]

totalIncome = 4000
totalExpense = 1800
avgIncome = 2000
avgExpense = 600
```

---

### Parte 3: Insight de Déficit/Superávit (Líneas 113-123)

```typescript
if (totalExpense > totalIncome) {
  const deficit = totalExpense - totalIncome;
  insights.push(
    `Tus gastos totales ($${totalExpense.toFixed(2)}) superan tus ingresos ($${totalIncome.toFixed(2)}) por $${deficit.toFixed(2)}`
  );
} else {
  const surplus = totalIncome - totalExpense;
  insights.push(
    `Tienes un superávit de $${surplus.toFixed(2)}. ¡Buen trabajo manteniendo tus gastos bajo control!`
  );
}
```

**Ejemplo:**
```javascript
totalIncome = 4000
totalExpense = 1800

surplus = 4000 - 1800 = 2200

Insight: "Tienes un superávit de $2200.00. ¡Buen trabajo manteniendo tus gastos bajo control!"
```

---

### Parte 4: Insight de Gasto Alto (Líneas 125-129)

```typescript
if (avgExpense > avgIncome * 0.8) {
  insights.push(
    `Tu gasto promedio ($${avgExpense.toFixed(2)}) es alto en comparación con tu ingreso promedio ($${avgIncome.toFixed(2)}). Considera reducir gastos.`
  );
}
```

**¿Qué detecta?**
- Si gasto promedio > 80% del ingreso promedio
- Señal de que gastas mucho por transacción

**Ejemplo:**
```javascript
avgIncome = 2000
avgExpense = 1700

1700 > 2000 * 0.8 ?
1700 > 1600 ? → Sí ✅

Insight: "Tu gasto promedio ($1700.00) es alto en comparación con tu ingreso promedio ($2000.00). Considera reducir gastos."
```

---

### Parte 5: Insight de Gastos Recientes (Líneas 131-138)

```typescript
const recentTransactions = transactions.slice(-10);
const recentExpenseRatio =
  recentTransactions.filter(t => t.type === 'expense').length / recentTransactions.length;
if (recentExpenseRatio > 0.8) {
  insights.push(
    'Has tenido muchos gastos recientemente. Considera revisar tus categorías de gasto más frecuentes.'
  );
}
```

**¿Qué detecta?**
- Si >80% de las últimas 10 transacciones son gastos
- Señal de período de alto gasto

**Ejemplo:**
```javascript
recentTransactions = [
  { type: 'expense' },
  { type: 'expense' },
  { type: 'expense' },
  { type: 'expense' },
  { type: 'expense' },
  { type: 'expense' },
  { type: 'expense' },
  { type: 'expense' },
  { type: 'income' },
  { type: 'expense' }
]

recentExpenseRatio = 9 / 10 = 0.9

0.9 > 0.8 ? → Sí ✅

Insight: "Has tenido muchos gastos recientemente..."
```

---

## 🔹 MÉTODO transactionsToDataPoints (Líneas 164-189)

```typescript
private transactionsToDataPoints(transactions: any[]): DataPoint[] {
  const monthlyData = new Map<string, number>();

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;

    if (!monthlyData.has(key)) {
      monthlyData.set(key, 0);
    }

    const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    monthlyData.set(key, monthlyData.get(key)! + amount);
  });

  const dataPoints: DataPoint[] = [];
  monthlyData.forEach((value, key) => {
    const [year, month] = key.split('-').map(Number);
    dataPoints.push({
      date: new Date(year, month, 1),
      value: Math.abs(value),
    });
  });

  return dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
}
```

**¿Qué hace?**
- Convierte transacciones individuales a puntos de datos mensuales
- Agrupa por mes
- Calcula balance neto por mes

### Ejemplo Paso a Paso

**Entrada:**
```javascript
transactions = [
  { date: '2025-01-15', amount: 100, type: 'expense' },
  { date: '2025-01-20', amount: 50, type: 'expense' },
  { date: '2025-01-25', amount: 2000, type: 'income' },
  { date: '2025-02-10', amount: 150, type: 'expense' },
  { date: '2025-02-15', amount: 2000, type: 'income' }
]
```

**Paso 1: Agrupar por mes**
```javascript
monthlyData = Map {
  '2025-0' => 0,  // Enero (mes 0)
  '2025-1' => 0   // Febrero (mes 1)
}
```

**Paso 2: Sumar con signo**
```javascript
// Enero:
// -100 (expense) + -50 (expense) + 2000 (income) = 1850

// Febrero:
// -150 (expense) + 2000 (income) = 1850

monthlyData = Map {
  '2025-0' => 1850,
  '2025-1' => 1850
}
```

**Paso 3: Convertir a DataPoints**
```javascript
dataPoints = [
  { date: new Date(2025, 0, 1), value: 1850 },  // Enero
  { date: new Date(2025, 1, 1), value: 1850 }   // Febrero
]
```

**¿Por qué Math.abs(value)?**
```javascript
// Si hay más gastos que ingresos:
value = -500  // Déficit

Math.abs(-500) = 500

// El modelo trabaja con valores absolutos
// La dirección (déficit/superávit) se maneja en insights
```

---

## 🔺 MÉTODOS DE CACHÉ (Líneas 195-213)

### getFromCache (Líneas 195-206)

```typescript
private getFromCache(key: string): any | null {
  const cached = this.cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > this.CACHE_TTL) {
    this.cache.delete(key);
    return null;
  }

  return cached.data;
}
```

**¿Qué hace?**
1. Busca en caché
2. Si no existe, retorna null
3. Si existe pero expiró, elimina y retorna null
4. Si existe y es válido, retorna datos

**Ejemplo:**
```javascript
// Guardado hace 10 horas
cached = {
  data: { predictions: [...] },
  timestamp: 1700000000000
}

now = 1700036000000  // 10 horas después

now - cached.timestamp = 36000000 ms = 10 horas
10 horas < 24 horas → Válido ✅

return cached.data
```

---

### setCache (Líneas 208-213)

```typescript
private setCache(key: string, data: any): void {
  this.cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}
```

**¿Qué hace?**
- Guarda datos en caché con timestamp actual

---

### invalidateCache (Líneas 154-162)

```typescript
invalidateCache(userId: string): void {
  const keysToDelete: string[] = [];
  this.cache.forEach((_, key) => {
    if (key.startsWith(userId)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => this.cache.delete(key));
}
```

**¿Qué hace?**
- Elimina todas las predicciones cacheadas de un usuario
- Útil cuando se crean nuevas transacciones

**¿Cuándo usar?**
```javascript
// Después de crear transacción
await Transaction.create({ userId, amount: 100 });

// Invalidar caché (predicciones ya no son válidas)
predictionEngine.invalidateCache(userId);

// Próxima predicción se recalculará con datos nuevos
```

---

## 📊 Flujo Completo

### Diagrama de Flujo

```
Usuario solicita predicción
         ↓
    ¿En caché? ──→ Sí → Retornar caché ⚡
         ↓ No
    Obtener transacciones
         ↓
    ¿Suficientes datos? ──→ No → Error
         ↓ Sí
    Preprocesar datos
    ├─ Convertir a DataPoints
    ├─ Limpiar
    ├─ Agregar por mes
    └─ Convertir a serie temporal
         ↓
    Entrenar modelo
         ↓
    Generar predicciones
         ↓
    Guardar en BD
         ↓
    Cachear resultado
         ↓
    Retornar predicciones
```

---

## 🎯 Ejemplo Completo

```javascript
// Obtener instancia única
const engine = PredictionEngine.getInstance();

// Primera llamada (sin caché)
const predictions1 = await engine.predict(userId, 'linear_regression', 6);
// Tiempo: ~5 segundos
// Proceso completo: BD → Preprocesar → Entrenar → Predecir → Guardar → Cachear

console.log(predictions1);
// {
//   id: '507f...',
//   userId: '507f...',
//   modelType: 'linear_regression',
//   predictions: [
//     { date: '2025-12-01', amount: 1500, lowerBound: 1350, upperBound: 1650 },
//     { date: '2026-01-01', amount: 1550, lowerBound: 1400, upperBound: 1700 },
//     ...
//   ],
//   confidence: 0.95,
//   metadata: {
//     name: 'Linear Regression',
//     rSquared: 0.95,
//     mae: 25.5,
//     rmse: 30.2
//   },
//   generatedAt: '2025-11-27T...'
// }

// Segunda llamada (con caché)
const predictions2 = await engine.predict(userId, 'linear_regression', 6);
// Tiempo: ~0.001 segundos ⚡
// Retorna desde caché (sin procesar nada)

predictions1 === predictions2  // false (objetos diferentes)
// Pero tienen los mismos datos

// Generar insights
const insights = await engine.generateInsights(userId);
console.log(insights);
// {
//   insights: [
//     "Tienes un superávit de $2200.00. ¡Buen trabajo!",
//     "Has tenido muchos gastos recientemente..."
//   ],
//   summary: {
//     totalTransactions: 150,
//     totalIncome: 4000,
//     totalExpense: 1800,
//     avgIncome: 2000,
//     avgExpense: 600,
//     balance: 2200,
//     hasEnoughData: true
//   }
// }

// Invalidar caché (después de nueva transacción)
await Transaction.create({ userId, amount: 500, type: 'expense' });
engine.invalidateCache(userId);

// Próxima predicción se recalculará
const predictions3 = await engine.predict(userId, 'linear_regression', 6);
// Tiempo: ~5 segundos (sin caché)
// Incluye la nueva transacción
```

---

## 🎓 Conceptos Clave

### 1. Patrón Singleton

**Ventajas:**
- ✅ Una sola instancia en memoria
- ✅ Caché compartido entre todas las llamadas
- ✅ Consistencia global

**Implementación:**
```typescript
private static instance: PredictionEngine;
private constructor() {}
static getInstance() { ... }
```

### 2. Caché en Memoria

**Estructura:**
```javascript
cache = Map {
  'userId-modelType-periods' => {
    data: { predictions: [...] },
    timestamp: 1700000000000
  }
}
```

**TTL (Time To Live):**
- 24 horas
- Auto-expiración
- Invalidación manual

### 3. Pipeline de ML

```
Datos Crudos → Preprocesar → Entrenar → Predecir → Guardar
```

### 4. Insights Inteligentes

**Tipos:**
1. Déficit/Superávit
2. Gasto promedio alto
3. Muchos gastos recientes

---

## ✅ Mejores Prácticas Implementadas

✅ **Singleton**: Una sola instancia  
✅ **Caché**: Performance optimizada  
✅ **Validación**: Mínimo de datos requerido  
✅ **Pipeline claro**: Pasos bien definidos  
✅ **Separación de responsabilidades**: Cada método una tarea  
✅ **Persistencia**: Guarda en BD para historial  
✅ **TTL**: Auto-limpieza de datos antiguos  

---

## 🚀 Casos de Uso

### 1. API Endpoint

```javascript
// En prediction.controller.ts
async generatePrediction(req, res) {
  const { modelType, periods } = req.body;
  const userId = req.user.id;
  
  const prediction = await predictionEngine.predict(userId, modelType, periods);
  
  return res.json({ success: true, data: prediction });
}
```

### 2. Cron Job

```javascript
// Generar predicciones para todos los usuarios cada noche
cron.schedule('0 2 * * *', async () => {
  const users = await User.find({ status: 'active' });
  
  for (const user of users) {
    await predictionEngine.predict(user._id, 'linear_regression', 6);
  }
});
```

### 3. Dashboard

```javascript
// Mostrar predicciones e insights
const [predictions, insights] = await Promise.all([
  predictionEngine.predict(userId, 'linear_regression', 6),
  predictionEngine.generateInsights(userId)
]);

renderPredictionsChart(predictions);
showInsights(insights);
```

---

¡Documentación completa del motor de predicciones! Este es el director de orquesta que coordina todo el sistema de ML. 🎼🤖

