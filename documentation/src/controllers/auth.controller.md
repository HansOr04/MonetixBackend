# Documentación: auth.controller.ts

**Ubicación:** `src/controllers/auth.controller.ts`

**Propósito:** Este archivo define el controlador de autenticación que maneja las operaciones de login, registro y obtención del usuario actual. Es responsable de la autenticación JWT (JSON Web Tokens) y la gestión de sesiones de usuario.

---

## Análisis Línea por Línea

### Líneas 1-4: Importaciones

```typescript
import { Request, Response } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { User } from '../models/User.model';
import { Types } from 'mongoose';
```

#### Línea 1: Importación de tipos de Express
```typescript
import { Request, Response } from 'express';
```

**¿Qué hace?**
- Importa los tipos `Request` y `Response` de Express
- Misma función que en `alert.controller.ts`
- Proporciona tipado TypeScript para las solicitudes y respuestas HTTP

**¿Por qué se usa?**
- Permite autocompletado y verificación de tipos
- Mejora la experiencia de desarrollo
- Previene errores de tipo en tiempo de compilación

---

#### Línea 2: Importación de jsonwebtoken
```typescript
import jwt, { Secret } from 'jsonwebtoken';
```

**¿Qué hace?**
- **`jwt`**: Importación default de la librería `jsonwebtoken`
- **`Secret`**: Tipo TypeScript que representa el secreto usado para firmar tokens
- **jsonwebtoken** es una librería para crear y verificar JSON Web Tokens (JWT)

**¿Qué es JWT?**
- **JSON Web Token**: Estándar abierto (RFC 7519) para transmitir información de forma segura
- Estructura: `header.payload.signature`
- Usado para autenticación stateless (sin estado en el servidor)
- El servidor no necesita almacenar sesiones, todo está en el token

**¿Por qué usar JWT?**
- **Stateless**: No requiere almacenar sesiones en el servidor
- **Escalable**: Funciona bien en arquitecturas distribuidas
- **Portable**: Puede usarse entre diferentes dominios
- **Seguro**: Firmado criptográficamente para prevenir manipulación

**Ejemplo de JWT:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoidXNlciJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

