import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.model';
import { Category } from '../models/Category.model';
import { User } from '../models/User.model';
import bcrypt from 'bcryptjs';

dotenv.config();

/**
 * Script simplificado para generar datos de prueba
 */

const seedTestData = async () => {
    try {
        // Conectar a la base de datos de prueba
        const mongoUri = process.env.MONGO_URI_TEST || process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error('MONGO_URI_TEST no está configurado');
        }

        console.log('🔌 Conectando a base de datos de prueba...');
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado exitosamente\n');

        // Limpiar datos existentes
        console.log('🗑️  Limpiando datos existentes...');
        await Transaction.deleteMany({});
        await Category.deleteMany({});
        await User.deleteMany({});
        console.log('✅ Datos limpiados\n');

        // Crear usuario de prueba
        console.log('👤 Creando usuario de prueba...');
        const hashedPassword = await bcrypt.hash('test12345', 10);

        const testUser = await User.create({
            name: 'Test User',
            email: 'test@monetix.com',
            password: hashedPassword,
            role: 'user',
        });
        console.log(`✅ Usuario creado: ${testUser.email} (ID: ${testUser._id})\n`);

        // Crear categorías
        console.log('📁 Creando categorías...');
        const expenseCategory = await Category.create({
            name: 'Alimentación',
            type: 'expense',
            icon: '🍔',
            color: '#FF6B6B',
        });

        const incomeCategory = await Category.create({
            name: 'Salario',
            type: 'income',
            icon: '💰',
            color: '#51CF66',
        });
        console.log(`✅ Categorías creadas: ${expenseCategory.name}, ${incomeCategory.name}\n`);

        // Generar transacciones (36 meses)
        console.log('📊 Generando transacciones...');
        const transactions: any[] = [];
        const today = new Date();
        const monthsToGenerate = 36;

        // Gastos con tendencia creciente
        for (let i = monthsToGenerate; i >= 1; i--) {
            const date = new Date(today);
            date.setMonth(date.getMonth() - i);
            date.setDate(15);

            const baseAmount = 500;
            const monthlyIncrease = 20;
            const trendAmount = baseAmount + (monthsToGenerate - i) * monthlyIncrease;
            const noise = trendAmount * (Math.random() * 0.2 - 0.1);
            const amount = Math.round((trendAmount + noise) * 100) / 100;

            transactions.push({
                userId: testUser._id,
                type: 'expense',
                categoryId: expenseCategory._id,
                category: expenseCategory.name,
                amount: amount,
                description: `Gastos de alimentación - Mes ${monthsToGenerate - i + 1}`,
                date: date,
            });
        }

        // Ingresos estables
        for (let i = monthsToGenerate; i >= 1; i--) {
            const date = new Date(today);
            date.setMonth(date.getMonth() - i);
            date.setDate(1);

            const baseSalary = 3000;
            const increments = Math.floor((monthsToGenerate - i) / 6);
            const amount = baseSalary + (increments * 200);

            transactions.push({
                userId: testUser._id,
                type: 'income',
                categoryId: incomeCategory._id,
                category: incomeCategory.name,
                amount: amount,
                description: `Salario - Mes ${monthsToGenerate - i + 1}`,
                date: date,
            });
        }

        await Transaction.insertMany(transactions);
        console.log(`✅ ${transactions.length} transacciones creadas\n`);

        // Resumen
        console.log('📊 RESUMEN:');
        console.log(`   Usuario: ${testUser.email}`);
        console.log(`   ID Usuario: ${testUser._id}`);
        console.log(`   Transacciones totales: ${transactions.length}`);
        console.log(`   Gastos: ${transactions.filter(t => t.type === 'expense').length}`);
        console.log(`   Ingresos: ${transactions.filter(t => t.type === 'income').length}`);
        console.log(`   Período: ${monthsToGenerate} meses\n`);

        console.log('✅ Datos de prueba generados exitosamente!');
        console.log('\n💡 Ahora puedes ejecutar: npm test\n');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Desconectado de la base de datos');
        process.exit(0);
    }
};

seedTestData();
