# Documentación: user.controller.ts

**Ubicación:** `src/controllers/user.controller.ts`

**Propósito:** Este archivo define el controlador de usuarios que maneja todas las operaciones de gestión de usuarios del sistema. Incluye funcionalidades CRUD completas, cambio de contraseña, validación de emails únicos, y protección contra eliminación del último administrador.

---

## Análisis Línea por Línea

### Líneas 1-3: Importaciones

```typescript
import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { Types, isValidObjectId } from 'mongoose';
```

#### Línea 1: Importación de tipos de Express
```typescript
import { Request, Response } from 'express';
```

**¿Qué hace?**
- Importa los tipos `Request` y `Response` de Express
- Proporciona tipado TypeScript para solicitudes y respuestas HTTP

---

#### Línea 2: Importación del modelo User
```typescript
import { User } from '../models/User.model';
```

**¿Qué hace?**
- Importa el modelo `User` de Mongoose
- Representa la estructura de usuarios en MongoDB

**Estructura típica de un usuario:**
```typescript
interface IUser {
  _id: ObjectId;
  email: string;
  password: string;        // Hasheado con bcrypt
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
```

**Ejemplo de usuario:**
```javascript
{
  _id: '507f191e810c19729de860ea',
  email: 'usuario@example.com',
  password: '$2b$10$...',  // Hash bcrypt
  name: 'Juan Pérez',
  role: 'user',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-11-27T16:00:00.000Z'
}
```

---

#### Línea 3: Importación de utilidades de Mongoose
```typescript
import { Types, isValidObjectId } from 'mongoose';
```

**¿Qué hace?**
- **`Types`**: Tipos de Mongoose (ObjectId, etc.)
- **`isValidObjectId`**: Función para validar ObjectIds

**¿Qué es isValidObjectId?**
- Función que verifica si un string es un ObjectId válido de MongoDB
- Retorna `true` o `false`

**Ejemplos:**
```javascript
isValidObjectId('507f1f77bcf86cd799439011')  // true ✅
isValidObjectId('abc123')                     // false ❌
isValidObjectId('507f1f77bcf86cd79943901')   // false ❌ (muy corto)
isValidObjectId(null)                         // false ❌
```

---

### Líneas 5-51: Función getAllUsers

```typescript
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
```

**Diferencia con controladores anteriores:**
- Este archivo usa **funciones exportadas** en lugar de una clase
- Patrón alternativo válido en Node.js/Express

**Clase vs Funciones:**
```typescript
// Patrón de clase (usado en otros controladores)
export class UserController {
  async getAllUsers(req, res) { ... }
}
export const userController = new UserController();

// Patrón de funciones (usado aquí)
export const getAllUsers = async (req, res) => { ... }
```

**Ambos patrones son válidos:**
- **Clase**: Mejor para compartir estado o métodos privados
- **Funciones**: Más simple, directo, funcional

---

#### Líneas 7-10: Extracción de parámetros
```typescript
// Extraer parámetros de query
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 10;
const role = req.query.role as string;
```

**¿Qué hace?**
- **Línea 8**: Página actual (por defecto 1)
- **Línea 9**: Usuarios por página (por defecto 10)
- **Línea 10**: Filtro opcional por rol

**¿Qué es parseInt?**
- Convierte string a número entero
- `parseInt('5')` → `5`
- `parseInt('abc')` → `NaN`

**Operador OR para valores por defecto:**
```javascript
parseInt(req.query.page as string) || 1

// Si page es undefined o NaN
parseInt(undefined) → NaN
NaN || 1 → 1  // Usa valor por defecto

// Si page es '2'
parseInt('2') → 2
2 || 1 → 2  // Usa el valor parseado
```

**Ejemplo de URL:**
```
GET /api/users?page=2&limit=20&role=admin
```

---

#### Líneas 12-16: Construcción del filtro
```typescript
// Construir filtro
const filter: any = {};
if (role && (role === 'user' || role === 'admin')) {
  filter.role = role;
}
```

