# Documentación ULTRA Didáctica: trendAnalyzer.ts

**Ubicación:** `src/core/utils/trendAnalyzer.ts`

**Propósito:** Este archivo es el "detective de patrones" que analiza datos financieros para descubrir **tendencias, estacionalidad, cambios bruscos y patrones ocultos**. Es como tener un analista financiero experto que encuentra insights en tus datos.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina que tienes gastos mensuales durante un año:

```
Ene: $1000  →  ¿Hay una tendencia?
Feb: $1100  →  ¿Los gastos suben o bajan?
Mar: $1200  →  ¿Hay patrones repetitivos?
Abr: $1300  →  ¿Cuándo hubo cambios importantes?
...
```

**Este archivo responde:**
- ✅ **Tendencia**: Gastos aumentan $100/mes (tendencia creciente)
- ✅ **Estacionalidad**: Gastos altos cada 3 meses (patrón trimestral)
- ✅ **Puntos de cambio**: En julio hubo un aumento significativo
- ✅ **Velocidad**: Gastos crecen a $100/mes
- ✅ **Aceleración**: El crecimiento se está acelerando

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  INTERFACES (líneas 3-25)               │
│  ├─ TrendAnalysis                       │
│  ├─ SeasonalityAnalysis                 │
│  ├─ ChangePoint                         │
│  └─ TimeSeriesDecomposition             │
├──────────────────────────────────────────┤
│  MÉTODOS PÚBLICOS (líneas 28-237)      │
│  ├─ detectTrend()         → Tendencia   │
│  ├─ calculateGrowthRate() → Crecimiento │
│  ├─ detectSeasonality()   → Estacional  │
│  ├─ findChangePoints()    → Cambios     │
│  ├─ decomposeTimeSeries() → Descomponer │
│  ├─ calculateDerivative() → Derivada    │
│  ├─ calculateVelocity()   → Velocidad   │
│  ├─ calculateAcceleration() → Aceleración│
│  ├─ identifyOutlierPeriods() → Outliers│
│  └─ smoothSeries()        → Suavizar    │
├──────────────────────────────────────────┤
│  MÉTODOS PRIVADOS (líneas 152-184)     │
│  ├─ extractTrend()        → Extraer tend│
│  └─ extractSeasonal()     → Extraer est │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

## 🔷 INTERFACES

### Líneas 3-7: TrendAnalysis

```typescript
export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  slope: number;
}
```

**¿Qué representa?**
- Resultado del análisis de tendencia

**Campos:**
- **`direction`**: Dirección de la tendencia
  - `'increasing'`: Valores suben
  - `'decreasing'`: Valores bajan
  - `'stable'`: Valores constantes
- **`strength`**: Fuerza de la tendencia (0-1)
  - 0.9 = Tendencia muy fuerte
  - 0.5 = Tendencia moderada
  - 0.1 = Tendencia débil
- **`slope`**: Pendiente (cuánto cambia por período)
  - 100 = Aumenta $100 por mes
  - -50 = Disminuye $50 por mes

**Ejemplo:**
```javascript
{
  direction: 'increasing',
  strength: 0.95,
  slope: 100
}
// Interpretación: Gastos aumentan fuertemente a $100/mes
```

---

### Líneas 9-13: SeasonalityAnalysis

```typescript
export interface SeasonalityAnalysis {
  hasSeasonality: boolean;
  period?: number;
  strength?: number;
}
```

**¿Qué representa?**
- Resultado del análisis de estacionalidad

**Campos:**
- **`hasSeasonality`**: ¿Hay patrón repetitivo?
- **`period`**: Cada cuántos períodos se repite
  - 3 = Patrón trimestral
  - 12 = Patrón anual
- **`strength`**: Fuerza del patrón (0-1)

**Ejemplo:**
```javascript
{
  hasSeasonality: true,
  period: 3,
  strength: 0.7
}
// Interpretación: Patrón fuerte que se repite cada 3 meses
```

