# Documentación ULTRA Didáctica: auth.middleware.ts

**Ubicación:** `src/middlewares/auth.middleware.ts`

**Propósito:** Este archivo es el **"verificador de identidad"** del sistema. Valida tokens JWT (JSON Web Tokens) para autenticar usuarios en cada solicitud. Es como un guardia que verifica tu credencial antes de dejarte entrar. Sin este middleware, cualquiera podría acceder a datos privados.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina un edificio con tarjeta de acceso:

```
❌ Sin autenticación:
Cualquiera puede:
- Ver transacciones de otros
- Modificar metas ajenas
- Acceder a datos privados
→ ¡Caos total!

✅ Con autenticación JWT:
Solo usuarios autenticados pueden:
- Ver sus propios datos
- Modificar su información
- Acceder a sus recursos
→ Sistema seguro ✅
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (líneas 1-3)             │
├──────────────────────────────────────────┤
│  FUNCIÓN getJwtSecret (líneas 5-11)     │
│  └─ Obtiene JWT_SECRET del .env         │
├──────────────────────────────────────────┤
│  INTERFACE JwtPayload (líneas 13-16)    │
│  └─ Define estructura del token         │
├──────────────────────────────────────────┤
│  MIDDLEWARE authenticate (líneas 18-57) │
│  ├─ Extraer token del header            │
│  ├─ Verificar token                     │
│  ├─ Buscar usuario en BD                │
│  ├─ Agregar usuario a req               │
│  └─ Manejo de errores                   │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

### Líneas 1-3: Importaciones

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { User } from '../models/User.model';
```

**¿Qué importa?**

**Línea 1: Express**
- **`Request, Response, NextFunction`**: Tipos de TypeScript para Express

**Línea 2: jsonwebtoken**
- **`jwt`**: Librería para trabajar con JWT
- **`Secret`**: Tipo para la clave secreta

**Línea 3: Modelo de Usuario**
- **`User`**: Modelo de Mongoose para buscar usuarios en BD

---

## 🔷 FUNCIÓN getJwtSecret (Líneas 5-11)

```typescript
const getJwtSecret = (): Secret => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }
  return secret as Secret;
};
```

**¿Qué hace?**
- Obtiene la clave secreta del archivo `.env`
- Valida que exista
- Retorna la clave

**¿Qué es JWT_SECRET?**
```
JWT_SECRET = Clave secreta para firmar tokens
- Debe ser larga y aleatoria
- Se guarda en .env (no en el código)
- Ejemplo: "mi_super_clave_secreta_123456789"
```

**¿Por qué validar?**
```javascript
// Sin validación:
const secret = process.env.JWT_SECRET;  // undefined
jwt.verify(token, secret);  // Error: secret must be a string

// Con validación:
if (!secret) {
  throw new Error('JWT_SECRET no está definido');
}
// Falla rápido con mensaje claro
```

**Archivo .env:**
```env
JWT_SECRET=mi_clave_super_secreta_que_nadie_debe_saber_12345
MONGODB_URI=mongodb://localhost:27017/monetix
```

---

## 🔶 INTERFACE JwtPayload (Líneas 13-16)

```typescript
interface JwtPayload {
  userId: string;
  role: string;
}
```

**¿Qué es?**
- Define la estructura de los datos dentro del token JWT

**¿Qué contiene un JWT?**
```javascript
// Token JWT decodificado
{
  userId: '507f191e810c19729de860ea',
  role: 'user',
  iat: 1700000000,  // Issued At (cuándo se creó)
  exp: 1700086400   // Expiration (cuándo expira)
}
```

**Campos:**
- **`userId`**: ID del usuario en MongoDB
- **`role`**: Rol del usuario ('user' o 'admin')

**¿Dónde se crea este token?**
```typescript
// En auth.controller.ts (login)
const token = jwt.sign(
  { userId: user._id, role: user.role },  // ← Payload
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

---

## 🔸 MIDDLEWARE authenticate (Líneas 18-57)

### Línea 18-22: Firma de la Función

```typescript
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
```

**¿Qué es?**
- Middleware de autenticación exportado
- Función asíncrona (usa `await`)

---

### Parte 1: Extraer Token del Header (Líneas 24-34)

```typescript
const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
  res.status(401).json({
    success: false,
    message: 'Token no proporcionado',
  });
  return;
}

