# Documentación ULTRA Didáctica: dataPreprocessor.ts

**Ubicación:** `src/core/utils/dataPreprocessor.ts`

**Propósito:** Este archivo es el "chef de datos" que **limpia, organiza y prepara** los datos financieros antes de que el modelo de machine learning los use. Sin este preprocesamiento, el modelo recibiría datos sucios y haría predicciones incorrectas.

---

## 🎯 ¿Por qué Preprocesar Datos?

Imagina que quieres hacer un pastel:

```
❌ Sin preprocesar:
Harina con piedras
Huevos podridos
Azúcar mezclada con sal
→ Pastel horrible

✅ Con preprocesamiento:
Harina tamizada
Huevos frescos
Ingredientes medidos
→ Pastel delicioso
```

**En machine learning:**
```
❌ Datos sin procesar:
- Fechas faltantes
- Valores negativos
- Outliers (valores extremos)
- Datos duplicados
→ Predicciones incorrectas

✅ Datos procesados:
- Fechas completas
- Valores válidos
- Sin outliers
- Datos limpios
→ Predicciones precisas
```

---

## 📚 Estructura del Archivo

```
┌─────────────────────────────────────────┐
│  1. INTERFACE (líneas 3-6)             │  ← Estructura de datos
├─────────────────────────────────────────┤
│  2. MÉTODOS PÚBLICOS (líneas 9-190)    │
│     ├─ cleanData()                      │  ← Elimina datos inválidos
│     ├─ normalizeData()                  │  ← Escala valores 0-1
│     ├─ denormalize()                    │  ← Revierte normalización
│     ├─ detectOutliers()                 │  ← Encuentra valores extremos
│     ├─ fillMissingDates()               │  ← Rellena fechas faltantes
│     ├─ aggregateByPeriod()              │  ← Agrupa por día/semana/mes
│     ├─ toTimeSeries()                   │  ← Convierte a serie temporal
│     ├─ removeOutliers()                 │  ← Elimina outliers
│     └─ validateMinimumData()            │  ← Valida datos suficientes
├─────────────────────────────────────────┤
│  3. MÉTODOS PRIVADOS (líneas 163-178)  │
│     ├─ getWeekNumber()                  │  ← Calcula número de semana
│     └─ getDateFromWeek()                │  ← Convierte semana a fecha
└─────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

### Líneas 1-6: Importaciones e Interface

```typescript
import { TimeSeriesData } from '../interfaces/PredictionModel';