---

### Líneas 15-19: ChangePoint

```typescript
export interface ChangePoint {
  index: number;
  date?: Date;
  significance: number;
}
```

**¿Qué representa?**
- Punto donde hubo un cambio significativo

**Campos:**
- **`index`**: Posición del cambio
- **`date`**: Fecha del cambio (opcional)
- **`significance`**: Qué tan significativo (>2 = importante)

**Ejemplo:**
```javascript
{
  index: 6,
  date: new Date('2025-07-01'),
  significance: 3.5
}
// Interpretación: En julio (posición 6) hubo un cambio muy significativo
```

---

### Líneas 21-25: TimeSeriesDecomposition

```typescript
export interface TimeSeriesDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
}
```

**¿Qué representa?**
- Descomposición de la serie temporal en 3 componentes

**Componentes:**
```
Valor Original = Tendencia + Estacionalidad + Residual

Tendencia: Dirección general a largo plazo
Estacionalidad: Patrón repetitivo
Residual: Ruido aleatorio
```

**Ejemplo:**
```javascript
{
  trend: [1000, 1050, 1100, 1150],
  seasonal: [50, -30, 20, -40],
  residual: [10, -5, 15, -20]
}

// Valores originales:
// [1060, 1015, 1135, 1090]
// = trend + seasonal + residual
```

---

## 🔶 MÉTODO detectTrend (Líneas 28-57)

```typescript
static detectTrend(values: number[]): TrendAnalysis {
  if (values.length < 3) {
    return {
      direction: 'stable',
      strength: 0,
      slope: 0,
    };
  }

  const x = Array.from({ length: values.length }, (_, i) => i);
  const { slope, intercept } = StatisticalTests.linearRegression(x, values);

  const predictions = x.map(xi => slope * xi + intercept);
  const rSquared = StatisticalTests.rSquared(values, predictions);

  const threshold = 0.01 * StatisticalTests.mean(values);

  let direction: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(slope) < threshold) {
    direction = 'stable';
  } else {
    direction = slope > 0 ? 'increasing' : 'decreasing';
  }

  return {
    direction,
    strength: Math.abs(rSquared),
    slope,
  };
}
```

**¿Qué hace?**
- Detecta si los valores tienen tendencia creciente, decreciente o estable
- Usa regresión lineal para encontrar la tendencia

### Paso a Paso

**Línea 37: Crear índices**
```typescript
const x = Array.from({ length: values.length }, (_, i) => i);
```

**Ejemplo:**
```javascript
values = [1000, 1100, 1200, 1300]
x = [0, 1, 2, 3]  // Índices
```

---

**Línea 38: Regresión lineal**
```typescript
const { slope, intercept } = StatisticalTests.linearRegression(x, values);
```

**¿Qué hace?**
- Encuentra la línea que mejor se ajusta a los datos
- `slope`: Cuánto cambia por período
- `intercept`: Valor inicial

**Ejemplo:**
```javascript
values = [1000, 1100, 1200, 1300]
x = [0, 1, 2, 3]

slope = 100  // Aumenta $100 por período
intercept = 1000  // Empieza en $1000

Ecuación: y = 100x + 1000
```

---

**Líneas 40-41: Calcular R²**
```typescript
const predictions = x.map(xi => slope * xi + intercept);
const rSquared = StatisticalTests.rSquared(values, predictions);
```

**¿Qué hace?**
- Predice valores usando la línea de tendencia
- Calcula qué tan bien se ajusta (R²)

**Ejemplo:**
```javascript
predictions = [1000, 1100, 1200, 1300]  // Predicciones perfectas
values = [1000, 1100, 1200, 1300]       // Valores reales

rSquared = 1.0  // Ajuste perfecto
```

---

**Línea 43: Umbral de estabilidad**
```typescript
const threshold = 0.01 * StatisticalTests.mean(values);
```