const token = authHeader.split(' ')[1];
```

**¿Qué hace?**
1. Lee el header `Authorization`
2. Verifica que exista y tenga formato correcto
3. Extrae el token

**¿Qué es el header Authorization?**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
               ^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
               Tipo   Token JWT
```

**Formato:**
```
"Bearer " + token
```

**Ejemplo:**
```javascript
// Header completo
req.headers.authorization = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMTkxZTgxMGMxOTcyOWRlODYwZWEiLCJyb2xlIjoidXNlciIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDg2NDAwfQ.signature'

// Extraer token
authHeader.split(' ')
// ['Bearer', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...']

token = authHeader.split(' ')[1]
// 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Validaciones:**
```javascript
// ❌ Sin header
req.headers.authorization = undefined
→ 401 "Token no proporcionado"

// ❌ Formato incorrecto
req.headers.authorization = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
→ 401 "Token no proporcionado" (falta "Bearer ")

// ✅ Formato correcto
req.headers.authorization = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
→ Continúa
```

---

### Parte 2: Verificar Token (Línea 36)

```typescript
const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
```

**¿Qué hace `jwt.verify()`?**
1. Verifica la firma del token
2. Verifica que no haya expirado
3. Decodifica el payload

**¿Cómo funciona JWT?**

**Estructura de un JWT:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMTkxZTgxMGMxOTcyOWRlODYwZWEiLCJyb2xlIjoidXNlciIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDg2NDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Header (base64)                  Payload (base64)                                                                          Signature
```

**Decodificado:**
```javascript
// Header
{
  "alg": "HS256",  // Algoritmo
  "typ": "JWT"     // Tipo
}

// Payload
{
  "userId": "507f191e810c19729de860ea",
  "role": "user",
  "iat": 1700000000,  // Issued At
  "exp": 1700086400   // Expiration (7 días después)
}

// Signature
// Hash generado con: HMACSHA256(header + payload, JWT_SECRET)
```

**Verificación:**
```javascript
// jwt.verify() hace:
1. Decodifica header y payload
2. Recalcula signature con JWT_SECRET
3. Compara signatures
4. Verifica que no haya expirado

// Si todo OK:
decoded = {
  userId: '507f191e810c19729de860ea',
  role: 'user',
  iat: 1700000000,
  exp: 1700086400
}

// Si falla:
throw new Error('Token inválido o expirado')
```

**Casos de error:**
```javascript
// Token modificado
jwt.verify(tokenModificado, secret)
→ Error: invalid signature

// Token expirado
jwt.verify(tokenViejo, secret)
→ Error: jwt expired

// Secret incorrecto
jwt.verify(token, secretIncorrecto)
→ Error: invalid signature
```

---

### Parte 3: Buscar Usuario en BD (Líneas 38-46)

```typescript
const user = await User.findById(decoded.userId).select('-password');

if (!user) {
  res.status(401).json({
    success: false,
    message: 'Usuario no encontrado',
  });
  return;
}
```

**¿Qué hace?**
1. Busca el usuario en MongoDB usando el ID del token
2. Excluye el campo `password` (seguridad)
3. Si no existe, retorna error 401

**¿Por qué buscar en BD?**
```
Token válido ≠ Usuario activo

Casos:
- Token válido pero usuario eliminado
- Token válido pero cuenta desactivada
- Token válido pero datos cambiaron
```

**¿Qué es `.select('-password')`?**
```javascript
// Sin select
user = {
  _id: '507f...',
  email: 'user@example.com',
  password: '$2b$10$hashedpassword...',  // ← Incluido
  role: 'user'
}

// Con select('-password')
user = {
  _id: '507f...',
  email: 'user@example.com',
  role: 'user'
  // password NO incluido ✅
}
```

**¿Por qué excluir password?**
- **Seguridad**: Nunca exponer contraseñas hasheadas
- **Buena práctica**: Principio de menor privilegio
- **Performance**: Menos datos transferidos

