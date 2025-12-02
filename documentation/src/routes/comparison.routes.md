# Documentación ULTRA Didáctica: comparison.routes.ts

**Ubicación:** `src/routes/comparison.routes.ts`

**Propósito:** Este archivo define las **rutas de comparaciones financieras**. Permite comparar gastos e ingresos de diferentes formas: por categoría, por tiempo, entre usuarios (admin), real vs predicho, y por períodos. Es como tener un **panel de análisis** que te muestra cómo cambian tus finanzas en diferentes dimensiones.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina un sistema de análisis:

```
Sin comparaciones:
- Solo ves datos aislados
- No sabes si gastas más o menos que antes
- No puedes comparar con predicciones

Con comparaciones:
GET /category → ¿Cuánto gasto en cada categoría?
GET /temporal → ¿Gasto más este mes que el anterior?
GET /real-vs-predicted → ¿Mis predicciones fueron correctas?
→ Análisis profundo y decisiones informadas
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (líneas 1-4)             │
│  ├─ Router de Express                   │
│  ├─ Controlador de comparaciones        │
│  ├─ Middleware de autenticación         │
│  └─ Middleware de autorización          │
├──────────────────────────────────────────┤
│  INICIALIZACIÓN (línea 6)               │
│  └─ Crear instancia de Router           │
├──────────────────────────────────────────┤
│  RUTAS (líneas 9-42)                    │
│  ├─ GET /category (por categoría)       │
│  ├─ GET /temporal (por tiempo)          │
│  ├─ POST /users (entre usuarios-admin)  │
│  ├─ GET /real-vs-predicted (vs ML)      │
│  └─ POST /periods (por períodos)        │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (línea 44)                 │
│  └─ Exportar router                     │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

### Líneas 1-4: Importaciones

```typescript
import { Router } from 'express';
import { comparisonController } from '../controllers/comparison.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/authorize.middleware';
```

**Línea 1: Router**
- Constructor para crear rutas

**Línea 2: comparisonController**
- Controlador con lógica de comparaciones

**Línea 3: authenticate**
- Middleware de autenticación JWT

**Línea 4: authorizeRoles**
- Middleware de autorización por roles
- Usado para rutas exclusivas de admin

---

## 🔷 RUTAS DEFINIDAS

### Ruta 1: GET /category (Líneas 9-13)

```typescript
// Comparación por categoría
router.get(
    '/category',
    authenticate,
    comparisonController.compareByCategory.bind(comparisonController)
);
```

**Endpoint completo:**
```
GET /api/comparisons/category
```

**¿Qué hace?**
- Compara **gastos e ingresos por categoría**
- Muestra cuánto se gasta en cada categoría
- Calcula porcentajes y totales

**Middlewares:**
1. `authenticate`: Verifica JWT

**Query parameters:**
```
?startDate=2025-11-01    // Fecha inicio
?endDate=2025-11-30      // Fecha fin
?type=expense            // Solo gastos o ingresos
```

**Ejemplo de request:**
```http
GET /api/comparisons/category?startDate=2025-11-01&endDate=2025-11-30&type=expense
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": {
          "id": "507f...",
          "name": "Comida",
          "icon": "🍔",
          "color": "#FF6B6B"
        },
        "total": 1500.00,
        "count": 45,
        "percentage": 35.5,
        "average": 33.33
      },
      {
        "category": {
          "id": "507f...",
          "name": "Transporte",
          "icon": "🚗",
          "color": "#4ECDC4"
        },
        "total": 800.00,
        "count": 20,
        "percentage": 18.9,
        "average": 40.00
      }
    ],
    "total": 4230.00,
    "period": {
      "start": "2025-11-01",
      "end": "2025-11-30"
    }
  }
}
```

**Caso de uso:**
```javascript
// Gráfico de pastel de gastos por categoría
const { data } = await fetch('/api/comparisons/category?type=expense');
const chartData = data.categories.map(item => ({
  label: item.category.name,
  value: item.total,
  percentage: item.percentage,
  color: item.category.color
}));
renderPieChart(chartData);
```

---

### Ruta 2: GET /temporal (Líneas 16-20)

```typescript
// Comparación temporal
router.get(
    '/temporal',
    authenticate,
    comparisonController.compareByTime.bind(comparisonController)
);
```

**Endpoint completo:**
```
GET /api/comparisons/temporal
```

**¿Qué hace?**
- Compara **gastos e ingresos en diferentes períodos de tiempo**
- Muestra tendencias (aumentó, disminuyó)
- Calcula cambios porcentuales

**Query parameters:**
```
?period=month           // Comparar meses
?period=week            // Comparar semanas
?period=year            // Comparar años
?periods=3              // Número de períodos a comparar
```

**Ejemplo de request:**
```http
GET /api/comparisons/temporal?period=month&periods=3
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "comparisons": [
      {
        "period": "2025-11",
        "label": "Noviembre 2025",
        "income": 3000.00,
        "expense": 2200.00,
        "balance": 800.00,
        "transactions": 65
      },
      {
        "period": "2025-10",
        "label": "Octubre 2025",
        "income": 3000.00,
        "expense": 1800.00,
        "balance": 1200.00,
        "transactions": 58
      },
      {
        "period": "2025-09",
        "label": "Septiembre 2025",
        "income": 2800.00,
        "expense": 1600.00,
        "balance": 1200.00,
        "transactions": 52
      }
    ],
    "trends": {
      "income": {
        "change": 7.14,
        "direction": "increasing"
      },
      "expense": {
        "change": 37.5,
        "direction": "increasing"
      },
      "balance": {
        "change": -33.33,
        "direction": "decreasing"
      }
    }
  }
}
```

**Caso de uso:**
```javascript
// Gráfico de líneas de tendencia
const { data } = await fetch('/api/comparisons/temporal?period=month&periods=6');
const chartData = {
  labels: data.comparisons.map(c => c.label),
  datasets: [
    {
      label: 'Ingresos',
      data: data.comparisons.map(c => c.income),
      color: '#4ECDC4'
    },
    {
      label: 'Gastos',
      data: data.comparisons.map(c => c.expense),
      color: '#FF6B6B'
    }
  ]
};
renderLineChart(chartData);
```

---

### Ruta 3: POST /users (Líneas 23-28)

```typescript
// Comparación entre usuarios (solo admin)
router.post(
    '/users',
    authenticate,
    authorizeRoles('admin'),
    comparisonController.compareByUsers.bind(comparisonController)
);
```

**Endpoint completo:**
```
POST /api/comparisons/users
```

**¿Qué hace?**
- Compara **gastos e ingresos entre diferentes usuarios**
- **Solo accesible para administradores**
- Útil para análisis global del sistema

**Middlewares:**
1. `authenticate`: Verifica JWT
2. `authorizeRoles('admin')`: Solo admins

**Ejemplo de request:**
```http
POST /api/comparisons/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "userIds": ["507f...", "507f...", "507f..."],
  "startDate": "2025-11-01",
  "endDate": "2025-11-30"
}
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "user": {
          "id": "507f...",
          "name": "Juan Pérez",
          "email": "juan@example.com"
        },
        "income": 3000.00,
        "expense": 2200.00,
        "balance": 800.00,
        "savingsRate": 26.67,
        "transactions": 65
      },
      {
        "user": {
          "id": "507f...",
          "name": "María García",
          "email": "maria@example.com"
        },
        "income": 2500.00,
        "expense": 1800.00,
        "balance": 700.00,
        "savingsRate": 28.00,
        "transactions": 52
      }
    ],
    "averages": {
      "income": 2750.00,
      "expense": 2000.00,
      "balance": 750.00,
      "savingsRate": 27.34
    }
  }
}
```

**Restricción:**
```javascript
// ❌ Usuario normal intenta acceder
GET /api/comparisons/users
// 403 Forbidden: "No tienes permisos para acceder a este recurso"