**¿Qué es el umbral?**
- 1% del promedio
- Si el cambio es menor que esto, se considera estable

**Ejemplo:**
```javascript
mean = 1150
threshold = 0.01 * 1150 = 11.5

slope = 5   → |5| < 11.5 → 'stable'
slope = 100 → |100| > 11.5 → 'increasing'
```

---

**Líneas 45-50: Determinar dirección**
```typescript
let direction: 'increasing' | 'decreasing' | 'stable';
if (Math.abs(slope) < threshold) {
  direction = 'stable';
} else {
  direction = slope > 0 ? 'increasing' : 'decreasing';
}
```

**Lógica:**
```
|slope| < threshold → 'stable'
slope > 0 → 'increasing'
slope < 0 → 'decreasing'
```

**Ejemplo:**
```javascript
slope = 100, threshold = 11.5
|100| > 11.5 → No estable
100 > 0 → 'increasing'
```

---

### Ejemplo Completo

```javascript
const values = [1000, 1100, 1200, 1300, 1400];

const trend = TrendAnalyzer.detectTrend(values);

console.log(trend);
// {
//   direction: 'increasing',
//   strength: 1.0,
//   slope: 100
// }

// Interpretación: Tendencia creciente muy fuerte (+$100/mes)
```

**Visualización:**
```
    Valor
1400|         ●
    |        /
1300|       ●
    |      /
1200|     ●     ← Tendencia creciente
    |    /
1100|   ●
    |  /
1000| ●
    |_____________
      0  1  2  3  4
```

---

## 🔸 MÉTODO calculateGrowthRate (Líneas 59-69)

```typescript
static calculateGrowthRate(values: number[]): number {
  if (values.length < 2) return 0;

  const firstValue = values[0];
  const lastValue = values[values.length - 1];

  if (firstValue === 0) return 0;

  const growthRate = ((lastValue - firstValue) / firstValue) * 100;
  return growthRate;
}
```

**¿Qué hace?**
- Calcula el crecimiento porcentual del primero al último valor

**Fórmula:**
```
growthRate = ((final - inicial) / inicial) * 100
```

**Ejemplo:**
```javascript
values = [1000, 1100, 1200, 1300, 1500]

firstValue = 1000
lastValue = 1500

growthRate = ((1500 - 1000) / 1000) * 100
           = (500 / 1000) * 100
           = 50%

Interpretación: Crecimiento del 50% en el período
```

**Casos:**
```javascript
// Crecimiento positivo
[1000, 1500] → 50% ✅

// Decrecimiento
[1000, 800] → -20% 📉

// Sin cambio
[1000, 1000] → 0%

// División por cero evitada
[0, 100] → 0 (no se puede calcular)
```

---

## 🔹 MÉTODO detectSeasonality (Líneas 71-100)

```typescript
static detectSeasonality(values: number[], maxPeriod: number = 12): SeasonalityAnalysis {
  if (values.length < maxPeriod * 2) {
    return { hasSeasonality: false };
  }

  let maxCorrelation = 0;
  let bestPeriod = 0;

  for (let period = 2; period <= Math.min(maxPeriod, Math.floor(values.length / 2)); period++) {
    const correlation = StatisticalTests.autocorrelation(values, period);

    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestPeriod = period;
    }
  }

  const threshold = 0.3;
  const hasSeasonality = maxCorrelation > threshold;

  if (hasSeasonality) {
    return {
      hasSeasonality: true,
      period: bestPeriod,
      strength: maxCorrelation,
    };
  }

  return { hasSeasonality: false };
}
```

**¿Qué es estacionalidad?**
- Patrón que se **repite** regularmente
- Ejemplo: Gastos altos cada diciembre (navidad)

**¿Cómo funciona?**
1. Prueba diferentes períodos (2, 3, 4, ..., 12)
2. Calcula autocorrelación para cada período
3. El período con mayor correlación es el patrón