export interface DataPoint {
  date: Date;
  value: number;
}
```

**¿Qué es DataPoint?**
- Estructura básica de un punto de datos
- **`date`**: Cuándo ocurrió (fecha)
- **`value`**: Cuánto fue (monto en dólares)

**Ejemplo:**
```javascript
{
  date: new Date('2025-11-27'),
  value: 150.50
}
// Significa: El 27 de noviembre gasté $150.50
```

---

### Línea 8: Declaración de la Clase

```typescript
export class DataPreprocessor {
```

**¿Por qué todos los métodos son `static`?**
- No necesita crear instancia: `new DataPreprocessor()` ❌
- Se usa directamente: `DataPreprocessor.cleanData()` ✅
- Es una **clase de utilidades**

**Analogía:**
```
Clase normal = Máquina que necesitas encender
Clase static = Herramientas que usas directamente
```

---

## 🔷 MÉTODO cleanData (Líneas 9-20)

```typescript
static cleanData(data: DataPoint[]): DataPoint[] {
  return data.filter(point => {
    return (
      point.date instanceof Date &&
      !isNaN(point.date.getTime()) &&
      typeof point.value === 'number' &&
      !isNaN(point.value) &&
      isFinite(point.value) &&
      point.value >= 0
    );
  });
}
```

**¿Qué hace?**
- **Filtra** (elimina) datos inválidos
- Solo mantiene datos buenos

### Validaciones línea por línea:

#### Línea 12: Validar que date sea Date
```typescript
point.date instanceof Date
```

**¿Qué verifica?**
- Que `date` sea un objeto Date

**Ejemplo:**
```javascript
// ✅ Válido
{ date: new Date('2025-11-27'), value: 100 }

// ❌ Inválido
{ date: '2025-11-27', value: 100 }  // String, no Date
{ date: null, value: 100 }           // null
{ date: undefined, value: 100 }      // undefined
```

---

#### Línea 13: Validar que date sea válida
```typescript
!isNaN(point.date.getTime())
```

**¿Qué verifica?**
- Que la fecha no sea "Invalid Date"

**Ejemplo:**
```javascript
// ✅ Válido
new Date('2025-11-27').getTime()  // 1732665600000

// ❌ Inválido
new Date('fecha-invalida').getTime()  // NaN
new Date('2025-13-45').getTime()      // NaN (mes 13 no existe)
```

**¿Qué es NaN?**
- **Not a Number**: No es un número
- `isNaN(NaN)` → `true`
- `!isNaN(NaN)` → `false` (rechaza)

---

#### Línea 14: Validar que value sea número
```typescript
typeof point.value === 'number'
```

**Ejemplo:**
```javascript
// ✅ Válido
{ value: 100 }
{ value: 150.50 }
{ value: 0 }

// ❌ Inválido
{ value: '100' }      // String
{ value: null }       // null
{ value: undefined }  // undefined
```

---

#### Línea 15: Validar que value no sea NaN
```typescript
!isNaN(point.value)
```

**Ejemplo:**
```javascript
// ✅ Válido
isNaN(100)    // false → !false = true ✅
isNaN(150.5)  // false → !false = true ✅

// ❌ Inválido
isNaN(NaN)           // true → !true = false ❌
isNaN(0/0)           // true → !true = false ❌
isNaN(parseInt('abc')) // true → !true = false ❌
```

---

#### Línea 16: Validar que value sea finito
```typescript
isFinite(point.value)
```

**¿Qué es infinito?**
```javascript
// ✅ Finito
isFinite(100)      // true
isFinite(-50)      // true
isFinite(0)        // true

// ❌ Infinito
isFinite(Infinity)     // false
isFinite(-Infinity)    // false
isFinite(1/0)          // false (= Infinity)
```

---

#### Línea 17: Validar que value no sea negativo
```typescript
point.value >= 0
```

**¿Por qué no negativos?**
- Los gastos/ingresos no pueden ser negativos
- Valores negativos indican datos corruptos

**Ejemplo:**
```javascript
// ✅ Válido
{ value: 0 }      // Cero está bien
{ value: 100 }    // Positivo
{ value: 0.01 }   // Decimal positivo

// ❌ Inválido
{ value: -50 }    // Negativo
{ value: -0.01 }  // Negativo pequeño
```

---

### Ejemplo Completo de cleanData

**Entrada (datos sucios):**
```javascript
const dirtyData = [
  { date: new Date('2025-11-01'), value: 100 },      // ✅ Válido
  { date: new Date('2025-11-02'), value: -50 },      // ❌ Negativo
  { date: new Date('invalid'), value: 150 },         // ❌ Fecha inválida
  { date: new Date('2025-11-03'), value: NaN },      // ❌ NaN
  { date: '2025-11-04', value: 200 },                // ❌ String, no Date
  { date: new Date('2025-11-05'), value: Infinity }, // ❌ Infinito
  { date: new Date('2025-11-06'), value: 300 },      // ✅ Válido
];

const clean = DataPreprocessor.cleanData(dirtyData);
```

**Salida (datos limpios):**
```javascript
[
  { date: new Date('2025-11-01'), value: 100 },
  { date: new Date('2025-11-06'), value: 300 }
]
// Solo 2 de 7 datos eran válidos
```

---

## 🔶 MÉTODO normalizeData (Líneas 22-37)

```typescript
static normalizeData(values: number[]): { normalized: number[]; min: number; max: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) {
    return {
      normalized: values.map(() => 0.5),
      min,
      max,
    };
  }

  const normalized = values.map(value => (value - min) / range);
  return { normalized, min, max };
}
```

**¿Qué es normalización?**
- **Escalar** todos los valores entre 0 y 1
- Facilita el trabajo del modelo de ML

**Fórmula:**
```
normalized = (value - min) / (max - min)
```

### Ejemplo Visual

**Datos originales:**
```
values = [1000, 1500, 2000, 2500]

min = 1000
max = 2500
range = 2500 - 1000 = 1500
```

**Normalización:**
```javascript
1000: (1000 - 1000) / 1500 = 0 / 1500 = 0.00
1500: (1500 - 1000) / 1500 = 500 / 1500 = 0.33
2000: (2000 - 1000) / 1500 = 1000 / 1500 = 0.67
2500: (2500 - 1000) / 1500 = 1500 / 1500 = 1.00

