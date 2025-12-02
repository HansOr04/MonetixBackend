# Documentación ULTRA Didáctica: alert.routes.ts

**Ubicación:** `src/routes/alert.routes.ts`

**Propósito:** Este archivo define las **rutas HTTP** para el módulo de alertas. Especifica qué URLs están disponibles, qué métodos HTTP aceptan (GET, POST, PUT, DELETE), y qué controladores manejan cada solicitud. Es como el **mapa de direcciones** que le dice a Express cómo responder a las peticiones relacionadas con alertas.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina un sistema de correo:

```
Sin rutas:
- No hay direcciones definidas
- Express no sabe qué hacer con las peticiones
- Aplicación no funciona

Con rutas:
GET /api/alerts → Obtener alertas del usuario
PUT /api/alerts/:id/read → Marcar alerta como leída
DELETE /api/alerts/:id → Eliminar alerta
→ Sistema organizado y funcional
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (líneas 1-3)             │
│  ├─ Router de Express                   │
│  ├─ Controlador de alertas              │
│  └─ Middleware de autenticación         │
├──────────────────────────────────────────┤
│  INICIALIZACIÓN (línea 5)               │
│  └─ Crear instancia de Router           │
├──────────────────────────────────────────┤
│  RUTAS (líneas 7-47)                    │
│  ├─ GET /unread-count (contador)        │
│  ├─ GET / (listar alertas)              │
│  ├─ GET /:id (alerta específica)        │
│  ├─ PUT /:id/read (marcar leída)        │
│  ├─ PUT /read-all (marcar todas)        │
│  ├─ DELETE /:id (eliminar)              │
│  └─ POST /generate (generar)            │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (línea 49)                 │
│  └─ Exportar router                     │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

### Líneas 1-3: Importaciones

```typescript
import { Router } from 'express';
import { alertController } from '../controllers/alert.controller';
import { authenticate } from '../middlewares/auth.middleware';
```

**Línea 1: Router**
- Constructor para crear rutas en Express
- Permite agrupar rutas relacionadas

**Línea 2: alertController**
- Controlador con la lógica de negocio
- Contiene métodos para cada operación

**Línea 3: authenticate**
- Middleware de autenticación JWT
- Verifica que el usuario esté autenticado

---

### Línea 5: Inicialización

```typescript
const router = Router();
```

**¿Qué hace?**
- Crea una instancia de Router
- Permite definir rutas específicas del módulo

---

## 🔷 RUTAS DEFINIDAS

### Ruta 1: GET /unread-count (Líneas 7-11)

```typescript
router.get(
  '/unread-count',
  authenticate,
  alertController.getUnreadCount.bind(alertController)
);
```

**Endpoint completo:**
```
GET /api/alerts/unread-count
```

**¿Qué hace?**
- Obtiene el **número de alertas no leídas** del usuario

**Middlewares:**
1. `authenticate`: Verifica JWT y agrega `req.user`

**Controlador:**
- `alertController.getUnreadCount`

**Ejemplo de request:**
```http
GET /api/alerts/unread-count
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "count": 5
}
```

**Caso de uso:**
```javascript
// Mostrar badge de notificaciones
const { count } = await fetch('/api/alerts/unread-count');
// Badge: 🔔 5
```

---

### Ruta 2: GET / (Líneas 13-17)

```typescript
router.get(
  '/',
  authenticate,
  alertController.getAlerts.bind(alertController)
);
```

**Endpoint completo:**
```
GET /api/alerts
```

**¿Qué hace?**
- Obtiene **todas las alertas** del usuario autenticado
- Soporta filtros y paginación

**Query parameters:**
```
?type=overspending          // Filtrar por tipo
?severity=critical          // Filtrar por severidad
?isRead=false              // Solo no leídas
?page=1&limit=10           // Paginación
```

**Ejemplo de request:**
```http
GET /api/alerts?isRead=false&severity=critical
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f...",
      "type": "overspending",
      "severity": "critical",
      "message": "Tus gastos han aumentado un 50%",
      "isRead": false,
      "createdAt": "2025-11-27T..."
    },
    {
      "id": "507f...",
      "type": "goal_progress",
      "severity": "warning",
      "message": "La meta 'Vacaciones' está retrasada",
      "isRead": false,
      "createdAt": "2025-11-26T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15
  }
}
```

---

### Ruta 3: GET /:id (Líneas 19-23)

```typescript
router.get(
  '/:id',
  authenticate,
  alertController.getAlertById.bind(alertController)
);
```

**Endpoint completo:**
```
GET /api/alerts/:id
```

**¿Qué hace?**
- Obtiene una **alerta específica** por ID

**Parámetros de ruta:**
- `:id`: ID de la alerta

**Ejemplo de request:**
```http
GET /api/alerts/507f191e810c19729de860ea
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "id": "507f191e810c19729de860ea",
    "type": "overspending",
    "severity": "warning",
    "message": "Tus gastos han aumentado un 30%",
    "isRead": false,
    "relatedData": {
      "recentAverage": 104,
      "previousAverage": 80,
      "increasePercent": 30
    },
    "createdAt": "2025-11-27T...",
    "updatedAt": "2025-11-27T..."
  }
}
```

**Caso de error:**
```json
{
  "success": false,
  "message": "Alerta no encontrada"
}
```

---

### Ruta 4: PUT /:id/read (Líneas 25-29)

```typescript
router.put(
  '/:id/read',
  authenticate,
  alertController.markAsRead.bind(alertController)
);
```

**Endpoint completo:**
```
PUT /api/alerts/:id/read
```

**¿Qué hace?**
- Marca una alerta como **leída**

**Parámetros de ruta:**
- `:id`: ID de la alerta

**Ejemplo de request:**
```http
PUT /api/alerts/507f191e810c19729de860ea/read
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "data": {
    "id": "507f191e810c19729de860ea",
    "isRead": true,
    "updatedAt": "2025-11-27T..."
  }
}
```

**Caso de uso:**
```javascript
// Usuario hace clic en alerta
onClick={() => {
  await fetch(`/api/alerts/${alertId}/read`, { method: 'PUT' });
  // Badge actualizado: 🔔 4 (era 5)
}}
```

---

### Ruta 5: PUT /read-all (Líneas 31-35)

```typescript
router.put(
  '/read-all',
  authenticate,
  alertController.markAllAsRead.bind(alertController)
);
```

**Endpoint completo:**
```
PUT /api/alerts/read-all
```

**¿Qué hace?**
- Marca **todas las alertas** del usuario como leídas

**Ejemplo de request:**
```http
PUT /api/alerts/read-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "message": "Todas las alertas marcadas como leídas",
  "modifiedCount": 5
}
```

**Caso de uso:**
```javascript
// Botón "Marcar todas como leídas"
onClick={async () => {
  await fetch('/api/alerts/read-all', { method: 'PUT' });
  // Badge: 🔔 0
}}
```

---

### Ruta 6: DELETE /:id (Líneas 37-41)

```typescript
router.delete(
  '/:id',
  authenticate,
  alertController.deleteAlert.bind(alertController)
);
```

**Endpoint completo:**
```
DELETE /api/alerts/:id
```

**¿Qué hace?**
- Elimina una alerta específica

**Parámetros de ruta:**
- `:id`: ID de la alerta

**Ejemplo de request:**
```http
DELETE /api/alerts/507f191e810c19729de860ea
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "message": "Alerta eliminada correctamente"
}
```

**Caso de uso:**
```javascript
// Botón de eliminar alerta
onClick={async () => {
  await fetch(`/api/alerts/${alertId}`, { method: 'DELETE' });
  // Alerta removida de la lista
}}
```

---

### Ruta 7: POST /generate (Líneas 43-47)

```typescript
router.post(
  '/generate',
  authenticate,
  alertController.generateAlerts.bind(alertController)
);
```

**Endpoint completo:**
```
POST /api/alerts/generate
```

**¿Qué hace?**
- **Genera alertas automáticamente** para el usuario
- Analiza transacciones, metas y patrones
- Crea alertas de sobregasto, progreso de metas, etc.

**Ejemplo de request:**
```http
POST /api/alerts/generate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response:**
```json
{
  "success": true,
  "message": "Alertas generadas correctamente",
  "generated": 3,
  "alerts": [
    {
      "type": "overspending",
      "severity": "warning",
      "message": "Tus gastos han aumentado un 30%"
    },
    {
      "type": "goal_progress",
      "severity": "warning",
      "message": "La meta 'Vacaciones' está retrasada"
    },
    {
      "type": "recommendation",
      "severity": "info",
      "message": "Tu tasa de ahorro es del 5%"
    }
  ]
}
```

