import dotenv from 'dotenv';
import app from './app';
import { connectDB } from './config/database';

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 5000;

// Función principal
const main = async () => {
  try {
    // 1. Conectar a la base de datos
    await connectDB();

    // 2. Iniciar servidor
    app.listen(PORT, () => {
      console.log('🚀 Servidor corriendo en http://localhost:${PORT}');
      console.log('📚 Documentación en http://localhost:${PORT}/api');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales de cierre
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT recibido. Cerrando servidor...');
  process.exit(0);
});

// Ejecutar función principal
main();