normalized = [0.00, 0.33, 0.67, 1.00]
```

**Visualización:**
```
Original:               Normalizado:
2500 |    ●            1.0 |    ●
2000 |   ●             0.67|   ●
1500 |  ●              0.33|  ●
1000 | ●               0.0 | ●
```

### Caso Especial: range === 0

**Líneas 27-32:**
```typescript
if (range === 0) {
  return {
    normalized: values.map(() => 0.5),
    min,
    max,
  };
}
```

**¿Cuándo ocurre?**
- Todos los valores son iguales

**Ejemplo:**
```javascript
values = [1000, 1000, 1000, 1000]

min = 1000
max = 1000
range = 0

// División por cero sería error
// Solución: usar 0.5 (punto medio)
normalized = [0.5, 0.5, 0.5, 0.5]
```

---

## 🔸 MÉTODO denormalize (Líneas 39-42)

```typescript
static denormalize(normalizedValues: number[], min: number, max: number): number[] {
  const range = max - min;
  return normalizedValues.map(value => value * range + min);
}
```

**¿Qué hace?**
- **Revierte** la normalización
- Convierte valores 0-1 de vuelta a escala original

**Fórmula:**
```
original = normalized * (max - min) + min
```

**Ejemplo:**
```javascript
// Normalizado
normalized = [0.00, 0.33, 0.67, 1.00]
min = 1000
max = 2500
range = 1500

// Denormalizar
0.00: 0.00 * 1500 + 1000 = 0 + 1000 = 1000
0.33: 0.33 * 1500 + 1000 = 495 + 1000 = 1495
0.67: 0.67 * 1500 + 1000 = 1005 + 1000 = 2005
1.00: 1.00 * 1500 + 1000 = 1500 + 1000 = 2500

original = [1000, 1495, 2005, 2500]
```

**¿Por qué normalizar y denormalizar?**
```
1. Normalizar → Entrenar modelo (valores 0-1)
2. Modelo predice → Valores normalizados
3. Denormalizar → Convertir a dólares reales
```

---

## 🔹 MÉTODO detectOutliers (Líneas 44-66)

```typescript
static detectOutliers(values: number[]): number[] {
  if (values.length < 4) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);

  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
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

**¿Qué es un outlier?**
- Valor **extremadamente diferente** del resto
- Puede ser error o evento excepcional

**Ejemplo:**
```
Gastos mensuales normales: $1000, $1100, $1200, $1300
Outlier: $10,000 (compra de auto)

El outlier distorsiona las predicciones
```

### Método IQR (Interquartile Range)

**Conceptos:**

**Q1 (Primer Cuartil):**
- 25% de los datos están por debajo
- 75% están por encima

**Q3 (Tercer Cuartil):**
- 75% de los datos están por debajo
- 25% están por encima

**IQR (Rango Intercuartílico):**
```
IQR = Q3 - Q1
```

**Límites:**
```
Lower Bound = Q1 - 1.5 * IQR
Upper Bound = Q3 + 1.5 * IQR
```

### Ejemplo Paso a Paso

**Datos:**
```javascript
values = [100, 150, 200, 250, 300, 350, 400, 1000]
//                                              ↑ Outlier
```

**Paso 1: Ordenar**
```javascript
sorted = [100, 150, 200, 250, 300, 350, 400, 1000]
length = 8
```

**Paso 2: Calcular índices**
```javascript
q1Index = Math.floor(8 * 0.25) = 2
q3Index = Math.floor(8 * 0.75) = 6
```

**Paso 3: Obtener Q1 y Q3**
```javascript
q1 = sorted[2] = 200
q3 = sorted[6] = 400
```

**Paso 4: Calcular IQR**
```javascript
iqr = 400 - 200 = 200
```

**Paso 5: Calcular límites**
```javascript
lowerBound = 200 - 1.5 * 200 = 200 - 300 = -100
upperBound = 400 + 1.5 * 200 = 400 + 300 = 700
```

**Paso 6: Detectar outliers**
```javascript
100  < -100 o > 700? No
150  < -100 o > 700? No
200  < -100 o > 700? No
250  < -100 o > 700? No
300  < -100 o > 700? No
350  < -100 o > 700? No
400  < -100 o > 700? No
1000 < -100 o > 700? Sí! ← Outlier

outlierIndices = [7]  // Índice del outlier
```