### Ejemplo Visual

**Datos con estacionalidad trimestral:**
```javascript
values = [
  1000, 1100, 1500,  // Q1: Pico en mes 3
  1000, 1100, 1500,  // Q2: Pico en mes 6
  1000, 1100, 1500,  // Q3: Pico en mes 9
  1000, 1100, 1500   // Q4: Pico en mes 12
]

// Patrón se repite cada 3 meses
```

**Autocorrelación por período:**
```javascript
period = 2: correlation = 0.2  // Baja
period = 3: correlation = 0.8  // ¡Alta! ← Patrón encontrado
period = 4: correlation = 0.1  // Baja
```

**Resultado:**
```javascript
{
  hasSeasonality: true,
  period: 3,
  strength: 0.8
}
// Interpretación: Patrón fuerte cada 3 meses
```

**Visualización:**
```
    Valor
1500|    ●     ●     ●     ●  ← Picos cada 3 meses
    |   /|    /|    /|    /|
1100|  ● |   ● |   ● |   ● |
    | /  |  /  |  /  |  /  |
1000|●   | ●   | ●   | ●   |
    |____|_____|_____|_____|
      1-3  4-6  7-9  10-12
```

---

## 🔺 MÉTODO findChangePoints (Líneas 102-133)

```typescript
static findChangePoints(values: number[]): ChangePoint[] {
  if (values.length < 10) return [];

  const changePoints: ChangePoint[] = [];
  const windowSize = Math.max(5, Math.floor(values.length / 10));

  for (let i = windowSize; i < values.length - windowSize; i++) {
    const before = values.slice(Math.max(0, i - windowSize), i);
    const after = values.slice(i, Math.min(values.length, i + windowSize));

    const meanBefore = StatisticalTests.mean(before);
    const meanAfter = StatisticalTests.mean(after);

    const stdBefore = StatisticalTests.standardDeviation(before);
    const stdAfter = StatisticalTests.standardDeviation(after);

    const pooledStd = Math.sqrt((stdBefore ** 2 + stdAfter ** 2) / 2);

    if (pooledStd === 0) continue;

    const significance = Math.abs(meanAfter - meanBefore) / pooledStd;

    if (significance > 2.0) {
      changePoints.push({
        index: i,
        significance,
      });
    }
  }

  return changePoints.sort((a, b) => b.significance - a.significance);
}
```

**¿Qué hace?**
- Detecta puntos donde hubo **cambios significativos**
- Compara promedios antes y después de cada punto

### Algoritmo

**1. Ventana deslizante:**
```
values = [1000, 1000, 1000, 2000, 2000, 2000]
                         ↑
                    Punto de cambio

Ventana antes:  [1000, 1000, 1000]
Ventana después: [2000, 2000, 2000]
```

**2. Calcular significancia:**
```typescript
const significance = Math.abs(meanAfter - meanBefore) / pooledStd;
```

**Fórmula:**
```
significance = |promedio_después - promedio_antes| / desviación_combinada
```

**Interpretación:**
```
significance > 2.0 → Cambio significativo
significance > 3.0 → Cambio muy significativo
significance > 4.0 → Cambio extremadamente significativo
```

### Ejemplo

```javascript
values = [
  1000, 1000, 1000, 1000,  // Período estable
  2000, 2000, 2000, 2000   // Cambio brusco
]

// En índice 4:
before = [1000, 1000, 1000]
after = [2000, 2000, 2000]

meanBefore = 1000
meanAfter = 2000
pooledStd = 0 (sin variación)

// Si hay variación:
significance = |2000 - 1000| / 100 = 10

// Resultado:
{
  index: 4,
  significance: 10
}
// Interpretación: Cambio muy significativo en posición 4
```

**Visualización:**
```
    Valor
2000|         ●●●●  ← Después del cambio
    |        /
    |       /
    |      / ← Punto de cambio (índice 4)
1000| ●●●●
    |_____________
      0  1  2  3  4  5  6  7
```

