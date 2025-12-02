# Documentación ULTRA Didáctica: validate.middleware.ts

**Ubicación:** `src/middlewares/validate.middleware.ts`

**Propósito:** Este archivo es el **"inspector de calidad de datos"** del sistema. Valida que los datos enviados por el cliente cumplan con reglas específicas antes de procesarlos. Usa la librería **Joi** para definir esquemas de validación. Es como un control de calidad que rechaza productos defectuosos antes de que entren a la fábrica.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina una fábrica que recibe materias primas:

```
❌ Sin validación:
Cliente envía:
- email: "no-es-email"
- edad: -5
- nombre: ""
→ Datos inválidos causan errores en BD

✅ Con validación:
Middleware verifica:
- email: debe ser formato válido
- edad: debe ser número positivo
- nombre: debe tener mínimo 2 caracteres
→ Solo datos válidos pasan ✅
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (líneas 1-2)             │
│  ├─ Express types                       │
│  └─ Joi (librería de validación)       │
├──────────────────────────────────────────┤
│  FUNCIÓN validate (líneas 4-35)         │
│  ├─ Recibe schema y source              │
│  ├─ Retorna middleware                  │
│  ├─ Valida datos                        │
│  ├─ Formatea errores                    │
│  └─ Continuar o rechazar                │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

### Líneas 1-2: Importaciones

```typescript
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
```

**¿Qué importa?**

**Línea 1: Express**
- Tipos para middleware

**Línea 2: Joi**
- Librería de validación de esquemas
- Permite definir reglas de validación declarativas

**¿Qué es Joi?**
```javascript
// Definir schema
const schema = Joi.object({
  email: Joi.string().email().required(),
  age: Joi.number().min(0).max(120).required(),
  name: Joi.string().min(2).max(50).required()
});

// Validar datos
const { error, value } = schema.validate(data);
```

---

## 🔷 FUNCIÓN validate (Líneas 4-35)

### Línea 4: Firma de la Función

```typescript
export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
```

**¿Qué es?**
- **Higher-order function**: Retorna middleware
- Recibe schema de validación y fuente de datos

**Parámetros:**

**1. schema: Joi.ObjectSchema**
- Esquema de validación Joi
- Define las reglas que los datos deben cumplir

**2. source: 'body' | 'query' | 'params'**
- Dónde buscar los datos a validar
- Default: `'body'`

**Fuentes de datos:**
```javascript
// body: Datos en el cuerpo de la solicitud (POST, PUT, PATCH)
POST /api/users
Body: { email: 'user@example.com', password: '123456' }
→ req.body

// query: Parámetros en la URL (GET)
GET /api/users?page=1&limit=10
→ req.query = { page: '1', limit: '10' }

// params: Parámetros de ruta (GET, PUT, DELETE)
GET /api/users/507f191e810c19729de860ea
→ req.params = { id: '507f191e810c19729de860ea' }
```

---

### Línea 5: Retornar Middleware

```typescript
return (req: Request, res: Response, next: NextFunction): void => {
```

**Patrón:**
- Función que retorna middleware configurado
- Similar a `authorizeRoles`

---

### Línea 6: Seleccionar Datos a Validar

```typescript
const dataToValidate = source === 'query' ? req.query : source === 'params' ? req.params : req.body;
```

**¿Qué hace?**
- Selecciona los datos según el parámetro `source`

**Operador ternario anidado:**
```javascript
// Equivalente a:
let dataToValidate;
if (source === 'query') {
  dataToValidate = req.query;
} else if (source === 'params') {
  dataToValidate = req.params;
} else {
  dataToValidate = req.body;
}
```

**Ejemplo:**
```javascript
// source = 'body'
dataToValidate = req.body
// { email: 'user@example.com', password: '123456' }

// source = 'query'
dataToValidate = req.query
// { page: '1', limit: '10' }

// source = 'params'
dataToValidate = req.params
// { id: '507f191e810c19729de860ea' }
```

---

### Líneas 8-11: Validar Datos

```typescript
const { error, value } = schema.validate(dataToValidate, {
  abortEarly: false,
  stripUnknown: true,
});
```

**¿Qué hace `schema.validate()`?**
- Valida los datos contra el schema
- Retorna objeto con `error` y `value`

**Opciones:**

**1. abortEarly: false**
```javascript
// abortEarly: true (default)
// Se detiene en el primer error
errors = [
  { field: 'email', message: 'Email inválido' }
]

// abortEarly: false
// Retorna TODOS los errores
errors = [
  { field: 'email', message: 'Email inválido' },
  { field: 'age', message: 'Edad debe ser positiva' },
  { field: 'name', message: 'Nombre es requerido' }
]
```

**2. stripUnknown: true**
```javascript
// Datos enviados
{
  email: 'user@example.com',
  password: '123456',
  hackerField: 'malicious'  // ← Campo no definido en schema
}

// stripUnknown: true
// Elimina campos no definidos en schema
value = {
  email: 'user@example.com',
  password: '123456'
  // hackerField eliminado ✅
}

// stripUnknown: false
// Mantiene campos extra
value = {
  email: 'user@example.com',
  password: '123456',
  hackerField: 'malicious'  // ← Peligro
}
```

**Resultado de validate():**
```javascript
// Validación exitosa
{
  error: undefined,
  value: { email: 'user@example.com', password: '123456' }
}

// Validación fallida
{
  error: {
    details: [
      { path: ['email'], message: '"email" must be a valid email' },
      { path: ['age'], message: '"age" must be a positive number' }
    ]
  },
  value: { ... }  // Valor parcialmente validado
}
```

---

### Líneas 13-25: Manejar Errores de Validación

```typescript
if (error) {
  const errors = error.details.map((detail) => ({
    field: detail.path.join('.'),
    message: detail.message,
  }));

  res.status(400).json({
    success: false,
    message: 'Error de validación',
    errors,
  });
  return;
}
```

**¿Qué hace?**
1. Si hay error, formatea los errores
2. Retorna 400 (Bad Request) con lista de errores
3. Termina la ejecución

**Formateo de errores:**
```javascript
// error.details (formato Joi)
[
  {
    path: ['email'],
    message: '"email" must be a valid email',
    type: 'string.email'
  },
  {
    path: ['user', 'age'],
    message: '"age" must be a positive number',
    type: 'number.positive'
  }
]

// errors (formato simplificado)
[
  {
    field: 'email',
    message: '"email" must be a valid email'
  },
  {
    field: 'user.age',
    message: '"age" must be a positive number'
  }
]
```

**¿Qué es `detail.path.join('.')`?**
```javascript
// Path simple
detail.path = ['email']
detail.path.join('.') = 'email'

// Path anidado
detail.path = ['user', 'address', 'city']
detail.path.join('.') = 'user.address.city'
```

**Respuesta de error:**
```json
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    },
    {
      "field": "age",
      "message": "\"age\" must be a positive number"
    }
  ]
}
```

---

### Líneas 27-31: Actualizar Request Body

```typescript
// Para query y params, no podemos reasignar directamente porque son readonly
// En su lugar, simplemente continuamos - la validación ya pasó
if (source === 'body') {
  req.body = value;
}
```

**¿Por qué actualizar req.body?**
```javascript
// Datos originales
req.body = {
  email: 'USER@EXAMPLE.COM',  // Mayúsculas
  age: '25',                   // String
  extraField: 'hack'           // Campo extra
}