// ✅ Admin puede acceder
GET /api/comparisons/users
// Retorna comparación entre usuarios
```

---

### Ruta 4: GET /real-vs-predicted/:predictionId (Líneas 31-35)

```typescript
// Comparación real vs predicho
router.get(
    '/real-vs-predicted/:predictionId',
    authenticate,
    comparisonController.compareRealVsPredicted.bind(comparisonController)
);
```

**Endpoint completo:**
```
GET /api/comparisons/real-vs-predicted/:predictionId
```

**¿Qué hace?**
- Compara **gastos reales vs predicciones de ML**
- Muestra qué tan precisas fueron las predicciones
- Calcula errores y métricas de precisión

**Parámetros de ruta:**
- `:predictionId`: ID de la predicción a comparar

**Ejemplo de request:**
```http
GET /api/comparisons/real-vs-predicted/507f191e810c19729de860ea
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "prediction": {
      "id": "507f...",
      "modelType": "linear_regression",
      "generatedAt": "2025-11-01T..."
    },
    "comparisons": [
      {
        "date": "2025-12-01",
        "predicted": 1500.00,
        "actual": 1450.00,
        "difference": -50.00,
        "percentageError": -3.33,
        "withinBounds": true
      },
      {
        "date": "2026-01-01",
        "predicted": 1550.00,
        "actual": 1600.00,
        "difference": 50.00,
        "percentageError": 3.23,
        "withinBounds": true
      }
    ],
    "metrics": {
      "mae": 50.00,
      "mape": 3.28,
      "rmse": 50.00,
      "accuracy": 96.72
    }
  }
}
```

**Caso de uso:**
```javascript
// Verificar precisión de predicciones
const { data } = await fetch(`/api/comparisons/real-vs-predicted/${predictionId}`);

