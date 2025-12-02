# Documentación ULTRA Didáctica: User.model.ts

**Ubicación:** `src/models/User.model.ts`

**Propósito:** Este archivo define el **modelo de Usuarios** del sistema. Gestiona la autenticación, roles y seguridad de las cuentas. Incluye **hash automático de contraseñas** con bcrypt y métodos para comparar contraseñas de forma segura. Es como el sistema de cuentas y credenciales que protege el acceso a la aplicación.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina un sistema de seguridad:

```
Sin modelo de usuarios:
- No hay autenticación
- Cualquiera accede a cualquier dato
- Contraseñas en texto plano

Con modelo de usuarios:
✅ Registro seguro con hash de contraseñas
✅ Login con verificación de credenciales
✅ Roles (user/admin) para permisos
✅ Contraseñas nunca expuestas
→ Sistema seguro
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (líneas 1-2)             │
│  ├─ mongoose                            │
│  └─ bcryptjs (hash de contraseñas)     │
├──────────────────────────────────────────┤
│  INTERFACE IUser (líneas 4-12)          │
│  └─ Define estructura TypeScript        │
├──────────────────────────────────────────┤
│  SCHEMA userSchema (líneas 14-42)       │
│  ├─ email (único, lowercase)            │
│  ├─ password (hasheada)                 │
│  ├─ name (nombre del usuario)           │
│  └─ role (user/admin)                   │
├──────────────────────────────────────────┤
│  MIDDLEWARE pre-save (líneas 44-55)     │
│  └─ Hash automático de contraseñas      │
├──────────────────────────────────────────┤
│  MÉTODO comparePassword (líneas 57-63)  │
│  └─ Verificar contraseña en login       │
├──────────────────────────────────────────┤
│  MÉTODO toJSON (líneas 65-69)           │
│  └─ Excluir password de respuestas      │
├──────────────────────────────────────────┤
│  ÍNDICES (líneas 71-77)                 │
│  └─ email y role                        │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (línea 79)                 │
│  └─ Modelo de Mongoose                  │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

## 🔷 IMPORTACIONES (Líneas 1-2)

```typescript
import mongoose,{Document, Schema} from "mongoose";
import bcrypt from "bcryptjs";
```

**Línea 1: mongoose**
- Librería para trabajar con MongoDB

**Línea 2: bcryptjs**
- Librería para **hash de contraseñas**
- Convierte contraseñas en texto cifrado irreversible

**¿Qué es bcrypt?**
```
Contraseña: "password123"
↓ bcrypt.hash()
Hash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

Imposible de revertir:
Hash → Contraseña original ❌
```

---

## 🔶 INTERFACE IUser (Líneas 4-12)

```typescript
export interface IUser extends Document{
    email: string;
    password: string;
    name: string;
    role: 'user' | 'admin';  
    createdAt: Date;
    updateAt: Date;
    comparePassword(candidatePassword: string):Promise<boolean>;
}
```

### Campos Explicados

**Línea 5: email**
```typescript
email: string;
```
- Email único del usuario
- Usado para login
- Convertido a minúsculas automáticamente

---

**Línea 6: password**
```typescript
password: string;
```
- Contraseña del usuario
- **SIEMPRE hasheada** antes de guardar
- Nunca se expone en respuestas JSON

---

**Línea 7: name**
```typescript
name: string;
```
- Nombre completo del usuario
- Ejemplo: `"Juan Pérez"`

---

**Línea 8: role**
```typescript
role: 'user' | 'admin';
```

**Roles:**

**user (Usuario normal)**
```javascript
{
  email: 'user@example.com',
  role: 'user'
}
// Acceso a sus propios datos
```

**admin (Administrador)**
```javascript
{
  email: 'admin@example.com',
  role: 'admin'
}
// Acceso a todos los datos del sistema
```

---

**Línea 11: comparePassword()**
```typescript
comparePassword(candidatePassword: string):Promise<boolean>;
```
- Método para verificar contraseñas en login
- Compara contraseña en texto plano con hash
- Retorna `true` si coincide, `false` si no

---

## 🔸 SCHEMA userSchema (Líneas 14-42)

### Líneas 16-22: email

```typescript
email: {
    type: String,
    required: [true, "Email requerido"],
    unique: true,
    lowercase: true,
    trim: true
},
```

**unique: true**
```javascript
// ✅ Primer usuario
{ email: 'user@example.com' }

