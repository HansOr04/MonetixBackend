# Documentación: database.ts

**Ubicación:** `src/config/database.ts`

**Propósito:** Este archivo configura y establece la conexión con la base de datos MongoDB utilizando Mongoose como ODM (Object Document Mapper).

---

## Análisis Línea por Línea

### Línea 1: Importación de Mongoose
```typescript
import mongoose from "mongoose";
```

**¿Qué hace?**
- Importa la librería `mongoose` completa como un objeto default.
- **Mongoose** es un ODM (Object Document Mapper) para MongoDB y Node.js que proporciona:
  - Una solución basada en esquemas para modelar datos de aplicación
  - Validación de datos incorporada
  - Conversión de tipos
  - Construcción de consultas
  - Hooks de middleware para lógica de negocio
  - Gestión de conexiones a MongoDB

**¿Por qué se usa?**
- Facilita la interacción con MongoDB mediante una API más amigable
- Permite definir esquemas y modelos con TypeScript
- Proporciona métodos para conectar, consultar y manipular datos en MongoDB

---

### Línea 2: Declaración de la función de conexión
```typescript
export const connectDB = async (): Promise<void> => {
```

**¿Qué hace?**
- **`export const`**: Exporta una constante para que pueda ser importada en otros archivos
- **`connectDB`**: Nombre de la función que establece la conexión a la base de datos
- **`async`**: Palabra clave que indica que la función es asíncrona y puede usar `await` internamente
- **`(): Promise<void>`**: Firma de tipo TypeScript que indica:
  - La función no recibe parámetros `()`
  - Retorna una `Promise` (promesa) que al resolverse no devuelve ningún valor (`void`)
  - El `void` significa que la función realiza una acción (conectar a la BD) pero no retorna datos

**¿Por qué es async?**
- La conexión a MongoDB es una operación de I/O (entrada/salida) que toma tiempo
- `async/await` permite esperar la conexión sin bloquear el resto del código
- Facilita el manejo de errores con try/catch

---

### Línea 3: Inicio del bloque try
```typescript
    try {
```

**¿Qué hace?**
- Inicia un bloque `try-catch` para manejo de errores
- Todo el código dentro del `try` será ejecutado y si ocurre algún error, será capturado por el `catch`

**¿Por qué se usa?**
- La conexión a MongoDB puede fallar por múltiples razones:
  - URI de conexión incorrecta
  - Base de datos no disponible
  - Problemas de red
  - Credenciales inválidas
- El `try-catch` permite manejar estos errores de forma controlada

---

### Línea 4: Obtención de la URI de MongoDB
```typescript
        const mongoUri = process.env.MONGODB_URI || "La direccion de la base de datos";
```

**¿Qué hace?**
- **`const mongoUri`**: Declara una constante que almacenará la URI de conexión a MongoDB
- **`process.env.MONGODB_URI`**: Accede a las variables de entorno del proceso Node.js
  - `process` es un objeto global de Node.js que proporciona información sobre el proceso actual
  - `process.env` es un objeto que contiene todas las variables de entorno
  - `MONGODB_URI` es la variable de entorno específica que contiene la cadena de conexión a MongoDB
- **`||`**: Operador OR lógico que actúa como valor por defecto
- **`"La direccion de la base de datos"`**: Valor por defecto si `MONGODB_URI` no está definida

**¿Por qué se usa?**
- **Seguridad**: No se debe hardcodear (escribir directamente) información sensible como URIs de bases de datos en el código
- **Flexibilidad**: Permite usar diferentes bases de datos en diferentes entornos (desarrollo, producción, testing)
- **Buenas prácticas**: Las variables de entorno se definen en archivos `.env` que no se suben al repositorio

**Ejemplo de MONGODB_URI:**
```
mongodb://localhost:27017/monetix
mongodb+srv://usuario:password@cluster.mongodb.net/monetix
```

---

### Línea 5: Conexión a MongoDB
```typescript
        await mongoose.connect(mongoUri);
```

**¿Qué hace?**
- **`await`**: Pausa la ejecución de la función hasta que la promesa se resuelva
- **`mongoose.connect()`**: Método de Mongoose que establece la conexión a MongoDB
  - Acepta como parámetro la URI de conexión
  - Retorna una `Promise` que se resuelve cuando la conexión es exitosa
  - Internamente, Mongoose maneja el pool de conexiones y la reconexión automática
- **`mongoUri`**: La cadena de conexión obtenida en la línea anterior

**¿Qué sucede internamente?**
1. Mongoose parsea la URI de conexión
2. Establece una conexión TCP con el servidor MongoDB
3. Autentica las credenciales (si están en la URI)
4. Selecciona la base de datos especificada
5. Mantiene la conexión abierta para futuras operaciones

**Opciones adicionales (no usadas aquí):**
```typescript
// Ejemplo con opciones (versiones antiguas de Mongoose)
await mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
```
*Nota: En versiones modernas de Mongoose (6+), estas opciones ya no son necesarias.*

---

### Línea 6: Mensaje de éxito
```typescript
        console.log("mongoDB esta conectado")
```

**¿Qué hace?**
- **`console.log()`**: Método global de JavaScript/Node.js que imprime mensajes en la consola
- Imprime el mensaje `"mongoDB esta conectado"` para confirmar que la conexión fue exitosa

**¿Por qué es importante?**
- Proporciona feedback visual en la consola del servidor
- Ayuda en el debugging y monitoreo del estado de la aplicación
- Confirma que la aplicación puede comunicarse con la base de datos

**Mejora sugerida:**
```typescript
console.log("✅ MongoDB está conectado exitosamente");
```

