# Documentación ULTRA Didáctica: admin.middleware.ts

**Ubicación:** `src/middlewares/admin.middleware.ts`

**Propósito:** Este archivo es el **"guardia de seguridad VIP"** que protege rutas exclusivas de administradores. Verifica que el usuario autenticado tenga el rol de `admin` antes de permitir el acceso a funcionalidades administrativas. Es como un portero que solo deja pasar a personas con credencial de administrador.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina un edificio con áreas restringidas:

```
❌ Sin middleware de admin:
Cualquier usuario puede:
- Ver todos los usuarios
- Eliminar cualquier cuenta
- Modificar configuraciones del sistema
→ ¡Caos total!

✅ Con middleware de admin:
Solo administradores pueden:
- Gestionar usuarios
- Acceder a estadísticas globales
- Modificar configuraciones
→ Sistema seguro ✅
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (línea 1)                │
├──────────────────────────────────────────┤
│  MIDDLEWARE requiredAdmin (líneas 3-30) │
│  ├─ Verificar autenticación             │
│  ├─ Verificar rol de admin              │
│  ├─ Continuar o rechazar                │
│  └─ Manejo de errores                   │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

### Línea 1: Importaciones

```typescript
import { Request, Response, NextFunction} from 'express';
```

**¿Qué importa?**
- **`Request`**: Tipo para el objeto de solicitud HTTP
- **`Response`**: Tipo para el objeto de respuesta HTTP
- **`NextFunction`**: Tipo para la función `next()` que continúa al siguiente middleware

**¿Qué es un middleware?**
```
Cliente → Middleware 1 → Middleware 2 → Controlador → Respuesta
              ↓              ↓
         Autenticación   Admin Check
```

**Analogía:**
```
Middleware = Filtros de seguridad en un aeropuerto