Decodificado:
```json
// Header
{ "alg": "HS256", "typ": "JWT" }

// Payload
{ "userId": "123", "role": "user", "exp": 1234567890 }

// Signature (verificación)
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

---

#### Línea 3: Importación del modelo User
```typescript
import { User } from '../models/User.model';
```

**¿Qué hace?**
- Importa el modelo `User` de Mongoose
- Representa la estructura de usuarios en MongoDB

**¿Qué contiene el modelo User?**
Típicamente incluye:
- `email`: Email del usuario (único)
- `password`: Contraseña hasheada (nunca en texto plano)
- `name`: Nombre del usuario
- `role`: Rol del usuario (user, admin, etc.)
- `createdAt`: Fecha de creación
- Métodos como `comparePassword()`: Compara contraseñas hasheadas

**¿Por qué se usa?**
- Permite realizar operaciones CRUD en la colección de usuarios
- Proporciona métodos de instancia como `comparePassword()`
- Maneja el hashing automático de contraseñas

---

#### Línea 4: Importación de Types de Mongoose
```typescript
import { Types } from 'mongoose';
```

**¿Qué hace?**
- Importa el objeto `Types` de Mongoose
- Contiene tipos y utilidades de Mongoose

**¿Para qué se usa en este archivo?**
- **`Types.ObjectId`**: Tipo para los IDs de MongoDB
- Se usa para hacer casting de tipos TypeScript: `user._id as Types.ObjectId`

**¿Por qué es necesario?**
- TypeScript necesita saber que `_id` es un ObjectId
- Permite usar métodos como `.toString()` de forma segura

---

### Línea 5: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa las importaciones de las funciones
- Mejora la legibilidad del código

---

### Líneas 6-12: Función getJwtSecret

```typescript
const getJwtSecret = (): Secret => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  return secret as Secret;
};
```

#### Línea 6: Declaración de la función
```typescript
const getJwtSecret = (): Secret => {
```

**¿Qué hace?**
- **`const getJwtSecret`**: Declara una función constante
- **`(): Secret`**: No recibe parámetros, retorna un `Secret`
- **Arrow function**: Sintaxis moderna de JavaScript (ES6)

**¿Por qué crear esta función?**
- **Reutilización**: El secreto se usa en múltiples lugares (login, register)
- **Validación centralizada**: Verifica que JWT_SECRET exista en un solo lugar
- **Seguridad**: Lanza error si el secreto no está configurado
- **Type safety**: Garantiza que siempre retorna un Secret válido

---

#### Línea 7: Obtención del secreto
```typescript
const secret = process.env.JWT_SECRET;
```

**¿Qué hace?**
- **`process.env.JWT_SECRET`**: Accede a la variable de entorno `JWT_SECRET`
- **`process.env`**: Objeto que contiene todas las variables de entorno

**¿Qué es JWT_SECRET?**
- Una cadena secreta usada para firmar y verificar tokens JWT
- Debe ser una cadena aleatoria y compleja
- **NUNCA** debe estar hardcodeada en el código
- Debe mantenerse en secreto (no subir al repositorio)

**Ejemplo en .env:**
```env
JWT_SECRET=mi_super_secreto_aleatorio_y_complejo_12345!@#$%
```

**¿Por qué es importante?**
- Si alguien obtiene el secreto, puede crear tokens válidos
- Puede suplantar a cualquier usuario
- Compromete toda la seguridad de la aplicación

---

#### Líneas 8-10: Validación del secreto
```typescript
if (!secret) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno');
}
```

**¿Qué hace?**
- **`if (!secret)`**: Verifica si el secreto es `null`, `undefined`, o string vacío
- **`throw new Error()`**: Lanza un error que detiene la ejecución

**¿Por qué lanzar un error?**
- **Fail-fast**: Es mejor fallar inmediatamente que continuar sin seguridad
- **Visibilidad**: El error es claro y fácil de diagnosticar
- **Prevención**: Previene que la aplicación funcione sin autenticación adecuada

**¿Cuándo se ejecuta?**
- Al iniciar la aplicación, cuando se intenta hacer login/register
- Si el archivo `.env` no tiene `JWT_SECRET` definido
- Si la variable de entorno no se cargó correctamente

---

#### Línea 11: Retorno del secreto
```typescript
return secret as Secret;
```

**¿Qué hace?**
- **`return secret`**: Retorna el secreto
- **`as Secret`**: Type assertion de TypeScript
  - Le dice a TypeScript: "confía en mí, esto es un Secret"

**¿Por qué usar `as Secret`?**
- `process.env.JWT_SECRET` tiene tipo `string | undefined`
- Ya validamos que no es `undefined` en la línea 8
- TypeScript no puede inferir esto automáticamente
- El casting es seguro porque ya verificamos que existe

---

#### Línea 12: Cierre de la función
```typescript
};
```

**¿Qué hace?**
- Cierra la función `getJwtSecret`

---

### Línea 13: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la función auxiliar de las funciones principales del controlador

---

### Líneas 14-67: Función login

```typescript
export const login = async (req: Request, res: Response): Promise<void> => {
```

#### Línea 14: Declaración de la función login
**¿Qué hace?**
- **`export const`**: Exporta la función para que pueda ser importada en las rutas
- **`login`**: Nombre de la función
- **`async`**: Función asíncrona (puede usar `await`)
- **`(req: Request, res: Response)`**: Parámetros tipados
- **`: Promise<void>`**: Retorna una promesa que no devuelve valor
  - Usa `res.json()` para enviar la respuesta, no retorna datos

**¿Por qué Promise<void>?**
- La función no retorna un valor, solo envía respuestas HTTP
- `res.json()` maneja el envío de datos al cliente

---

#### Línea 15: Inicio del bloque try
```typescript
try {
```

**¿Qué hace?**
- Inicia el manejo de errores con try-catch
- Captura errores de base de datos, validación, etc.

---

#### Línea 16: Extracción de credenciales
```typescript
const { email, password } = req.body;
```

**¿Qué hace?**
- **Destructuring**: Extrae `email` y `password` del cuerpo de la solicitud
- **`req.body`**: Objeto que contiene los datos enviados por el cliente
  - Poblado por middleware como `express.json()`

**Ejemplo de request:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "miContraseña123"
}
```

Resulta en:
```javascript
email = "usuario@example.com"
password = "miContraseña123"
```

**¿Por qué no validar aquí?**
- La validación debería hacerse en un middleware previo (usando Joi, Zod, etc.)
- Separa responsabilidades: validación vs. lógica de negocio

---

#### Línea 17: Línea en blanco
```typescript

```
**¿Qué hace?**
- Mejora la legibilidad separando la extracción de datos de la lógica

---

#### Línea 18: Búsqueda del usuario
```typescript
const user = await User.findOne({ email });
```

**¿Qué hace?**
- **`User.findOne()`**: Método de Mongoose que busca un solo documento
- **`{ email }`**: Filtro - busca un usuario con ese email
  - Sintaxis abreviada de ES6: equivalente a `{ email: email }`
- **`await`**: Espera a que la búsqueda se complete
- **`user`**: Variable que contiene el usuario encontrado o `null`

**¿Por qué buscar por email?**
- El email es único en el sistema (definido en el modelo)
- Es el identificador principal para login
- No se puede tener dos usuarios con el mismo email

**Resultado:**
```javascript
// Si encuentra el usuario
user = {
  _id: ObjectId("507f1f77bcf86cd799439011"),
  email: "usuario@example.com",
  password: "$2b$10$hashedpassword...",
  name: "Juan Pérez",
  role: "user"
}

// Si no encuentra el usuario
user = null
```

---

#### Línea 19: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la búsqueda de la validación

---

#### Líneas 20-26: Validación de existencia del usuario
```typescript
if (!user) {
  res.status(401).json({
    success: false,
    message: 'Credenciales inválidas',
  });
  return;
}
```

**¿Qué hace?**
- **`if (!user)`**: Verifica si el usuario NO existe (es `null`)
- **`res.status(401)`**: Código 401 (Unauthorized - No autorizado)
- **`message: 'Credenciales inválidas'`**: Mensaje genérico de error
- **`return`**: Termina la ejecución de la función

**¿Por qué 401 en lugar de 404?**
- **401 (Unauthorized)**: Problema de autenticación
- **404 (Not Found)**: Recurso no encontrado
- En login, es un problema de autenticación, no de recurso

**¿Por qué mensaje genérico?**
- **Seguridad**: No revelar si el email existe o no
- Previene enumeración de usuarios
- Un atacante no puede saber si el email está registrado

**Mala práctica (revela información):**
```javascript
// ❌ NO HACER ESTO
if (!user) {
  return res.status(404).json({ message: 'Email no registrado' });
}
if (!isPasswordValid) {
  return res.status(401).json({ message: 'Contraseña incorrecta' });
}
```

**Buena práctica (mensaje genérico):**
```javascript
// ✅ HACER ESTO
if (!user || !isPasswordValid) {
  return res.status(401).json({ message: 'Credenciales inválidas' });
}
```

---

#### Línea 27: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la validación de usuario de la validación de contraseña

---

#### Línea 28: Verificación de contraseña
```typescript
const isPasswordValid = await user.comparePassword(password);
```

**¿Qué hace?**
- **`user.comparePassword()`**: Método de instancia del modelo User
- **`password`**: Contraseña en texto plano enviada por el cliente
- **`await`**: Espera a que la comparación se complete (es asíncrona)
- **`isPasswordValid`**: Booleano - `true` si coincide, `false` si no

**¿Qué hace comparePassword internamente?**
```typescript
// En User.model.ts
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

**¿Cómo funciona bcrypt.compare?**
1. Toma la contraseña en texto plano
2. Extrae el salt del hash almacenado
3. Hashea la contraseña con el mismo salt
4. Compara los hashes
5. Retorna `true` si coinciden, `false` si no

**Ejemplo:**
```javascript
// Contraseña almacenada (hasheada)
user.password = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

// Contraseña enviada por el usuario
password = "miContraseña123"

// bcrypt.compare hashea "miContraseña123" con el mismo salt y compara
isPasswordValid = true // Si coinciden
isPasswordValid = false // Si no coinciden
```

**¿Por qué es asíncrono?**
- Bcrypt es computacionalmente intensivo (por diseño, para seguridad)
- Evita bloquear el event loop de Node.js
- Permite que otras operaciones continúen mientras se hashea

---

#### Línea 29: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la verificación de contraseña de la validación

---

#### Líneas 30-36: Validación de contraseña
```typescript
if (!isPasswordValid) {
  res.status(401).json({
    success: false,
    message: 'Credenciales inválidas',
  });
  return;
}
```

**¿Qué hace?**
- **`if (!isPasswordValid)`**: Verifica si la contraseña NO es válida
- **`res.status(401)`**: Código 401 (Unauthorized)
- **`message: 'Credenciales inválidas'`**: Mismo mensaje genérico que antes
- **`return`**: Termina la ejecución

**¿Por qué el mismo mensaje?**
- **Seguridad**: No revelar si el problema es el email o la contraseña
- Previene ataques de enumeración
- Mantiene consistencia en los mensajes de error

---

#### Línea 37: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la validación de la generación del token

---

#### Líneas 38-45: Generación del token JWT
```typescript
const token = jwt.sign(
  { 
    userId: (user._id as Types.ObjectId).toString(), 
    role: user.role 
  },
  getJwtSecret(),
  { expiresIn: '7d' }
);
```

**¿Qué hace?**
- **`jwt.sign()`**: Método que crea y firma un token JWT
- Recibe 3 parámetros: payload, secret, opciones

#### Parámetro 1: Payload (Líneas 39-42)
```typescript
{ 
  userId: (user._id as Types.ObjectId).toString(), 
  role: user.role 
}
```

**¿Qué es el payload?**
- Datos que se incluyen en el token
- Serán accesibles al decodificar el token
- **NO** están encriptados, solo codificados en Base64
- **NUNCA** incluir información sensible (contraseñas, números de tarjeta, etc.)

**¿Qué contiene?**
- **`userId`**: ID del usuario como string
  - `(user._id as Types.ObjectId)`: Casting de tipo
  - `.toString()`: Convierte ObjectId a string
- **`role`**: Rol del usuario ('user', 'admin', etc.)

**¿Por qué convertir _id a string?**
- ObjectId es un objeto complejo de MongoDB
- JWT solo acepta tipos primitivos (string, number, boolean)
- `.toString()` convierte `ObjectId("507f...")` a `"507f..."`

**Ejemplo de payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "user"
}
```

#### Parámetro 2: Secret (Línea 43)
```typescript
getJwtSecret(),
```

**¿Qué hace?**
- Llama a la función `getJwtSecret()` que definimos antes
- Retorna el secreto de las variables de entorno
- Se usa para firmar el token criptográficamente

**¿Por qué es importante?**
- La firma garantiza que el token no ha sido manipulado
- Solo quien tiene el secreto puede crear tokens válidos
- El servidor puede verificar la autenticidad del token

#### Parámetro 3: Opciones (Línea 44)
```typescript
{ expiresIn: '7d' }
```

**¿Qué hace?**
- **`expiresIn`**: Tiempo de expiración del token
- **`'7d'`**: 7 días (también se puede usar '1h', '30m', '1y', etc.)

**¿Por qué expira?**
- **Seguridad**: Limita el tiempo que un token robado es válido
- **Mejores prácticas**: Tokens de larga duración son riesgosos
- **Refresh tokens**: En producción, se usan tokens de corta duración + refresh tokens

**Formatos de tiempo:**
```javascript
'60s'   // 60 segundos
'5m'    // 5 minutos
'2h'    // 2 horas
'7d'    // 7 días
'1y'    // 1 año
```

**Token generado:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJyb2xlIjoidXNlciIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwNjA0ODAwfQ.signature
```

Decodificado:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "user",
  "iat": 1700000000,  // Issued at (cuándo se creó)
  "exp": 1700604800   // Expiration (cuándo expira)
}
```

---

#### Línea 46: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la generación del token de la respuesta

---

#### Líneas 47-59: Respuesta exitosa
```typescript
res.status(200).json({
  success: true,
  message: 'Login exitoso',
  data: {
    token,
    user: {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
  },
});
```

**¿Qué hace?**
- **`res.status(200)`**: Código 200 (OK - éxito)
- **`success: true`**: Indica que el login fue exitoso
- **`message`**: Mensaje descriptivo
- **`data`**: Objeto con el token y datos del usuario

**¿Qué contiene data?**
- **`token`**: JWT generado (el cliente lo guardará)
- **`user`**: Información del usuario (sin la contraseña)
  - `id`: ID del usuario como string
  - `email`: Email del usuario
  - `name`: Nombre del usuario
  - `role`: Rol del usuario

**¿Por qué NO incluir la contraseña?**
- **Seguridad**: Nunca enviar contraseñas (ni hasheadas) al cliente
- **Privacidad**: La contraseña no es necesaria en el frontend
- **Mejores prácticas**: Minimizar exposición de datos sensibles

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "usuario@example.com",
      "name": "Juan Pérez",
      "role": "user"
    }
  }
}
```

**¿Cómo usa el cliente el token?**
```javascript
// Frontend guarda el token
localStorage.setItem('token', data.token);

