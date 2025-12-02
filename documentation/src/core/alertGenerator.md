# Documentación ULTRA Didáctica: alertGenerator.ts

**Ubicación:** `src/core/alertGenerator.ts`

**Propósito:** Este archivo es el "asistente financiero inteligente" que **monitorea automáticamente** tus finanzas y genera alertas cuando detecta problemas, patrones inusuales o oportunidades de mejora. Es como tener un asesor financiero 24/7 vigilando tu dinero.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina que tienes un asistente que revisa tus finanzas constantemente:

```
❌ Sin alertas:
- Gastas más sin darte cuenta
- Metas se atrasan
- Patrones peligrosos pasan desapercibidos

✅ Con alertas automáticas:
- "¡Alerta! Gastos aumentaron 30%"
- "Tu meta está retrasada"
- "Gastos inusuales en Comida"
- "Tasa de ahorro muy baja (5%)"
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (líneas 1-5)             │
├──────────────────────────────────────────┤
│  MÉTODOS DE DETECCIÓN (líneas 8-297)   │
│  ├─ checkOverspending()      → Sobregasto│
│  ├─ checkGoalProgress()      → Metas    │
│  ├─ detectUnusualPatterns()  → Patrones │
│  └─ generateRecommendations() → Consejos│
├──────────────────────────────────────────┤
│  ORQUESTADOR (líneas 299-306)          │
│  └─ runAllChecks()           → Ejecuta  │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (líneas 309-310)          │
│  └─ alertGenerator (instancia)          │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

## 🔷 MÉTODO checkOverspending (Líneas 8-93)

```typescript
async checkOverspending(userId: string): Promise<void> {
```

**¿Qué hace?**
- Detecta si estás **gastando más** de lo normal
- Compara últimos 30 días vs 30 días anteriores
- Genera alertas si hay aumento significativo

### Parte 1: Obtener Gastos Recientes (Líneas 9-20)

```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const recentExpenses = await Transaction.find({
  userId,
  type: 'expense',
  date: { $gte: thirtyDaysAgo },
}).lean();

if (recentExpenses.length < 5) {
  return;
}
```

**¿Qué hace?**
- Obtiene gastos de los últimos 30 días
- Si hay menos de 5 transacciones, no hay suficientes datos

**Ejemplo:**
```javascript
Hoy: 2025-11-27
thirtyDaysAgo: 2025-10-28

Busca gastos desde 2025-10-28 hasta 2025-11-27
```

**¿Por qué mínimo 5 transacciones?**
- Con muy pocos datos, las comparaciones no son confiables
- Evita alertas falsas

---

### Parte 2: Obtener Gastos Anteriores (Líneas 22-33)

```typescript
const sixtyDaysAgo = new Date();
sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

const previousExpenses = await Transaction.find({
  userId,
  type: 'expense',
  date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
}).lean();

if (previousExpenses.length < 5) {
  return;
}
```

**¿Qué hace?**
- Obtiene gastos de los 30 días anteriores (días 31-60)

**Ejemplo:**
```javascript
Hoy: 2025-11-27
sixtyDaysAgo: 2025-09-28
thirtyDaysAgo: 2025-10-28

Busca gastos desde 2025-09-28 hasta 2025-10-28
```

**Períodos comparados:**
```
┌─────────────────┬─────────────────┐
│ Período Anterior│ Período Reciente│
│  (días 31-60)   │   (días 1-30)   │
│                 │                 │
│ 2025-09-28      │ 2025-10-28      │ 2025-11-27
│ hasta           │ hasta           │ (hoy)
│ 2025-10-28      │ 2025-11-27      │
└─────────────────┴─────────────────┘
```

---

### Parte 3: Calcular Promedios (Líneas 35-38)

```typescript
const recentTotal = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
const previousTotal = previousExpenses.reduce((sum, t) => sum + t.amount, 0);
const recentAvg = recentTotal / 30;
const previousAvg = previousTotal / 30;
```

**¿Qué hace?**
- Suma todos los gastos de cada período
- Calcula promedio diario

**Ejemplo:**
```javascript
// Período reciente (últimos 30 días)
recentTotal = $3000
recentAvg = $3000 / 30 = $100/día

// Período anterior (días 31-60)
previousTotal = $2400
previousAvg = $2400 / 30 = $80/día
```

---

### Parte 4: Detectar Sobregasto (Líneas 40-55)

```typescript
if (recentAvg > previousAvg * 1.2) {
  const increasePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

  await Alert.create({
    userId,
    type: 'overspending',
    severity: increasePercent > 50 ? 'critical' : 'warning',
    message: `Tus gastos han aumentado un ${increasePercent.toFixed(1)}% en los últimos 30 días. Gasto diario promedio: $${recentAvg.toFixed(2)} (antes: $${previousAvg.toFixed(2)})`,
    relatedData: {
      recentAverage: recentAvg,
      previousAverage: previousAvg,
      increasePercent,
      period: '30 días',
    },
  });
}
```

**¿Qué es el umbral 1.2?**
```
recentAvg > previousAvg * 1.2

Significa: Gastos aumentaron más del 20%
```

**Ejemplo:**
```javascript
previousAvg = $80/día
recentAvg = $100/día

$100 > $80 * 1.2 ?
$100 > $96 ? → Sí ✅

increasePercent = ((100 - 80) / 80) * 100 = 25%
```

**Severidad:**
```javascript
increasePercent > 50 → 'critical' (crítico)
increasePercent ≤ 50 → 'warning' (advertencia)
```

**Ejemplo de alerta:**
```json
{
  "type": "overspending",
  "severity": "warning",
  "message": "Tus gastos han aumentado un 25.0% en los últimos 30 días. Gasto diario promedio: $100.00 (antes: $80.00)",
  "relatedData": {
    "recentAverage": 100,
    "previousAverage": 80,
    "increasePercent": 25,
    "period": "30 días"
  }
}
```

---

### Parte 5: Detectar Gastos Inusuales por Categoría (Líneas 57-92)

```typescript
const expensesByCategory = new Map<string, number[]>();
recentExpenses.forEach(expense => {
  const categoryId = expense.categoryId.toString();
  if (!expensesByCategory.has(categoryId)) {
    expensesByCategory.set(categoryId, []);
  }
  expensesByCategory.get(categoryId)!.push(expense.amount);
});
```

**¿Qué hace?**
- Agrupa gastos por categoría
- Crea un Map: `categoryId → [montos]`

**Ejemplo:**
```javascript
expensesByCategory = Map {
  'comida' => [50, 60, 55, 200],  // ← 200 es inusual
  'transporte' => [30, 35, 32],
  'entretenimiento' => [100, 120]
}
```

---

**Líneas 66-92: Detectar outliers por categoría**

```typescript
for (const [categoryId, amounts] of expensesByCategory) {
  if (amounts.length < 3) continue;

  const avgAmount = StatisticalTests.mean(amounts);
  const stdDev = StatisticalTests.standardDeviation(amounts);

  const unusualExpenses = amounts.filter(amount => amount > avgAmount + 2 * stdDev);

  if (unusualExpenses.length > 0) {
    const category = await Category.findById(categoryId).lean();
    const categoryName = category ? category.name : 'Desconocida';

    await Alert.create({
      userId,
      type: 'unusual_pattern',
      severity: 'warning',
      message: `Gastos inusuales detectados en la categoría "${categoryName}". Algunos gastos superan significativamente tu promedio de $${avgAmount.toFixed(2)}`,
      relatedData: {
        categoryId,
        categoryName,
        averageAmount: avgAmount,
        unusualExpenses,
        unusualCount: unusualExpenses.length,
      },
    });
  }
}
```

**¿Qué es `avgAmount + 2 * stdDev`?**
- **Regla de 2 sigmas**: Valores fuera de 2 desviaciones estándar son inusuales
- ~95% de los datos están dentro de ±2σ

**Ejemplo:**
```javascript
// Categoría "Comida"
amounts = [50, 60, 55, 200]

avgAmount = (50 + 60 + 55 + 200) / 4 = 91.25
stdDev = 62.5

threshold = 91.25 + 2 * 62.5 = 216.25

unusualExpenses = amounts.filter(a => a > 216.25)
// unusualExpenses = [] (200 < 216.25)

// Pero si hubiera un gasto de $250:
amounts = [50, 60, 55, 250]
avgAmount = 103.75
stdDev = 82.5
threshold = 103.75 + 2 * 82.5 = 268.75
// 250 < 268.75, no es outlier

// Con más datos normales:
amounts = [50, 60, 55, 52, 58, 200]
avgAmount = 62.5
stdDev = 55.9
threshold = 62.5 + 2 * 55.9 = 174.3
unusualExpenses = [200] ✅
```

**Visualización:**
```
    Monto
200 |       ●  ← Inusual (outlier)
    |      /
174 |─────────  ← Umbral (avg + 2σ)
    |
 60 |  ● ● ●   ← Gastos normales
 50 | ●
```

---

## 🔶 MÉTODO checkGoalProgress (Líneas 95-164)

```typescript
async checkGoalProgress(userId: string): Promise<void> {
```

**¿Qué hace?**
- Monitorea el progreso de las metas financieras
- Genera 3 tipos de alertas:
  1. **Meta expirada** (no alcanzada a tiempo)
  2. **Meta retrasada** (progreso < esperado)
  3. **Casi completada** (progreso ≥ 90%)

### Parte 1: Obtener Metas Activas (Líneas 96-99)

```typescript
const activeGoals = await Goal.find({
  userId,
  status: 'active',
}).lean();
```

---

### Parte 2: Calcular Progreso y Días Restantes (Líneas 102-105)

```typescript
const progress = (goal.currentAmount / goal.targetAmount) * 100;
const daysUntilTarget = Math.ceil(
  (goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
);
```

**Ejemplo:**
```javascript
goal = {
  name: "Vacaciones",
  currentAmount: 750,
  targetAmount: 1000,
  targetDate: new Date('2025-12-31')
}

progress = (750 / 1000) * 100 = 75%

// Hoy: 2025-11-27
daysUntilTarget = (2025-12-31 - 2025-11-27) / (1000 * 60 * 60 * 24)
                = 34 días
```

---

### Parte 3: Alerta de Meta Expirada (Líneas 107-124)

```typescript
if (daysUntilTarget <= 0 && progress < 100) {
  await Alert.create({
    userId,
    type: 'goal_progress',
    severity: 'critical',
    message: `La meta "${goal.name}" ha expirado. Progreso: ${progress.toFixed(1)}% ($${goal.currentAmount.toFixed(2)} de $${goal.targetAmount.toFixed(2)})`,
    relatedData: {
      goalId: goal._id,
      goalName: goal.name,
      progress,
      currentAmount: goal.currentAmount,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      daysOverdue: Math.abs(daysUntilTarget),
    },
  });
  continue;
}
```

**¿Cuándo se activa?**
```
daysUntilTarget ≤ 0 → Fecha ya pasó
progress < 100 → No completada
```

**Ejemplo:**
```javascript
targetDate: 2025-11-20
Hoy: 2025-11-27
daysUntilTarget = -7 (7 días tarde)

progress = 75%

Alerta: "La meta 'Vacaciones' ha expirado. Progreso: 75.0% ($750.00 de $1000.00)"
```

---

### Parte 4: Calcular Progreso Esperado (Líneas 126-132)

```typescript
const daysElapsed = Math.ceil(
  (Date.now() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
);
const totalDays = Math.ceil(
  (goal.targetDate.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
);
const expectedProgress = (daysElapsed / totalDays) * 100;
```

**¿Qué es el progreso esperado?**
- Progreso que **deberías tener** según el tiempo transcurrido

**Ejemplo:**
```javascript
createdAt: 2025-10-01
targetDate: 2025-12-31
Hoy: 2025-11-27

daysElapsed = 57 días (desde creación)
totalDays = 91 días (duración total)

expectedProgress = (57 / 91) * 100 = 62.6%

// Si progress actual = 75%
// → Vas adelantado ✅

// Si progress actual = 40%
// → Vas retrasado ❌
```

**Visualización:**
```
Progreso
100%|                    ● (meta)
    |                   /
 75%|         ●────────/  ← Progreso actual
    |        /       /
 63%|   ────●───────/     ← Progreso esperado
    |      /       /
  0%|●────────────/
    |____________
    Oct  Nov  Dic
```

---

### Parte 5: Alerta de Meta Retrasada (Líneas 134-148)

```typescript
if (progress < expectedProgress * 0.7 && daysUntilTarget > 0) {
  await Alert.create({
    userId,
    type: 'goal_progress',
    severity: daysUntilTarget < 30 ? 'warning' : 'info',
    message: `La meta "${goal.name}" está retrasada. Progreso actual: ${progress.toFixed(1)}%, progreso esperado: ${expectedProgress.toFixed(1)}%. Quedan ${daysUntilTarget} días.`,
    relatedData: {
      goalId: goal._id,
      goalName: goal.name,
      currentProgress: progress,
      expectedProgress,
      daysRemaining: daysUntilTarget,
      amountNeeded: goal.targetAmount - goal.currentAmount,
    },
  });
}
```

**¿Cuándo se activa?**
```
progress < expectedProgress * 0.7

Significa: Progreso real es menos del 70% del esperado
```

**Ejemplo:**
```javascript
expectedProgress = 62.6%
progress = 40%

40 < 62.6 * 0.7 ?
40 < 43.82 ? → Sí ✅ (retrasado)

// Severidad
daysUntilTarget = 34
34 < 30 ? → No
severity = 'info'

// Si quedaran 20 días:
20 < 30 ? → Sí
severity = 'warning'
```

---

### Parte 6: Alerta de Casi Completada (Líneas 149-162)

```typescript
else if (progress >= 90 && progress < 100) {
  await Alert.create({
    userId,
    type: 'goal_progress',
    severity: 'info',
    message: `¡Casi lo logras! La meta "${goal.name}" está al ${progress.toFixed(1)}%. Solo faltan $${(goal.targetAmount - goal.currentAmount).toFixed(2)}`,
    relatedData: {
      goalId: goal._id,
      goalName: goal.name,
      progress,
      amountNeeded: goal.targetAmount - goal.currentAmount,
    },
  });
}
```

**¿Cuándo se activa?**
```
90% ≤ progress < 100%
```

**Ejemplo:**
```javascript
currentAmount = 950
targetAmount = 1000

progress = 95%

Alerta: "¡Casi lo logras! La meta 'Vacaciones' está al 95.0%. Solo faltan $50.00"
```

---

## 🔸 MÉTODO detectUnusualPatterns (Líneas 166-230)

```typescript
async detectUnusualPatterns(userId: string): Promise<void> {
```

**¿Qué hace?**
- Detecta **patrones inusuales** en las transacciones
- Identifica:
  1. Transacciones con montos muy altos
  2. Días de la semana con más actividad

### Parte 1: Detectar Transacciones de Alto Valor (Líneas 179-204)

```typescript
const amounts = recentTransactions.map(t => t.amount);
const avgAmount = StatisticalTests.mean(amounts);
const stdDev = StatisticalTests.standardDeviation(amounts);

const highValueTransactions = recentTransactions.filter(
  t => t.amount > avgAmount + 2 * stdDev
);

if (highValueTransactions.length > 0) {
  await Alert.create({
    userId,
    type: 'unusual_pattern',
    severity: 'info',
    message: `Se detectaron ${highValueTransactions.length} transacciones con montos inusualmente altos en los últimos 30 días`,
    relatedData: {
      transactionCount: highValueTransactions.length,
      averageAmount: avgAmount,
      threshold: avgAmount + 2 * stdDev,
      highValueTransactions: highValueTransactions.map(t => ({
        amount: t.amount,
        date: t.date,
        type: t.type,
      })),
    },
  });
}
```

**Ejemplo:**
```javascript
amounts = [50, 60, 55, 52, 58, 500, 62]

avgAmount = 119.57
stdDev = 165.8

threshold = 119.57 + 2 * 165.8 = 451.17

highValueTransactions = [500] ✅

Alerta: "Se detectaron 1 transacciones con montos inusualmente altos en los últimos 30 días"
```

---

### Parte 2: Detectar Día Más Activo (Líneas 206-229)

```typescript
const transactionsByDay = new Map<number, number>();
recentTransactions.forEach(t => {
  const day = new Date(t.date).getDay();
  transactionsByDay.set(day, (transactionsByDay.get(day) || 0) + 1);
});

const mostActiveDay = Array.from(transactionsByDay.entries()).reduce((max, entry) =>
  entry[1] > max[1] ? entry : max
);

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
if (mostActiveDay[1] > recentTransactions.length * 0.3) {
  await Alert.create({
    userId,
    type: 'unusual_pattern',
    severity: 'info',
    message: `La mayoría de tus transacciones (${mostActiveDay[1]}) ocurren los ${dayNames[mostActiveDay[0]]}s`,
    relatedData: {
      day: dayNames[mostActiveDay[0]],
      transactionCount: mostActiveDay[1],
      percentage: (mostActiveDay[1] / recentTransactions.length) * 100,
    },
  });
}
```

**¿Qué hace?**
- Cuenta transacciones por día de la semana
- Si un día tiene >30% de las transacciones, genera alerta

**Ejemplo:**
```javascript
transactionsByDay = Map {
  0 (Domingo) => 2,
  1 (Lunes) => 3,
  5 (Viernes) => 15,  // ← Día más activo
  6 (Sábado) => 5
}

total = 25 transacciones
mostActiveDay = [5, 15]  // Viernes con 15 transacciones

15 > 25 * 0.3 ?
15 > 7.5 ? → Sí ✅

Alerta: "La mayoría de tus transacciones (15) ocurren los Viernes"
```

**¿Por qué es útil?**
- Identifica hábitos de gasto
- Ejemplo: Gastas mucho los viernes (salidas)

---

## 🔹 MÉTODO generateRecommendations (Líneas 232-297)

```typescript
async generateRecommendations(userId: string): Promise<void> {
```

**¿Qué hace?**
- Genera **recomendaciones** basadas en análisis financiero
- Identifica:
  1. Tasa de ahorro baja
  2. Categorías con gastos excesivos

### Parte 1: Calcular Tasa de Ahorro (Líneas 245-265)

```typescript
const incomes = transactions.filter(t => t.type === 'income');
const expenses = transactions.filter(t => t.type === 'expense');

const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

if (savingsRate < 10 && totalIncome > 0) {
  await Alert.create({
    userId,
    type: 'recommendation',
    severity: 'info',
    message: `Tu tasa de ahorro es del ${savingsRate.toFixed(1)}%. Se recomienda ahorrar al menos el 20% de tus ingresos. Considera reducir gastos no esenciales.`,
    relatedData: {
      savingsRate,
      recommendedRate: 20,
      monthlySavings: (totalIncome - totalExpense) / 2,
      monthlyIncome: totalIncome / 2,
    },
  });
}
```

**¿Qué es la tasa de ahorro?**
```
savingsRate = ((ingresos - gastos) / ingresos) * 100
```

**Ejemplo:**
```javascript
totalIncome = $5000
totalExpense = $4800

savingsRate = ((5000 - 4800) / 5000) * 100
            = (200 / 5000) * 100
            = 4%

4 < 10 ? → Sí ✅

Alerta: "Tu tasa de ahorro es del 4.0%. Se recomienda ahorrar al menos el 20% de tus ingresos."
```

**Interpretación:**
```
savingsRate ≥ 20% → Excelente ✅
savingsRate 10-20% → Aceptable
savingsRate < 10% → Bajo ⚠️
savingsRate < 0% → Déficit ❌
```

---

### Parte 2: Detectar Categoría Dominante (Líneas 267-296)

```typescript
const expensesByCategory = new Map<string, number>();
for (const expense of expenses) {
  const categoryId = expense.categoryId.toString();
  expensesByCategory.set(categoryId, (expensesByCategory.get(categoryId) || 0) + expense.amount);
}

const sortedCategories = Array.from(expensesByCategory.entries()).sort((a, b) => b[1] - a[1]);

if (sortedCategories.length > 0) {
  const topCategory = sortedCategories[0];
  const topCategoryPercent = (topCategory[1] / totalExpense) * 100;

  if (topCategoryPercent > 40) {
    const category = await Category.findById(topCategory[0]).lean();
    const categoryName = category ? category.name : 'Desconocida';

    await Alert.create({
      userId,
      type: 'recommendation',
      severity: 'info',
      message: `El ${topCategoryPercent.toFixed(1)}% de tus gastos son en "${categoryName}". Considera si puedes optimizar en esta área.`,
      relatedData: {
        categoryId: topCategory[0],
        categoryName,
        amount: topCategory[1],
        percentage: topCategoryPercent,
      },
    });
  }
}
```

**¿Qué hace?**
- Suma gastos por categoría
- Si una categoría representa >40% del total, genera recomendación

**Ejemplo:**
```javascript
expensesByCategory = Map {
  'comida' => 2000,      // ← 50% del total
  'transporte' => 1000,
  'entretenimiento' => 800,
  'otros' => 200
}

totalExpense = 4000

sortedCategories = [
  ['comida', 2000],
  ['transporte', 1000],
  ['entretenimiento', 800],
  ['otros', 200]
]

topCategory = ['comida', 2000]
topCategoryPercent = (2000 / 4000) * 100 = 50%

50 > 40 ? → Sí ✅

Alerta: "El 50.0% de tus gastos son en 'Comida'. Considera si puedes optimizar en esta área."
```

---

## 🔺 MÉTODO runAllChecks (Líneas 299-306)

```typescript
async runAllChecks(userId: string): Promise<void> {
  await Promise.all([
    this.checkOverspending(userId),
    this.checkGoalProgress(userId),
    this.detectUnusualPatterns(userId),
    this.generateRecommendations(userId),
  ]);
}
```

**¿Qué hace?**
- Ejecuta **todas las verificaciones** en paralelo
- Usa `Promise.all()` para eficiencia

**¿Por qué Promise.all?**
```javascript
// Sin Promise.all (secuencial)
await checkOverspending();      // 2s
await checkGoalProgress();      // 2s
await detectUnusualPatterns();  // 2s
await generateRecommendations();// 2s
// Total: 8 segundos

// Con Promise.all (paralelo)
await Promise.all([
  checkOverspending(),
  checkGoalProgress(),
  detectUnusualPatterns(),
  generateRecommendations()
]);
// Total: 2 segundos (todas al mismo tiempo)
```

---

## 📊 Resumen de Tipos de Alertas

| Tipo | Severidad | Cuándo se Genera |
|------|-----------|------------------|
| **overspending** | warning/critical | Gastos aumentaron >20% |
| **unusual_pattern** | warning/info | Gastos inusuales detectados |
| **goal_progress** | critical/warning/info | Meta expirada/retrasada/casi completa |
| **recommendation** | info | Tasa de ahorro baja, categoría dominante |

### Niveles de Severidad

```
critical → Requiere atención inmediata (rojo)
warning  → Advertencia importante (amarillo)
info     → Información útil (azul)
```

---

## 🎯 Ejemplos Completos

### Ejemplo 1: Usuario con Sobregasto

```javascript
// Ejecutar verificaciones
await alertGenerator.runAllChecks(userId);

// Alertas generadas:
[
  {
    type: 'overspending',
    severity: 'warning',
    message: 'Tus gastos han aumentado un 30.0% en los últimos 30 días. Gasto diario promedio: $104.00 (antes: $80.00)'
  },
  {
    type: 'unusual_pattern',
    severity: 'warning',
    message: 'Gastos inusuales detectados en la categoría "Entretenimiento". Algunos gastos superan significativamente tu promedio de $50.00'
  },
  {
    type: 'recommendation',
    severity: 'info',
    message: 'Tu tasa de ahorro es del 5.0%. Se recomienda ahorrar al menos el 20% de tus ingresos.'
  }
]
```

### Ejemplo 2: Usuario con Meta Retrasada

```javascript
await alertGenerator.checkGoalProgress(userId);

// Alerta generada:
{
  type: 'goal_progress',
  severity: 'warning',
  message: 'La meta "Vacaciones" está retrasada. Progreso actual: 40.0%, progreso esperado: 62.6%. Quedan 20 días.',
  relatedData: {
    currentProgress: 40,
    expectedProgress: 62.6,
    daysRemaining: 20,
    amountNeeded: 600
  }
}
```

### Ejemplo 3: Patrón de Gasto Detectado

```javascript
await alertGenerator.detectUnusualPatterns(userId);

// Alertas generadas:
[
  {
    type: 'unusual_pattern',
    severity: 'info',
    message: 'Se detectaron 2 transacciones con montos inusualmente altos en los últimos 30 días',
    relatedData: {
      transactionCount: 2,
      averageAmount: 75,
      threshold: 225,
      highValueTransactions: [
        { amount: 500, date: '2025-11-15', type: 'expense' },
        { amount: 300, date: '2025-11-20', type: 'expense' }
      ]
    }
  },
  {
    type: 'unusual_pattern',
    severity: 'info',
    message: 'La mayoría de tus transacciones (18) ocurren los Viernes',
    relatedData: {
      day: 'Viernes',
      transactionCount: 18,
      percentage: 45
    }
  }
]
```

---

## 🚀 Casos de Uso

### 1. Cron Job Diario

```javascript
// Ejecutar cada día a las 8:00 AM
cron.schedule('0 8 * * *', async () => {
  const users = await User.find({ status: 'active' });
  
  for (const user of users) {
    await alertGenerator.runAllChecks(user._id);
  }
});
```

### 2. Después de Crear Transacción

```javascript
// En transaction.controller.ts
async createTransaction(req, res) {
  const transaction = await Transaction.create(req.body);
  
  // Verificar si hay nuevas alertas
  await alertGenerator.checkOverspending(req.user.id);
  await alertGenerator.detectUnusualPatterns(req.user.id);
  
  return res.json({ success: true, data: transaction });
}
```

### 3. Dashboard de Alertas

```javascript
// Obtener alertas no leídas
const alerts = await Alert.find({
  userId,
  isRead: false
}).sort({ createdAt: -1 });

// Mostrar en UI
alerts.forEach(alert => {
  showNotification(alert.severity, alert.message);
});
```

---

## 🎓 Conceptos Clave

### 1. Detección de Outliers

**Regla de 2 sigmas:**
```
threshold = mean + 2 * stdDev

Valores > threshold son outliers
```

### 2. Comparación de Períodos

```
Período Reciente vs Período Anterior
Detecta cambios en comportamiento
```

### 3. Progreso Esperado

```
expectedProgress = (daysElapsed / totalDays) * 100

Compara con progreso real
```

### 4. Tasa de Ahorro

```
savingsRate = ((income - expense) / income) * 100

Recomendado: ≥ 20%
```

---

## ✅ Mejores Prácticas Implementadas

✅ **Umbrales inteligentes**: No genera alertas por cambios mínimos  
✅ **Datos suficientes**: Requiere mínimo de transacciones  
✅ **Severidad apropiada**: critical/warning/info según importancia  
✅ **Contexto completo**: relatedData con información detallada  
✅ **Ejecución paralela**: Promise.all para eficiencia  
✅ **Estadística robusta**: Usa desviación estándar para detección  

---

¡Documentación completa del generador de alertas! Este es el asistente financiero inteligente que vigila tus finanzas 24/7. 🚨💰

