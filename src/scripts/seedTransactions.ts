import dotenv from 'dotenv';
import { connectToDatabase } from '../config/database';
import { Transaction } from '../models/Transaction.model';
import { Category } from '../models/Category.model';
import { User } from '../models/User.model';
import mongoose from 'mongoose';

dotenv.config();

/**
 * Script para generar datos de transacciones de prueba
 * Esto permite probar los cálculos de predicciones con datos realistas
 */

const seedTransactions = async () => {
  try {
    await connectToDatabase();
    console.log('📊 Iniciando generación de datos de prueba...\n');

    // 1. Buscar o crear un usuario de prueba
    let testUser = await User.findOne({ email: 'test@monetix.com' });

    if (!testUser) {
      testUser = await User.create({
        name: 'Usuario de Prueba',
        email: 'test@monetix.com',
        password: 'test12345',
        role: 'user',
      });
      console.log('✅ Usuario de prueba creado:', testUser.email);
    } else {
      console.log('✅ Usuario de prueba encontrado:', testUser.email);
    }

    // 2. Buscar o crear categorías de prueba
    let expenseCategory = await Category.findOne({
      name: 'Alimentación',
      type: 'expense'
    });

    if (!expenseCategory) {
      expenseCategory = await Category.create({
        name: 'Alimentación',
        type: 'expense',
        icon: '🍔',
        color: '#FF6B6B',
      });
      console.log('✅ Categoría de gasto creada:', expenseCategory.name);
    }

    let incomeCategory = await Category.findOne({
      name: 'Salario',
      type: 'income'
    });

    if (!incomeCategory) {
      incomeCategory = await Category.create({
        name: 'Salario',
        type: 'income',
        icon: '💰',
        color: '#51CF66',
      });
      console.log('✅ Categoría de ingreso creada:', incomeCategory.name);
    }

    // 3. Limpiar transacciones anteriores del usuario de prueba
    await Transaction.deleteMany({ userId: testUser._id });
    console.log('🗑️  Transacciones anteriores eliminadas\n');

    // 4. Generar datos de transacciones con patrones predecibles
    const transactions: any[] = [];
    const today = new Date();
    const monthsToGenerate = 36; // 36 meses de datos históricos

    console.log('📈 Generando transacciones con patrones predecibles:\n');
    console.log('   GASTOS (Alimentación):');
    console.log('   - Patrón: Tendencia creciente lineal');
    console.log('   - Base: $500/mes + $20/mes de incremento');
    console.log('   - Variación: ±10% aleatorio\n');

    // Generar gastos mensuales con tendencia creciente
    for (let i = monthsToGenerate; i >= 1; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      date.setDate(15); // Día 15 de cada mes

      // Patrón lineal creciente: base + incremento mensual + ruido
      const baseAmount = 500;
      const monthlyIncrease = 20;
      const trendAmount = baseAmount + (monthsToGenerate - i) * monthlyIncrease;

      // Agregar variación aleatoria del ±10%
      const noise = trendAmount * (Math.random() * 0.2 - 0.1);
      const amount = Math.round((trendAmount + noise) * 100) / 100;

      transactions.push({
        userId: testUser._id,
        type: 'expense',
        categoryId: expenseCategory._id,
        amount: amount,
        description: `Gastos de alimentación - Mes ${monthsToGenerate - i + 1}`,
        date: date,
      });

      console.log(`   Mes ${String(monthsToGenerate - i + 1).padStart(2, '0')}: $${amount.toFixed(2)}`);
    }

    console.log('\n   INGRESOS (Salario):');
    console.log('   - Patrón: Estable con incremento anual');
    console.log('   - Base: $3000/mes');
    console.log('   - Incremento: +$200 cada 6 meses\n');

    // Generar ingresos mensuales (más estables)
    for (let i = monthsToGenerate; i >= 1; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      date.setDate(1); // Primer día de cada mes

      // Salario base con incremento cada 6 meses
      const baseSalary = 3000;
      const increments = Math.floor((monthsToGenerate - i) / 6);
      const amount = baseSalary + (increments * 200);

      transactions.push({
        userId: testUser._id,
        type: 'income',
        categoryId: incomeCategory._id,
        amount: amount,
        description: `Salario - Mes ${monthsToGenerate - i + 1}`,
        date: date,
      });

      console.log(`   Mes ${String(monthsToGenerate - i + 1).padStart(2, '0')}: $${amount.toFixed(2)}`);
    }

    // 5. Insertar todas las transacciones
    await Transaction.insertMany(transactions);

    console.log(`\n✅ ${transactions.length} transacciones creadas exitosamente`);
    console.log(`\n📊 Resumen:`);
    console.log(`   Usuario: ${testUser.email}`);
    console.log(`   ID Usuario: ${testUser._id}`);
    console.log(`   Período: ${monthsToGenerate} meses`);
    console.log(`   Gastos: ${transactions.filter(t => t.type === 'expense').length} transacciones`);
    console.log(`   Ingresos: ${transactions.filter(t => t.type === 'income').length} transacciones`);

    console.log('\n🎯 Predicciones esperadas para los próximos 3 meses:');
    console.log('   GASTOS (continuando la tendencia):');
    for (let i = 1; i <= 3; i++) {
      const predictedAmount = 500 + (monthsToGenerate + i) * 20;
      console.log(`   Mes ${i}: ~$${predictedAmount.toFixed(2)}`);
    }

    console.log('\n   INGRESOS (estables):');
    const currentSalary = 3000 + (Math.floor(monthsToGenerate / 6) * 200);
    console.log(`   Mes 1-3: ~$${currentSalary.toFixed(2)}`);

    console.log('\n💡 Ahora puedes probar las predicciones con:');
    console.log('   npm run test:predictions');
    console.log('   o usar el endpoint POST /api/predictions/generate\n');

  } catch (error) {
    console.error('❌ Error generando datos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Desconectado de la base de datos');
  }
};

seedTransactions();