---

### Parte 4: Agregar Usuario a Request (Líneas 48-49)

```typescript
req.user = user;
next();
```

**¿Qué hace?**
- Agrega el usuario al objeto `req`
- Llama a `next()` para continuar al siguiente middleware/controlador

**¿Qué es `req.user`?**
```typescript
// Antes del middleware
req.user = undefined

// Después del middleware
req.user = {
  _id: '507f191e810c19729de860ea',
  email: 'user@example.com',
  role: 'user',
  createdAt: Date,
  updatedAt: Date
}
```

**¿Cómo se usa en controladores?**
```typescript
// En transaction.controller.ts
export const getTransactions = async (req, res) => {
  const userId = req.user?.id;  // ← Usuario autenticado
  
  const transactions = await Transaction.find({ userId });
  
  res.json({ success: true, data: transactions });
};
```

**Flujo completo:**
```
Cliente → authenticate → req.user agregado → Controlador usa req.user
```

---

### Parte 5: Manejo de Errores (Líneas 50-56)

```typescript
} catch (error) {
  console.error('Error en autenticación:', error);
  res.status(401).json({
    success: false,
    message: 'Token inválido o expirado',
  });
}
```

**¿Qué errores captura?**

**1. Token inválido:**
```javascript
jwt.verify(tokenModificado, secret)
→ Error: invalid signature
→ 401 "Token inválido o expirado"
```

**2. Token expirado:**
```javascript
jwt.verify(tokenViejo, secret)
→ Error: jwt expired
→ 401 "Token inválido o expirado"
```

**3. Token malformado:**
```javascript
jwt.verify('token-invalido', secret)
→ Error: jwt malformed
→ 401 "Token inválido o expirado"
```

**4. Error de BD:**
```javascript
await User.findById(invalidId)
→ Error: Cast to ObjectId failed
→ 401 "Token inválido o expirado"
```

---

## 🔹 Flujo Completo del Middleware

### Diagrama de Flujo

```
Cliente hace request con token
         ↓
    ¿Header Authorization existe?
         ↓ No
    ❌ 401 "Token no proporcionado"
         ↓ Sí
    ¿Formato "Bearer token"?
         ↓ No
    ❌ 401 "Token no proporcionado"
         ↓ Sí
    Extraer token
         ↓
    jwt.verify(token, secret)
         ↓ Error
    ❌ 401 "Token inválido o expirado"
         ↓ OK
    decoded = { userId, role }
         ↓
    Buscar usuario en BD
         ↓ No existe
    ❌ 401 "Usuario no encontrado"
         ↓ Existe
    req.user = usuario
         ↓
    ✅ next() → Continúa
```

---

## 🎯 Ejemplo Completo

### Escenario 1: Login y Request Autenticado

```javascript
// 1. Usuario hace login
POST /api/auth/login
Body: { email: 'user@example.com', password: 'password123' }

// 2. Servidor genera token
const token = jwt.sign(
  { userId: '507f...', role: 'user' },
  'mi_clave_secreta',
  { expiresIn: '7d' }
);

// 3. Servidor retorna token
Response: {
  success: true,
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}

// 4. Cliente guarda token
localStorage.setItem('token', token);

// 5. Cliente hace request autenticado
GET /api/transactions
Headers: {
  Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}

// 6. Middleware authenticate:
// - Extrae token
// - Verifica firma
// - Busca usuario
// - Agrega req.user
// - Continúa

// 7. Controlador usa req.user
const userId = req.user.id;
const transactions = await Transaction.find({ userId });

// 8. Retorna datos
Response: {
  success: true,
  data: [...]
}
```

---

## 📊 Comparación de Escenarios

### Tabla de Respuestas

| Escenario | Header | Token | Usuario | Código | Mensaje |
|-----------|--------|-------|---------|--------|---------|
| Sin header | - | - | - | 401 | Token no proporcionado |
| Formato incorrecto | "token123" | - | - | 401 | Token no proporcionado |
| Token inválido | "Bearer xxx" | Inválido | - | 401 | Token inválido o expirado |
| Token expirado | "Bearer xxx" | Expirado | - | 401 | Token inválido o expirado |
| Usuario eliminado | "Bearer xxx" | Válido | No existe | 401 | Usuario no encontrado |
| Todo correcto | "Bearer xxx" | Válido | Existe | - | ✅ Continúa |