**¿Qué hace?**
- Crea filtro vacío por defecto
- Agrega filtro de rol solo si es válido

**¿Por qué validar el rol?**
- **Seguridad**: Solo acepta roles válidos
- **Prevención de inyección**: Evita valores maliciosos
- **Validación de entrada**: Asegura datos correctos

**Ejemplos:**
```javascript
// Sin filtro de rol
filter = {}  // Retorna todos los usuarios

// Con rol válido
role = 'admin'
filter = { role: 'admin' }  // Solo admins

// Con rol inválido
role = 'superuser'
filter = {}  // Ignora el filtro inválido
```

---

#### Líneas 18-19: Cálculo de paginación
```typescript
// Calcular offset
const skip = (page - 1) * limit;
```

**¿Qué hace?**
- Calcula cuántos documentos saltar
- Fórmula estándar de paginación

**Ejemplos:**
```javascript
// Página 1, límite 10
skip = (1 - 1) * 10 = 0  // Documentos 1-10

// Página 2, límite 10
skip = (2 - 1) * 10 = 10  // Documentos 11-20

// Página 3, límite 20
skip = (3 - 1) * 20 = 40  // Documentos 41-60
```

---

#### Líneas 21-26: Consulta con exclusión de password
```typescript
// Ejecutar query
const users = await User.find(filter)
  .select('-password')
  .limit(limit)
  .skip(skip)
  .sort({ createdAt: -1 });
```

**¿Qué hace?**
- **`.find(filter)`**: Busca usuarios según filtro
- **`.select('-password')`**: **EXCLUYE el campo password**
- **`.limit(limit)`**: Limita resultados
- **`.skip(skip)`**: Salta documentos para paginación
- **`.sort({ createdAt: -1 })`**: Ordena por fecha de creación descendente

**¿Qué es .select('-password')?**
- Método de Mongoose para seleccionar/excluir campos
- **`-`** antes del campo significa EXCLUIR
- **Sin `-`** significa INCLUIR

**Ejemplos de select:**
```javascript
// Excluir password
.select('-password')
// Resultado: { _id, email, name, role } ✅

// Incluir solo email y name
.select('email name')
// Resultado: { _id, email, name }

// Excluir múltiples campos
.select('-password -__v')
// Resultado: { _id, email, name, role }
```

**¿Por qué excluir password?**
- **Seguridad**: NUNCA enviar hashes de contraseñas al cliente
- **Privacidad**: Información sensible
- **Mejores prácticas**: Principio de mínimo privilegio

**Resultado sin .select('-password'):**
```json
{
  "_id": "507f...",
  "email": "user@example.com",
  "password": "$2b$10$abcd...",  // ❌ NUNCA exponer esto
  "name": "Juan",
  "role": "user"
}
```

**Resultado con .select('-password'):**
```json
{
  "_id": "507f...",
  "email": "user@example.com",
  "name": "Juan",
  "role": "user"
}
```

---

#### Líneas 28-32: Conteo y cálculo de páginas
```typescript
// Contar total de documentos
const total = await User.countDocuments(filter);

// Calcular total de páginas
const totalPages = Math.ceil(total / limit);
```

**¿Qué hace?**
- **Línea 29**: Cuenta total de usuarios que coinciden con el filtro
- **Línea 32**: Calcula número total de páginas

**Ejemplo:**
```javascript
total = 45
limit = 10
totalPages = Math.ceil(45 / 10) = 5 páginas
```

---

#### Líneas 34-43: Respuesta con paginación
```typescript
res.status(200).json({
  success: true,
  data: users,
  pagination: {
    page,
    limit,
    total,
    totalPages,
  },
});
```

**¿Qué hace?**
- Retorna usuarios con metadata de paginación

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f...",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "_id": "507f...",
      "email": "user@example.com",
      "name": "Regular User",
      "role": "user",
      "createdAt": "2025-01-02T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### Líneas 53-88: Función getUserById

