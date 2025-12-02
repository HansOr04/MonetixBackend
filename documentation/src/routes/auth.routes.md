# Documentación ULTRA Didáctica: auth.routes.ts

**Ubicación:** `src/routes/auth.routes.ts`

**Propósito:** Este archivo define las **rutas de autenticación** del sistema. Maneja el registro de nuevos usuarios, login (inicio de sesión) y obtención del usuario actual. Es la **puerta de entrada** al sistema - sin estas rutas, nadie podría acceder a la aplicación.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina la entrada de un edificio:

```
Sin rutas de autenticación:
- No hay forma de registrarse
- No hay forma de hacer login
- No se puede verificar quién eres
→ Sistema inaccesible

Con rutas de autenticación:
POST /register → Crear cuenta nueva
POST /login → Iniciar sesión (obtener token)
GET /me → Verificar quién soy
→ Sistema accesible y seguro
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (líneas 1-5)             │
│  ├─ Router de Express                   │
│  ├─ Controladores de auth               │
│  ├─ Middleware de validación            │
│  ├─ Middleware de autenticación         │
│  └─ Schemas de validación               │
├──────────────────────────────────────────┤
│  INICIALIZACIÓN (línea 7)               │
│  └─ Crear instancia de Router           │
├──────────────────────────────────────────┤
│  RUTAS (líneas 9-13)                    │
│  ├─ POST /login (iniciar sesión)        │
│  ├─ POST /register (registrarse)        │
│  └─ GET /me (usuario actual)            │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (línea 15)                 │
│  └─ Exportar router                     │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

### Líneas 1-5: Importaciones

```typescript
import { Router } from "express";
import { login,register,getCurrentUser } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";
```

**Línea 1: Router**
- Constructor para crear rutas en Express

**Línea 2: Controladores**
- `login`: Maneja inicio de sesión
- `register`: Maneja registro de usuarios
- `getCurrentUser`: Obtiene datos del usuario autenticado

**Línea 3: validate**
- Middleware para validar datos con Joi
- Verifica que los datos cumplan reglas

**Línea 4: authenticate**
- Middleware para verificar JWT
- Protege rutas que requieren autenticación

**Línea 5: Schemas de validación**
- `loginSchema`: Reglas para login (email, password)
- `registerSchema`: Reglas para registro (email, password, name)

---

### Línea 7: Inicialización

```typescript
const router = Router();
```

**¿Qué hace?**
- Crea una instancia de Router
- Permite definir rutas de autenticación

---

## 🔷 RUTAS DEFINIDAS

### Ruta 1: POST /login (Línea 9)

```typescript
router.post("/login", validate(loginSchema), login);
```

**Endpoint completo:**
```
POST /api/auth/login
```

**¿Qué hace?**
- Permite a usuarios **iniciar sesión**
- Verifica credenciales (email + password)
- Retorna **token JWT** si es válido

**Middlewares:**
1. `validate(loginSchema)`: Valida email y password

**Controlador:**
- `login`: Verifica credenciales y genera token

**Schema de validación:**
```typescript
// loginSchema
{
  email: Joi.string().email().required(),
  password: Joi.string().required()
}
```

**Ejemplo de request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ejemplo de response exitoso:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMTkxZTgxMGMxOTcyOWRlODYwZWEiLCJyb2xlIjoidXNlciIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwNjA0ODAwfQ.signature",
  "user": {
    "_id": "507f191e810c19729de860ea",
    "email": "user@example.com",
    "name": "Juan Pérez",
    "role": "user"
  }
}
```

**Ejemplo de response con error:**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

**Flujo completo:**
```
1. Cliente envía email + password
2. validate(loginSchema) verifica formato
3. login() busca usuario por email
4. Compara password con hash (bcrypt)
5. Si coincide, genera token JWT
6. Retorna token + datos de usuario
```

---

### Ruta 2: POST /register (Línea 11)

```typescript
router.post("/register", validate(registerSchema), register);
```

**Endpoint completo:**
```
POST /api/auth/register
```

**¿Qué hace?**
- Permite **crear una cuenta nueva**
- Valida datos del usuario
- Hashea la contraseña automáticamente
- Retorna token JWT

**Middlewares:**
1. `validate(registerSchema)`: Valida email, password y name

