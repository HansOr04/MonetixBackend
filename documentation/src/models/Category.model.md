# Documentación ULTRA Didáctica: Category.model.ts

**Ubicación:** `src/models/Category.model.ts`

**Propósito:** Este archivo define el **modelo de Categorías** del sistema. Las categorías organizan transacciones en grupos lógicos (Comida, Transporte, Salario, etc.). El sistema incluye **categorías predeterminadas** (del sistema) y permite a los usuarios crear **categorías personalizadas**. Es como tener carpetas predefinidas y la opción de crear tus propias carpetas personalizadas.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina organizar tus transacciones:

```
Sin categorías:
- Lista desordenada de transacciones
- Difícil analizar patrones
- No se puede agrupar gastos similares

Con categorías:
📁 Comida: $500
📁 Transporte: $200
📁 Entretenimiento: $150
📁 Salario: $3000
→ Organizado y fácil de analizar
```

**Dos tipos de categorías:**

```
🔒 Categorías del sistema (isDefault: true)
- Predefinidas para todos los usuarios
- No se pueden eliminar
- Ejemplos: Comida, Transporte, Salario

🔓 Categorías personalizadas (isDefault: false)
- Creadas por el usuario
- Específicas para cada usuario
- Ejemplos: "Gym", "Clases de inglés", "Freelance"
```

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  IMPORTACIONES (línea 1)                │
├──────────────────────────────────────────┤
│  INTERFACE ICategory (líneas 6-17)      │
│  └─ Define estructura TypeScript        │
├──────────────────────────────────────────┤
│  SCHEMA categorySchema (líneas 22-69)   │
│  ├─ name (nombre)                       │
│  ├─ type (income/expense)               │
│  ├─ icon (emoji)                        │
│  ├─ color (hexadecimal)                 │
│  ├─ description (opcional)              │
│  ├─ userId (null para sistema)          │
│  └─ isDefault (sistema vs personal)     │
├──────────────────────────────────────────┤
│  ÍNDICE (línea 75)                      │
│  └─ Nombres únicos por usuario          │
├──────────────────────────────────────────┤
│  MIDDLEWARE pre-save (líneas 80-85)     │
│  └─ Capitalizar nombre                  │
├──────────────────────────────────────────┤
│  MÉTODO toJSON (líneas 90-103)          │
│  └─ Formatear respuesta                 │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (línea 105)                │
│  └─ Modelo de Mongoose                  │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis Línea por Línea

## 🔷 INTERFACE ICategory (Líneas 6-17)

```typescript
export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  description?: string;
  userId?: mongoose.Types.ObjectId;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Campos Explicados

**Línea 8: name**
```typescript
name: string;
```
- Nombre de la categoría
- Ejemplos: `"Comida"`, `"Transporte"`, `"Salario"`

---

**Línea 9: type**
```typescript
type: 'income' | 'expense';
```

**Tipos:**

**income (Ingreso)**
```javascript
{
  name: 'Salario',
  type: 'income',
  icon: '💰'
}
```

**expense (Gasto)**
```javascript
{
  name: 'Comida',
  type: 'expense',
  icon: '🍔'
}
```

---

**Línea 10: icon**
```typescript
icon?: string;
```
- Emoji que representa la categoría
- Opcional (?)
- Default: `'💰'`

**Ejemplos:**
```javascript
{ name: 'Comida', icon: '🍔' }
{ name: 'Transporte', icon: '🚗' }
{ name: 'Entretenimiento', icon: '🎬' }
{ name: 'Salario', icon: '💰' }
{ name: 'Salud', icon: '⚕️' }
```

---

**Línea 11: color**
```typescript
color?: string;
```
- Color en formato hexadecimal
- Opcional (?)
- Default: `'#6D9C71'` (verde matcha)

**Ejemplos:**
```javascript
{ name: 'Comida', color: '#FF6B6B' }      // Rojo
{ name: 'Transporte', color: '#4ECDC4' }  // Turquesa
{ name: 'Salario', color: '#95E1D3' }     // Verde claro
```

**Validación:**
```javascript
// ✅ Válido
color: '#FF6B6B'  // 6 dígitos hexadecimales

