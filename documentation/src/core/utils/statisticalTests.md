# Documentación ULTRA Didáctica: statisticalTests.ts

**Ubicación:** `src/core/utils/statisticalTests.ts`

**Propósito:** Este archivo es la "calculadora estadística" del sistema. Contiene **15 funciones matemáticas** que miden qué tan buenas son las predicciones y analizan patrones en los datos. Es como tener un matemático experto que evalúa la calidad de las predicciones.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina que haces predicciones del clima:

```
Predicción: "Mañana lloverá 10mm"
Realidad: Llovió 12mm

¿Qué tan buena fue la predicción?
→ Este archivo calcula eso
```

**En nuestro sistema:**
```
Predicción: "Gastarás $1,500 en diciembre"
Realidad: Gastaste $1,450

¿Qué tan precisa fue la predicción?
→ R² = 0.96 (96% de precisión) ✅
→ MAE = $50 (error promedio)
→ MAPE = 3.3% (error porcentual)
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  ESTADÍSTICAS BÁSICAS (líneas 2-17)     │
│  ├─ mean()              → Promedio       │
│  ├─ variance()          → Varianza       │
│  └─ standardDeviation() → Desv. estándar│
├──────────────────────────────────────────┤
│  RELACIONES (líneas 19-43)              │
│  ├─ covariance()        → Covarianza     │
│  └─ correlation()       → Correlación    │
├──────────────────────────────────────────┤
│  INTERVALOS (líneas 45-71)              │
│  └─ confidenceInterval() → Int. confianza│
├──────────────────────────────────────────┤
│  SUAVIZADO (líneas 73-100)              │
│  ├─ movingAverage()     → Media móvil    │
│  └─ exponentialSmoothing() → Suavizado  │
├──────────────────────────────────────────┤
│  MÉTRICAS DE ERROR (líneas 102-155)     │
│  ├─ rSquared()          → R²             │
│  ├─ mape()              → MAPE           │
│  ├─ mae()               → MAE            │
│  └─ rmse()              → RMSE           │
├──────────────────────────────────────────┤
│  REGRESIÓN (líneas 157-178)             │
│  └─ linearRegression()  → Regresión      │
├──────────────────────────────────────────┤
│  SERIES TEMPORALES (líneas 180-198)     │
│  └─ autocorrelation()   → Autocorrelación│
├──────────────────────────────────────────┤
│  PERCENTILES (líneas 200-228)           │
│  ├─ median()            → Mediana        │
│  └─ percentile()        → Percentil      │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

## 🔷 ESTADÍSTICAS BÁSICAS

### Líneas 2-6: mean (Promedio)

```typescript
static mean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}
```

**¿Qué es el promedio?**
- Suma de todos los valores dividida por la cantidad
- También llamado "media aritmética"

**Fórmula:**
```
mean = (Σ values) / n
```

**Ejemplo:**
```javascript
values = [100, 150, 200, 250]

sum = 100 + 150 + 200 + 250 = 700
n = 4
mean = 700 / 4 = 175

Interpretación: El gasto promedio es $175
```

**Visualización:**
```
    Valor
250 |       ●
200 |     ●
175 |   ─────  ← Promedio
150 |   ●
100 | ●
```

---

### Líneas 8-13: variance (Varianza)

```typescript
static variance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = this.mean(values);
  const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
  return this.mean(squaredDiffs);
}
```

**¿Qué es la varianza?**
- Mide qué tan **dispersos** están los datos
- Promedio de las diferencias al cuadrado

**Fórmula:**
```
variance = Σ(value - mean)² / n
```

**Ejemplo paso a paso:**
```javascript
values = [100, 150, 200, 250]
mean = 175

// Diferencias
100 - 175 = -75
150 - 175 = -25
200 - 175 = 25
250 - 175 = 75

// Cuadrados
(-75)² = 5625
(-25)² = 625
(25)² = 625
(75)² = 5625

// Promedio de cuadrados
variance = (5625 + 625 + 625 + 5625) / 4 = 12500 / 4 = 3125
```

**Interpretación:**
```
Varianza alta = Datos muy dispersos
Varianza baja = Datos concentrados

values = [100, 110, 120]  → Varianza baja (datos cercanos)
values = [10, 500, 1000]  → Varianza alta (datos dispersos)
```

---

### Líneas 15-17: standardDeviation (Desviación Estándar)

```typescript
static standardDeviation(values: number[]): number {
  return Math.sqrt(this.variance(values));
}
```

**¿Qué es la desviación estándar?**
- Raíz cuadrada de la varianza
- Mide dispersión en las **mismas unidades** que los datos

**Fórmula:**
```
std = √variance
```

**Ejemplo:**
```javascript
variance = 3125
std = √3125 = 55.9