**Controlador:**
- `register`: Crea usuario y genera token

**Schema de validación:**
```typescript
// registerSchema
{
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required()
}
```

**Ejemplo de request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Juan Pérez"
}
```

**Ejemplo de response exitoso:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f191e810c19729de860ea",
    "email": "newuser@example.com",
    "name": "Juan Pérez",
    "role": "user",
    "createdAt": "2025-11-27T..."
  }
}
```

**Ejemplo de response con error:**
```json
{
  "success": false,
  "message": "El email ya está registrado"
}
```

**Flujo completo:**
```
1. Cliente envía email, password, name
2. validate(registerSchema) verifica formato
3. register() verifica que email no exista
4. Crea usuario (password hasheada automáticamente)
5. Genera token JWT
6. Retorna token + datos de usuario
```

---

### Ruta 3: GET /me (Línea 13)

```typescript
router.get("/me", authenticate ,getCurrentUser);
```

**Endpoint completo:**
```
GET /api/auth/me
```

**¿Qué hace?**
- Obtiene **datos del usuario autenticado**
- Verifica que el token sea válido
- Retorna información del usuario

**Middlewares:**
1. `authenticate`: Verifica JWT y agrega `req.user`

**Controlador:**
- `getCurrentUser`: Retorna datos del usuario

**Ejemplo de request:**
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo de response exitoso:**
```json
{
  "success": true,
  "user": {
    "_id": "507f191e810c19729de860ea",
    "email": "user@example.com",
    "name": "Juan Pérez",
    "role": "user",
    "createdAt": "2025-11-27T...",
    "updatedAt": "2025-11-27T..."
  }
}
```

**Ejemplo de response con error:**
```json
{
  "success": false,
  "message": "Token inválido o expirado"
}
```

**Flujo completo:**
```
1. Cliente envía token en header Authorization
2. authenticate() verifica token
3. authenticate() agrega req.user
4. getCurrentUser() retorna req.user
```

**Caso de uso:**
```javascript
// Al cargar la aplicación
const checkAuth = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    redirect('/login');
    return;
  }
  
  const response = await fetch('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const { user } = await response.json();
    setCurrentUser(user);
  } else {
    localStorage.removeItem('token');
    redirect('/login');
  }
};
```

---

## 📊 Resumen de Rutas

| Método | Ruta | Descripción | Auth | Validación |
|--------|------|-------------|------|------------|
| POST | `/login` | Iniciar sesión | ❌ | loginSchema |
| POST | `/register` | Registrarse | ❌ | registerSchema |
| GET | `/me` | Usuario actual | ✅ | - |

**Rutas públicas:** `/login`, `/register` (no requieren autenticación)  
**Rutas protegidas:** `/me` (requiere token JWT)

---

## 🔐 Seguridad

### 1. Validación de Datos

**loginSchema:**
```typescript
{
  email: Joi.string().email().required(),
  password: Joi.string().required()
}
```

**Previene:**
```javascript
// ❌ Email inválido
{ email: 'not-an-email', password: '123' }
// Error: "email" must be a valid email

// ❌ Password faltante
{ email: 'user@example.com' }
// Error: "password" is required
```

**registerSchema:**
```typescript
{
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required()
}
```

**Previene:**
```javascript
// ❌ Password muy corta
{ email: 'user@example.com', password: '123', name: 'Juan' }
// Error: "password" length must be at least 8 characters long

// ❌ Nombre muy corto
{ email: 'user@example.com', password: 'password123', name: 'J' }
// Error: "name" length must be at least 2 characters long
```

---

### 2. Hash de Contraseñas

**En el modelo User:**
```typescript
// Middleware pre-save hashea automáticamente
userSchema.pre('save', async function (next){
  if(!this.isModified('password')){
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**Resultado:**
```javascript
// Input
password: 'password123'

// Guardado en BD
password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
```

---

### 3. Tokens JWT

**Generación:**
```typescript
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