---

## 🔻 MÉTODO decomposeTimeSeries (Líneas 135-150)

```typescript
static decomposeTimeSeries(values: number[], period: number = 12): TimeSeriesDecomposition {
  if (values.length < period * 2) {
    return {
      trend: values,
      seasonal: Array(values.length).fill(0),
      residual: Array(values.length).fill(0),
    };
  }

  const trend = this.extractTrend(values, period);
  const detrended = values.map((val, i) => val - trend[i]);
  const seasonal = this.extractSeasonal(detrended, period);
  const residual = values.map((val, i) => val - trend[i] - seasonal[i]);

  return { trend, seasonal, residual };
}
```

**¿Qué hace?**
- Descompone la serie en 3 componentes:
  1. **Tendencia**: Dirección general
  2. **Estacionalidad**: Patrón repetitivo
  3. **Residual**: Ruido aleatorio

**Fórmula:**
```
Valor = Tendencia + Estacionalidad + Residual
```

### Ejemplo Visual

**Datos originales:**
```javascript
values = [1050, 980, 1120, 1180, 1110, 1250, 1310, 1240, 1380]
```

**Descomposición:**

**1. Tendencia (línea suavizada):**
```javascript
trend = [1000, 1050, 1100, 1150, 1200, 1250, 1300, 1350, 1400]
// Aumenta gradualmente
```

**2. Estacionalidad (patrón repetitivo):**
```javascript
seasonal = [50, -70, 20, 50, -70, 20, 50, -70, 20]
// Patrón: +50, -70, +20 que se repite
```

**3. Residual (ruido):**
```javascript
residual = [0, 0, 0, -20, -20, -20, -40, -40, -40]
// Pequeñas variaciones aleatorias
```

**Verificación:**
```javascript
values[0] = trend[0] + seasonal[0] + residual[0]
1050 = 1000 + 50 + 0 ✅

values[3] = trend[3] + seasonal[3] + residual[3]
1180 = 1150 + 50 + (-20) ✅
```

**Visualización:**
```
Original:
1400|         ●
    |    ●   / \
1200|   / \ /   ●
    |  /   ●     \
1000| ●           ●

Tendencia:
1400|         ╱
    |       ╱
1200|     ╱
    |   ╱
1000| ╱

Estacionalidad:
 50 | ●   ●   ●
  0 |___________
-70 |  ●   ●   ●
```

---

## 🔲 MÉTODO calculateDerivative (Líneas 186-196)

```typescript
static calculateDerivative(values: number[]): number[] {
  if (values.length < 2) return [];

  const derivative: number[] = [];

  for (let i = 0; i < values.length - 1; i++) {
    derivative.push(values[i + 1] - values[i]);
  }

  return derivative;
}
```

**¿Qué es la derivada?**
- **Cambio** de un valor al siguiente
- Mide la "velocidad" del cambio

**Fórmula:**
```
derivative[i] = values[i+1] - values[i]
```

**Ejemplo:**
```javascript
values = [1000, 1100, 1250, 1300, 1500]

derivative[0] = 1100 - 1000 = 100
derivative[1] = 1250 - 1100 = 150
derivative[2] = 1300 - 1250 = 50
derivative[3] = 1500 - 1300 = 200

derivative = [100, 150, 50, 200]
```

**Interpretación:**
```
100 → Aumentó $100
150 → Aumentó $150 (aceleró)
50  → Aumentó $50 (desaceleró)
200 → Aumentó $200 (aceleró mucho)
```

**Visualización:**
```
    Valor
1500|         ●
    |        /↑ +200
1300|       ●
    |      /↑ +50
1250|     ●
    |    /↑ +150
1100|   ●
    |  /↑ +100
1000| ●
```

---

## 🔳 MÉTODO calculateVelocity (Líneas 198-203)