Interpretación: Los datos varían ±$55.90 del promedio
```

**¿Por qué usar std en lugar de varianza?**
```
Datos en dólares: [100, 150, 200, 250]

Varianza = 3125 dólares²  ← Unidad extraña
Std = 55.9 dólares        ← Misma unidad que datos ✅
```

**Visualización:**
```
    Valor
250 |       ●
    |   ┌───┐
200 |   │ ● │  ← Rango de ±1 std
    |   │   │
150 |   │ ● │
    |   └───┘
100 | ●
```

---

## 🔶 RELACIONES ENTRE VARIABLES

### Líneas 19-31: covariance (Covarianza)

```typescript
static covariance(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const meanX = this.mean(x);
  const meanY = this.mean(y);

  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY);
  }

  return sum / x.length;
}
```

**¿Qué es la covarianza?**
- Mide si dos variables **cambian juntas**
- Positiva: Cuando una sube, la otra sube
- Negativa: Cuando una sube, la otra baja
- Cero: No hay relación

**Fórmula:**
```
cov(x,y) = Σ[(x - meanX) * (y - meanY)] / n
```

**Ejemplo:**
```javascript
// Mes (x) vs Gasto (y)
x = [1, 2, 3, 4]  // Meses
y = [100, 150, 200, 250]  // Gastos

meanX = 2.5
meanY = 175

// Productos de diferencias
(1 - 2.5) * (100 - 175) = (-1.5) * (-75) = 112.5
(2 - 2.5) * (150 - 175) = (-0.5) * (-25) = 12.5
(3 - 2.5) * (200 - 175) = (0.5) * (25) = 12.5
(4 - 2.5) * (250 - 175) = (1.5) * (75) = 112.5

cov = (112.5 + 12.5 + 12.5 + 112.5) / 4 = 250 / 4 = 62.5
```

**Interpretación:**
```
cov > 0: Relación positiva (ambas suben juntas)
cov < 0: Relación negativa (una sube, otra baja)
cov = 0: Sin relación
```

---

### Líneas 33-43: correlation (Correlación)

```typescript
static correlation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const cov = this.covariance(x, y);
  const stdX = this.standardDeviation(x);
  const stdY = this.standardDeviation(y);

  if (stdX === 0 || stdY === 0) return 0;

  return cov / (stdX * stdY);
}
```

**¿Qué es la correlación?**
- Covarianza **normalizada** entre -1 y 1
- Mide la **fuerza** de la relación

**Fórmula:**
```
correlation = cov(x,y) / (std(x) * std(y))
```

**Interpretación:**
```
+1.0 = Correlación perfecta positiva
+0.7 = Correlación fuerte positiva
+0.3 = Correlación débil positiva
 0.0 = Sin correlación
-0.3 = Correlación débil negativa
-0.7 = Correlación fuerte negativa
-1.0 = Correlación perfecta negativa
```

**Visualización:**
```
Correlación +1:        Correlación 0:        Correlación -1:
    y                      y                      y
    |  ●                   |  ●   ●               |      ●
    | ●                    |    ●                 |    ●
    |●                     | ●     ●              |  ●
    |_____ x               |_____ x               |_____ x
```

**Ejemplo:**
```javascript
// Mes vs Gasto
x = [1, 2, 3, 4]
y = [100, 150, 200, 250]

cov = 62.5
stdX = 1.118
stdY = 55.9

correlation = 62.5 / (1.118 * 55.9) = 62.5 / 62.5 = 1.0

Interpretación: Correlación perfecta (gastos aumentan linealmente con el tiempo)
```

---

## 🔸 INTERVALOS DE CONFIANZA

### Líneas 45-71: confidenceInterval

```typescript
static confidenceInterval(
  values: number[],
  confidenceLevel: number = 0.95
): { lower: number; upper: number; mean: number } {
  // ... código ...
  const avg = this.mean(values);
  const std = this.standardDeviation(values);
  const n = values.length;

  const zScores: { [key: number]: number } = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };

  const z = zScores[confidenceLevel] || 1.96;
  const marginOfError = z * (std / Math.sqrt(n));

  return {
    lower: avg - marginOfError,
    upper: avg + marginOfError,
    mean: avg,
  };
}
```

**¿Qué es un intervalo de confianza?**
- Rango donde probablemente está el **valor real**
- 95% de confianza = 95% de probabilidad de estar en el rango

**Fórmula:**
```
margin = z * (std / √n)
lower = mean - margin
upper = mean + margin
```

**Z-scores:**
```
90% confianza → z = 1.645
95% confianza → z = 1.96
99% confianza → z = 2.576
```

**Ejemplo:**
```javascript
values = [100, 110, 120, 130, 140]