// Después de validación con schema que:
// - Convierte email a minúsculas
// - Convierte age a número
// - Elimina campos extra (stripUnknown)

req.body = {
  email: 'user@example.com',  // ← Normalizado
  age: 25,                     // ← Convertido a número
  // extraField eliminado
}
```

**¿Por qué no actualizar query y params?**
```typescript
// req.query y req.params son readonly en TypeScript
req.query = value;   // ❌ Error de compilación
req.params = value;  // ❌ Error de compilación

// Solo req.body es mutable
req.body = value;    // ✅ OK
```

---

### Línea 33: Continuar

```typescript
next();
```

**¿Qué hace?**
- Continúa al siguiente middleware/controlador
- Solo se ejecuta si la validación pasó

---

## 🔸 Ejemplos de Uso

### Ejemplo 1: Validar Body (Registro de Usuario)

```typescript
// schemas/user.schema.ts
import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email debe ser válido',
      'any.required': 'Email es requerido'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Contraseña debe tener al menos 6 caracteres',
      'any.required': 'Contraseña es requerida'
    }),
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
});

// routes/auth.routes.ts
import { validate } from '../middlewares/validate.middleware';
import { registerSchema } from '../schemas/user.schema';

router.post('/register',
  validate(registerSchema),  // Valida req.body
  authController.register
);
```

**Request válido:**
```javascript
POST /api/auth/register
Body: {
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe'
}

// ✅ Pasa validación
// Continúa a authController.register
```

**Request inválido:**
```javascript
POST /api/auth/register
Body: {
  email: 'not-an-email',
  password: '123',
  name: 'J'
}

// ❌ Falla validación
// Respuesta:
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    { "field": "email", "message": "Email debe ser válido" },
    { "field": "password", "message": "Contraseña debe tener al menos 6 caracteres" },
    { "field": "name", "message": "\"name\" length must be at least 2 characters long" }
  ]
}
```

---

### Ejemplo 2: Validar Query (Paginación)

```typescript
// schemas/pagination.schema.ts
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  sortBy: Joi.string()
    .valid('date', 'amount', 'createdAt')
    .default('date'),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
});

// routes/transaction.routes.ts
router.get('/',
  authenticate,
  validate(paginationSchema, 'query'),  // Valida req.query
  transactionController.getTransactions
);
```

**Request:**
```javascript
GET /api/transactions?page=2&limit=50&sortBy=amount&sortOrder=asc

// req.query antes de validación (todo strings)
{
  page: '2',
  limit: '50',
  sortBy: 'amount',
  sortOrder: 'asc'
}