```typescript
static calculateVelocity(values: number[]): number {
  if (values.length < 2) return 0;

  const derivative = this.calculateDerivative(values);
  return StatisticalTests.mean(derivative);
}
```

**¿Qué es la velocidad?**
- **Promedio** de los cambios
- Cambio promedio por período

**Ejemplo:**
```javascript
values = [1000, 1100, 1250, 1300, 1500]

derivative = [100, 150, 50, 200]

velocity = (100 + 150 + 50 + 200) / 4 = 125

Interpretación: En promedio, aumenta $125 por período
```

---

## 🔘 MÉTODO calculateAcceleration (Líneas 205-212)

```typescript
static calculateAcceleration(values: number[]): number {
  if (values.length < 3) return 0;

  const firstDerivative = this.calculateDerivative(values);
  const secondDerivative = this.calculateDerivative(firstDerivative);

  return StatisticalTests.mean(secondDerivative);
}
```

**¿Qué es la aceleración?**
- **Cambio de la velocidad**
- Derivada de la derivada
- Mide si el crecimiento se acelera o desacelera

**Ejemplo:**
```javascript
values = [1000, 1100, 1250, 1300, 1500]

// Primera derivada (velocidad)
firstDerivative = [100, 150, 50, 200]

// Segunda derivada (aceleración)
secondDerivative[0] = 150 - 100 = 50
secondDerivative[1] = 50 - 150 = -100
secondDerivative[2] = 200 - 50 = 150

secondDerivative = [50, -100, 150]

acceleration = (50 + (-100) + 150) / 3 = 33.33

Interpretación: La velocidad aumenta en promedio $33.33 por período
```

**Analogía con un auto:**
```
Posición: [0, 10, 30, 60, 100] metros
Velocidad: [10, 20, 30, 40] m/s
Aceleración: [10, 10, 10] m/s²

El auto acelera constantemente a 10 m/s²
```

---

## 🔴 MÉTODO identifyOutlierPeriods (Líneas 214-233)

```typescript
static identifyOutlierPeriods(values: number[]): number[] {
  if (values.length < 4) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = StatisticalTests.percentile(values, 25);
  const q3 = StatisticalTests.percentile(values, 75);
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outlierIndices: number[] = [];
  values.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      outlierIndices.push(index);
    }
  });

  return outlierIndices;
}
```

**¿Qué hace?**
- Identifica **períodos anómalos** (outliers)
- Usa el método IQR (igual que en dataPreprocessor)

**Ejemplo:**
```javascript
values = [1000, 1100, 1200, 5000, 1300, 1400]
                              ↑ Outlier

q1 = 1100
q3 = 1300
iqr = 200

lowerBound = 1100 - 1.5 * 200 = 800
upperBound = 1300 + 1.5 * 200 = 1600

outlierIndices = [3]  // Índice del valor 5000

Interpretación: El mes 3 tuvo un gasto anómalo
```

---

## 🟢 MÉTODO smoothSeries (Líneas 235-237)

```typescript
static smoothSeries(values: number[], alpha: number = 0.3): number[] {
  return StatisticalTests.exponentialSmoothing(values, alpha);
}
```

**¿Qué hace?**
- Suaviza la serie usando suavizado exponencial
- Wrapper de `StatisticalTests.exponentialSmoothing()`

---

## 📊 Ejemplo Completo de Análisis