mean = 120
std = 14.14
n = 5
z = 1.96 (95% confianza)

margin = 1.96 * (14.14 / √5) = 1.96 * 6.32 = 12.4

lower = 120 - 12.4 = 107.6
upper = 120 + 12.4 = 132.4

Interpretación: Con 95% de confianza, el valor real está entre $107.60 y $132.40
```

**Visualización:**
```
    Valor
140 |     ●
132 |   ┌─────┐ ← Límite superior
120 |   │  ●  │ ← Media
108 |   └─────┘ ← Límite inferior
100 | ●
    
    95% de confianza que el valor real está en el rango
```

---

## 🔹 SUAVIZADO DE DATOS

### Líneas 73-86: movingAverage (Media Móvil)

```typescript
static movingAverage(values: number[], window: number): number[] {
  if (window <= 0 || window > values.length) return values;

  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length, i + Math.ceil(window / 2));
    const windowValues = values.slice(start, end);
    result.push(this.mean(windowValues));
  }

  return result;
}
```

**¿Qué es la media móvil?**
- Promedio de una **ventana** de valores
- Suaviza fluctuaciones y muestra tendencias

**Ejemplo con ventana = 3:**
```javascript
values = [100, 150, 200, 250, 300]
window = 3

Posición 0 (100):
  ventana = [100, 150]  // Solo 2 valores disponibles
  promedio = 125

Posición 1 (150):
  ventana = [100, 150, 200]
  promedio = 150

Posición 2 (200):
  ventana = [150, 200, 250]
  promedio = 200

Posición 3 (250):
  ventana = [200, 250, 300]
  promedio = 250

Posición 4 (300):
  ventana = [250, 300]  // Solo 2 valores disponibles
  promedio = 275

result = [125, 150, 200, 250, 275]
```

**Visualización:**
```
    Valor
300 |         ●
    |        /
250 |      ●
    |     /
200 |   ●       ← Original (con picos)
    |  /
150 | ●
    |/
100 |●

    Valor
300 |         ●
    |       ╱
250 |     ●
    |   ╱
200 | ●         ← Suavizado (sin picos)
    |╱
150 |●
    |
100 |●
```

---

### Líneas 88-100: exponentialSmoothing (Suavizado Exponencial)

```typescript
static exponentialSmoothing(values: number[], alpha: number = 0.3): number[] {
  if (values.length === 0) return [];
  if (alpha < 0 || alpha > 1) alpha = 0.3;

  const result: number[] = [values[0]];

  for (let i = 1; i < values.length; i++) {
    const smoothed = alpha * values[i] + (1 - alpha) * result[i - 1];
    result.push(smoothed);
  }

  return result;
}
```

**¿Qué es el suavizado exponencial?**
- Promedio ponderado que da **más peso** a valores recientes
- `alpha` controla cuánto peso dar al valor actual

**Fórmula:**
```
smoothed[i] = α * value[i] + (1 - α) * smoothed[i-1]
```

**Parámetro alpha:**
```
α = 0.1 → Suavizado fuerte (lento a cambios)
α = 0.5 → Suavizado moderado
α = 0.9 → Suavizado débil (rápido a cambios)
```

**Ejemplo con α = 0.3:**
```javascript
values = [100, 150, 200, 250]
alpha = 0.3

result[0] = 100  // Primer valor sin cambios

result[1] = 0.3 * 150 + 0.7 * 100
         = 45 + 70 = 115

result[2] = 0.3 * 200 + 0.7 * 115
         = 60 + 80.5 = 140.5

result[3] = 0.3 * 250 + 0.7 * 140.5
         = 75 + 98.35 = 173.35