**Caso de uso:**
```javascript
// Ejecutar diariamente (cron job)
cron.schedule('0 0 * * *', async () => {
  await fetch('/api/alerts/generate', { method: 'POST' });
  // Nuevas alertas generadas cada día
});
```

---

## 🔸 ¿Qué es `.bind(alertController)`?

```typescript
alertController.getAlerts.bind(alertController)
```

**¿Por qué usar `.bind()`?**

**Problema sin bind:**
```javascript
// Cuando Express llama al método, pierde el contexto 'this'
router.get('/', alertController.getAlerts);
// Dentro de getAlerts, 'this' es undefined
```

**Solución con bind:**
```javascript
// bind() asegura que 'this' siempre sea alertController
router.get('/', alertController.getAlerts.bind(alertController));
// Dentro de getAlerts, 'this' es alertController ✅
```

**Ejemplo:**
```javascript
class AlertController {
  async getAlerts(req, res) {
    // Sin bind: this = undefined ❌
    // Con bind: this = alertController ✅
    const alerts = await this.alertService.getAlerts();
  }
}
```

---

## 📊 Resumen de Rutas

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/unread-count` | Contador de no leídas | ✅ |
| GET | `/` | Listar alertas | ✅ |
| GET | `/:id` | Alerta específica | ✅ |
| PUT | `/:id/read` | Marcar como leída | ✅ |
| PUT | `/read-all` | Marcar todas leídas | ✅ |
| DELETE | `/:id` | Eliminar alerta | ✅ |
| POST | `/generate` | Generar alertas | ✅ |

**Todas las rutas requieren autenticación** ✅

---

## 🎯 Flujo de una Request

```
Cliente hace request
         ↓
    Express recibe
         ↓
    Busca ruta coincidente
         ↓
    Ejecuta middlewares en orden
         ↓
    1. authenticate
       - Verifica JWT
       - Agrega req.user
         ↓
    2. Controlador
       - Ejecuta lógica
       - Retorna respuesta
         ↓
    Express envía respuesta
         ↓
    Cliente recibe