```typescript
export const getUserById = async (req: Request, res: Response): Promise<void> => {
```

#### Líneas 55-64: Validación de ObjectId
```typescript
const { id } = req.params;

// Validar que sea un ObjectId válido
if (!isValidObjectId(id)) {
  res.status(400).json({
    success: false,
    message: 'ID de usuario inválido',
  });
  return;
}
```

**¿Qué hace?**
- Valida que el ID tenga formato de ObjectId
- Retorna 400 (Bad Request) si es inválido

**¿Por qué validar antes de consultar?**
- **Performance**: Evita consultas innecesarias a la BD
- **Claridad**: Mensaje de error específico
- **Prevención de errores**: Mongoose lanzaría error si el ID es inválido

**Ejemplos:**
```javascript
// ID válido
isValidObjectId('507f1f77bcf86cd799439011')  // true ✅
// Continúa con la consulta

// ID inválido
isValidObjectId('abc123')  // false ❌
// Retorna 400 inmediatamente
```

---

#### Líneas 66-75: Búsqueda y validación
```typescript
// Buscar usuario
const user = await User.findById(id).select('-password');

if (!user) {
  res.status(404).json({
    success: false,
    message: 'Usuario no encontrado',
  });
  return;
}
```

**¿Qué hace?**
- Busca usuario por ID
- Excluye password
- Retorna 404 si no existe

---

### Líneas 90-130: Función createUser

```typescript
export const createUser = async (req: Request, res: Response): Promise<void> => {
```

#### Líneas 92-103: Validación de email único
```typescript
const { email, password, name, role } = req.body;

// Verificar si el email ya existe
const existingUser = await User.findOne({ email });

if (existingUser) {
  res.status(400).json({
    success: false,
    message: 'El email ya está registrado',
  });
  return;
}
```

**¿Qué hace?**
- Verifica que el email no esté en uso
- Previene duplicados

**¿Por qué validar emails únicos?**
- **Integridad de datos**: Un email por usuario
- **Autenticación**: El email es el identificador de login
- **UX**: Mensaje claro si el email ya existe

---

#### Líneas 105-113: Creación del usuario
```typescript
// Crear nuevo usuario
const user = new User({
  email,
  password,
  name,
  role: role || 'user',
});

await user.save();
```

**¿Qué hace?**
- Crea nueva instancia del modelo User
- **`role: role || 'user'`**: Por defecto 'user' si no se especifica
- Guarda en la base de datos

**¿Qué pasa con el password?**
- El modelo User tiene un middleware `pre('save')`
- Automáticamente hashea el password con bcrypt antes de guardar
- NUNCA se guarda el password en texto plano

**Middleware en el modelo:**
```typescript
// En User.model.ts
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

---

#### Líneas 115-122: Respuesta sin password
```typescript
// Obtener usuario sin password
const userWithoutPassword = await User.findById(user._id).select('-password');