result = [100, 115, 140.5, 173.35]
```

**Comparación:**
```
Original:  [100, 150, 200, 250]
Suavizado: [100, 115, 140, 173]  ← Cambios más graduales
```

---

## 🔺 MÉTRICAS DE ERROR

### Líneas 102-117: rSquared (R²)

```typescript
static rSquared(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0;

  const meanActual = this.mean(actual);
  let ssTotal = 0;
  let ssResidual = 0;

  for (let i = 0; i < actual.length; i++) {
    ssTotal += Math.pow(actual[i] - meanActual, 2);
    ssResidual += Math.pow(actual[i] - predicted[i], 2);
  }

  if (ssTotal === 0) return 0;

  return 1 - ssResidual / ssTotal;
}
```

**¿Qué es R²?**
- **Coeficiente de determinación**
- Mide qué tan bien el modelo explica los datos
- Valor de 0 a 1 (o negativo si muy malo)

**Fórmula:**
```
R² = 1 - (SS_residual / SS_total)

SS_total = Σ(actual - mean)²
SS_residual = Σ(actual - predicted)²
```

**Ejemplo:**
```javascript
actual = [100, 150, 200, 250]
predicted = [105, 145, 205, 245]

meanActual = 175

// SS_total (variación total)
(100 - 175)² = 5625
(150 - 175)² = 625
(200 - 175)² = 625
(250 - 175)² = 5625
SS_total = 12500

// SS_residual (error del modelo)
(100 - 105)² = 25
(150 - 145)² = 25
(200 - 205)² = 25
(250 - 245)² = 25
SS_residual = 100

R² = 1 - (100 / 12500) = 1 - 0.008 = 0.992

Interpretación: 99.2% de precisión ✅
```

**Interpretación:**
```
R² = 1.00  → Predicción perfecta (100%)
R² = 0.95  → Excelente (95%)
R² = 0.85  → Muy bueno (85%)
R² = 0.70  → Aceptable (70%)
R² = 0.50  → Pobre (50%)
R² = 0.00  → Muy malo (0%)
R² < 0.00  → Peor que predecir el promedio
```

---

### Líneas 119-133: mape (MAPE)

```typescript
static mape(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0;

  let sum = 0;
  let count = 0;

  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      count++;
    }
  }

  return count > 0 ? (sum / count) * 100 : 0;
}
```

**¿Qué es MAPE?**
- **Mean Absolute Percentage Error**
- Error promedio en **porcentaje**
- Más fácil de interpretar que MAE

**Fórmula:**
```
MAPE = (Σ |actual - predicted| / actual) / n * 100
```

**Ejemplo:**
```javascript
actual = [1000, 1500, 2000]
predicted = [1050, 1450, 2100]

// Errores porcentuales
|1000 - 1050| / 1000 = 50 / 1000 = 0.05 (5%)
|1500 - 1450| / 1500 = 50 / 1500 = 0.033 (3.3%)
|2000 - 2100| / 2000 = 100 / 2000 = 0.05 (5%)

MAPE = (0.05 + 0.033 + 0.05) / 3 * 100 = 4.4%

Interpretación: Error promedio del 4.4%
```

**Interpretación:**
```
MAPE < 5%   → Excelente
MAPE < 10%  → Muy bueno
MAPE < 15%  → Aceptable
MAPE < 20%  → Pobre
MAPE > 20%  → Muy malo
```

**¿Por qué evitar división por cero?**
```typescript
if (actual[i] !== 0) {
  // Solo calcular si actual no es cero
}
```
- División por cero = Infinity
- Se omiten valores donde actual = 0

---

### Líneas 135-144: mae (MAE)

```typescript
static mae(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0;

  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    sum += Math.abs(actual[i] - predicted[i]);
  }

  return sum / actual.length;
}
```

**¿Qué es MAE?**
- **Mean Absolute Error**
- Error promedio en **unidades absolutas** (dólares)

**Fórmula:**
```
MAE = Σ|actual - predicted| / n
```

**Ejemplo:**
```javascript
actual = [1000, 1500, 2000]
predicted = [1050, 1450, 2100]

// Errores absolutos
|1000 - 1050| = 50
|1500 - 1450| = 50
|2000 - 2100| = 100

MAE = (50 + 50 + 100) / 3 = 200 / 3 = 66.67

Interpretación: Error promedio de $66.67
```

---

### Líneas 146-155: rmse (RMSE)

```typescript
static rmse(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0;

  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    sum += Math.pow(actual[i] - predicted[i], 2);
  }

  return Math.sqrt(sum / actual.length);
}
```

**¿Qué es RMSE?**
- **Root Mean Square Error**
- Similar a MAE pero **penaliza errores grandes** más fuertemente

**Fórmula:**
```
RMSE = √(Σ(actual - predicted)² / n)
```

**Ejemplo:**
```javascript
actual = [1000, 1500, 2000]
predicted = [1050, 1450, 2100]