1. Verificar boleto (autenticación)
2. Verificar clase VIP (admin)
3. Pasar a la sala VIP (controlador)
```

---

## 🔷 MIDDLEWARE requiredAdmin (Líneas 3-30)

### Línea 3: Firma de la Función

```typescript
export const requiredAdmin = (req: Request, res: Response, next: NextFunction): void => {
```

**¿Qué es?**
- Función middleware exportada
- Recibe 3 parámetros estándar de Express

**Parámetros:**
- **`req`**: Objeto de solicitud (contiene datos del usuario)
- **`res`**: Objeto de respuesta (para enviar respuestas)
- **`next`**: Función para continuar al siguiente middleware/controlador

**¿Por qué `void`?**
- No retorna valor
- Solo llama a `res.json()` o `next()`

---

### Líneas 4-12: Verificar Autenticación

```typescript
try{
    const user = req.user;
    if(!user){
        res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
        return;
    }
```

**¿Qué hace?**
1. Obtiene el usuario del request
2. Verifica si existe
3. Si no existe, retorna error 401

**¿De dónde viene `req.user`?**
```typescript
// Agregado por el middleware de autenticación (auth.middleware.ts)
// Antes de este middleware, otro middleware ya verificó el JWT
// y agregó el usuario al request

req.user = {
  id: '507f...',
  email: 'user@example.com',
  role: 'user' // o 'admin'
}
```

**Códigos de estado HTTP:**
```
401 Unauthorized = No autenticado
403 Forbidden = Autenticado pero sin permisos
```

**Ejemplo de flujo:**
```javascript
// Sin token JWT o token inválido
req.user = undefined

// Middleware detecta:
if (!user) {
  // Retorna 401
  return res.status(401).json({
    success: false,
    message: 'Usuario no autenticado'
  });
}
```

**Visualización:**
```
Cliente sin token
      ↓
   Middleware
      ↓
   req.user = undefined
      ↓
   ❌ 401 Unauthorized
   "Usuario no autenticado"
```

---

### Líneas 13-19: Verificar Rol de Admin

```typescript
if(user.role !== 'admin'){
    res.status(403).json({
        success: false,
        message: 'Acceso degenado'
    });
    return;
}
```

**¿Qué hace?**
- Verifica que el rol del usuario sea `'admin'`
- Si no es admin, retorna error 403

**Roles en el sistema:**
```typescript
type UserRole = 'user' | 'admin'

'user'  → Usuario normal (mayoría)
'admin' → Administrador (pocos)
```

**Ejemplo:**
```javascript
// Usuario normal intenta acceder
req.user = {
  id: '507f...',
  email: 'user@example.com',
  role: 'user'  // ← No es admin
}

// Middleware detecta:
if (user.role !== 'admin') {
  // Retorna 403
  return res.status(403).json({
    success: false,
    message: 'Acceso denegado'
  });
}
```

**Visualización:**
```
Usuario normal (role: 'user')
      ↓
   Middleware
      ↓
   role !== 'admin'
      ↓
   ❌ 403 Forbidden
   "Acceso denegado"
```

**Nota:** Hay un typo en el mensaje: `'Acceso degenado'` debería ser `'Acceso denegado'`

---

### Línea 21: Continuar al Siguiente Middleware

```typescript
next();
```

**¿Qué hace?**
- Llama a la función `next()`
- Continúa al siguiente middleware o controlador
- Solo se ejecuta si todas las validaciones pasaron

**Flujo exitoso:**
```
Usuario admin (role: 'admin')
      ↓
   Middleware
      ↓
   ✅ user existe
   ✅ role === 'admin'
      ↓
   next() → Continúa al controlador
```

---

### Líneas 23-29: Manejo de Errores

```typescript
}catch(error){
    console.error('Error en verificacion de admin', error);
    res.status(500).json({
        success: false,
        message: 'Error en verificar permisos'
    });
}
```

**¿Qué hace?**
- Captura cualquier error inesperado
- Registra el error en consola
- Retorna error 500 (error del servidor)

**¿Cuándo se activaría?**
```javascript
// Ejemplo: req.user es un objeto corrupto
req.user = null;

// Al intentar acceder a user.role:
if (user.role !== 'admin') {
  // Error: Cannot read property 'role' of null
}

// Catch captura el error:
catch(error) {
  console.error('Error en verificacion de admin', error);
  return res.status(500).json({
    success: false,
    message: 'Error en verificar permisos'
  });
}
```

**Códigos de estado:**
```
500 Internal Server Error = Error inesperado del servidor
```

---

## 🔸 Flujo Completo del Middleware

### Diagrama de Flujo

```
Cliente hace request a ruta protegida
         ↓
    ¿req.user existe?
         ↓ No
    ❌ 401 "Usuario no autenticado"
         ↓ Sí
    ¿user.role === 'admin'?
         ↓ No
    ❌ 403 "Acceso denegado"
         ↓ Sí
    ✅ next() → Continúa al controlador
```

### Casos de Uso

**Caso 1: Usuario no autenticado**
```javascript
// Request sin token JWT
req.user = undefined

// Resultado:
// 401 Unauthorized
// "Usuario no autenticado"
```

**Caso 2: Usuario normal**
```javascript
// Request con token de usuario normal
req.user = {
  id: '507f...',
  email: 'user@example.com',
  role: 'user'
}

// Resultado:
// 403 Forbidden
// "Acceso denegado"
```

**Caso 3: Administrador**
```javascript
// Request con token de admin
req.user = {
  id: '507f...',
  email: 'admin@example.com',
  role: 'admin'
}

// Resultado:
// ✅ next() → Continúa al controlador
```

---

## 🎯 Ejemplo de Uso en Rutas

### Aplicar Middleware a Rutas

```typescript
// En routes/user.routes.ts
import { Router } from 'express';
import { requiredAdmin } from '../middlewares/admin.middleware';
import { verifyToken } from '../middlewares/auth.middleware';
import * as userController from '../controllers/user.controller';

const router = Router();

// Rutas públicas (sin middleware)
router.post('/register', userController.createUser);
router.post('/login', userController.login);

// Rutas protegidas (requieren autenticación)
router.get('/profile', verifyToken, userController.getProfile);

// Rutas de admin (requieren autenticación + rol admin)
router.get('/users', verifyToken, requiredAdmin, userController.getAllUsers);
router.delete('/users/:id', verifyToken, requiredAdmin, userController.deleteUser);

export default router;
```

**Orden de middlewares:**
```
1. verifyToken    → Verifica JWT y agrega req.user
2. requiredAdmin  → Verifica que req.user.role === 'admin'
3. controlador    → Ejecuta la lógica de negocio
```

**Visualización:**
```
GET /api/users
      ↓
   verifyToken
      ↓
   req.user = { id, email, role }
      ↓
   requiredAdmin
      ↓
   ¿role === 'admin'? → Sí
      ↓
   getAllUsers()
      ↓
   Retorna lista de usuarios
```

---

## 📊 Comparación de Escenarios

### Tabla de Respuestas

| Escenario | req.user | role | Código | Mensaje |
|-----------|----------|------|--------|---------|
| Sin token | undefined | - | 401 | Usuario no autenticado |
| Usuario normal | {...} | 'user' | 403 | Acceso denegado |
| Administrador | {...} | 'admin' | - | ✅ Continúa |
| Error inesperado | corrupto | - | 500 | Error en verificar permisos |

---

## 🔐 Seguridad

### Principio de Menor Privilegio

**Concepto:**
- Usuarios solo tienen acceso a lo que necesitan
- Administradores tienen acceso completo

**Implementación:**
```typescript
// Usuario normal puede:
- Ver su perfil
- Crear sus transacciones
- Ver sus metas

// Admin puede (además):
- Ver todos los usuarios
- Eliminar usuarios
- Ver estadísticas globales
- Modificar configuraciones
```

### Defensa en Profundidad

**Capas de seguridad:**
```
1. verifyToken    → ¿Token válido?
2. requiredAdmin  → ¿Es admin?
3. Controlador    → Validaciones adicionales
```

**Ejemplo:**
```typescript
// En user.controller.ts
export const deleteUser = async (req, res) => {
  // Capa 1: verifyToken ya verificó autenticación
  // Capa 2: requiredAdmin ya verificó rol
  
  // Capa 3: Validación adicional
  const user = await User.findById(req.params.id);
  
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 1) {
      return res.status(400).json({
        message: 'No se puede eliminar el último administrador'
      });
    }
  }
  
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
```

---

## ✅ Mejores Prácticas Implementadas

✅ **Try-catch**: Manejo de errores robusto  
✅ **Códigos HTTP apropiados**: 401, 403, 500  
✅ **Mensajes claros**: Usuario sabe por qué fue rechazado  
✅ **Return después de res**: Evita ejecución adicional  
✅ **Validación en capas**: Primero autenticación, luego autorización  

---

## 🚀 Casos de Uso Reales

### 1. Panel de Administración

```typescript
// routes/admin.routes.ts
router.get('/dashboard', verifyToken, requiredAdmin, adminController.getDashboard);
router.get('/stats', verifyToken, requiredAdmin, adminController.getStats);
router.post('/settings', verifyToken, requiredAdmin, adminController.updateSettings);
```

### 2. Gestión de Usuarios

```typescript
// routes/user.routes.ts
router.get('/users', verifyToken, requiredAdmin, userController.getAllUsers);
router.delete('/users/:id', verifyToken, requiredAdmin, userController.deleteUser);
router.patch('/users/:id/role', verifyToken, requiredAdmin, userController.changeRole);
```

### 3. Comparaciones Globales

```typescript
// routes/comparison.routes.ts
router.get('/compare/users', verifyToken, requiredAdmin, comparisonController.compareByUsers);
```

---

## 🎓 Conceptos Clave

### 1. Middleware

**Definición:**
- Función que se ejecuta entre la solicitud y la respuesta
- Puede modificar `req` y `res`
- Puede terminar el ciclo o continuar con `next()`

**Tipos:**
```typescript
// Middleware de aplicación
app.use(middleware);