console.log(`Precisión del modelo: ${data.metrics.accuracy}%`);
console.log(`Error promedio: ${data.metrics.mape}%`);

// Gráfico comparativo
const chartData = {
  labels: data.comparisons.map(c => c.date),
  datasets: [
    {
      label: 'Predicho',
      data: data.comparisons.map(c => c.predicted),
      color: '#4ECDC4'
    },
    {
      label: 'Real',
      data: data.comparisons.map(c => c.actual),
      color: '#FF6B6B'
    }
  ]
};
```

---

### Ruta 5: POST /periods (Líneas 38-42)

```typescript
// Comparación por períodos
router.post(
    '/periods',
    authenticate,
    comparisonController.compareByPeriods.bind(comparisonController)
);
```

**Endpoint completo:**
```
POST /api/comparisons/periods
```

**¿Qué hace?**
- Compara **gastos e ingresos entre períodos personalizados**
- Permite definir períodos específicos a comparar
- Más flexible que comparación temporal

**Ejemplo de request:**
```http
POST /api/comparisons/periods
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "periods": [
    {
      "label": "Vacaciones",
      "startDate": "2025-07-01",
      "endDate": "2025-07-31"
    },
    {
      "label": "Trabajo normal",
      "startDate": "2025-08-01",
      "endDate": "2025-08-31"
    }
  ]
}
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "comparisons": [
      {
        "label": "Vacaciones",
        "period": {
          "start": "2025-07-01",
          "end": "2025-07-31"
        },
        "income": 3000.00,
        "expense": 3500.00,
        "balance": -500.00,
        "transactions": 78,
        "avgDailyExpense": 112.90
      },
      {
        "label": "Trabajo normal",
        "period": {
          "start": "2025-08-01",
          "end": "2025-08-31"
        },
        "income": 3000.00,
        "expense": 2000.00,
        "balance": 1000.00,
        "transactions": 52,
        "avgDailyExpense": 64.52
      }
    ],
    "differences": {
      "income": 0.00,
      "expense": -1500.00,
      "balance": 1500.00,
      "avgDailyExpense": -48.38
    }
  }
}
```

**Caso de uso:**
```javascript
// Comparar diferentes etapas de vida
const periods = [
  { label: 'Antes del bebé', startDate: '2024-01-01', endDate: '2024-06-30' },
  { label: 'Después del bebé', startDate: '2024-07-01', endDate: '2024-12-31' }
];

const { data } = await fetch('/api/comparisons/periods', {
  method: 'POST',
  body: JSON.stringify({ periods })
});