---

## 🔐 Seguridad

### ¿Por qué JWT?

**Ventajas:**
```
✅ Stateless: No requiere sesiones en servidor
✅ Escalable: Funciona en múltiples servidores
✅ Seguro: Firma criptográfica
✅ Portable: Funciona en web, móvil, etc.
```

**Desventajas:**
```
❌ No se puede revocar fácilmente
❌ Tamaño mayor que session ID
❌ Si se roba, es válido hasta expirar
```

### Mejores Prácticas Implementadas

✅ **HTTPS**: Siempre usar HTTPS en producción  
✅ **Expiración**: Tokens expiran en 7 días  
✅ **Secret seguro**: Clave larga y aleatoria  
✅ **No exponer password**: `.select('-password')`  
✅ **Validación robusta**: Múltiples verificaciones  

### Mejoras Adicionales

**1. Refresh Tokens:**
```typescript
// Token de acceso: 15 minutos
// Refresh token: 7 días
// Cuando expira el access token, usar refresh para obtener nuevo
```

**2. Blacklist de Tokens:**
```typescript
// Guardar tokens revocados en Redis
// Verificar si token está en blacklist antes de aceptar
```

**3. Rate Limiting:**
```typescript
// Limitar intentos de autenticación
// Prevenir ataques de fuerza bruta
```

---

## 🚀 Uso en Rutas

### Aplicar Middleware

```typescript
// routes/transaction.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as transactionController from '../controllers/transaction.controller';

const router = Router();

// Rutas públicas (sin autenticación)
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Rutas protegidas (requieren autenticación)
router.get('/', authenticate, transactionController.getTransactions);
router.post('/', authenticate, transactionController.createTransaction);
router.put('/:id', authenticate, transactionController.updateTransaction);
router.delete('/:id', authenticate, transactionController.deleteTransaction);

export default router;
```

### Múltiples Middlewares

```typescript
// Autenticación + Autorización
router.get('/users', 
  authenticate,      // 1. Verifica token y agrega req.user
  requiredAdmin,     // 2. Verifica que req.user.role === 'admin'
  getAllUsers        // 3. Controlador
);
```

---

## 🎓 Conceptos Clave

### 1. JWT (JSON Web Token)

**Estructura:**
```
Header.Payload.Signature
```

**Ejemplo:**
```javascript
// Token
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMTkxZTgxMGMxOTcyOWRlODYwZWEiLCJyb2xlIjoidXNlciIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDg2NDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

// Decodificado
{
  header: { alg: 'HS256', typ: 'JWT' },
  payload: { userId: '507f...', role: 'user', iat: 1700000000, exp: 1700086400 },
  signature: 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
}
```

### 2. Bearer Token

**Formato:**
```
Authorization: Bearer <token>
```

**¿Por qué "Bearer"?**
- Significa "portador" en inglés
- Quien porta el token tiene acceso
- Estándar OAuth 2.0

### 3. Stateless Authentication

**Sin estado:**
```
Servidor NO guarda sesiones
Toda la información está en el token
Cada request es independiente
```

**Ventaja:**
```
Escalable: Múltiples servidores pueden validar el mismo token
No requiere base de datos de sesiones
```

---

## 📝 Resumen

**Propósito:**
- Autenticar usuarios mediante JWT
- Agregar información del usuario a `req.user`

**Funcionamiento:**
1. Extraer token del header `Authorization`
2. Verificar firma y expiración con `jwt.verify()`
3. Buscar usuario en BD
4. Agregar usuario a `req`
5. Continuar al controlador

**Códigos de respuesta:**
- 401: Token no proporcionado, inválido, expirado, o usuario no encontrado

**Uso:**
```typescript
router.get('/protected', authenticate, controller);
```

---

¡Documentación completa del middleware de autenticación! Este es el guardián que verifica la identidad de cada usuario. 🔐🛡️