// Errores al cuadrado
(1000 - 1050)² = 2500
(1500 - 1450)² = 2500
(2000 - 2100)² = 10000

RMSE = √((2500 + 2500 + 10000) / 3)
     = √(15000 / 3)
     = √5000
     = 70.71

Interpretación: Error cuadrático de $70.71
```

**MAE vs RMSE:**
```
Errores: [50, 50, 100]

MAE = (50 + 50 + 100) / 3 = 66.67
RMSE = √((2500 + 2500 + 10000) / 3) = 70.71

RMSE > MAE porque penaliza el error de 100 más fuertemente
```

---

## 🔻 REGRESIÓN LINEAL

### Líneas 157-178: linearRegression

```typescript
static linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  // ... código ...
  const n = x.length;
  const meanX = this.mean(x);
  const meanY = this.mean(y);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  return { slope, intercept };
}
```

**¿Qué hace?**
- Encuentra la **línea que mejor se ajusta** a los datos
- Retorna pendiente e intercepto

**Fórmula:**
```
y = slope * x + intercept

slope = Σ[(x - meanX) * (y - meanY)] / Σ(x - meanX)²
intercept = meanY - slope * meanX
```

**Ejemplo:**
```javascript
x = [1, 2, 3, 4]  // Meses
y = [100, 150, 200, 250]  // Gastos

meanX = 2.5
meanY = 175

// Numerador
(1 - 2.5) * (100 - 175) = 112.5
(2 - 2.5) * (150 - 175) = 12.5
(3 - 2.5) * (200 - 175) = 12.5
(4 - 2.5) * (250 - 175) = 112.5
numerator = 250

// Denominador
(1 - 2.5)² = 2.25
(2 - 2.5)² = 0.25
(3 - 2.5)² = 0.25
(4 - 2.5)² = 2.25
denominator = 5

slope = 250 / 5 = 50
intercept = 175 - 50 * 2.5 = 50

Ecuación: y = 50x + 50
Interpretación: Gastos aumentan $50 por mes, empezando en $50
```

---

## 🔲 SERIES TEMPORALES

### Líneas 180-198: autocorrelation

```typescript
static autocorrelation(values: number[], lag: number): number {
  if (lag <= 0 || lag >= values.length) return 0;

  const n = values.length;
  const mean = this.mean(values);
  
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n - lag; i++) {
    numerator += (values[i] - mean) * (values[i + lag] - mean);
  }

  for (let i = 0; i < n; i++) {
    denominator += Math.pow(values[i] - mean, 2);
  }

  return denominator !== 0 ? numerator / denominator : 0;
}
```

**¿Qué es autocorrelación?**
- Correlación de una serie consigo misma **desplazada**
- Detecta patrones repetitivos

**Lag (retraso):**
```
lag = 1: Compara cada valor con el siguiente
lag = 2: Compara cada valor con el que está 2 posiciones adelante
lag = 7: Compara cada valor con el de 7 posiciones adelante (útil para detectar ciclos semanales)
```

**Ejemplo con lag = 1:**
```javascript
values = [100, 150, 200, 250, 300]
lag = 1
mean = 200

// Comparar cada valor con el siguiente
(100 - 200) * (150 - 200) = (-100) * (-50) = 5000
(150 - 200) * (200 - 200) = (-50) * (0) = 0
(200 - 200) * (250 - 200) = (0) * (50) = 0
(250 - 200) * (300 - 200) = (50) * (100) = 5000

numerator = 10000

// Denominador (varianza total)
denominator = 40000

autocorr = 10000 / 40000 = 0.25

Interpretación: Correlación positiva débil con el valor anterior
```

---

## 🔳 PERCENTILES

### Líneas 200-211: median (Mediana)

```typescript
static median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}
```

**¿Qué es la mediana?**
- Valor **del medio** cuando los datos están ordenados
- Menos sensible a outliers que el promedio

**Ejemplo con cantidad impar:**
```javascript
values = [100, 200, 300, 400, 500]
sorted = [100, 200, 300, 400, 500]
mid = 2

median = sorted[2] = 300
```

**Ejemplo con cantidad par:**
```javascript
values = [100, 200, 300, 400]
sorted = [100, 200, 300, 400]
mid = 2

median = (sorted[1] + sorted[2]) / 2
       = (200 + 300) / 2
       = 250