console.log(`Aumento de gastos: $${data.differences.expense}`);
```

---

## 📊 Resumen de Rutas

| Método | Ruta | Descripción | Auth | Admin |
|--------|------|-------------|------|-------|
| GET | `/category` | Por categoría | ✅ | ❌ |
| GET | `/temporal` | Por tiempo | ✅ | ❌ |
| POST | `/users` | Entre usuarios | ✅ | ✅ |
| GET | `/real-vs-predicted/:id` | Real vs ML | ✅ | ❌ |
| POST | `/periods` | Períodos personalizados | ✅ | ❌ |

**Todas las rutas requieren autenticación** ✅  
**Solo `/users` requiere rol de admin** 🔐

---

## 🎯 Casos de Uso

### 1. Dashboard de Análisis

```javascript
// Cargar múltiples comparaciones
const loadDashboard = async () => {
  // Gastos por categoría
  const byCategory = await fetch('/api/comparisons/category?type=expense');
  
  // Tendencia de últimos 6 meses
  const temporal = await fetch('/api/comparisons/temporal?period=month&periods=6');
  
  // Precisión de predicciones
  const vsML = await fetch(`/api/comparisons/real-vs-predicted/${predictionId}`);
  
  renderDashboard({ byCategory, temporal, vsML });
};
```

---

### 2. Análisis de Hábitos

```javascript
// Comparar fin de semana vs días laborales
const periods = [
  {
    label: 'Fines de semana',
    startDate: '2025-11-01',
    endDate: '2025-11-30',
    filter: 'weekends'
  },
  {
    label: 'Días laborales',
    startDate: '2025-11-01',
    endDate: '2025-11-30',
    filter: 'weekdays'
  }
];

const { data } = await fetch('/api/comparisons/periods', {
  method: 'POST',
  body: JSON.stringify({ periods })
});

console.log(`Gastas ${data.differences.avgDailyExpense} más en fines de semana`);
```

---

### 3. Validación de Predicciones

```javascript
// Verificar todas las predicciones
const predictions = await fetch('/api/predictions');

for (const prediction of predictions.data) {
  const comparison = await fetch(`/api/comparisons/real-vs-predicted/${prediction.id}`);
  
  console.log(`Modelo: ${prediction.modelType}`);
  console.log(`Precisión: ${comparison.data.metrics.accuracy}%`);
  console.log(`Error: ${comparison.data.metrics.mape}%`);
}
```

---

## 🔐 Seguridad

### 1. Autenticación Requerida

```javascript
// Todas las rutas requieren token
const response = await fetch('/api/comparisons/category', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2. Solo Datos Propios

```javascript
// En el controlador
const transactions = await Transaction.find({
  userId: req.user.id,  // ← Solo transacciones del usuario
  date: { $gte: startDate, $lte: endDate }
});
```

### 3. Ruta Admin Protegida

```javascript
// Solo admins pueden comparar entre usuarios
router.post('/users',
  authenticate,
  authorizeRoles('admin'),  // ← Verifica rol
  controller
);
```

---

## ✅ Mejores Prácticas

### 1. Cachear Resultados

```javascript
// Cachear comparaciones pesadas
const cacheKey = `comparison:category:${userId}:${startDate}:${endDate}`;
const cached = await cache.get(cacheKey);

if (cached) {
  return res.json(cached);
}

const data = await generateComparison();
await cache.set(cacheKey, data, 3600);  // 1 hora
```

### 2. Limitar Períodos

```javascript
// No permitir períodos muy largos
const maxDays = 365;
const days = (endDate - startDate) / (1000 * 60 * 60 * 24);

if (days > maxDays) {
  return res.status(400).json({
    message: `El período no puede exceder ${maxDays} días`
  });
}
```

### 3. Agregar Filtros

```javascript
// Permitir filtrar por categoría en comparación temporal
GET /api/comparisons/temporal?period=month&periods=6&categoryId=507f...
```

---

## 📝 Resumen

**Propósito:**
- Definir rutas para comparaciones financieras
- Análisis multidimensional de gastos e ingresos

**Rutas principales:**
- `GET /category`: Comparar por categoría
- `GET /temporal`: Comparar por tiempo
- `POST /users`: Comparar entre usuarios (admin)
- `GET /real-vs-predicted/:id`: Comparar con predicciones ML
- `POST /periods`: Comparar períodos personalizados

**Tipos de análisis:**
- **Por categoría**: ¿Dónde gasto más?
- **Temporal**: ¿Gasto más que antes?
- **Entre usuarios**: ¿Cómo se comparan los usuarios? (admin)
- **Real vs ML**: ¿Qué tan precisas son las predicciones?
- **Por períodos**: Comparar etapas específicas

**Seguridad:**
- Todas las rutas requieren autenticación
- Solo `/users` requiere rol admin
- Solo acceso a datos propios

---

¡Documentación completa de las rutas de comparaciones! Este es el sistema de análisis financiero avanzado. 📊📈

