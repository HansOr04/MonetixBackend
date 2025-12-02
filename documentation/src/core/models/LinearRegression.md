# Documentación ULTRA Didáctica: LinearRegression.ts

**Ubicación:** `src/core/models/LinearRegression.ts`

**Propósito:** Este archivo implementa el algoritmo de **Regresión Lineal Cuadrática** para predecir gastos futuros basándose en datos históricos. Es el "cerebro matemático" que aprende de tus patrones de gasto y predice el futuro.

---

## 🎯 ¿Qué es Regresión Lineal?

Imagina que tienes estos gastos mensuales:

```
Enero:   $1000
Febrero: $1100
Marzo:   $1200
Abril:   $1300
```

**Pregunta:** ¿Cuánto gastarás en Mayo?

La regresión lineal **encuentra el patrón** (aumenta $100 cada mes) y predice: **$1400**

### Analogía Simple

```
Regresión Lineal = Encontrar la línea que mejor se ajusta a los puntos

    Gasto ($)
    1400 |              ● (predicción)
    1300 |           ●
    1200 |        ●
    1100 |     ●
    1000 |  ●
         |________________
           E  F  M  A  M  (meses)
           
La línea conecta los puntos y se extiende al futuro
```

---

## 📚 Estructura del Archivo

```
┌─────────────────────────────────────┐
│  1. IMPORTACIONES (líneas 1-7)     │
├─────────────────────────────────────┤
│  2. PROPIEDADES PRIVADAS (9-18)    │  ← Variables internas del modelo
├─────────────────────────────────────┤
│  3. MÉTODOS PÚBLICOS (20-95)       │  ← API del modelo
│     - train()                       │
│     - predict()                     │
│     - getConfidence()               │
│     - getMetadata()                 │
├─────────────────────────────────────┤
│  4. MÉTODOS PRIVADOS (97-224)      │  ← Matemáticas internas
│     - Álgebra lineal                │
│     - Cálculos de predicción        │
└─────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

### Líneas 1-7: Importaciones

```typescript
import {
  IPredictionModel,
  TimeSeriesData,
  PredictionResult,
  ModelMetadata,
} from '../interfaces/PredictionModel';
import { StatisticalTests } from '../utils/statisticalTests';
```

**¿Qué importa?**

**Líneas 1-6: Interfaces**
- **`IPredictionModel`**: Interface que este modelo debe implementar
- **`TimeSeriesData`**: Datos de entrada (fechas y valores)
- **`PredictionResult`**: Resultado de predicción (fecha, monto, límites)
- **`ModelMetadata`**: Información sobre el modelo

**Línea 7: Utilidades estadísticas**
- **`StatisticalTests`**: Funciones para calcular métricas (R², MAE, RMSE)

---

### Línea 9: Declaración de la Clase

```typescript
export class LinearRegressionModel implements IPredictionModel {
```

**¿Qué significa?**
- **`export class`**: Exporta la clase para usar en otros archivos
- **`implements IPredictionModel`**: Promete implementar todos los métodos de la interface

**¿Qué es implements?**
- Es un **contrato** en TypeScript
- La clase DEBE tener los métodos: `train()`, `predict()`, `getConfidence()`, `getMetadata()`

---

## 🔷 PROPIEDADES PRIVADAS (Líneas 10-18)

### Líneas 10-18: Variables Internas

```typescript
private coefficients: number[] = [];
private intercept: number = 0;
private rSquared: number = 0;
private trainedValues: number[] = [];
private trainedDates: Date[] = [];
private mae: number = 0;
private rmse: number = 0;
private lastValue: number = 0;
private lastDate: Date = new Date();
```

**¿Qué es `private`?**
- Solo accesible dentro de la clase
- No se puede acceder desde fuera: `model.coefficients` ❌

### Explicación de cada propiedad:

#### Línea 10: coefficients
```typescript
private coefficients: number[] = [];
```

**¿Qué es?**
- Los **coeficientes** de la ecuación de regresión
- En regresión cuadrática: `[a, b]` donde `y = intercept + a*x + b*x²`

**Ejemplo:**
```javascript
coefficients = [100, 5]
// Significa: y = intercept + 100*x + 5*x²
```

---

#### Línea 11: intercept
```typescript
private intercept: number = 0;
```

**¿Qué es?**
- El **intercepto** (punto de inicio)
- Donde la línea cruza el eje Y

**Ecuación completa:**
```
y = intercept + coefficients[0]*x + coefficients[1]*x²
```

**Ejemplo visual:**
```
    y
    |
1000|  ← intercept (punto de inicio)
    |    /
    |   /
    |  /
    | /
    |________________ x
```

---

#### Línea 12: rSquared
```typescript
private rSquared: number = 0;
```

**¿Qué es R²?**
- **Coeficiente de determinación**
- Mide qué tan bien el modelo se ajusta a los datos
- Valor de 0 a 1

**Interpretación:**
```
R² = 0.95  →  95% de precisión (excelente)
R² = 0.85  →  85% de precisión (muy bueno)
R² = 0.70  →  70% de precisión (aceptable)
R² = 0.50  →  50% de precisión (pobre)
```

**Analogía:**
```
R² = Qué tan cerca están los puntos de la línea

R² alto (0.95):        R² bajo (0.50):
  ●                      ●
  ●                        ●
  ●                    ●
  ●                          ●
  ●                      ●
```

---

#### Línea 13: trainedValues
```typescript
private trainedValues: number[] = [];
```

**¿Qué es?**
- Los valores (gastos) usados para entrenar
- Ejemplo: `[1000, 1100, 1200, 1300]`

---

#### Línea 14: trainedDates
```typescript
private trainedDates: Date[] = [];
```

**¿Qué es?**
- Las fechas correspondientes a los valores
- Ejemplo: `[2025-01, 2025-02, 2025-03, 2025-04]`

---

#### Línea 15: mae
```typescript
private mae: number = 0;
```

**¿Qué es MAE?**
- **Mean Absolute Error** (Error Absoluto Medio)
- Promedio de cuánto se equivoca el modelo

**Ejemplo:**
```
Valores reales:    [1000, 1100, 1200]
Predicciones:      [1020, 1080, 1210]
Errores:           [  20,   20,   10]
MAE = (20 + 20 + 10) / 3 = 16.67

Interpretación: El modelo se equivoca en promedio $16.67
```

---

#### Línea 16: rmse
```typescript
private rmse: number = 0;
```

**¿Qué es RMSE?**
- **Root Mean Square Error** (Raíz del Error Cuadrático Medio)
- Similar a MAE pero penaliza errores grandes más fuertemente

**Diferencia MAE vs RMSE:**
```
Errores: [10, 10, 100]

MAE  = (10 + 10 + 100) / 3 = 40
RMSE = √((10² + 10² + 100²) / 3) = √3400 = 58.3

RMSE es mayor porque penaliza el error de 100 más fuertemente
```

---

#### Líneas 17-18: lastValue y lastDate
```typescript
private lastValue: number = 0;
private lastDate: Date = new Date();
```

**¿Para qué sirven?**
- Guardan el último valor y fecha de entrenamiento
- Usados para calcular fechas futuras en las predicciones

---

## 🔶 MÉTODO TRAIN (Líneas 20-44)

### Línea 20: Firma del Método

```typescript
train(data: TimeSeriesData): void {
```

**¿Qué hace este método?**
- **Entrena** el modelo con datos históricos
- Calcula los coeficientes de la ecuación
- Es como "enseñarle" al modelo el patrón

**Parámetro:**
```typescript
data: TimeSeriesData
```

**Estructura de TimeSeriesData:**
```typescript
{
  dates: [Date, Date, Date, ...],
  values: [1000, 1100, 1200, ...]
}
```

---

### Líneas 21-23: Validación de Datos

```typescript
if (data.values.length < 2) {
  throw new Error('Se necesitan al menos 2 puntos de datos para entrenar el modelo');
}
```

**¿Por qué al menos 2 puntos?**
- Con 1 punto no hay patrón
- Con 2+ puntos se puede encontrar una tendencia

**Ejemplo:**
```
1 punto:  ●           → No hay tendencia
2 puntos: ●  ●        → Hay tendencia (línea)
3 puntos: ●  ●  ●     → Mejor tendencia
```

---

### Líneas 25-28: Guardar Datos de Entrenamiento

```typescript
this.trainedValues = [...data.values];
this.trainedDates = [...data.dates];
this.lastValue = data.values[data.values.length - 1];
this.lastDate = data.dates[data.dates.length - 1];
```

**¿Qué es `[...data.values]`?**
- **Spread operator**: Crea una copia del array
- No modifica el array original

**Ejemplo:**
```javascript
const original = [1, 2, 3];
const copia = [...original];

copia.push(4);
// original = [1, 2, 3]  ← No cambia
// copia = [1, 2, 3, 4]  ← Cambia
```

**¿Qué es `data.values.length - 1`?**
- Índice del último elemento
- Arrays empiezan en 0

**Ejemplo:**
```javascript
values = [1000, 1100, 1200, 1300]
length = 4
length - 1 = 3
values[3] = 1300  ← Último elemento
```

---

### Líneas 30-32: Preparar Datos para Regresión

```typescript
const n = data.values.length;
const x = Array.from({ length: n }, (_, i) => i);
const y = data.values;
```

**Línea 30:**
```typescript
const n = data.values.length;
```
- `n`: Número de puntos de datos

**Línea 31:**
```typescript
const x = Array.from({ length: n }, (_, i) => i);
```

**¿Qué hace `Array.from()`?**
- Crea un array de números secuenciales
- `(_, i) => i`: Función que retorna el índice

**Ejemplo:**
```javascript
n = 4
x = Array.from({ length: 4 }, (_, i) => i)
x = [0, 1, 2, 3]
```

**¿Por qué usar índices en lugar de fechas?**
- Las matemáticas son más simples con números
- 0, 1, 2, 3 es más fácil que fechas

**Mapeo:**
```
x (índice)  →  Fecha real     →  y (gasto)
0           →  2025-01        →  1000
1           →  2025-02        →  1100
2           →  2025-03        →  1200
3           →  2025-04        →  1300
```

---

### Líneas 34-38: Calcular Coeficientes

```typescript
const X = this.createDesignMatrix(x);
const beta = this.computeCoefficients(X, y);

this.intercept = beta[0];
this.coefficients = beta.slice(1);
```

**¿Qué es la Design Matrix (X)?**
- Matriz que contiene los términos de la ecuación
- Para regresión cuadrática: `[1, x, x²]`

**Ejemplo:**
```javascript
x = [0, 1, 2, 3]

X = [
  [1, 0, 0],   // 1, 0, 0²
  [1, 1, 1],   // 1, 1, 1²
  [1, 2, 4],   // 1, 2, 2²
  [1, 3, 9]    // 1, 3, 3²
]
```

**¿Qué es beta?**
- Vector de coeficientes: `[intercept, a, b]`
- Resultado de resolver el sistema de ecuaciones

**Ejemplo:**
```javascript
beta = [1000, 100, 5]

intercept = beta[0] = 1000
coefficients = beta.slice(1) = [100, 5]

Ecuación: y = 1000 + 100*x + 5*x²
```

---

### Líneas 40-43: Calcular Métricas

```typescript
const predictions = this.predictFromX(x);
this.rSquared = StatisticalTests.rSquared(y, predictions);
this.mae = StatisticalTests.mae(y, predictions);
this.rmse = StatisticalTests.rmse(y, predictions);
```

**¿Qué hace?**
1. Predice valores para los datos de entrenamiento
2. Compara predicciones con valores reales
3. Calcula métricas de precisión

**Ejemplo:**
```javascript
y (real) = [1000, 1100, 1200, 1300]
predictions = [1005, 1105, 1195, 1305]

rSquared = 0.98  // 98% de precisión
mae = 5          // Error promedio de $5
rmse = 6.5       // Error cuadrático de $6.50
```

---

## 🔸 MÉTODO PREDICT (Líneas 46-76)

### Línea 46: Firma del Método

```typescript
predict(periods: number): PredictionResult[] {
```

**¿Qué hace?**
- Predice valores futuros
- `periods`: Cuántos meses predecir

**Retorna:**
```typescript
PredictionResult[] = [
  { date, amount, lowerBound, upperBound },
  { date, amount, lowerBound, upperBound },
  ...
]
```

---

### Líneas 47-49: Validación

```typescript
if (this.trainedValues.length === 0) {
  throw new Error('El modelo debe ser entrenado antes de hacer predicciones');
}
```

**¿Por qué validar?**
- No se puede predecir sin entrenar primero
- Previene errores

---

### Líneas 51-54: Preparación

```typescript
const results: PredictionResult[] = [];
const n = this.trainedValues.length;
const confidenceInterval = StatisticalTests.confidenceInterval(this.trainedValues, 0.95);
const intervalWidth = confidenceInterval.upper - confidenceInterval.lower;
```

**Línea 53: Intervalo de confianza**
```typescript
const confidenceInterval = StatisticalTests.confidenceInterval(this.trainedValues, 0.95);
```

**¿Qué es intervalo de confianza?**
- Rango donde probablemente caerá el valor real
- `0.95` = 95% de confianza

**Ejemplo:**
```javascript
confidenceInterval = {
  lower: 950,
  upper: 1050
}

intervalWidth = 1050 - 950 = 100

Interpretación: Los valores reales probablemente varían ±50 del promedio
```

---

### Líneas 56-73: Bucle de Predicción

```typescript
for (let i = 1; i <= periods; i++) {
  const x = n + i - 1;
  const predicted = this.predictValue(x);

  const uncertainty = intervalWidth * Math.sqrt(1 + i / n);
  const lowerBound = Math.max(0, predicted - uncertainty);
  const upperBound = predicted + uncertainty;

  const date = new Date(this.lastDate);
  date.setMonth(date.getMonth() + i);

  results.push({
    date,
    amount: Math.max(0, predicted),
    lowerBound,
    upperBound,
  });
}
```

**Línea 57: Calcular índice x**
```typescript
const x = n + i - 1;
```

**Ejemplo:**
```javascript
n = 4  // Tenemos 4 datos de entrenamiento (índices 0-3)
i = 1  // Primera predicción

x = 4 + 1 - 1 = 4  // Índice para el primer mes futuro
```

**Mapeo:**
```
Datos de entrenamiento:
x=0 → Enero
x=1 → Febrero
x=2 → Marzo
x=3 → Abril

Predicciones:
x=4 → Mayo (i=1)
x=5 → Junio (i=2)
x=6 → Julio (i=3)
```

---

**Línea 58: Predecir valor**
```typescript
const predicted = this.predictValue(x);
```

**¿Qué hace `predictValue(x)`?**
```typescript
// Ecuación: y = intercept + a*x + b*x²
predicted = 1000 + 100*4 + 5*16
predicted = 1000 + 400 + 80
predicted = 1480
```

---

**Línea 60: Calcular incertidumbre**
```typescript
const uncertainty = intervalWidth * Math.sqrt(1 + i / n);
```

**¿Por qué aumenta la incertidumbre?**
- Mientras más lejos predecimos, menos confiables son las predicciones
- `Math.sqrt(1 + i / n)` aumenta con cada período

**Ejemplo:**
```javascript
intervalWidth = 100
n = 4

i=1: uncertainty = 100 * √(1 + 1/4) = 100 * 1.12 = 112
i=2: uncertainty = 100 * √(1 + 2/4) = 100 * 1.22 = 122
i=3: uncertainty = 100 * √(1 + 3/4) = 100 * 1.32 = 132

La incertidumbre crece con cada mes
```

**Visualización:**
```
    Gasto
    |
    |        ╱╲  ← Incertidumbre crece
    |       ╱  ╲
    |      ╱    ╲
    |     ╱      ╲
    |    ●────────● (predicción)
    |___________________
         Ahora    Futuro
```

---

**Líneas 61-62: Calcular límites**
```typescript
const lowerBound = Math.max(0, predicted - uncertainty);
const upperBound = predicted + uncertainty;
```

**¿Qué es `Math.max(0, ...)`?**
- Asegura que el límite inferior no sea negativo
- Los gastos no pueden ser negativos

**Ejemplo:**
```javascript
predicted = 1480
uncertainty = 112

lowerBound = Math.max(0, 1480 - 112) = 1368
upperBound = 1480 + 112 = 1592

Rango: $1,368 - $1,592
```

---

**Líneas 64-65: Calcular fecha futura**
```typescript
const date = new Date(this.lastDate);
date.setMonth(date.getMonth() + i);
```

**Ejemplo:**
```javascript
this.lastDate = new Date('2025-04-01')  // Abril

i=1:
date = new Date('2025-04-01')
date.setMonth(4 + 1)  // Mes 5 (Mayo)
date = '2025-05-01'

i=2:
date = new Date('2025-04-01')
date.setMonth(4 + 2)  // Mes 6 (Junio)
date = '2025-06-01'
```

---

**Líneas 67-72: Agregar resultado**
```typescript
results.push({
  date,
  amount: Math.max(0, predicted),
  lowerBound,
  upperBound,
});
```

**Resultado completo:**
```javascript
{
  date: new Date('2025-05-01'),
  amount: 1480,
  lowerBound: 1368,
  upperBound: 1592
}
```

---

## 🔹 MÉTODO getConfidence (Líneas 78-80)

```typescript
getConfidence(): number {
  return Math.max(0, Math.min(1, this.rSquared));
}
```

**¿Qué hace?**
- Retorna el nivel de confianza del modelo
- Asegura que esté entre 0 y 1

**`Math.max(0, Math.min(1, value))`:**
- Clamp (limita) el valor entre 0 y 1

**Ejemplo:**
```javascript
rSquared = 0.85
Math.min(1, 0.85) = 0.85
Math.max(0, 0.85) = 0.85
// Retorna: 0.85

rSquared = 1.2  // Valor anómalo
Math.min(1, 1.2) = 1.0
Math.max(0, 1.0) = 1.0
// Retorna: 1.0 (máximo)

rSquared = -0.1  // Valor anómalo
Math.min(1, -0.1) = -0.1
Math.max(0, -0.1) = 0.0
// Retorna: 0.0 (mínimo)
```

---

## 🔺 MÉTODO getMetadata (Líneas 82-95)

```typescript
getMetadata(): ModelMetadata {
  return {
    name: 'Linear Regression',
    parameters: {
      intercept: this.intercept,
      coefficients: this.coefficients,
    },
    trainingSamples: this.trainedValues.length,
    rSquared: this.rSquared,
    mae: this.mae,
    rmse: this.rmse,
    complexity: 'O(n³)',
  };
}
```

**¿Qué retorna?**
- Información sobre el modelo entrenado

**Ejemplo de resultado:**
```javascript
{
  name: 'Linear Regression',
  parameters: {
    intercept: 1000,
    coefficients: [100, 5]
  },
  trainingSamples: 120,
  rSquared: 0.85,
  mae: 75.5,
  rmse: 95.2,
  complexity: 'O(n³)'
}
```

**¿Qué es `complexity: 'O(n³)'`?**
- **Complejidad computacional**
- Indica qué tan rápido crece el tiempo de cálculo

**Notación Big O:**
```
O(n)   = Lineal (rápido)
O(n²)  = Cuadrático (moderado)
O(n³)  = Cúbico (lento para datos grandes)
```

**¿Por qué O(n³)?**
- La inversión de matriz es O(n³)
- Para 100 datos: ~1,000,000 operaciones
- Para 1000 datos: ~1,000,000,000 operaciones

---

## 🔻 MÉTODOS PRIVADOS (Álgebra Lineal)

### createDesignMatrix (Líneas 97-106)

```typescript
private createDesignMatrix(x: number[]): number[][] {
  const n = x.length;
  const X: number[][] = [];

  for (let i = 0; i < n; i++) {
    X.push([1, x[i], x[i] * x[i]]);
  }

  return X;
}
```

**¿Qué hace?**
- Crea la matriz de diseño para regresión cuadrática
- Cada fila: `[1, x, x²]`

**Ejemplo:**
```javascript
x = [0, 1, 2, 3]

X = [
  [1, 0, 0],   // 1, 0, 0²
  [1, 1, 1],   // 1, 1, 1²
  [1, 2, 4],   // 1, 2, 2²
  [1, 3, 9]    // 1, 3, 3²
]
```

**¿Por qué [1, x, x²]?**
- Ecuación cuadrática: `y = a + b*x + c*x²`
- La columna de 1s es para el intercepto (a)
- La columna de x es para el término lineal (b)
- La columna de x² es para el término cuadrático (c)

---

### computeCoefficients (Líneas 108-116)

```typescript
private computeCoefficients(X: number[][], y: number[]): number[] {
  const XtX = this.multiplyMatrices(this.transpose(X), X);
  const Xty = this.multiplyMatrixVector(this.transpose(X), y);

  const XtX_inv = this.inverseMatrix(XtX);
  const beta = this.multiplyMatrixVector(XtX_inv, Xty);

  return beta;
}
```

**¿Qué hace?**
- Resuelve el sistema de ecuaciones para encontrar los coeficientes
- Usa la fórmula: `beta = (X^T * X)^-1 * X^T * y`

**Matemáticas explicadas:**

**Fórmula de mínimos cuadrados:**
```
beta = (X^T * X)^-1 * X^T * y

Donde:
X^T = Transpuesta de X
(...)^-1 = Inversa de la matriz
* = Multiplicación de matrices
```

**Paso a paso:**
```javascript
// 1. Transponer X
X^T = transpose(X)

// 2. Multiplicar X^T * X
XtX = X^T * X

// 3. Multiplicar X^T * y
Xty = X^T * y

// 4. Invertir XtX
XtX_inv = inverse(XtX)

// 5. Multiplicar XtX_inv * Xty
beta = XtX_inv * Xty
```

---

### transpose (Líneas 118-131)

```typescript
private transpose(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = [];

  for (let j = 0; j < cols; j++) {
    result[j] = [];
    for (let i = 0; i < rows; i++) {
      result[j][i] = matrix[i][j];
    }
  }

  return result;
}
```

**¿Qué es transponer?**
- Intercambiar filas por columnas

**Ejemplo visual:**
```
Original:           Transpuesta:
[1, 2, 3]           [1, 4]
[4, 5, 6]           [2, 5]
                    [3, 6]

Filas → Columnas
Columnas → Filas
```

**Ejemplo con código:**
```javascript
matrix = [
  [1, 2, 3],
  [4, 5, 6]
]

transpose(matrix) = [
  [1, 4],
  [2, 5],
  [3, 6]
]
```

---

### multiplyMatrices (Líneas 133-151)

```typescript
private multiplyMatrices(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const result: number[][] = []

  for (let i = 0; i < rowsA; i++) {
    result[i] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }

  return result;
}
```

**¿Qué hace?**
- Multiplica dos matrices

**Regla de multiplicación:**
```
(m×n) * (n×p) = (m×p)

A tiene m filas y n columnas
B tiene n filas y p columnas
Resultado tiene m filas y p columnas
```

**Ejemplo:**
```javascript
A = [
  [1, 2],
  [3, 4]
]

B = [
  [5, 6],
  [7, 8]
]

A * B = [
  [1*5 + 2*7, 1*6 + 2*8],  = [19, 22]
  [3*5 + 4*7, 3*6 + 4*8]   = [43, 50]
]
```

---

### inverseMatrix (Líneas 167-213)

```typescript
private inverseMatrix(matrix: number[][]): number[][] {
  // ... implementación de Gauss-Jordan
}
```

**¿Qué hace?**
- Calcula la inversa de una matriz
- Usa el método de **Gauss-Jordan**

**¿Qué es la inversa?**
```
Si A * A^-1 = I (matriz identidad)
Entonces A^-1 es la inversa de A

Matriz identidad:
[1, 0, 0]
[0, 1, 0]
[0, 0, 1]
```

**Analogía:**
```
Inversa de matriz = Inversa de número

5 * (1/5) = 1
A * A^-1 = I
```

---

### predictValue (Líneas 215-220)

```typescript
private predictValue(x: number): number {
  let result = this.intercept;
  result += this.coefficients[0] * x;
  result += this.coefficients[1] * x * x;
  return result;
}
```

**¿Qué hace?**
- Calcula la predicción para un valor x
- Usa la ecuación cuadrática

**Ecuación:**
```
y = intercept + a*x + b*x²
```

**Ejemplo:**
```javascript
intercept = 1000
coefficients = [100, 5]
x = 4

result = 1000
result += 100 * 4 = 1000 + 400 = 1400
result += 5 * 16 = 1400 + 80 = 1480

Predicción: $1480
```

---

## 📊 Flujo Completo del Modelo

### 1. Entrenamiento

```javascript
// Datos históricos
const data = {
  dates: [
    new Date('2025-01'),
    new Date('2025-02'),
    new Date('2025-03'),
    new Date('2025-04')
  ],
  values: [1000, 1100, 1200, 1300]
};

// Entrenar modelo
const model = new LinearRegressionModel();
model.train(data);

// Internamente:
// 1. Crea matriz de diseño X
// 2. Calcula coeficientes (intercept, a, b)
// 3. Calcula métricas (R², MAE, RMSE)
```

### 2. Predicción

```javascript
// Predecir próximos 3 meses
const predictions = model.predict(3);

// Resultado:
[
  {
    date: '2025-05-01',
    amount: 1400,
    lowerBound: 1288,
    upperBound: 1512
  },
  {
    date: '2025-06-01',
    amount: 1510,
    lowerBound: 1388,
    upperBound: 1632
  },
  {
    date: '2025-07-01',
    amount: 1630,
    lowerBound: 1498,
    upperBound: 1762
  }
]
```

---

## 🎓 Conceptos Matemáticos Resumidos

### 1. Regresión Cuadrática

**Ecuación:**
```
y = a + b*x + c*x²
```

**Ventajas:**
- Captura tendencias no lineales
- Más flexible que regresión lineal simple

**Ejemplo visual:**
```
Lineal (y = a + b*x):    Cuadrática (y = a + b*x + c*x²):
    ●                         ●
   ●                         ●
  ●                        ●
 ●                       ●
●                      ●
```

### 2. Mínimos Cuadrados

**Objetivo:**
- Encontrar la línea que minimiza la suma de errores al cuadrado

**Fórmula:**
```
Minimizar: Σ(y_real - y_predicho)²
```

### 3. Métricas de Precisión

| Métrica | Fórmula | Interpretación |
|---------|---------|----------------|
| **R²** | 1 - (SS_res / SS_tot) | % de varianza explicada |
| **MAE** | Σ\|real - pred\| / n | Error promedio absoluto |
| **RMSE** | √(Σ(real - pred)² / n) | Error cuadrático medio |

---

## ✅ Ventajas y Limitaciones

### Ventajas ✅

1. **Simple y rápido** para datos pequeños
2. **Interpretable**: Ecuación clara
3. **No requiere bibliotecas externas**
4. **Captura tendencias cuadráticas**

### Limitaciones ❌

1. **O(n³)**: Lento para muchos datos
2. **Asume tendencia cuadrática**: No captura patrones complejos
3. **Sensible a outliers**: Valores extremos afectan mucho
4. **No captura estacionalidad**: No detecta patrones cíclicos

---

## 🚀 Ejemplo Completo de Uso

```javascript
import { LinearRegressionModel } from './LinearRegression';

// Crear modelo
const model = new LinearRegressionModel();

// Datos de entrenamiento (6 meses)
const trainingData = {
  dates: [
    new Date('2025-01-01'),
    new Date('2025-02-01'),
    new Date('2025-03-01'),
    new Date('2025-04-01'),
    new Date('2025-05-01'),
    new Date('2025-06-01')
  ],
  values: [1000, 1050, 1120, 1180, 1250, 1310]
};

// Entrenar
model.train(trainingData);

// Ver confianza
console.log('Confianza:', model.getConfidence());
// Output: 0.98 (98% de precisión)

// Ver metadata
console.log('Metadata:', model.getMetadata());
// Output: { name: 'Linear Regression', rSquared: 0.98, ... }

// Predecir próximos 3 meses
const predictions = model.predict(3);
console.log('Predicciones:', predictions);
// Output: [
//   { date: '2025-07-01', amount: 1380, lowerBound: 1268, upperBound: 1492 },
//   { date: '2025-08-01', amount: 1450, lowerBound: 1328, upperBound: 1572 },
//   { date: '2025-09-01', amount: 1520, lowerBound: 1388, upperBound: 1652 }
// ]
```

---

¡Documentación completa del modelo de Regresión Lineal! Este es el cerebro matemático que hace las predicciones. 🧠📈