// ❌ Intento de duplicar
{ email: 'user@example.com' }
// Error: Email ya existe
```

**lowercase: true**
```javascript
// Entrada
email: 'USER@EXAMPLE.COM'

// Guardado
email: 'user@example.com'  // ← Convertido a minúsculas
```

**trim: true**
```javascript
// Entrada
email: '  user@example.com  '

// Guardado
email: 'user@example.com'  // ← Sin espacios
```

---

### Líneas 23-27: password

```typescript
password: {
    type: String, 
    required: [true, "Contraseña requerida"],
    minlength: [8, "Contresña minima de 8 caracteres"]
},
```

**minlength: 8**
```javascript
// ❌ Muy corta
password: '1234567'  // 7 caracteres
// Error: Contraseña mínima de 8 caracteres

// ✅ Válida
password: '12345678'  // 8 caracteres
```

**Nota:** Hay un typo en el mensaje: `"Contresña"` debería ser `"Contraseña"`

---

### Líneas 28-32: name

```typescript
name: {
    type: String,
    required: [true, "Nombre requerido"],
    trim: true
},
```

**trim: true**
```javascript
// Entrada
name: '  Juan Pérez  '

// Guardado
name: 'Juan Pérez'  // Sin espacios extra
```

---

### Líneas 33-37: role

```typescript
role: {
    type: String,
    enum: ['user','admin'],
    default: 'user',
},
```

**enum:**
- Solo permite `'user'` o `'admin'`

**default: 'user'**
```javascript
// Sin especificar role
await User.create({
  email: 'user@example.com',
  password: 'password123',
  name: 'Juan Pérez'
});

// Resultado
{
  role: 'user'  // ← Default aplicado
}
```

---

### Líneas 39-41: Opciones del Schema

```typescript
{
    timestamps: true
}
```

**timestamps: true**
- Agrega automáticamente `createdAt` y `updatedAt`

---

## 🔹 MIDDLEWARE pre-save (Líneas 44-55)

```typescript
userSchema.pre('save', async function (next){
    if(!this.isModified('password')){
        return next();
    }
    try{
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error:any){
        next(error);
    }
});
```

**¿Qué hace?**
- Se ejecuta **antes de guardar** el usuario
- Hashea la contraseña automáticamente
- Solo hashea si la contraseña cambió

### Paso a Paso

**Línea 45: Verificar si password cambió**
```typescript
if(!this.isModified('password')){
    return next();
}
```

**¿Qué es `isModified()`?**
- Método de Mongoose
- Verifica si un campo fue modificado
- Retorna `true` si cambió, `false` si no

**¿Por qué verificar?**
```javascript
// Caso 1: Crear usuario
const user = new User({ email, password, name });
await user.save();
// isModified('password') = true → Hashea

// Caso 2: Actualizar nombre (sin cambiar password)
user.name = 'Nuevo Nombre';
await user.save();
// isModified('password') = false → NO hashea
// Evita hashear un hash (doble hash)
```

---

**Línea 49: Generar salt**
```typescript
const salt = await bcrypt.genSalt(10);
```

**¿Qué es un salt?**
- Cadena aleatoria agregada a la contraseña
- Hace cada hash único, incluso con misma contraseña

**Ejemplo:**
```javascript
// Usuario 1
password: 'password123'
salt: 'abc123xyz'
hash: bcrypt.hash('password123' + 'abc123xyz')

// Usuario 2 (misma contraseña)
password: 'password123'
salt: 'def456uvw'  // ← Salt diferente
hash: bcrypt.hash('password123' + 'def456uvw')

// Hashes diferentes aunque contraseña igual ✅
```

**¿Qué es el número 10?**
- **Rounds** o **cost factor**
- Cuántas veces se aplica el algoritmo
- Más rounds = más seguro pero más lento

```
Rounds: 10 → ~100ms (recomendado)
Rounds: 12 → ~400ms (muy seguro)
Rounds: 15 → ~3 segundos (extremo)
```

---

**Línea 50: Hashear contraseña**
```typescript
this.password = await bcrypt.hash(this.password, salt);
```

**Transformación:**
```javascript
// Antes
this.password = 'password123'

// Después
this.password = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
```

**Estructura del hash:**
```
$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
│  │ │ │                                                          │
│  │ │ └─ Salt (22 caracteres)                                   │
│  │ └─── Rounds (10)                                            │
│  └───── Versión de bcrypt (2b)                                 │
└──────── Identificador de algoritmo                             │
         └─────────────────────────────────────────────────────────┘
                              Hash (31 caracteres)