**Visualización:**
```
    Valor
1000|              ● ← Outlier (fuera de límites)
 700|-------------- Upper Bound
 400|        ●
 350|       ●
 300|      ●
 250|     ●
 200|    ●
 150|   ●
 100|  ●
-100|-------------- Lower Bound
```

---

## 🔺 MÉTODO fillMissingDates (Líneas 68-97)

```typescript
static fillMissingDates(data: DataPoint[]): DataPoint[] {
  if (data.length === 0) return [];

  const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  const result: DataPoint[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    result.push(sorted[i]);

    const currentDate = new Date(sorted[i].date);
    const nextDate = new Date(sorted[i + 1].date);
    const daysDiff = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 1) {
      const interpolatedValue = (sorted[i].value + sorted[i + 1].value) / 2;

      for (let j = 1; j < daysDiff; j++) {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + j);
        result.push({
          date: newDate,
          value: interpolatedValue,
        });
      }
    }
  }

  result.push(sorted[sorted.length - 1]);
  return result;
}
```

**¿Qué hace?**
- Rellena fechas faltantes con valores interpolados

**¿Qué es interpolación?**
- Estimar valores intermedios
- Usa el promedio de los valores adyacentes

### Ejemplo Visual

**Datos originales (con fechas faltantes):**
```javascript
[
  { date: '2025-11-01', value: 100 },
  // 2025-11-02 FALTA
  // 2025-11-03 FALTA
  { date: '2025-11-04', value: 200 }
]
```

**Cálculo:**
```javascript
currentDate = '2025-11-01'
nextDate = '2025-11-04'
daysDiff = 3 días

interpolatedValue = (100 + 200) / 2 = 150
```

**Resultado (fechas rellenadas):**
```javascript
[
  { date: '2025-11-01', value: 100 },
  { date: '2025-11-02', value: 150 },  // ← Interpolado
  { date: '2025-11-03', value: 150 },  // ← Interpolado
  { date: '2025-11-04', value: 200 }
]
```

**Visualización:**
```
Valor
200 |           ●
    |          /
150 |    ●---●  ← Valores interpolados
    |   /
100 | ●
    |_____________
      1  2  3  4  (días)
```

### Cálculo de Diferencia de Días

**Línea 79:**
```typescript
const daysDiff = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
```

**Desglose:**
```javascript
nextDate.getTime() - currentDate.getTime()
// Diferencia en milisegundos

1000 = milisegundos por segundo
60 = segundos por minuto
60 = minutos por hora
24 = horas por día

1000 * 60 * 60 * 24 = 86,400,000 ms por día

// Dividir para obtener días
Math.floor(diferencia_ms / 86400000)
```

**Ejemplo:**
```javascript
currentDate = new Date('2025-11-01')  // 1730419200000
nextDate = new Date('2025-11-04')     // 1730678400000

diferencia = 1730678400000 - 1730419200000 = 259200000 ms

días = 259200000 / 86400000 = 3 días
```

---

## 🔻 MÉTODO aggregateByPeriod (Líneas 99-153)

```typescript
static aggregateByPeriod(
  data: DataPoint[],
  period: 'day' | 'week' | 'month'
): DataPoint[] {
  // ... implementación
}
```

**¿Qué hace?**
- Agrupa datos por día, semana o mes
- Calcula el promedio de cada grupo

### Ejemplo: Agrupar por Mes

**Datos diarios:**
```javascript
[
  { date: '2025-11-01', value: 100 },
  { date: '2025-11-05', value: 150 },
  { date: '2025-11-10', value: 200 },
  { date: '2025-12-01', value: 120 },
  { date: '2025-12-15', value: 180 }
]
```

**Agrupación:**
```javascript
Noviembre 2025:
  - 2025-11-01: 100
  - 2025-11-05: 150
  - 2025-11-10: 200
  Promedio: (100 + 150 + 200) / 3 = 150

Diciembre 2025:
  - 2025-12-01: 120
  - 2025-12-15: 180
  Promedio: (120 + 180) / 2 = 150
```

**Resultado:**
```javascript
[
  { date: '2025-11-01', value: 150 },  // Promedio de noviembre
  { date: '2025-12-01', value: 150 }   // Promedio de diciembre
]
```

### Generación de Claves

**Líneas 111-122:**
```typescript
switch (period) {
  case 'day':
    key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    break;
  case 'week':
    const weekNumber = this.getWeekNumber(date);
    key = `${date.getFullYear()}-W${weekNumber}`;
    break;
  case 'month':
    key = `${date.getFullYear()}-${date.getMonth()}`;
    break;
}
```