// ❌ Inválido
color: '#FF6'     // Muy corto
color: 'red'      // No es hexadecimal
color: '#GGGGGG'  // Caracteres inválidos
```

---

**Línea 12: description**
```typescript
description?: string;
```
- Descripción opcional de la categoría
- Máximo 200 caracteres

**Ejemplo:**
```javascript
{
  name: 'Freelance',
  type: 'income',
  description: 'Ingresos por proyectos de desarrollo web'
}
```

---

**Línea 13: userId**
```typescript
userId?: mongoose.Types.ObjectId;
```

**Dos casos:**

**1. Categoría del sistema (userId = null)**
```javascript
{
  name: 'Comida',
  userId: null,
  isDefault: true
}
// Disponible para TODOS los usuarios
```

**2. Categoría personalizada (userId = ObjectId)**
```javascript
{
  name: 'Clases de inglés',
  userId: '507f191e810c19729de860ea',
  isDefault: false
}
// Solo para este usuario
```

---

**Línea 14: isDefault**
```typescript
isDefault: boolean;
```

**Valores:**

**true: Categoría del sistema**
```javascript
{
  name: 'Comida',
  isDefault: true,
  userId: null
}
// No se puede eliminar
// Disponible para todos
```

**false: Categoría personalizada**
```javascript
{
  name: 'Gym',
  isDefault: false,
  userId: '507f...'
}
// Se puede eliminar
// Solo para este usuario
```

---

## 🔶 SCHEMA categorySchema (Líneas 22-69)

### Líneas 24-30: name

```typescript
name: {
  type: String,
  required: [true, 'El nombre de la categoría es requerido'],
  trim: true,
  minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
  maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
},
```

**Validaciones:**

**trim: true**
```javascript
// Entrada
name: '  Comida  '

// Guardado
name: 'Comida'  // Sin espacios extra
```

**minlength: 2**
```javascript
// ❌ Muy corto
name: 'A'  // 1 carácter
// Error: El nombre debe tener al menos 2 caracteres

// ✅ Válido
name: 'Gym'  // 3 caracteres
```

**maxlength: 50**
```javascript
// ❌ Muy largo
name: 'A'.repeat(51)  // 51 caracteres
// Error: El nombre no puede exceder 50 caracteres
```

---

### Líneas 31-38: type

```typescript
type: {
  type: String,
  required: [true, 'El tipo de categoría es requerido'],
  enum: {
    values: ['income', 'expense'],
    message: 'El tipo debe ser "income" o "expense"',
  },
},
```

**enum:**
- Solo permite `'income'` o `'expense'`

**Ejemplo de error:**
```javascript
await Category.create({
  name: 'Test',
  type: 'invalid'  // ❌ No está en enum
});

// Error: El tipo debe ser "income" o "expense"
```

---

### Líneas 39-43: icon

```typescript
icon: {
  type: String,
  trim: true,
  default: '💰',
},
```

**default: '💰'**
```javascript
// Sin especificar icon
await Category.create({
  name: 'Comida',
  type: 'expense'
});

// Resultado
{
  name: 'Comida',
  icon: '💰'  // ← Default aplicado
}
```

---

### Líneas 44-49: color

```typescript
color: {
  type: String,
  trim: true,
  default: '#6D9C71',
  match: [/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido'],
},
```

**Regex explicado:**
```javascript
/^#[0-9A-Fa-f]{6}$/

^        → Inicio de string
#        → Debe empezar con #
[0-9A-Fa-f] → Dígitos 0-9 o letras A-F (mayúsculas o minúsculas)
{6}      → Exactamente 6 caracteres
$        → Fin de string
```

**Ejemplos:**
```javascript
// ✅ Válidos
'#FF6B6B'
'#4ecdc4'
'#000000'
'#FFFFFF'

// ❌ Inválidos
'#FF6'      // Muy corto
'#GGGGGG'   // G no es hexadecimal
'FF6B6B'    // Falta #
'#FF6B6B00' // Muy largo
```

---

### Líneas 50-54: description

```typescript
description: {
  type: String,
  trim: true,
  maxlength: [200, 'La descripción no puede exceder 200 caracteres'],
},
```

**Opcional:**
- No es `required`
- Puede ser `undefined`

---

### Líneas 55-59: userId

```typescript
userId: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  default: null,
},
```

**default: null**
```javascript
// Categoría del sistema
{
  name: 'Comida',
  userId: null  // ← Default
}

// Categoría personalizada
{
  name: 'Gym',
  userId: '507f191e810c19729de860ea'
}
```

**ref: 'User'**
- Permite `populate()` para obtener datos del usuario

---

### Líneas 60-63: isDefault

```typescript
isDefault: {
  type: Boolean,
  default: false,
},
```

**default: false**
```javascript
// Categoría personalizada (default)
{
  name: 'Gym',
  isDefault: false  // ← Default
}

// Categoría del sistema (especificado)
{
  name: 'Comida',
  isDefault: true
}
```

---

## 🔸 ÍNDICE (Línea 75)

```typescript
categorySchema.index({ name: 1, userId: 1, type: 1 }, { unique: true });
```

**¿Qué hace?**
- Asegura que no haya categorías duplicadas
- Combinación única de: `name` + `userId` + `type`

### Casos de Uso

**Caso 1: Categorías del sistema**
```javascript
// ✅ Primera categoría "Comida" del sistema
{
  name: 'Comida',
  userId: null,
  type: 'expense',
  isDefault: true
}