// En futuras peticiones, lo envía en el header
fetch('/api/alerts', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

#### Líneas 60-66: Manejo de errores
```typescript
} catch (error) {
  console.error('Error en login:', error);
  res.status(500).json({
    success: false,
    message: 'Error al iniciar sesión',
  });
}
```

**¿Qué hace?**
- Captura cualquier error no manejado
- Log del error en la consola
- Respuesta 500 (Internal Server Error)

**¿Cuándo se ejecuta?**
- Error de conexión a la base de datos
- Error en bcrypt.compare
- Error al generar el token
- Cualquier excepción inesperada

**Nota de seguridad:**
- No se envía el detalle del error al cliente
- Previene filtración de información del sistema
- En producción, los errores se loguean en herramientas de monitoreo

---

#### Línea 67: Cierre de la función
```typescript
};
```

**¿Qué hace?**
- Cierra la función `login`

---

### Líneas 69-121: Función register

```typescript
export const register = async (req: Request, res: Response): Promise<void> => {
```

#### Línea 69: Declaración de la función register
**¿Qué hace?**
- Similar a `login`
- Función para registrar nuevos usuarios
- Asíncrona, recibe Request y Response, retorna Promise<void>

---

#### Línea 70: Inicio del bloque try
```typescript
try {
```

**¿Qué hace?**
- Inicia el manejo de errores

---

#### Línea 71: Extracción de datos del usuario
```typescript
const { email, password, name, role } = req.body;
```

**¿Qué hace?**
- Extrae los datos del nuevo usuario del cuerpo de la solicitud
- **`email`**: Email del usuario (será único)
- **`password`**: Contraseña en texto plano (será hasheada)
- **`name`**: Nombre del usuario
- **`role`**: Rol del usuario (opcional)

**Ejemplo de request:**
```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "nuevo@example.com",
  "password": "contraseñaSegura123",
  "name": "María García",
  "role": "user"
}
```

---

#### Línea 72: Línea en blanco
```typescript

```
**¿Qué hace?**
- Mejora la legibilidad

---

#### Línea 73: Verificación de email existente
```typescript
const existingUser = await User.findOne({ email });
```

**¿Qué hace?**
- **`User.findOne({ email })`**: Busca si ya existe un usuario con ese email
- **`existingUser`**: Será el usuario si existe, o `null` si no existe

**¿Por qué verificar?**
- El email debe ser único en el sistema
- Previene duplicados
- Aunque el modelo tenga índice único, es mejor validar explícitamente

**Flujo:**
```javascript
// Si el email ya existe
existingUser = { _id: '...', email: 'nuevo@example.com', ... }

// Si el email no existe
existingUser = null
```

---

#### Línea 74: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la búsqueda de la validación

---

#### Líneas 75-81: Validación de email duplicado
```typescript
if (existingUser) {
  res.status(400).json({
    success: false,
    message: 'El email ya está registrado',
  });
  return;
}
```

**¿Qué hace?**
- **`if (existingUser)`**: Verifica si el email ya está en uso
- **`res.status(400)`**: Código 400 (Bad Request - solicitud incorrecta)
- **`message`**: Mensaje claro indicando el problema
- **`return`**: Termina la ejecución

**¿Por qué 400 en lugar de 409?**
- **400 (Bad Request)**: Datos de entrada inválidos
- **409 (Conflict)**: Conflicto con el estado actual (también válido)
- Ambos son aceptables, 400 es más común

**Consideración de seguridad:**
- Este mensaje revela que el email existe
- En algunos casos, esto puede ser un problema de privacidad
- Depende de los requisitos del negocio

**Alternativa más segura:**
```javascript
// No revela si el email existe
if (existingUser) {
  res.status(400).json({
    message: 'No se pudo completar el registro'
  });
}
```

---

#### Línea 82: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la validación de la creación del usuario

---

#### Líneas 83-88: Creación del nuevo usuario
```typescript
const user = new User({
  email,
  password,
  name,
  role: role || 'user',
});
```

**¿Qué hace?**
- **`new User()`**: Crea una nueva instancia del modelo User
- **`email`**: Email del usuario
- **`password`**: Contraseña en texto plano (será hasheada automáticamente)
- **`name`**: Nombre del usuario
- **`role: role || 'user'`**: Rol del usuario, por defecto 'user' si no se proporciona

**¿Cómo se hashea la contraseña?**
En el modelo User, hay un middleware de Mongoose:
```typescript
// En User.model.ts
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

**Flujo de hashing:**
1. Usuario envía: `password: "miContraseña123"`
2. Middleware `pre('save')` se ejecuta antes de guardar
3. Genera un salt: `$2b$10$N9qo8uLOickgx2ZMRZoMye`
4. Hashea la contraseña con el salt
5. Guarda el hash: `$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`

**¿Por qué `role || 'user'`?**
- **Operador OR**: Si `role` es `undefined`, `null`, o string vacío, usa `'user'`
- **Valor por defecto**: Todos los usuarios son 'user' por defecto
- **Seguridad**: Previene que alguien se registre como 'admin' sin autorización

**Ejemplo:**
```javascript
// Si se proporciona role
role = 'admin'
user.role = 'admin'

// Si NO se proporciona role
role = undefined
user.role = 'user' // valor por defecto
```

**Nota de seguridad:**
En producción, NO permitir que el cliente especifique el rol:
```typescript
// ✅ Mejor práctica
const user = new User({
  email,
  password,
  name,
  role: 'user', // Siempre 'user', los admins se crean por otro medio
});
```

---

#### Línea 89: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la creación del guardado

---

#### Línea 90: Guardado del usuario en la base de datos
```typescript
await user.save();
```

**¿Qué hace?**
- **`user.save()`**: Método de Mongoose que guarda el documento en MongoDB
- **`await`**: Espera a que la operación se complete
- Ejecuta validaciones del esquema
- Ejecuta middlewares `pre('save')` (como el hashing de contraseña)
- Inserta el documento en la colección

**¿Qué sucede internamente?**
1. Valida los datos según el esquema
2. Ejecuta middleware `pre('save')` (hashea la contraseña)
3. Genera un `_id` automáticamente
4. Inserta el documento en MongoDB
5. Ejecuta middleware `post('save')` si existe
6. Retorna el documento guardado con `_id`

**Posibles errores:**
- **Validación**: Email inválido, campos requeridos faltantes
- **Duplicado**: Email ya existe (índice único)
- **Conexión**: Error de conexión a MongoDB

**Ejemplo de documento guardado:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  email: "nuevo@example.com",
  password: "$2b$10$hashedpassword...",
  name: "María García",
  role: "user",
  createdAt: ISODate("2025-11-27T16:00:00.000Z"),
  updatedAt: ISODate("2025-11-27T16:00:00.000Z")
}
```

---

#### Línea 91: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa el guardado de la generación del token

---

#### Líneas 92-99: Generación del token JWT
```typescript
const token = jwt.sign(
  { 
    userId: (user._id as Types.ObjectId).toString(), 
    role: user.role 
  },
  getJwtSecret(),
  { expiresIn: '7d' }
);
```

**¿Qué hace?**
- Idéntico a la generación de token en `login`
- Crea un JWT con el ID y rol del nuevo usuario
- Expira en 7 días

**¿Por qué generar token en register?**
- **UX mejorada**: El usuario inicia sesión automáticamente después de registrarse
- **Menos pasos**: No necesita hacer login después de registrarse
- **Estándar**: Práctica común en aplicaciones modernas

---

#### Línea 100: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la generación del token de la respuesta

---

#### Líneas 101-113: Respuesta exitosa
```typescript
res.status(201).json({
  success: true,
  message: 'Usuario creado exitosamente',
  data: {
    token,
    user: {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
  },
});
```

**¿Qué hace?**
- **`res.status(201)`**: Código 201 (Created - recurso creado)
- **`success: true`**: Indica éxito
- **`message`**: Mensaje descriptivo
- **`data`**: Token y datos del usuario

**¿Por qué 201 en lugar de 200?**
- **200 (OK)**: Solicitud exitosa (genérico)
- **201 (Created)**: Recurso creado exitosamente (más específico)
- **Semántica HTTP**: 201 es más apropiado para creación de recursos

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "nuevo@example.com",
      "name": "María García",
      "role": "user"
    }
  }
}
```

**Flujo en el frontend:**
```javascript
// 1. Usuario se registra
const response = await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({ email, password, name })
});