**Ejemplos de claves:**
```javascript
// Día
'2025-10-27'  // 27 de noviembre de 2025

// Semana
'2025-W48'    // Semana 48 de 2025

// Mes
'2025-10'     // Noviembre de 2025 (mes 10, base 0)
```

---

## 🔲 MÉTODO toTimeSeries (Líneas 155-161)

```typescript
static toTimeSeries(data: DataPoint[]): TimeSeriesData {
  const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  return {
    dates: sorted.map(point => point.date),
    values: sorted.map(point => point.value),
  };
}
```

**¿Qué hace?**
- Convierte array de DataPoint a TimeSeriesData
- Separa fechas y valores en arrays paralelos

**Transformación:**
```javascript
// Entrada (DataPoint[])
[
  { date: new Date('2025-11-01'), value: 100 },
  { date: new Date('2025-11-02'), value: 150 },
  { date: new Date('2025-11-03'), value: 200 }
]

// Salida (TimeSeriesData)
{
  dates: [
    new Date('2025-11-01'),
    new Date('2025-11-02'),
    new Date('2025-11-03')
  ],
  values: [100, 150, 200]
}
```

**¿Por qué separar?**
- El modelo de ML trabaja con arrays de números
- Las fechas se usan para generar predicciones futuras

---

## 🔳 MÉTODO removeOutliers (Líneas 180-186)

```typescript
static removeOutliers(data: DataPoint[]): DataPoint[] {
  const values = data.map(d => d.value);
  const outlierIndices = this.detectOutliers(values);
  const outlierSet = new Set(outlierIndices);

  return data.filter((_, index) => !outlierSet.has(index));
}
```

**¿Qué hace?**
- Combina `detectOutliers()` con filtrado
- Elimina los outliers detectados

**Ejemplo:**
```javascript
const data = [
  { date: '2025-11-01', value: 100 },
  { date: '2025-11-02', value: 150 },
  { date: '2025-11-03', value: 200 },
  { date: '2025-11-04', value: 10000 }  // ← Outlier
];

const clean = DataPreprocessor.removeOutliers(data);
// Resultado: Solo los primeros 3 puntos
```

**¿Qué es Set?**
```javascript
const outlierSet = new Set([7, 15, 23]);

outlierSet.has(7)   // true
outlierSet.has(10)  // false
outlierSet.has(15)  // true
```

**Ventaja de Set:**
- Búsqueda O(1) (muy rápida)
- Mejor que array para verificar existencia

---

## 🔘 MÉTODO validateMinimumData (Líneas 188-190)

```typescript
static validateMinimumData(data: DataPoint[], minPoints: number = 30): boolean {
  return data.length >= minPoints;
}
```

**¿Qué hace?**
- Verifica que haya suficientes datos para entrenar
- Por defecto: mínimo 30 puntos

**¿Por qué 30 puntos?**
- Con pocos datos, las predicciones son poco confiables
- 30 puntos = ~1 mes de datos diarios o ~2.5 años de datos mensuales

**Ejemplo:**
```javascript
const data = [...]; // 25 puntos

DataPreprocessor.validateMinimumData(data)
// false - Insuficientes datos

DataPreprocessor.validateMinimumData(data, 20)
// true - Suficientes para mínimo de 20
```

---

## 📊 Flujo Completo de Preprocesamiento

### Pipeline Típico

```javascript
// 1. Datos crudos de la base de datos
const rawData = await Transaction.find({ userId });

// 2. Convertir a DataPoint
const dataPoints = rawData.map(t => ({
  date: t.date,
  value: t.amount
}));

// 3. Limpiar datos inválidos
const cleaned = DataPreprocessor.cleanData(dataPoints);

// 4. Validar mínimo de datos
if (!DataPreprocessor.validateMinimumData(cleaned)) {
  throw new Error('Datos insuficientes');
}

// 5. Eliminar outliers
const withoutOutliers = DataPreprocessor.removeOutliers(cleaned);

// 6. Rellenar fechas faltantes
const filled = DataPreprocessor.fillMissingDates(withoutOutliers);

// 7. Agrupar por mes
const monthly = DataPreprocessor.aggregateByPeriod(filled, 'month');

// 8. Convertir a serie temporal
const timeSeries = DataPreprocessor.toTimeSeries(monthly);

// 9. Normalizar para ML
const { normalized, min, max } = DataPreprocessor.normalizeData(timeSeries.values);

// 10. Entrenar modelo
model.train({
  dates: timeSeries.dates,
  values: normalized
});

// 11. Predecir
const predictions = model.predict(6);

// 12. Denormalizar predicciones
const denormalized = DataPreprocessor.denormalize(
  predictions.map(p => p.amount),
  min,
  max
);
```

