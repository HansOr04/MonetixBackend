# Monetix Backend

Backend API REST para Monetix, un sistema de gestión financiera desarrollado con Node.js, Express y TypeScript.

## Descripción

Monetix Backend es una API RESTful robusta que proporciona servicios de autenticación, gestión de usuarios y operaciones administrativas. El sistema está diseñado con arquitectura modular, validación de datos y autenticación basada en JWT.

## Características Principales

- **Autenticación y Autorización**: Sistema completo de registro, inicio de sesión y gestión de tokens JWT
- **Gestión de Usuarios**: CRUD completo de usuarios con diferentes roles (usuario/administrador)
- **Validación de Datos**: Validación de esquemas usando Joi
- **Seguridad**: Encriptación de contraseñas con bcrypt, protección de rutas mediante middlewares
- **Base de Datos**: MongoDB con Mongoose ODM
- **TypeScript**: Código fuertemente tipado para mayor robustez y mantenibilidad
- **CORS Configurado**: Soporte para aplicaciones frontend separadas

## Tecnologías Utilizadas

- **Runtime**: Node.js
- **Framework**: Express 5.x
- **Lenguaje**: TypeScript 5.x
- **Base de Datos**: MongoDB con Mongoose 8.x
- **Autenticación**: JSON Web Tokens (JWT)
- **Seguridad**: bcryptjs para hash de contraseñas
- **Validación**: Joi para validación de esquemas
- **Desarrollo**: ts-node-dev para hot-reloading

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- Node.js (versión 16.x o superior)
- npm o yarn
- MongoDB (versión 5.x o superior)
- Git

## Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd MonetixBackend
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Puerto del servidor
PORT=5000

# Configuración de MongoDB
MONGODB_URI=mongodb://localhost:27017/monetix

# JWT Secret
JWT_SECRET=tu_clave_secreta_muy_segura

# Configuración de CORS
CORS_ORIGIN=http://localhost:5173