// 2. Guarda el token
const { data } = await response.json();
localStorage.setItem('token', data.token);

// 3. Redirige a la aplicación (ya autenticado)
window.location.href = '/dashboard';
```

---

#### Líneas 114-120: Manejo de errores
```typescript
} catch (error) {
  console.error('Error en registro:', error);
  res.status(500).json({
    success: false,
    message: 'Error al registrar usuario',
  });
}
```

**¿Qué hace?**
- Captura errores durante el registro
- Log del error
- Respuesta 500 (Internal Server Error)

**Errores comunes:**
- **Validación de Mongoose**: Campos inválidos
- **Duplicado**: Email ya existe (si no se validó antes)
- **Hashing**: Error en bcrypt
- **Base de datos**: Error de conexión

**Mejora sugerida:**
```typescript
catch (error) {
  console.error('Error en registro:', error);
  
  // Manejo específico de errores de duplicado
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'El email ya está registrado'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Error al registrar usuario'
  });
}
```

---

#### Línea 121: Cierre de la función
```typescript
};
```

**¿Qué hace?**
- Cierra la función `register`

---

### Líneas 123-153: Función getCurrentUser

```typescript
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
```

#### Línea 123: Declaración de la función
**¿Qué hace?**
- Función para obtener los datos del usuario actualmente autenticado
- Útil para verificar el estado de autenticación
- Permite al frontend obtener datos del usuario al cargar la aplicación

---

#### Línea 124: Inicio del bloque try
```typescript
try {
```

**¿Qué hace?**
- Inicia el manejo de errores

---

#### Línea 125: Obtención del usuario
```typescript
const user = req.user;
```

**¿Qué hace?**
- **`req.user`**: Objeto agregado por el middleware de autenticación
- Contiene los datos del usuario autenticado

**¿De dónde viene req.user?**
El middleware de autenticación lo agrega:
```typescript
// En middleware/auth.ts
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // "Bearer token"
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    req.user = user; // ← Aquí se agrega
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'No autorizado' });
  }
};
```

**Flujo completo:**
1. Cliente envía request con header: `Authorization: Bearer eyJhbG...`
2. Middleware extrae y verifica el token
3. Busca el usuario en la base de datos
4. Agrega `req.user` con los datos del usuario
5. Llama a `next()` para continuar al controlador
6. `getCurrentUser` accede a `req.user`

---

#### Línea 126: Línea en blanco
```typescript