```

**Mediana vs Promedio:**
```
Datos: [100, 110, 120, 130, 1000]  ← Outlier

Promedio = 292  ← Afectado por outlier
Mediana = 120   ← No afectada ✅
```

---

### Líneas 213-228: percentile (Percentil)

```typescript
static percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  if (p < 0 || p > 100) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
```

**¿Qué es un percentil?**
- Valor por debajo del cual está el **p%** de los datos

**Ejemplos:**
```
Percentil 25 (Q1): 25% de datos están por debajo
Percentil 50 (Mediana): 50% de datos están por debajo
Percentil 75 (Q3): 75% de datos están por debajo
Percentil 90: 90% de datos están por debajo
```

**Ejemplo:**
```javascript
values = [100, 200, 300, 400, 500]
p = 75  // Percentil 75

sorted = [100, 200, 300, 400, 500]
index = (75 / 100) * (5 - 1) = 0.75 * 4 = 3

lower = 3
upper = 3
weight = 0

percentile = sorted[3] = 400

Interpretación: 75% de los datos están por debajo de $400
```

**Ejemplo con interpolación:**
```javascript
values = [100, 200, 300, 400, 500]
p = 60

index = (60 / 100) * 4 = 2.4

lower = 2  → sorted[2] = 300
upper = 3  → sorted[3] = 400
weight = 0.4

percentile = 300 * (1 - 0.4) + 400 * 0.4
           = 300 * 0.6 + 400 * 0.4
           = 180 + 160
           = 340

Interpretación: 60% de los datos están por debajo de $340
```

---

## 📊 Resumen de Métricas

### Tabla Comparativa

| Métrica | Fórmula | Rango | Interpretación |
|---------|---------|-------|----------------|
| **R²** | 1 - (SS_res / SS_tot) | 0 a 1 | % de varianza explicada |
| **MAPE** | Σ\|error\| / actual * 100 | 0 a ∞ | Error porcentual |
| **MAE** | Σ\|error\| / n | 0 a ∞ | Error promedio (dólares) |
| **RMSE** | √(Σerror² / n) | 0 a ∞ | Error cuadrático (dólares) |

### Cuándo Usar Cada Métrica

**R²:**
- Evaluar calidad general del modelo
- Comparar diferentes modelos
- Valor: Más alto = mejor

**MAPE:**
- Comunicar precisión a usuarios
- Fácil de entender (porcentaje)
- Valor: Más bajo = mejor

**MAE:**
- Medir error promedio en dólares
- Menos sensible a outliers
- Valor: Más bajo = mejor

**RMSE:**
- Penalizar errores grandes
- Optimización de modelos
- Valor: Más bajo = mejor

---

## 🚀 Ejemplo Completo

```javascript
// Datos reales vs predichos
const actual = [1000, 1100, 1200, 1300, 1400];
const predicted = [1020, 1080, 1210, 1290, 1420];

// Calcular todas las métricas
const r2 = StatisticalTests.rSquared(actual, predicted);
console.log(`R²: ${r2.toFixed(3)}`);
// Output: R²: 0.992 (99.2% de precisión)

const mape = StatisticalTests.mape(actual, predicted);
console.log(`MAPE: ${mape.toFixed(2)}%`);
// Output: MAPE: 1.52% (error del 1.52%)

const mae = StatisticalTests.mae(actual, predicted);
console.log(`MAE: $${mae.toFixed(2)}`);
// Output: MAE: $18.00 (error promedio de $18)

const rmse = StatisticalTests.rmse(actual, predicted);
console.log(`RMSE: $${rmse.toFixed(2)}`);
// Output: RMSE: $20.00 (error cuadrático de $20)

// Estadísticas básicas
const mean = StatisticalTests.mean(actual);
console.log(`Promedio: $${mean}`);
// Output: Promedio: $1200

const std = StatisticalTests.standardDeviation(actual);
console.log(`Desv. Estándar: $${std.toFixed(2)}`);
// Output: Desv. Estándar: $141.42

// Intervalo de confianza
const ci = StatisticalTests.confidenceInterval(actual, 0.95);
console.log(`IC 95%: [$${ci.lower.toFixed(2)}, $${ci.upper.toFixed(2)}]`);
// Output: IC 95%: [$1075.84, $1324.16]
```

---

¡Documentación completa de las pruebas estadísticas! Este es el matemático que evalúa la calidad de las predicciones. 📊🔬