**Estructura del token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMTkxZTgxMGMxOTcyOWRlODYwZWEiLCJyb2xlIjoidXNlciIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwNjA0ODAwfQ.signature
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^
Header                           Payload                                                                                   Signature
```

**Payload decodificado:**
```json
{
  "userId": "507f191e810c19729de860ea",
  "role": "user",
  "iat": 1700000000,
  "exp": 1700604800
}
```

---

## 🎯 Flujo Completo de Autenticación

### Registro → Login → Acceso

```
1. REGISTRO
   Cliente → POST /register
   { email, password, name }
         ↓
   Validación (registerSchema)
         ↓
   Crear usuario (password hasheada)
         ↓
   Generar token JWT
         ↓
   Retornar token + usuario
         ↓
   Cliente guarda token

2. LOGIN (sesiones futuras)
   Cliente → POST /login
   { email, password }
         ↓
   Validación (loginSchema)
         ↓
   Buscar usuario por email
         ↓
   Comparar password con hash
         ↓
   Generar token JWT
         ↓
   Retornar token + usuario
         ↓
   Cliente guarda token

3. ACCESO A RECURSOS
   Cliente → GET /api/transactions
   Header: Authorization: Bearer <token>
         ↓
   authenticate() verifica token
         ↓
   Agrega req.user
         ↓
   Controlador usa req.user.id
         ↓
   Retorna datos del usuario
```

---

## 📝 Ejemplo de Uso Completo

### Frontend - Flujo de Autenticación

```javascript
// 1. REGISTRO
const register = async (email, password, name) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  
  if (response.ok) {
    const { token, user } = await response.json();
    localStorage.setItem('token', token);
    setCurrentUser(user);
    redirect('/dashboard');
  } else {
    const { message } = await response.json();
    showError(message);
  }
};

// 2. LOGIN
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (response.ok) {
    const { token, user } = await response.json();
    localStorage.setItem('token', token);
    setCurrentUser(user);
    redirect('/dashboard');
  } else {
    const { message } = await response.json();
    showError(message);
  }
};

// 3. VERIFICAR AUTENTICACIÓN
const checkAuth = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    redirect('/login');
    return;
  }
  
  const response = await fetch('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const { user } = await response.json();
    setCurrentUser(user);
  } else {
    localStorage.removeItem('token');
    redirect('/login');
  }
};

// 4. LOGOUT
const logout = () => {
  localStorage.removeItem('token');
  setCurrentUser(null);
  redirect('/login');
};

// 5. USAR EN REQUESTS
const fetchTransactions = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/transactions', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { data } = await response.json();
  setTransactions(data);
};
```

---

## ✅ Mejores Prácticas

### 1. Guardar Token de Forma Segura

```javascript
// ✅ localStorage (simple, común)
localStorage.setItem('token', token);

// ✅ sessionStorage (más seguro, expira al cerrar pestaña)
sessionStorage.setItem('token', token);

// ✅ Cookie httpOnly (más seguro, no accesible desde JS)
// Requiere configuración en backend
```

### 2. Incluir Token en Todas las Requests

```javascript
// ✅ Crear función helper
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
};

// Uso
const response = await fetchWithAuth('/api/transactions');
```

### 3. Manejar Expiración de Token

```javascript
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Token expirado
  if (response.status === 401) {
    localStorage.removeItem('token');
    redirect('/login');
    return;
  }
  
  return response;
};
```

### 4. Validar Antes de Enviar

```javascript
const login = async (email, password) => {
  // Validación en frontend
  if (!email || !password) {
    showError('Email y contraseña son requeridos');
    return;
  }
  
  if (password.length < 8) {
    showError('La contraseña debe tener al menos 8 caracteres');
    return;
  }
  
  // Enviar a backend
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  // ...
};
```

---

## 📝 Resumen

**Propósito:**
- Definir rutas de autenticación
- Manejar registro, login y verificación de usuario

**Rutas:**
- `POST /login`: Iniciar sesión (retorna token)
- `POST /register`: Crear cuenta (retorna token)
- `GET /me`: Obtener usuario actual (requiere token)

**Seguridad:**
- Validación con Joi (loginSchema, registerSchema)
- Hash de contraseñas con bcrypt
- Tokens JWT con expiración (7 días)
- Middleware authenticate para rutas protegidas

**Flujo:**
```
Registro/Login → Token JWT → Guardar token → Usar en requests
```

**Patrón:**
```typescript
router.post('/ruta', validate(schema), controlador);
router.get('/ruta', authenticate, controlador);
```

---

¡Documentación completa de las rutas de autenticación! Este es el sistema de acceso y seguridad. 🔐🚪