```
**¿Qué hace?**
- Mejora la legibilidad

---

#### Líneas 127-133: Validación de autenticación
```typescript
if (!user) {
  res.status(401).json({
    success: false,
    message: 'Usuario no autenticado',
  });
  return;
}
```

**¿Qué hace?**
- **`if (!user)`**: Verifica si el usuario NO está autenticado
- **`res.status(401)`**: Código 401 (Unauthorized)
- **`return`**: Termina la ejecución

**¿Cuándo ocurre esto?**
- El middleware de autenticación falló
- El token es inválido o expiró
- El usuario fue eliminado después de generar el token
- No se envió token en el header

**Nota:**
En la práctica, si el middleware de autenticación funciona correctamente, este bloque nunca debería ejecutarse porque el middleware ya habría retornado 401.

---

#### Línea 134: Línea en blanco
```typescript

```
**¿Qué hace?**
- Separa la validación de la respuesta

---

#### Líneas 135-145: Respuesta exitosa
```typescript
res.status(200).json({
  success: true,
  data: {
    user: {
      id: (user._id as Types.ObjectId).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
  },
});
```

**¿Qué hace?**
- **`res.status(200)`**: Código 200 (OK)
- **`success: true`**: Indica éxito
- **`data.user`**: Datos del usuario autenticado

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "usuario@example.com",
      "name": "Juan Pérez",
      "role": "user"
    }
  }
}
```

**¿Cuándo se usa este endpoint?**
```javascript
// Al cargar la aplicación
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setUser(data.user); // Actualiza el estado del usuario
    })
    .catch(() => {
      // Token inválido, redirigir a login
      localStorage.removeItem('token');
      window.location.href = '/login';
    });
  }
}, []);
```

---

#### Líneas 146-152: Manejo de errores
```typescript
} catch (error) {
  console.error('Error al obtener usuario:', error);
  res.status(500).json({
    success: false,
    message: 'Error al obtener usuario',
  });
}
```

**¿Qué hace?**
- Captura errores inesperados
- Log del error
- Respuesta 500

**¿Cuándo se ejecuta?**
- Error al acceder a propiedades de `user`
- Error en el casting de tipos
- Cualquier excepción inesperada

---

#### Línea 153: Cierre de la función
```typescript
};
```

**¿Qué hace?**
- Cierra la función `getCurrentUser`
- Fin del archivo

---

## Flujo de Autenticación Completo

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Servidor
    participant DB as MongoDB
    participant JWT as JWT Service

    Note over C,JWT: Registro
    C->>S: POST /auth/register {email, password, name}
    S->>DB: Verificar si email existe
    DB-->>S: No existe
    S->>DB: Guardar nuevo usuario (password hasheado)
    DB-->>S: Usuario creado
    S->>JWT: Generar token con userId y role
    JWT-->>S: Token JWT
    S-->>C: 201 {token, user}
    C->>C: Guardar token en localStorage

    Note over C,JWT: Login
    C->>S: POST /auth/login {email, password}
    S->>DB: Buscar usuario por email
    DB-->>S: Usuario encontrado
    S->>S: Comparar password con bcrypt
    S->>JWT: Generar token
    JWT-->>S: Token JWT
    S-->>C: 200 {token, user}
    C->>C: Guardar token en localStorage

    Note over C,JWT: Peticiones Autenticadas
    C->>S: GET /api/alerts (Header: Bearer token)
    S->>JWT: Verificar token
    JWT-->>S: Token válido, userId extraído
    S->>DB: Buscar usuario por userId
    DB-->>S: Usuario encontrado
    S->>S: req.user = usuario
    S->>DB: Obtener alertas del usuario
    DB-->>S: Alertas
    S-->>C: 200 {alertas}
```

---

## Resumen de Funciones

| Función | Ruta | Descripción | Retorna |
|---------|------|-------------|---------|
| `login` | POST /auth/login | Autentica usuario con email y password | Token JWT + datos usuario |
| `register` | POST /auth/register | Registra nuevo usuario | Token JWT + datos usuario |
| `getCurrentUser` | GET /auth/me | Obtiene datos del usuario autenticado | Datos del usuario |

---

## Dependencias

### Externas
- **express**: Framework web
  - `Request`, `Response`: Tipos para solicitudes y respuestas
- **jsonwebtoken**: Librería para JWT
  - `jwt.sign()`: Crea y firma tokens
  - `Secret`: Tipo para el secreto
- **mongoose**: ODM para MongoDB
  - `Types.ObjectId`: Tipo para IDs de MongoDB

### Internas
- **User** (`../models/User.model`): Modelo de usuario
  - Métodos: `findOne()`, `save()`, `comparePassword()`

---

## Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `JWT_SECRET` | Secreto para firmar tokens JWT | `mi_secreto_super_seguro_123!@#` |

**Archivo .env:**
```env
JWT_SECRET=mi_secreto_super_seguro_y_aleatorio_12345!@#$%
```

**Generación de secreto seguro:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64
```

---

## Seguridad Implementada

✅ **Hashing de contraseñas**: Bcrypt con salt automático  
✅ **JWT**: Tokens firmados criptográficamente  
✅ **Mensajes genéricos**: No revela si email o password es incorrecto  
✅ **Expiración de tokens**: Tokens expiran en 7 días  
✅ **No exponer contraseñas**: Nunca se envían al cliente  
✅ **Validación de secreto**: Error si JWT_SECRET no está definido  

---

## Mejores Prácticas Implementadas

✅ **Try-catch**: Manejo de errores en todas las funciones  
✅ **Códigos HTTP apropiados**: 200, 201, 400, 401, 500  
✅ **Respuestas consistentes**: Formato `{ success, message, data }`  
✅ **Validación de duplicados**: Verifica email antes de crear usuario  
✅ **Valores por defecto**: Role por defecto es 'user'  
✅ **Type safety**: Casting apropiado de ObjectId a string  

---

## Posibles Mejoras

### 1. Refresh Tokens
```typescript
// Tokens de corta duración + refresh tokens
const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });
const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });

// Guardar refresh token en BD
await RefreshToken.create({ userId, token: refreshToken });
```

### 2. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: 'Demasiados intentos de login'
});

router.post('/login', loginLimiter, login);
```

### 3. Validación de entrada
```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres')
});

// En el controlador
const { email, password } = loginSchema.parse(req.body);
```

### 4. Verificación de email
```typescript
// Enviar email de verificación al registrarse
const verificationToken = crypto.randomBytes(32).toString('hex');
await sendVerificationEmail(user.email, verificationToken);

// Usuario debe verificar email antes de poder usar la cuenta
user.emailVerified = false;
user.verificationToken = verificationToken;
```

### 5. Logout con blacklist
```typescript
// Invalidar tokens al hacer logout
export const logout = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  // Agregar token a blacklist
  await TokenBlacklist.create({ token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
  
  res.json({ success: true, message: 'Logout exitoso' });
};
```

### 6. Protección contra timing attacks
```typescript
// Usar tiempo constante para comparaciones
import { timingSafeEqual } from 'crypto';

// En lugar de comparar directamente
if (!user || !await user.comparePassword(password)) {
  // Siempre toma el mismo tiempo, previene timing attacks
  await bcrypt.compare(password, '$2b$10$dummyhash');
  return res.status(401).json({ message: 'Credenciales inválidas' });
}
```