# Entorno
NODE_ENV=development
```

### 4. Inicializar Usuario Administrador

Para crear el primer usuario administrador, ejecuta:

```bash
npm run seed:admin
```

## Uso

### Modo Desarrollo

Inicia el servidor en modo desarrollo con hot-reloading:

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

### Modo Producción

#### Compilar el Proyecto

```bash
npm run build
```

#### Ejecutar en Producción

```bash
npm start
```

## Estructura del Proyecto

```
MonetixBackend/
├── src/
│   ├── config/          # Configuraciones (base de datos, etc.)
│   ├── controllers/     # Controladores de las rutas
│   ├── middlewares/     # Middlewares personalizados
│   ├── models/          # Modelos de Mongoose
│   ├── routes/          # Definición de rutas
│   ├── types/           # Tipos TypeScript personalizados
│   ├── validators/      # Esquemas de validación con Joi
│   ├── scripts/         # Scripts de utilidad
│   ├── app.ts           # Configuración de Express
│   └── server.ts        # Punto de entrada de la aplicación
├── dist/                # Código compilado (generado)
├── .env                 # Variables de entorno (no versionado)
├── package.json
├── tsconfig.json
└── README.md
```

## Endpoints Principales

### Autenticación

- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener información del usuario autenticado

### Usuarios (Requiere Autenticación)

- `GET /api/users` - Listar todos los usuarios (solo admin)
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario (solo admin)

### General

- `GET /` - Estado de la API y endpoints disponibles

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con hot-reloading |
| `npm run build` | Compila el proyecto TypeScript a JavaScript |
| `npm start` | Ejecuta el servidor en modo producción |
## Seguridad

El proyecto implementa las siguientes medidas de seguridad:

- Contraseñas hasheadas con bcryptjs (salt rounds: 10)
- Autenticación basada en JWT
- Validación de datos de entrada con Joi
- Middlewares de autorización por roles
- CORS configurado para dominios específicos
- Variables de entorno para información sensible

## Variables de Entorno

| Variable | Descripción | Requerido | Valor por Defecto |
|----------|-------------|-----------|-------------------|
| `PORT` | Puerto del servidor | No | 5000 |
| `MONGODB_URI` | URI de conexión a MongoDB | Sí | - |
| `JWT_SECRET` | Clave secreta para JWT | Sí | - |
| `CORS_ORIGIN` | Origen permitido para CORS | No | http://localhost:5173 |
| `NODE_ENV` | Entorno de ejecución | No | development |

## Desarrollo

### Convenciones de Código

- Utilizar TypeScript para todo el código fuente
- Seguir el principio de responsabilidad única en controladores
- Validar todos los datos de entrada con esquemas Joi
- Documentar funciones complejas con comentarios JSDoc
- Usar async/await para operaciones asíncronas

### Añadir Nuevas Rutas

1. Crear el modelo en `src/models/`
2. Crear el controlador en `src/controllers/`
3. Crear el validador en `src/validators/`
4. Definir las rutas en `src/routes/`
5. Registrar las rutas en `src/app.ts`

## Resolución de Problemas

### El servidor no inicia

- Verifica que MongoDB esté en ejecución
- Asegúrate de que el archivo `.env` existe y está correctamente configurado
- Comprueba que el puerto especificado no esté en uso

### Error de conexión a la base de datos

- Confirma que MongoDB esté corriendo: `mongod --version`
- Verifica la URI de conexión en el archivo `.env`
- Revisa los logs del servidor para más detalles

### Errores de TypeScript

- Ejecuta `npm install` para asegurar que todas las dependencias estén instaladas
- Verifica que `tsconfig.json` esté correctamente configurado

## Contribución

1. Crea un fork del proyecto
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios y haz commit (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## Licencia

ISC

## Contacto

Para preguntas o soporte, por favor abre un issue en el repositorio del proyecto.

---

Desarrollado con Node.js, Express y TypeScript

## Arquitectura y Patrones de Diseño

El proyecto sigue una arquitectura limpia y modular, implementando varios patrones de diseño y principios SOLID para asegurar escalabilidad y mantenibilidad.

### Patrones de Diseño Utilizados

1.  **Repository Pattern**:
    *   **Uso**: Se utiliza para abstraer la lógica de acceso a datos. Los controladores y servicios no interactúan directamente con los modelos de Mongoose, sino a través de repositorios (`src/repositories`).
    *   **Beneficio**: Permite cambiar la implementación de la base de datos sin afectar a la lógica de negocio y facilita las pruebas unitarias al poder mockear la capa de datos.

2.  **Dependency Injection (Inyección de Dependencias)**:
    *   **Uso**: Implementado a través de la librería `inversify`. Las dependencias (como repositorios o servicios) se inyectan en las clases que las necesitan en lugar de instanciarse directamente dentro de ellas.
    *   **Beneficio**: Reduce el acoplamiento entre clases y mejora la testabilidad y modularidad del código.

### Principios SOLID Aplicados

1.  **Single Responsibility Principle (SRP - Principio de Responsabilidad Única)**:
    *   **Aplicación**: Cada clase tiene una única responsabilidad.
        *   **Controladores**: Manejan solo la entrada/salida HTTP.
        *   **Servicios**: Contienen la lógica de negocio pura.
        *   **Repositorios**: Se encargan de las consultas a la base de datos.
    *   **Beneficio**: Hace que el código sea más fácil de entender, mantener y modificar.

2.  **Dependency Inversion Principle (DIP - Principio de Inversión de Dependencias)**:
    *   **Aplicación**: Los módulos de alto nivel (Servicios/Controladores) no dependen de módulos de bajo nivel (Implementaciones concretas de Repositorios), sino de abstracciones (Interfaces).
    *   **Beneficio**: Permite desacoplar la lógica de negocio de los detalles de implementación (como la base de datos específica), facilitando cambios futuros y la escalabilidad.