```

---

## 🔺 MÉTODO comparePassword (Líneas 57-63)

```typescript
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    try{
        return await bcrypt.compare(candidatePassword, this.password);
    }catch (error){
        return false;
    }
};
```

**¿Qué hace?**
- Compara contraseña en texto plano con hash
- Usado en el login

**¿Cómo funciona bcrypt.compare()?**
```javascript
bcrypt.compare(candidatePassword, hash)

// Internamente:
1. Extrae el salt del hash
2. Hashea candidatePassword con ese salt
3. Compara los hashes
4. Retorna true si coinciden
```

**Ejemplo:**
```javascript
// Contraseña guardada (hasheada)
user.password = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

// Login - contraseña correcta
await user.comparePassword('password123')
// → true ✅

// Login - contraseña incorrecta
await user.comparePassword('wrongpassword')
// → false ❌
```

**Try-catch:**
```javascript
try{
    return await bcrypt.compare(candidatePassword, this.password);
}catch (error){
    return false;
}

// Si hay error (ej: hash corrupto), retorna false
// Evita que la aplicación crashee
```

---

## 🔻 MÉTODO toJSON (Líneas 65-69)

```typescript
userSchema.methods.toJSON = function (){
    const user = this.toObject();
    delete user.password;
    return user;
};
```

**¿Qué hace?**
- Personaliza la respuesta JSON
- **Excluye el password** (seguridad crítica)

**Transformación:**
```javascript
// Documento en MongoDB
{
  _id: ObjectId('507f...'),
  email: 'user@example.com',
  password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  name: 'Juan Pérez',
  role: 'user',
  createdAt: ISODate('2025-11-27T...'),
  updatedAt: ISODate('2025-11-27T...')
}

// Respuesta JSON (después de toJSON)
{
  "_id": "507f...",
  "email": "user@example.com",
  // password NO incluido ✅
  "name": "Juan Pérez",
  "role": "user",
  "createdAt": "2025-11-27T...",
  "updatedAt": "2025-11-27T..."
}
```

**¿Por qué excluir password?**
```
NUNCA exponer contraseñas hasheadas:
- Aunque estén hasheadas, son sensibles
- Podrían ser atacadas con rainbow tables
- Principio de seguridad: menos información = mejor
```

---

## 🔲 ÍNDICES (Líneas 71-77)

```typescript
userSchema.index({
    email: 1
});

userSchema.index({
    role: 1
});
```

### Índice 1: email

```typescript
{ email: 1 }
```

**Optimiza:**
```javascript
// Login - buscar por email
User.findOne({ email: 'user@example.com' });
```

**Además:**
- `unique: true` en el campo email ya crea un índice
- Este índice explícito refuerza la optimización

---

### Índice 2: role

```typescript
{ role: 1 }
```

**Optimiza:**
```javascript
// Obtener todos los admins
User.find({ role: 'admin' });

// Obtener todos los usuarios normales
User.find({ role: 'user' });
```

---

## 🎯 Ejemplos Completos

### Ejemplo 1: Registro de Usuario

```javascript
// Crear usuario
const user = await User.create({
  email: 'user@example.com',
  password: 'password123',  // ← Texto plano
  name: 'Juan Pérez'
});

console.log(user);
// {
//   _id: '507f...',
//   email: 'user@example.com',
//   // password NO visible (toJSON lo excluye)
//   name: 'Juan Pérez',
//   role: 'user',  // ← Default
//   createdAt: '2025-11-27T...',
//   updatedAt: '2025-11-27T...'
// }

// En la BD (password hasheada)
// password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
```

---

### Ejemplo 2: Login

```javascript
// Usuario intenta hacer login
const email = 'user@example.com';
const password = 'password123';

// Buscar usuario por email
const user = await User.findOne({ email });

if (!user) {
  return res.status(401).json({
    message: 'Credenciales inválidas'
  });
}

// Verificar contraseña
const isMatch = await user.comparePassword(password);

if (!isMatch) {
  return res.status(401).json({
    message: 'Credenciales inválidas'
  });
}

// Login exitoso
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

res.json({
  success: true,
  token,
  user  // password NO incluido (toJSON)
});
```

---

### Ejemplo 3: Cambiar Contraseña

```javascript
// Obtener usuario
const user = await User.findById(userId);