// ❌ Intento de duplicar
{
  name: 'Comida',
  userId: null,
  type: 'expense',
  isDefault: true
}
// Error: Duplicate key error
```

---

**Caso 2: Categorías personalizadas de diferentes usuarios**
```javascript
// ✅ Usuario A crea "Gym"
{
  name: 'Gym',
  userId: '507f...A',
  type: 'expense'
}

// ✅ Usuario B también puede crear "Gym"
{
  name: 'Gym',
  userId: '507f...B',
  type: 'expense'
}
// OK: Diferentes userId
```

---

**Caso 3: Mismo usuario, diferentes tipos**
```javascript
// ✅ Usuario crea "Freelance" como ingreso
{
  name: 'Freelance',
  userId: '507f...',
  type: 'income'
}

// ✅ Mismo usuario crea "Freelance" como gasto
{
  name: 'Freelance',
  userId: '507f...',
  type: 'expense'
}
// OK: Diferentes type
```

---

**Caso 4: Duplicado del mismo usuario**
```javascript
// ✅ Primera vez
{
  name: 'Gym',
  userId: '507f...',
  type: 'expense'
}

// ❌ Intento de duplicar
{
  name: 'Gym',
  userId: '507f...',
  type: 'expense'
}
// Error: Duplicate key error
```

---

## 🔹 MIDDLEWARE pre-save (Líneas 80-85)

```typescript
categorySchema.pre('save', function (next) {
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
  }
  next();
});
```

**¿Qué hace?**
- Capitaliza el nombre antes de guardar
- Primera letra mayúscula, resto minúsculas

**Transformación:**
```javascript
// Entrada
name: 'COMIDA'

// Guardado
name: 'Comida'

// Entrada
name: 'transporte'

// Guardado
name: 'Transporte'

// Entrada
name: 'eNtReTenImIeNtO'

// Guardado
name: 'Entretenimiento'
```

**Código explicado:**
```javascript
this.name.charAt(0).toUpperCase()  // Primera letra mayúscula
+ 
this.name.slice(1).toLowerCase()   // Resto minúsculas

