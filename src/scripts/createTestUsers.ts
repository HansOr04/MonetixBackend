import mongoose from 'mongoose';
import { User } from '../models/User.model';
import dotenv from 'dotenv';

dotenv.config();

async function createTestUsers() {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/monetix');
        console.log('✓ Conectado a MongoDB\n');

        // Verificar si ya existen los usuarios
        const existingAdmin = await User.findOne({ email: 'admin@monetix.com' });
        const existingUser1 = await User.findOne({ email: 'user@monetix.com' });
        const existingUser2 = await User.findOne({ email: 'user2@monetix.com' });

        // Crear admin si no existe
        if (!existingAdmin) {
            const admin = new User({
                email: 'admin@monetix.com',
                password: 'Admin123!',
                name: 'Admin Test',
                role: 'admin',
            });
            await admin.save();
            console.log('✓ Usuario admin creado: admin@monetix.com / Admin123!');
        } else {
            console.log('- Usuario admin ya existe: admin@monetix.com');
        }

        // Crear usuario 1 si no existe
        if (!existingUser1) {
            const user1 = new User({
                email: 'user@monetix.com',
                password: 'User123!',
                name: 'Usuario Test 1',
                role: 'user',
            });
            await user1.save();
            console.log('✓ Usuario 1 creado: user@monetix.com / User123!');
        } else {
            console.log('- Usuario 1 ya existe: user@monetix.com');
        }

        // Crear usuario 2 si no existe
        if (!existingUser2) {
            const user2 = new User({
                email: 'user2@monetix.com',
                password: 'User123!',
                name: 'Usuario Test 2',
                role: 'user',
            });
            await user2.save();
            console.log('✓ Usuario 2 creado: user2@monetix.com / User123!');
        } else {
            console.log('- Usuario 2 ya existe: user2@monetix.com');
        }

        console.log('\n✓ Usuarios de prueba listos\n');
        console.log('Credenciales:');
        console.log('  Admin:    admin@monetix.com / Admin123!');
        console.log('  Usuario 1: user@monetix.com / User123!');
        console.log('  Usuario 2: user2@monetix.com / User123!\n');

        await mongoose.connection.close();
        console.log('✓ Conexión cerrada');
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
}

createTestUsers();