---

### Línea 7: Cierre del bloque try
```typescript
    }
```

**¿Qué hace?**
- Cierra el bloque `try` iniciado en la línea 3
- Si todo el código dentro del `try` se ejecuta sin errores, el flujo continúa después del bloque `catch`

---

### Línea 8: Inicio del bloque catch
```typescript
    catch (error){
```

**¿Qué hace?**
- **`catch`**: Captura cualquier error que ocurra dentro del bloque `try`
- **`error`**: Parámetro que contiene el objeto de error capturado
  - Puede ser de cualquier tipo (Error, string, objeto, etc.)
  - Contiene información sobre qué salió mal

**¿Cuándo se ejecuta?**
- Si `mongoose.connect()` falla
- Si hay un error en la URI de conexión
- Si MongoDB no está disponible
- Si hay problemas de autenticación
- Cualquier otro error durante la conexión

---

### Línea 9: Registro del error
```typescript
        console.error("Error al conectar a mongoDB: ", error);
```

**¿Qué hace?**
- **`console.error()`**: Similar a `console.log()` pero específico para errores
  - En muchas consolas, se muestra en color rojo
  - Se registra en el stream de errores (stderr) en lugar del stream estándar (stdout)
- Imprime el mensaje de error junto con el objeto `error` completo

**¿Por qué se usa console.error en lugar de console.log?**
- Semántica correcta: indica que es un error, no información normal
- Facilita el filtrado de logs en producción
- Herramientas de monitoreo pueden detectar errores más fácilmente

**Información que muestra:**
```
Error al conectar a mongoDB:  MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
    at Connection.openUri (...)
    ...
```

---

### Línea 10: Terminación del proceso
```typescript
        process.exit(1)
```

**¿Qué hace?**
- **`process.exit()`**: Método de Node.js que termina el proceso actual inmediatamente
- **`1`**: Código de salida que indica que el proceso terminó con error
  - `0` = éxito
  - `1` (o cualquier número diferente de 0) = error

**¿Por qué terminar el proceso?**
- Si la aplicación no puede conectarse a la base de datos, no puede funcionar correctamente
- Es mejor fallar rápido y de forma visible que continuar en un estado inválido
- Permite que sistemas de orquestación (Docker, Kubernetes, PM2) detecten el fallo y reinicien la aplicación

**Consideraciones:**
- En desarrollo, esto detiene el servidor y muestra el error claramente
- En producción, herramientas como PM2 o Kubernetes pueden reiniciar automáticamente la aplicación
- Previene que la aplicación acepte peticiones sin tener acceso a la base de datos

---

### Línea 11: Cierre del bloque catch
```typescript
    }
```

**¿Qué hace?**
- Cierra el bloque `catch` iniciado en la línea 8
- Finaliza el manejo de errores

---

### Línea 12: Cierre de la función
```typescript
}
```

**¿Qué hace?**
- Cierra la función `connectDB` declarada en la línea 2
- Finaliza la definición de la función exportada

---

## Flujo de Ejecución

```mermaid
flowchart TD
    A[Inicio: connectDB] --> B[Obtener MONGODB_URI de variables de entorno]
    B --> C{¿URI disponible?}
    C -->|Sí| D[Usar URI de .env]
    C -->|No| E[Usar valor por defecto]
    D --> F[Intentar conectar con mongoose.connect]
    E --> F
    F --> G{¿Conexión exitosa?}
    G -->|Sí| H[Mostrar mensaje de éxito]
    H --> I[Fin: Conexión establecida]
    G -->|No| J[Capturar error en catch]
    J --> K[Mostrar error en consola]
    K --> L[Terminar proceso con código 1]
    L --> M[Fin: Aplicación detenida]
```

---

## Uso en la Aplicación

Esta función se importa y ejecuta típicamente en el archivo principal del servidor (por ejemplo, `server.ts` o `app.ts`):

```typescript
import { connectDB } from './config/database';

// Conectar a la base de datos antes de iniciar el servidor
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo iniciar el servidor:', error);
  });
```

---

## Dependencias

### Externas
- **mongoose** (v6.x o superior): ODM para MongoDB
  - Instalación: `npm install mongoose`
  - Documentación: https://mongoosejs.com/

### Internas de Node.js
- **process**: Objeto global de Node.js (no requiere importación)
  - Proporciona acceso a variables de entorno
  - Permite controlar el proceso de la aplicación

---

## Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `MONGODB_URI` | Cadena de conexión a MongoDB | `mongodb://localhost:27017/monetix` |

**Archivo .env:**
```env
MONGODB_URI=mongodb://localhost:27017/monetix
```

---

## Mejores Prácticas Implementadas

✅ **Manejo de errores**: Uso de try-catch para capturar errores de conexión  
✅ **Variables de entorno**: No hardcodear información sensible  
✅ **Async/await**: Código asíncrono legible y mantenible  
✅ **Fail-fast**: Terminar el proceso si no hay conexión a BD  
✅ **Logging**: Mensajes informativos de éxito y error  

---

## Posibles Mejoras

1. **Agregar opciones de reconexión:**
```typescript
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB desconectado. Intentando reconectar...');
});
```

2. **Validar la URI antes de conectar:**
```typescript
if (!mongoUri || mongoUri === "La direccion de la base de datos") {
  throw new Error('MONGODB_URI no está configurada correctamente');
}
```

3. **Agregar timeout de conexión:**
```typescript
await mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000 // 5 segundos
});
```

4. **Logging más detallado:**
```typescript
console.log(`✅ MongoDB conectado a: ${mongoose.connection.host}`);
```