// Ejemplo: 'COMIDA'
'COMIDA'.charAt(0).toUpperCase()  // 'C'
'COMIDA'.slice(1).toLowerCase()   // 'omida'
// Resultado: 'Comida'
```

---

## 🔺 MÉTODO toJSON (Líneas 90-103)

```typescript
categorySchema.methods.toJSON = function () {
  const category = this.toObject();
  return {
    id: category._id,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    description: category.description,
    isDefault: category.isDefault,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};
```

**¿Qué hace?**
- Personaliza la respuesta JSON
- Renombra `_id` a `id`
- **Excluye `userId`** (no se expone en API)

**Transformación:**
```javascript
// Documento en MongoDB
{
  _id: ObjectId('507f191e810c19729de860ea'),
  name: 'Comida',
  type: 'expense',
  icon: '🍔',
  color: '#FF6B6B',
  description: 'Gastos en alimentos',
  userId: ObjectId('507f191e810c19729de860eb'),
  isDefault: false,
  createdAt: ISODate('2025-11-27T...'),
  updatedAt: ISODate('2025-11-27T...')
}

// Respuesta JSON
{
  "id": "507f191e810c19729de860ea",
  "name": "Comida",
  "type": "expense",
  "icon": "🍔",
  "color": "#FF6B6B",
  "description": "Gastos en alimentos",
  "isDefault": false,
  "createdAt": "2025-11-27T...",
  "updatedAt": "2025-11-27T..."
}
// userId NO incluido (privacidad)
```

---

## 🎯 Ejemplos Completos

### Ejemplo 1: Crear Categoría del Sistema

```javascript
const category = await Category.create({
  name: 'comida',  // Se capitalizará a "Comida"
  type: 'expense',
  icon: '🍔',
  color: '#FF6B6B',
  description: 'Gastos en alimentos y bebidas',
  userId: null,     // Categoría del sistema
  isDefault: true   // No se puede eliminar
});

console.log(category);
// {
//   id: '507f...',
//   name: 'Comida',  // ← Capitalizado
//   type: 'expense',
//   icon: '🍔',
//   color: '#FF6B6B',
//   description: 'Gastos en alimentos y bebidas',
//   isDefault: true,
//   createdAt: '2025-11-27T...',
//   updatedAt: '2025-11-27T...'
// }
```

---

### Ejemplo 2: Crear Categoría Personalizada

```javascript
const category = await Category.create({
  name: 'gym',  // Se capitalizará a "Gym"
  type: 'expense',
  icon: '💪',
  color: '#4ECDC4',
  description: 'Membresía y clases de gimnasio',
  userId: '507f191e810c19729de860ea',  // Usuario específico
  isDefault: false  // Se puede eliminar
});

console.log(category);
// {
//   id: '507f...',
//   name: 'Gym',  // ← Capitalizado
//   type: 'expense',
//   icon: '💪',
//   color: '#4ECDC4',
//   description: 'Membresía y clases de gimnasio',
//   isDefault: false,
//   createdAt: '2025-11-27T...',
//   updatedAt: '2025-11-27T...'
// }
```

---

### Ejemplo 3: Obtener Categorías del Usuario

```javascript
// Obtener categorías del sistema + personalizadas del usuario
const categories = await Category.find({
  $or: [
    { isDefault: true },                    // Categorías del sistema
    { userId: '507f191e810c19729de860ea' }  // Categorías del usuario
  ]
}).sort({ name: 1 });

console.log(categories);
// [
//   { name: 'Comida', isDefault: true, ... },      // Sistema
//   { name: 'Gym', isDefault: false, ... },        // Personal
//   { name: 'Salario', isDefault: true, ... },     // Sistema
//   { name: 'Transporte', isDefault: true, ... }   // Sistema
// ]
```

---

### Ejemplo 4: Filtrar por Tipo

```javascript
// Solo categorías de gastos
const expenseCategories = await Category.find({
  type: 'expense',
  $or: [
    { isDefault: true },
    { userId: '507f191e810c19729de860ea' }
  ]
});

// Solo categorías de ingresos
const incomeCategories = await Category.find({
  type: 'income',
  $or: [
    { isDefault: true },
    { userId: '507f191e810c19729de860ea' }
  ]
});
```

---

## 📊 Categorías Predeterminadas del Sistema

### Categorías de Gastos (expense)

```javascript
const defaultExpenseCategories = [
  { name: 'Comida', icon: '🍔', color: '#FF6B6B' },
  { name: 'Transporte', icon: '🚗', color: '#4ECDC4' },
  { name: 'Entretenimiento', icon: '🎬', color: '#95E1D3' },
  { name: 'Salud', icon: '⚕️', color: '#F38181' },
  { name: 'Educación', icon: '📚', color: '#AA96DA' },
  { name: 'Vivienda', icon: '🏠', color: '#FCBAD3' },
  { name: 'Servicios', icon: '💡', color: '#A8D8EA' },
  { name: 'Otros', icon: '📦', color: '#6D9C71' }
];
```

### Categorías de Ingresos (income)

```javascript
const defaultIncomeCategories = [
  { name: 'Salario', icon: '💰', color: '#95E1D3' },
  { name: 'Freelance', icon: '💼', color: '#AA96DA' },
  { name: 'Inversiones', icon: '📈', color: '#4ECDC4' },
  { name: 'Otros', icon: '💵', color: '#6D9C71' }
];
```

---

## ✅ Mejores Prácticas

### 1. Siempre Filtrar por Usuario

```javascript
// ❌ Incorrecto: Obtiene TODAS las categorías
const categories = await Category.find();

// ✅ Correcto: Solo del sistema + del usuario
const categories = await Category.find({
  $or: [
    { isDefault: true },
    { userId: req.user.id }
  ]
});
```

### 2. No Eliminar Categorías del Sistema

```javascript
// Verificar antes de eliminar
const category = await Category.findById(id);

if (category.isDefault) {
  return res.status(400).json({
    message: 'No se pueden eliminar categorías del sistema'
  });
}

await Category.findByIdAndDelete(id);
```

### 3. Validar Pertenencia

```javascript
// Verificar que la categoría pertenece al usuario
const category = await Category.findOne({
  _id: categoryId,
  $or: [
    { isDefault: true },
    { userId: req.user.id }
  ]
});

if (!category) {
  return res.status(404).json({
    message: 'Categoría no encontrada'
  });
}
```

---

## 📝 Resumen

**Propósito:**
- Organizar transacciones en categorías
- Soportar categorías del sistema y personalizadas

**Tipos:**
- `income`: Categorías de ingresos
- `expense`: Categorías de gastos

**Campos clave:**
- `name`: Nombre de la categoría (capitalizado automáticamente)
- `type`: income o expense
- `icon`: Emoji representativo
- `color`: Color hexadecimal
- `userId`: null para sistema, ObjectId para personalizadas
- `isDefault`: true para sistema, false para personalizadas

**Índice único:**
- Combinación de `name` + `userId` + `type`
- Previene duplicados

**Middleware:**
- `pre-save`: Capitaliza el nombre

**toJSON:**
- Excluye `userId` de la respuesta

---

¡Documentación completa del modelo de Categorías! Este es el sistema de organización de transacciones. 📁🎨