// Cambiar contraseña
user.password = 'newpassword456';
await user.save();

// Middleware pre-save detecta cambio y hashea automáticamente
// isModified('password') = true → Hashea
```

---

### Ejemplo 4: Actualizar Nombre (sin cambiar password)

```javascript
// Obtener usuario
const user = await User.findById(userId);

// Cambiar solo nombre
user.name = 'Nuevo Nombre';
await user.save();

// Middleware pre-save NO hashea
// isModified('password') = false → NO hashea
// password permanece igual
```

---

### Ejemplo 5: Crear Admin

```javascript
const admin = await User.create({
  email: 'admin@example.com',
  password: 'adminpassword123',
  name: 'Admin User',
  role: 'admin'  // ← Especificar role
});

console.log(admin.role);  // 'admin'
```

---

### Ejemplo 6: Verificar Rol

```javascript
// En middleware de autorización
const user = await User.findById(req.user.id);

if (user.role !== 'admin') {
  return res.status(403).json({
    message: 'Acceso denegado'
  });
}

// Usuario es admin, continuar
```

---

## 🔐 Seguridad

### 1. Hash de Contraseñas

**Flujo:**
```
Usuario registra → password: 'password123'
         ↓
    pre-save middleware
         ↓
    bcrypt.genSalt(10)
         ↓
    bcrypt.hash(password, salt)
         ↓
    password: '$2b$10$...'
         ↓
    Guardado en BD
```

**Beneficios:**
- ✅ Contraseñas nunca en texto plano
- ✅ Irreversible (no se puede obtener original)
- ✅ Cada hash es único (salt)
- ✅ Resistente a rainbow tables

---

### 2. Exclusión de Password

```javascript
// toJSON excluye password automáticamente
const user = await User.findById(userId);
res.json({ user });

// Respuesta NO incluye password ✅
```

**Importante:**
```javascript
// ❌ NUNCA hacer esto
const user = await User.findById(userId).select('+password');
res.json({ user });
// Expone password hasheada

// ✅ Correcto
const user = await User.findById(userId);
res.json({ user });
// password excluida automáticamente
```

---

### 3. Validación de Email Único

```javascript
// unique: true previene duplicados
await User.create({ email: 'user@example.com', ... });  // ✅
await User.create({ email: 'user@example.com', ... });  // ❌ Error
```

---

## ✅ Mejores Prácticas

### 1. Nunca Exponer Passwords

```javascript
// ❌ Incorrecto
const users = await User.find().select('+password');

// ✅ Correcto
const users = await User.find();
// toJSON excluye password automáticamente
```

### 2. Usar comparePassword para Login

```javascript
// ❌ Incorrecto
if (user.password === candidatePassword) { ... }

// ✅ Correcto
if (await user.comparePassword(candidatePassword)) { ... }
```

### 3. Validar Contraseñas Fuertes

```javascript
// Agregar validación adicional
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

if (!passwordRegex.test(password)) {
  return res.status(400).json({
    message: 'Contraseña debe tener mayúsculas, minúsculas y números'
  });
}
```

### 4. Proteger Último Admin

```javascript
// No eliminar el último admin
const user = await User.findById(userId);

if (user.role === 'admin') {
  const adminCount = await User.countDocuments({ role: 'admin' });
  
  if (adminCount === 1) {
    return res.status(400).json({
      message: 'No se puede eliminar el último administrador'
    });
  }
}

await User.findByIdAndDelete(userId);
```

---

## 📝 Resumen

**Propósito:**
- Gestionar usuarios y autenticación
- Hash automático de contraseñas
- Control de roles (user/admin)

**Campos clave:**
- `email`: Único, lowercase, usado para login
- `password`: Hasheada automáticamente con bcrypt
- `name`: Nombre del usuario
- `role`: 'user' o 'admin' (default: 'user')

**Seguridad:**
- Hash automático con bcrypt (10 rounds)
- Password nunca expuesta en JSON
- Método comparePassword para verificación segura
- Email único para evitar duplicados

**Métodos:**
- `comparePassword()`: Verificar contraseña en login
- `toJSON()`: Excluir password de respuestas

**Middleware:**
- `pre-save`: Hashea password si cambió

**Índices:**
- email (único y optimizado)
- role (para filtrar por rol)

---

¡Documentación completa del modelo de Usuario! Este es el sistema de autenticación y seguridad. 🔐👤