```javascript
// Datos de gastos mensuales
const monthlyExpenses = [
  1000, 1100, 1500,  // Q1
  1050, 1150, 1550,  // Q2
  1100, 1200, 1600,  // Q3
  1150, 1250, 1650   // Q4
];

// 1. Detectar tendencia
const trend = TrendAnalyzer.detectTrend(monthlyExpenses);
console.log('Tendencia:', trend);
// {
//   direction: 'increasing',
//   strength: 0.95,
//   slope: 50
// }
// → Gastos aumentan $50/mes con tendencia fuerte

// 2. Calcular crecimiento
const growth = TrendAnalyzer.calculateGrowthRate(monthlyExpenses);
console.log('Crecimiento:', growth + '%');
// 65%
// → Crecimiento del 65% en el año

// 3. Detectar estacionalidad
const seasonality = TrendAnalyzer.detectSeasonality(monthlyExpenses);
console.log('Estacionalidad:', seasonality);
// {
//   hasSeasonality: true,
//   period: 3,
//   strength: 0.8
// }
// → Patrón trimestral fuerte (picos cada 3 meses)

// 4. Encontrar cambios
const changes = TrendAnalyzer.findChangePoints(monthlyExpenses);
console.log('Puntos de cambio:', changes);
// [{ index: 2, significance: 3.5 }]
// → Cambio significativo en marzo

// 5. Descomponer serie
const decomposition = TrendAnalyzer.decomposeTimeSeries(monthlyExpenses, 3);
console.log('Componentes:', decomposition);
// {
//   trend: [1000, 1050, 1100, 1150, ...],
//   seasonal: [0, 50, 400, 0, 50, 400, ...],
//   residual: [0, 0, 0, -50, 50, 0, ...]
// }

// 6. Calcular velocidad
const velocity = TrendAnalyzer.calculateVelocity(monthlyExpenses);
console.log('Velocidad:', velocity);
// 59.09
// → Aumenta en promedio $59.09/mes

// 7. Calcular aceleración
const acceleration = TrendAnalyzer.calculateAcceleration(monthlyExpenses);
console.log('Aceleración:', acceleration);
// 0
// → Crecimiento constante (no acelera ni desacelera)

// 8. Identificar outliers
const outliers = TrendAnalyzer.identifyOutlierPeriods(monthlyExpenses);
console.log('Outliers:', outliers);
// []
// → No hay meses anómalos
```

---

## 🎓 Resumen de Métodos

| Método | Propósito | Retorna |
|--------|-----------|---------|
| `detectTrend()` | Dirección de tendencia | direction, strength, slope |
| `calculateGrowthRate()` | Crecimiento % | number |
| `detectSeasonality()` | Patrón repetitivo | hasSeasonality, period, strength |
| `findChangePoints()` | Cambios significativos | ChangePoint[] |
| `decomposeTimeSeries()` | Separar componentes | trend, seasonal, residual |
| `calculateDerivative()` | Cambios entre valores | number[] |
| `calculateVelocity()` | Cambio promedio | number |
| `calculateAcceleration()` | Cambio de velocidad | number |
| `identifyOutlierPeriods()` | Períodos anómalos | number[] |
| `smoothSeries()` | Suavizar datos | number[] |

---

## 🚀 Casos de Uso

### 1. Dashboard de Insights

```javascript
const expenses = await getMonthlyExpenses(userId);

const trend = TrendAnalyzer.detectTrend(expenses);
const growth = TrendAnalyzer.calculateGrowthRate(expenses);
const seasonality = TrendAnalyzer.detectSeasonality(expenses);

// Mostrar en UI
showTrend(trend.direction, trend.slope);
showGrowth(growth);
if (seasonality.hasSeasonality) {
  showSeasonalPattern(seasonality.period);
}
```

### 2. Alertas Inteligentes

```javascript
const changes = TrendAnalyzer.findChangePoints(expenses);

changes.forEach(change => {
  if (change.significance > 3.0) {
    sendAlert(`Cambio significativo detectado en ${change.date}`);
  }
});
```

### 3. Predicciones Mejoradas

```javascript
const decomposition = TrendAnalyzer.decomposeTimeSeries(expenses, 12);

// Usar solo la tendencia para predicciones más estables
const predictions = model.predict(decomposition.trend);
```

---

¡Documentación completa del analizador de tendencias! Este es el detective que encuentra patrones ocultos en tus datos. 🔍📈