res.status(201).json({
  success: true,
  message: 'Usuario creado exitosamente',
  data: userWithoutPassword,
});
```

**¿Qué hace?**
- Busca el usuario recién creado
- Excluye el password
- Retorna 201 (Created)

**¿Por qué buscar de nuevo?**
- El objeto `user` después de `.save()` incluye el password hasheado
- Necesitamos excluirlo antes de enviarlo al cliente
- Más seguro que manipular el objeto directamente

---

### Líneas 132-195: Función updateUser

```typescript
export const updateUser = async (req: Request, res: Response): Promise<void> => {
```

#### Líneas 134-144: Validación de ID
```typescript
const { id } = req.params;
const { email, name, role } = req.body;

// Validar que sea un ObjectId válido
if (!isValidObjectId(id)) {
  res.status(400).json({
    success: false,
    message: 'ID de usuario inválido',
  });
  return;
}
```

**¿Qué hace?**
- Extrae datos de la solicitud
- Valida el ID

**Nota importante:**
- **NO** se permite actualizar el password aquí
- Existe una función separada `changePassword` para eso
- Mejores prácticas de seguridad

---

#### Líneas 146-160: Validación de email único
```typescript
// Si se actualiza el email, verificar que no exista en otro usuario
if (email) {
  const existingUser = await User.findOne({
    email,
    _id: { $ne: id },
  });

  if (existingUser) {
    res.status(400).json({
      success: false,
      message: 'El email ya está en uso por otro usuario',
    });
    return;
  }
}
```

**¿Qué hace?**
- Verifica que el nuevo email no esté en uso
- **`_id: { $ne: id }`**: Excluye el usuario actual de la búsqueda

**¿Qué es $ne?**
- Operador de MongoDB: "Not Equal" (no igual)
- Excluye documentos donde `_id` es igual a `id`

**¿Por qué excluir el usuario actual?**
```javascript
// Usuario A (id: '507f...001') quiere actualizar su email a 'user@example.com'
// Usuario A ya tiene email 'user@example.com'

// Sin $ne
const existingUser = await User.findOne({ email: 'user@example.com' });
// Encuentra al usuario A
// ❌ Error: "Email ya en uso" (falso positivo)

// Con $ne
const existingUser = await User.findOne({
  email: 'user@example.com',
  _id: { $ne: '507f...001' }
});
// No encuentra nada (excluye al usuario A)
// ✅ Permite la actualización
```

---

#### Líneas 162-166: Construcción dinámica del objeto de actualización
```typescript
// Construir objeto de actualización solo con campos presentes
const updateData: any = {};
if (email !== undefined) updateData.email = email;
if (name !== undefined) updateData.name = name;
if (role !== undefined) updateData.role = role;
```

**¿Qué hace?**
- Construye objeto de actualización solo con campos proporcionados
- No sobrescribe campos no enviados

**¿Por qué verificar !== undefined?**
```javascript
// Request solo actualiza name
req.body = { name: 'Nuevo Nombre' }

// Sin verificación
updateData = {
  email: undefined,  // ❌ Borraría el email
  name: 'Nuevo Nombre',
  role: undefined    // ❌ Borraría el rol
}

// Con verificación
updateData = {
  name: 'Nuevo Nombre'  // ✅ Solo actualiza name
}
```

**Actualización parcial vs completa:**
```javascript
// PATCH (actualización parcial) - Correcto
{ name: 'Nuevo Nombre' }
// Solo actualiza name, mantiene email y role

// PUT (actualización completa) - Requeriría todos los campos
{ email: '...', name: '...', role: '...' }
```

---

#### Líneas 168-181: Actualización del usuario
```typescript
// Actualizar usuario
const updatedUser = await User.findByIdAndUpdate(
  id,
  updateData,
  { new: true, runValidators: true }
).select('-password');

if (!updatedUser) {
  res.status(404).json({
    success: false,
    message: 'Usuario no encontrado',
  });
  return;
}
```

**¿Qué hace?**
- Actualiza el usuario
- **`new: true`**: Retorna documento actualizado
- **`runValidators: true`**: Ejecuta validaciones del esquema
- Excluye password

---

### Líneas 197-248: Función deleteUser

```typescript
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
```

#### Líneas 210-219: Búsqueda del usuario
```typescript
// Buscar usuario a eliminar
const user = await User.findById(id);

if (!user) {
  res.status(404).json({
    success: false,
    message: 'Usuario no encontrado',
  });
  return;
}
```

**¿Qué hace?**
- Busca el usuario antes de eliminar
- Necesario para verificar el rol

---

#### Líneas 221-232: Protección del último admin
```typescript
// Si es admin, verificar que no sea el último
if (user.role === 'admin') {
  const adminCount = await User.countDocuments({ role: 'admin' });

  if (adminCount === 1) {
    res.status(400).json({
      success: false,
      message: 'No se puede eliminar el último administrador del sistema',
    });
    return;
  }
}
```

**¿Qué hace?**
- Si el usuario es admin, cuenta cuántos admins hay
- Previene eliminar el último admin

**¿Por qué proteger el último admin?**
- **Seguridad del sistema**: Siempre debe haber al menos un admin
- **Prevención de bloqueo**: Sin admins, nadie puede gestionar el sistema
- **Mejores prácticas**: Protección contra errores humanos

**Escenarios:**
```javascript
// Escenario 1: Hay 3 admins
adminCount = 3
// ✅ Permite eliminar (quedarían 2)

// Escenario 2: Hay 1 admin
adminCount = 1
// ❌ Bloquea eliminación (quedarían 0)

// Escenario 3: Usuario normal
user.role = 'user'
// ✅ Permite eliminar (no afecta admins)
```

---

#### Líneas 234-240: Eliminación del usuario
```typescript
// Eliminar usuario
await User.findByIdAndDelete(id);

res.status(200).json({
  success: true,
  message: 'Usuario eliminado exitosamente',
});
```

**¿Qué hace?**
- Elimina el usuario de la base de datos
- Retorna confirmación

**Nota:**
- Esto es un **hard delete** (eliminación permanente)
- Alternativa: **soft delete** (marcar como eliminado)

---

### Líneas 250-290: Función changePassword

```typescript
export const changePassword = async (req: Request, res: Response): Promise<void> => {
```

#### Líneas 252-273: Validación y búsqueda
```typescript
const { id } = req.params;
const { password } = req.body;

// Validar que sea un ObjectId válido
if (!isValidObjectId(id)) {
  res.status(400).json({
    success: false,
    message: 'ID de usuario inválido',
  });
  return;
}

// Buscar usuario
const user = await User.findById(id);

if (!user) {
  res.status(404).json({
    success: false,
    message: 'Usuario no encontrado',
  });
  return;
}
```

**¿Qué hace?**
- Valida el ID
- Busca el usuario

---

#### Líneas 275-282: Actualización de contraseña
```typescript
// Asignar nueva contraseña (se hasheará automáticamente por el middleware)
user.password = password;
await user.save();

res.status(200).json({
  success: true,
  message: 'Contraseña actualizada exitosamente',
});
```

**¿Qué hace?**
- Asigna la nueva contraseña
- Guarda el usuario
- El middleware `pre('save')` hashea automáticamente

**¿Por qué usar .save() en lugar de findByIdAndUpdate?**
```typescript
// ❌ NO funciona con findByIdAndUpdate
await User.findByIdAndUpdate(id, { password: newPassword });
// El middleware pre('save') NO se ejecuta
// Password se guarda en texto plano ❌

// ✅ Funciona con .save()
user.password = newPassword;
await user.save();
// El middleware pre('save') SÍ se ejecuta
// Password se hashea correctamente ✅
```

**Middleware en el modelo:**
```typescript
userSchema.pre('save', async function(next) {
  // Solo hashear si el password fue modificado
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

---

## Resumen de Funciones

| Función | Ruta | Descripción | Características |
|---------|------|-------------|-----------------|
| `getAllUsers` | GET /users | Lista usuarios con paginación | Filtro por rol, excluye passwords |
| `getUserById` | GET /users/:id | Obtiene un usuario | Valida ObjectId, excluye password |
| `createUser` | POST /users | Crea usuario | Valida email único, hashea password |
| `updateUser` | PUT /users/:id | Actualiza usuario | Valida email único, actualización parcial |
| `deleteUser` | DELETE /users/:id | Elimina usuario | Protege último admin |
| `changePassword` | PATCH /users/:id/password | Cambia contraseña | Hashea automáticamente |

---

## Conceptos Clave

### 1. Exclusión de Password

**Siempre excluir password en respuestas:**
```typescript
.select('-password')
```

**Razones:**
- **Seguridad**: Nunca exponer hashes
- **Privacidad**: Información sensible
- **Mejores prácticas**: Mínimo privilegio

### 2. Validación de ObjectId

```typescript
if (!isValidObjectId(id)) {
  return res.status(400).json({ message: 'ID inválido' });
}
```

**Beneficios:**
- Performance (evita consultas innecesarias)
- Mensajes de error claros
- Prevención de errores

### 3. Validación de Email Único

```typescript
// Al crear
const existingUser = await User.findOne({ email });

// Al actualizar
const existingUser = await User.findOne({
  email,
  _id: { $ne: id }  // Excluye usuario actual
});
```

### 4. Protección del Último Admin

```typescript
if (user.role === 'admin') {
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount === 1) {
    return res.status(400).json({
      message: 'No se puede eliminar el último administrador'
    });
  }
}
```

### 5. Actualización Parcial

```typescript
const updateData: any = {};
if (email !== undefined) updateData.email = email;
if (name !== undefined) updateData.name = name;
// Solo actualiza campos proporcionados
```

---

## Seguridad Implementada

✅ **Passwords nunca expuestos**: `.select('-password')` en todas las consultas  
✅ **Passwords hasheados**: Middleware automático con bcrypt  
✅ **Validación de ObjectIds**: Previene errores y ataques  
✅ **Emails únicos**: Previene duplicados  
✅ **Protección de admins**: No se puede eliminar el último  
✅ **Actualización parcial**: No sobrescribe campos no enviados  

---

## Mejores Prácticas Implementadas

✅ **Paginación**: Evita cargar todos los usuarios  
✅ **Validación de entrada**: Verifica roles, IDs, emails  
✅ **Mensajes claros**: Errores específicos y descriptivos  
✅ **Separación de responsabilidades**: Función específica para cambiar password  
✅ **Middleware de modelo**: Hasheo automático de passwords  

---

## Posibles Mejoras

### 1. Soft delete
```typescript
// Agregar campo deletedAt al modelo
interface IUser {
  // ... campos existentes
  deletedAt?: Date;
}

// Modificar delete
await User.findByIdAndUpdate(id, { deletedAt: new Date() });

// Modificar consultas para excluir eliminados
const filter = { deletedAt: null };
```

### 2. Validación de contraseña fuerte
```typescript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

if (!passwordRegex.test(password)) {
  return res.status(400).json({
    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
  });
}
```

### 3. Verificación de email
```typescript
// Enviar email de verificación al crear usuario
const verificationToken = generateToken();
await sendVerificationEmail(user.email, verificationToken);

// Agregar campo al modelo
interface IUser {
  emailVerified: boolean;
  verificationToken?: string;
}
```

### 4. Historial de cambios
```typescript
// Guardar historial de actualizaciones
interface IUserHistory {
  userId: ObjectId;
  changes: object;
  changedBy: ObjectId;
  changedAt: Date;
}

await UserHistory.create({
  userId: id,
  changes: updateData,
  changedBy: req.user?.id,
  changedAt: new Date()
});
```

### 5. Rate limiting para cambio de contraseña
```typescript
import rateLimit from 'express-rate-limit';

const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // máximo 3 intentos
  message: 'Demasiados intentos de cambio de contraseña'
});

router.patch('/users/:id/password', passwordChangeLimiter, changePassword);
```

---

## Casos de Uso

### 1. Panel de administración
```javascript
// Listar todos los usuarios
const response = await fetch('/api/users?page=1&limit=20');
const { data, pagination } = await response.json();

renderUserTable(data);
renderPagination(pagination);
```

### 2. Filtrar solo administradores
```javascript
const admins = await fetch('/api/users?role=admin').then(r => r.json());
showAdminList(admins.data);
```

### 3. Crear nuevo usuario
```javascript
const newUser = await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({
    email: 'nuevo@example.com',
    password: 'SecurePass123!',
    name: 'Nuevo Usuario',
    role: 'user'
  })
});
```

### 4. Cambiar contraseña
```javascript
await fetch(`/api/users/${userId}/password`, {
  method: 'PATCH',
  body: JSON.stringify({
    password: 'NewSecurePass123!'
  })
});
```