// Middleware de ruta
router.get('/path', middleware, controller);

// Middleware de error
app.use((err, req, res, next) => { ... });
```

### 2. Autenticación vs Autorización

**Autenticación:**
- ¿Quién eres?
- Verificar identidad (JWT)
- Middleware: `verifyToken`

**Autorización:**
- ¿Qué puedes hacer?
- Verificar permisos (rol)
- Middleware: `requiredAdmin`

**Analogía:**
```
Autenticación = Mostrar tu ID
Autorización = Verificar si tienes permiso de entrada
```

### 3. Códigos de Estado HTTP

```
200 OK = Éxito
401 Unauthorized = No autenticado
403 Forbidden = Autenticado pero sin permisos
404 Not Found = Recurso no encontrado
500 Internal Server Error = Error del servidor
```

---

## 🔧 Posibles Mejoras

### 1. Corregir Typo

```typescript
// Actual
message: 'Acceso degenado'

// Correcto
message: 'Acceso denegado'
```

### 2. Agregar Logging

```typescript
if (user.role !== 'admin') {
  console.warn(`Intento de acceso no autorizado: ${user.email} (${user.role})`);
  res.status(403).json({
    success: false,
    message: 'Acceso denegado'
  });
  return;
}
```

### 3. Roles Múltiples

```typescript
// Permitir múltiples roles
export const requiredRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado'
      });
    }
    
    next();
  };
};

// Uso:
router.get('/users', verifyToken, requiredRoles(['admin', 'moderator']), controller);
```

---

## 📝 Resumen

**Propósito:**
- Proteger rutas exclusivas de administradores

**Funcionamiento:**
1. Verifica que el usuario esté autenticado
2. Verifica que el usuario tenga rol `'admin'`
3. Continúa al controlador o rechaza con error

**Códigos de respuesta:**
- 401: Usuario no autenticado
- 403: Usuario sin permisos de admin
- 500: Error inesperado

**Uso:**
```typescript
router.get('/admin-route', verifyToken, requiredAdmin, controller);
```

---

¡Documentación completa del middleware de administrador! Este es el guardia que protege las áreas VIP del sistema. 🛡️👮