```

---

## 🔐 Seguridad

### Todas las Rutas Protegidas

```typescript
// Todas usan authenticate
router.get('/', authenticate, controller);
router.put('/:id/read', authenticate, controller);
router.delete('/:id', authenticate, controller);
```

**¿Qué hace authenticate?**
1. Verifica token JWT
2. Agrega `req.user` con datos del usuario
3. Rechaza si token inválido (401)

### Validación de Pertenencia

```javascript
// En el controlador
const alert = await Alert.findOne({
  _id: alertId,
  userId: req.user.id  // ← Solo alertas del usuario
});

if (!alert) {
  return res.status(404).json({
    message: 'Alerta no encontrada'
  });
}
```

---

## 📝 Ejemplo de Uso Completo

### Frontend - Componente de Alertas

```javascript
// Obtener alertas no leídas
const fetchUnreadAlerts = async () => {
  const response = await fetch('/api/alerts?isRead=false', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const { data } = await response.json();
  setAlerts(data);
};

// Marcar como leída
const markAsRead = async (alertId) => {
  await fetch(`/api/alerts/${alertId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  fetchUnreadAlerts();  // Actualizar lista
};

// Marcar todas como leídas
const markAllAsRead = async () => {
  await fetch('/api/alerts/read-all', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  fetchUnreadAlerts();
};

// Eliminar alerta
const deleteAlert = async (alertId) => {
  await fetch(`/api/alerts/${alertId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  fetchUnreadAlerts();
};

// Generar nuevas alertas
const generateAlerts = async () => {
  await fetch('/api/alerts/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  fetchUnreadAlerts();
};
```

---

## ✅ Mejores Prácticas

### 1. Siempre Incluir Token

```javascript
// ❌ Sin token
fetch('/api/alerts');
// 401 Unauthorized

// ✅ Con token
fetch('/api/alerts', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 2. Manejar Errores

```javascript
try {
  const response = await fetch('/api/alerts');
  
  if (!response.ok) {
    throw new Error('Error al obtener alertas');
  }
  
  const data = await response.json();
  setAlerts(data.data);
} catch (error) {
  console.error(error);
  showError('No se pudieron cargar las alertas');
}
```

### 3. Actualizar UI Después de Acciones

```javascript
// Después de marcar como leída
await markAsRead(alertId);
fetchUnreadAlerts();  // ← Actualizar lista
updateBadge();        // ← Actualizar contador
```

---

## 📝 Resumen

**Propósito:**
- Definir rutas HTTP para alertas
- Conectar URLs con controladores
- Aplicar autenticación a todas las rutas

**Rutas principales:**
- `GET /unread-count`: Contador de no leídas
- `GET /`: Listar alertas
- `PUT /:id/read`: Marcar como leída
- `PUT /read-all`: Marcar todas
- `DELETE /:id`: Eliminar
- `POST /generate`: Generar automáticamente

**Seguridad:**
- Todas las rutas requieren autenticación
- Solo acceso a alertas propias del usuario

**Patrón:**
```typescript
router.método(
  '/ruta',
  authenticate,
  controlador.método.bind(controlador)
);
```

---

¡Documentación completa de las rutas de alertas! Este es el mapa de endpoints del módulo de notificaciones. 🚨🗺️

