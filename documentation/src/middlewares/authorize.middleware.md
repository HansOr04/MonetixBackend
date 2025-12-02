# Documentación ULTRA Didáctica: authorize.middleware.ts

**Ubicación:** `src/middlewares/authorize.middleware.ts`

**Propósito:** Este archivo es el **"control de acceso flexible"** del sistema. A diferencia de `admin.middleware` que solo permite administradores, este middleware permite especificar **múltiples roles permitidos** para cada ruta. Es como tener diferentes niveles de acceso VIP (Gold, Platinum, Diamond) en lugar de solo uno.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina un edificio con diferentes áreas de acceso:

```
❌ Con admin.middleware (inflexible):
Solo admins pueden acceder
→ Todo o nada

✅ Con authorize.middleware (flexible):
Puedes especificar:
- Solo admins
- Admins y moderadores
- Admins, moderadores y usuarios premium
→ Control granular ✅
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (línea 1)                │
├──────────────────────────────────────────┤
│  FUNCIÓN authorizeRoles (líneas 6-26)   │
│  ├─ Retorna middleware                  │
│  ├─ Verifica autenticación              │
│  ├─ Verifica rol permitido              │
│  └─ Continuar o rechazar                │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

### Línea 1: Importaciones

```typescript
import { Request, Response, NextFunction } from 'express';
```

**¿Qué importa?**
- Tipos de Express para middleware

---

## 🔷 FUNCIÓN authorizeRoles (Líneas 6-26)

### Líneas 3-6: Documentación y Firma

```typescript
/**
 * Middleware para autorizar roles específicos
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
```

**¿Qué es esto?**
- **Función de orden superior** (Higher-Order Function)
- Recibe roles permitidos
- **Retorna** un middleware

**¿Qué es `...allowedRoles`?**
- **Rest parameter**: Acepta múltiples argumentos
- Se convierte en array

**Ejemplo:**
```javascript
// Llamadas
authorizeRoles('admin')
// allowedRoles = ['admin']

authorizeRoles('admin', 'moderator')
// allowedRoles = ['admin', 'moderator']

authorizeRoles('admin', 'moderator', 'premium')
// allowedRoles = ['admin', 'moderator', 'premium']
```

---

### Línea 7: Retornar Middleware

```typescript
return (req: Request, res: Response, next: NextFunction): void => {
```

**¿Qué hace?**
- Retorna la función middleware real
- Esta es la función que Express ejecutará

**Patrón de diseño:**
```javascript
// Función que crea middleware
const authorizeRoles = (...roles) => {
  // Retorna el middleware
  return (req, res, next) => {
    // Lógica del middleware
  };
};

// Uso
router.get('/route', authorizeRoles('admin', 'moderator'), controller);
```

**Visualización:**
```
authorizeRoles('admin', 'moderator')
         ↓
    Retorna middleware configurado
         ↓
    Express ejecuta el middleware
         ↓
    Verifica si req.user.role está en ['admin', 'moderator']
```

---

### Líneas 8-14: Verificar Autenticación

```typescript
if (!req.user) {
    res.status(401).json({
        success: false,
        message: 'No autenticado',
    });
    return;
}
```

**¿Qué hace?**
- Verifica que el usuario esté autenticado
- Si no hay `req.user`, retorna 401

**¿De dónde viene `req.user`?**
```typescript
// Agregado por authenticate middleware
// Debe ejecutarse ANTES de authorizeRoles

router.get('/route',
  authenticate,        // 1. Agrega req.user
  authorizeRoles(...), // 2. Verifica req.user.role
  controller           // 3. Ejecuta lógica
);
```

**Ejemplo:**
```javascript
// Sin authenticate antes
req.user = undefined

// authorizeRoles detecta:
if (!req.user) {
  return res.status(401).json({
    success: false,
    message: 'No autenticado'
  });
}
```

---

### Líneas 16-22: Verificar Rol Permitido

```typescript
if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
    });
    return;
}
```

**¿Qué hace?**
- Verifica si el rol del usuario está en la lista de roles permitidos
- Si no está, retorna 403 (Forbidden)

**¿Qué es `.includes()`?**
```javascript
const array = ['admin', 'moderator'];

array.includes('admin')     // true
array.includes('moderator') // true
array.includes('user')      // false
```

**Ejemplo:**
```javascript
// Ruta permite admin y moderator
allowedRoles = ['admin', 'moderator']

// Usuario normal intenta acceder
req.user.role = 'user'

// Verificación
allowedRoles.includes('user')
// ['admin', 'moderator'].includes('user')
// false

// Resultado: 403 Forbidden
```

---

### Línea 24: Continuar

```typescript
next();
```

**¿Qué hace?**
- Llama a `next()` para continuar al siguiente middleware/controlador
- Solo se ejecuta si todas las validaciones pasaron

---

## 🔸 Comparación: admin.middleware vs authorize.middleware

### Tabla Comparativa

| Característica | admin.middleware | authorize.middleware |
|----------------|------------------|----------------------|
| **Flexibilidad** | Solo 'admin' | Múltiples roles |
| **Uso** | `requiredAdmin` | `authorizeRoles('admin', 'mod')` |
| **Configuración** | Fija | Dinámica |
| **Casos de uso** | Rutas exclusivas admin | Rutas con varios niveles |

### Código Comparado

**admin.middleware:**
```typescript
export const requiredAdmin = (req, res, next) => {
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};

// Uso
router.get('/users', authenticate, requiredAdmin, getAllUsers);
```

**authorize.middleware:**
```typescript
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Sin permisos' });
    }
    next();
  };
};

// Uso (más flexible)
router.get('/users', authenticate, authorizeRoles('admin'), getAllUsers);
router.get('/posts', authenticate, authorizeRoles('admin', 'moderator'), getPosts);
router.get('/premium', authenticate, authorizeRoles('admin', 'premium'), getPremium);
```

---

## 🔹 Flujo Completo

### Diagrama de Flujo

```
Cliente hace request
         ↓
    authenticate middleware
         ↓
    req.user agregado
         ↓
    authorizeRoles(['admin', 'moderator'])
         ↓
    ¿req.user existe?
         ↓ No
    ❌ 401 "No autenticado"
         ↓ Sí
    ¿req.user.role en allowedRoles?
         ↓ No
    ❌ 403 "Sin permisos"
         ↓ Sí
    ✅ next() → Controlador
```

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Solo Administradores

```typescript
// routes/user.routes.ts
router.delete('/users/:id', 
  authenticate,
  authorizeRoles('admin'),  // Solo admins
  deleteUser
);
```

**Resultado:**
```javascript
// Admin puede acceder
req.user.role = 'admin'
→ ✅ Permitido

// Usuario normal no puede
req.user.role = 'user'
→ ❌ 403 "Sin permisos"
```

---

### Ejemplo 2: Admins y Moderadores

```typescript
// routes/post.routes.ts
router.delete('/posts/:id',
  authenticate,
  authorizeRoles('admin', 'moderator'),  // Admins y moderadores
  deletePost
);
```

**Resultado:**
```javascript
// Admin puede
req.user.role = 'admin'
→ ✅ Permitido

// Moderador puede
req.user.role = 'moderator'
→ ✅ Permitido

// Usuario normal no puede
req.user.role = 'user'
→ ❌ 403 "Sin permisos"
```

---

### Ejemplo 3: Múltiples Niveles

```typescript
// routes/content.routes.ts

// Solo admins
router.post('/content/settings',
  authenticate,
  authorizeRoles('admin'),
  updateSettings
);

// Admins y moderadores
router.delete('/content/:id',
  authenticate,
  authorizeRoles('admin', 'moderator'),
  deleteContent
);

// Admins, moderadores y usuarios premium
router.get('/content/premium',
  authenticate,
  authorizeRoles('admin', 'moderator', 'premium'),
  getPremiumContent
);

// Todos los usuarios autenticados
router.get('/content/public',
  authenticate,
  getPublicContent
);
```

---

## 📊 Tabla de Escenarios

| Roles Permitidos | req.user.role | Resultado |
|------------------|---------------|-----------|
| `['admin']` | 'admin' | ✅ Permitido |
| `['admin']` | 'user' | ❌ 403 |
| `['admin', 'moderator']` | 'admin' | ✅ Permitido |
| `['admin', 'moderator']` | 'moderator' | ✅ Permitido |
| `['admin', 'moderator']` | 'user' | ❌ 403 |
| `['admin', 'moderator', 'premium']` | 'premium' | ✅ Permitido |
| `['admin', 'moderator', 'premium']` | 'user' | ❌ 403 |

---

## 🔐 Patrón de Diseño: Higher-Order Function

### ¿Qué es?

**Definición:**
- Función que retorna otra función
- Permite configuración dinámica

**Ejemplo simple:**
```javascript
// Función normal
const sayHello = () => {
  console.log('Hello');
};

// Higher-order function
const createGreeter = (greeting) => {
  return () => {
    console.log(greeting);
  };
};

// Uso
const sayHello = createGreeter('Hello');
const sayHola = createGreeter('Hola');

sayHello(); // "Hello"
sayHola();  // "Hola"
```

**En nuestro caso:**
```javascript
// authorizeRoles es higher-order function
const authorizeRoles = (...roles) => {
  // Retorna middleware configurado
  return (req, res, next) => {
    // Usa 'roles' del closure
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Sin permisos' });
    }
    next();
  };
};

// Cada llamada crea un middleware diferente
const adminOnly = authorizeRoles('admin');
const adminAndMod = authorizeRoles('admin', 'moderator');
const allPremium = authorizeRoles('admin', 'moderator', 'premium');
```

---

## 🎓 Conceptos Clave

### 1. Rest Parameters

**Sintaxis:**
```typescript
function example(...args: string[]) {
  // args es un array
}
```

**Ejemplo:**
```javascript
const sum = (...numbers) => {
  return numbers.reduce((total, n) => total + n, 0);
};

sum(1, 2, 3);        // 6
sum(1, 2, 3, 4, 5);  // 15
```

### 2. Closure

**Definición:**
- Función que "recuerda" variables de su scope externo

**Ejemplo:**
```javascript
const authorizeRoles = (...allowedRoles) => {
  // allowedRoles está en el scope externo
  
  return (req, res, next) => {
    // Esta función "recuerda" allowedRoles
    if (!allowedRoles.includes(req.user.role)) {
      // Usa allowedRoles del scope externo
    }
  };
};
```

### 3. Códigos HTTP

```
401 Unauthorized = No autenticado
403 Forbidden = Autenticado pero sin permisos
```

---

## 🚀 Casos de Uso Avanzados

### Sistema de Roles Completo

```typescript
// Definir roles
enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  PREMIUM = 'premium',
  USER = 'user'
}

// Rutas con diferentes niveles
router.post('/admin/settings',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  updateSettings
);

router.delete('/posts/:id',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.MODERATOR),
  deletePost
);

router.get('/premium-content',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.PREMIUM),
  getPremiumContent
);

router.get('/profile',
  authenticate,
  // Todos los usuarios autenticados
  getProfile
);
```

---

## ✅ Mejores Prácticas

### 1. Siempre Usar con authenticate

```typescript
// ❌ Incorrecto
router.get('/route', authorizeRoles('admin'), controller);

// ✅ Correcto
router.get('/route', authenticate, authorizeRoles('admin'), controller);
```

### 2. Orden de Middlewares

```typescript
router.get('/route',
  authenticate,        // 1. Autenticación
  authorizeRoles(...), // 2. Autorización
  controller           // 3. Lógica de negocio
);
```

### 3. Usar Enums para Roles

```typescript
// ❌ Strings mágicos
authorizeRoles('admin', 'moderator')

// ✅ Enums
enum Role {
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

authorizeRoles(Role.ADMIN, Role.MODERATOR)
```

---

## 🔧 Posibles Mejoras

### 1. Logging de Intentos

```typescript
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Agregar logging
      console.warn(`Acceso denegado: ${req.user.email} (${req.user.role}) intentó acceder a ruta que requiere: ${allowedRoles.join(', ')}`);
      
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
      });
      return;
    }

    next();
  };
};
```

### 2. Mensajes Personalizados

```typescript
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Esta acción requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
        requiredRoles: allowedRoles,
        currentRole: req.user.role
      });
      return;
    }

    next();
  };
};
```

---

## 📝 Resumen

**Propósito:**
- Autorizar acceso basado en múltiples roles
- Más flexible que `admin.middleware`

**Funcionamiento:**
1. Recibe lista de roles permitidos
2. Retorna middleware configurado
3. Verifica que usuario esté autenticado
4. Verifica que rol esté en lista permitida
5. Continúa o rechaza

**Ventajas:**
- ✅ Flexible: Múltiples roles por ruta
- ✅ Reutilizable: Una función para todos los casos
- ✅ Claro: Roles explícitos en cada ruta

**Uso:**
```typescript
router.get('/route',
  authenticate,
  authorizeRoles('admin', 'moderator'),
  controller
);
```

---

¡Documentación completa del middleware de autorización! Este es el control de acceso flexible que permite múltiples niveles de permisos. 🎫🔐