// Después de validación (convertidos)
// Nota: req.query no se actualiza, pero la validación pasó
{
  page: 2,        // ← Convertido a número
  limit: 50,      // ← Convertido a número
  sortBy: 'amount',
  sortOrder: 'asc'
}
```

---

### Ejemplo 3: Validar Params (ID de MongoDB)

```typescript
// schemas/id.schema.ts
export const mongoIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID debe ser un ObjectId válido de MongoDB'
    })
});

// routes/user.routes.ts
router.get('/:id',
  authenticate,
  validate(mongoIdSchema, 'params'),  // Valida req.params
  userController.getUserById
);
```

**Request válido:**
```javascript
GET /api/users/507f191e810c19729de860ea

// req.params
{
  id: '507f191e810c19729de860ea'
}

// ✅ Pasa validación (formato ObjectId correcto)
```

**Request inválido:**
```javascript
GET /api/users/invalid-id

// req.params
{
  id: 'invalid-id'
}

// ❌ Falla validación
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    { "field": "id", "message": "ID debe ser un ObjectId válido de MongoDB" }
  ]
}
```

---

## 📊 Esquemas Joi Comunes

### Tipos Básicos

```typescript
// String
Joi.string()
  .min(2)
  .max(50)
  .required()
  .trim()
  .lowercase()

// Number
Joi.number()
  .integer()
  .min(0)
  .max(100)
  .required()

// Boolean
Joi.boolean()
  .required()

// Date
Joi.date()
  .iso()
  .min('now')
  .required()

// Email
Joi.string()
  .email()
  .required()

// Enum
Joi.string()
  .valid('user', 'admin', 'moderator')
  .required()

// Array
Joi.array()
  .items(Joi.string())
  .min(1)
  .max(10)
  .required()

// Object anidado
Joi.object({
  name: Joi.string().required(),
  age: Joi.number().required()
})
```

### Esquema de Transacción

```typescript
export const transactionSchema = Joi.object({
  type: Joi.string()
    .valid('income', 'expense')
    .required(),
  amount: Joi.number()
    .positive()
    .required(),
  categoryId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
  description: Joi.string()
    .max(200)
    .optional(),
  date: Joi.date()
    .iso()
    .max('now')
    .required()
});
```

---

## 🎓 Conceptos Clave

### 1. Validación Declarativa

**Imperativa (sin Joi):**
```typescript
if (!email) {
  return res.status(400).json({ message: 'Email requerido' });
}
if (!email.includes('@')) {
  return res.status(400).json({ message: 'Email inválido' });
}
if (password.length < 6) {
  return res.status(400).json({ message: 'Contraseña muy corta' });
}
// ... más validaciones
```

**Declarativa (con Joi):**
```typescript
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

validate(schema);  // ✅ Limpio y claro
```

### 2. Código de Estado 400

```
400 Bad Request = Datos inválidos enviados por el cliente
```

**Diferencia con otros códigos:**
```
400 Bad Request = Datos mal formados
401 Unauthorized = No autenticado
403 Forbidden = Sin permisos
404 Not Found = Recurso no existe
422 Unprocessable Entity = Datos válidos pero lógica incorrecta
500 Internal Server Error = Error del servidor
```

### 3. stripUnknown

**Seguridad:**
```javascript
// Cliente malicioso envía:
{
  email: 'user@example.com',
  password: '123456',
  isAdmin: true  // ← Intento de escalar privilegios
}

// stripUnknown: true elimina campos extra
req.body = {
  email: 'user@example.com',
  password: '123456'
  // isAdmin eliminado ✅
}
```

---

## ✅ Mejores Prácticas

### 1. Schemas en Archivos Separados

```typescript
// ❌ Schema en ruta
router.post('/users', validate(Joi.object({ ... })), controller);

// ✅ Schema en archivo separado
// schemas/user.schema.ts
export const createUserSchema = Joi.object({ ... });

// routes/user.routes.ts
import { createUserSchema } from '../schemas/user.schema';
router.post('/users', validate(createUserSchema), controller);
```

### 2. Mensajes Personalizados

```typescript
const schema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Por favor ingresa un email válido',
      'any.required': 'El email es obligatorio',
      'string.empty': 'El email no puede estar vacío'
    })
});
```

### 3. Valores por Defecto

```typescript
const schema = Joi.object({
  page: Joi.number().default(1),
  limit: Joi.number().default(20),
  sortOrder: Joi.string().default('desc')
});
```

---

## 📝 Resumen

**Propósito:**
- Validar datos de entrada (body, query, params)
- Prevenir datos inválidos en la aplicación

**Funcionamiento:**
1. Recibe schema Joi y fuente de datos
2. Valida datos contra schema
3. Si hay errores, retorna 400 con lista de errores
4. Si pasa, actualiza req.body y continúa

**Ventajas:**
- ✅ Validación declarativa y clara
- ✅ Mensajes de error detallados
- ✅ Conversión automática de tipos
- ✅ Eliminación de campos no deseados
- ✅ Reutilizable con diferentes schemas

**Uso:**
```typescript
router.post('/route',
  validate(schema),           // body (default)
  validate(schema, 'query'),  // query
  validate(schema, 'params'), // params
  controller
);
```

---

¡Documentación completa del middleware de validación! Este es el inspector de calidad que asegura datos limpios y válidos. ✅🔍