---

## 🎓 Conceptos Clave Resumidos

### 1. Limpieza de Datos

| Validación | Propósito | Ejemplo Rechazado |
|------------|-----------|-------------------|
| `instanceof Date` | Tipo correcto | `'2025-11-27'` (string) |
| `!isNaN(date)` | Fecha válida | `new Date('invalid')` |
| `typeof === 'number'` | Valor numérico | `'100'` (string) |
| `!isNaN(value)` | No NaN | `0/0` |
| `isFinite(value)` | No infinito | `1/0` |
| `value >= 0` | No negativo | `-50` |

### 2. Normalización

**Fórmula:**
```
normalized = (value - min) / (max - min)
```

**Rango:** 0 a 1

**Ventajas:**
- Facilita entrenamiento de ML
- Evita que valores grandes dominen

### 3. Detección de Outliers (IQR)

**Fórmula:**
```
IQR = Q3 - Q1
Lower Bound = Q1 - 1.5 * IQR
Upper Bound = Q3 + 1.5 * IQR
```

**Outlier:** Valor fuera de los límites

### 4. Interpolación

**Método:** Promedio simple
```
interpolated = (value_before + value_after) / 2
```

### 5. Agregación

**Períodos:**
- **day**: Agrupa por día
- **week**: Agrupa por semana
- **month**: Agrupa por mes

**Cálculo:** Promedio de valores en el período

---

## ✅ Ejemplo Completo

```javascript
// Datos crudos (sucios)
const rawData = [
  { date: new Date('2025-11-01'), value: 100 },
  { date: new Date('2025-11-02'), value: -50 },      // ❌ Negativo
  { date: new Date('2025-11-05'), value: 150 },      // ✅ OK (falta 3 y 4)
  { date: new Date('2025-11-06'), value: 10000 },    // ❌ Outlier
  { date: new Date('2025-11-07'), value: 200 },
];

// 1. Limpiar
const cleaned = DataPreprocessor.cleanData(rawData);
// Resultado: [100, 150, 10000, 200]

// 2. Remover outliers
const noOutliers = DataPreprocessor.removeOutliers(cleaned);
// Resultado: [100, 150, 200]

// 3. Rellenar fechas
const filled = DataPreprocessor.fillMissingDates(noOutliers);
// Resultado: [100, 125, 125, 150, 200]
//                  ↑    ↑  Interpolados

// 4. Normalizar
const { normalized, min, max } = DataPreprocessor.normalizeData(
  filled.map(d => d.value)
);
// normalized = [0, 0.25, 0.25, 0.5, 1.0]
// min = 100, max = 200

// 5. Convertir a serie temporal
const timeSeries = DataPreprocessor.toTimeSeries(filled);
// {
//   dates: [Date, Date, Date, Date, Date],
//   values: [100, 125, 125, 150, 200]
// }
```

---

## 🚀 Casos de Uso

### 1. Preparar Datos para Predicción

```javascript
const transactions = await Transaction.find({ userId });
const dataPoints = transactions.map(t => ({
  date: t.date,
  value: t.amount
}));

const processed = DataPreprocessor.cleanData(dataPoints);
const monthly = DataPreprocessor.aggregateByPeriod(processed, 'month');
const timeSeries = DataPreprocessor.toTimeSeries(monthly);

// Listo para entrenar modelo
model.train(timeSeries);
```

### 2. Detectar Gastos Anómalos

```javascript
const values = data.map(d => d.value);
const outlierIndices = DataPreprocessor.detectOutliers(values);

outlierIndices.forEach(index => {
  console.log(`Gasto anómalo: $${data[index].value}`);
  // Enviar alerta al usuario
});
```

### 3. Análisis Mensual

```javascript
const daily = await getDailyTransactions();
const monthly = DataPreprocessor.aggregateByPeriod(daily, 'month');

monthly.forEach(month => {
  console.log(`${month.date}: Promedio $${month.value}`);
});
```

---

¡Documentación completa del preprocesador de datos! Este es el "chef" que prepara los datos para el machine learning. 👨‍🍳📊
