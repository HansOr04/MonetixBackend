import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Transaction } from '../models/Transaction.model';
import { connectToDatabase } from '../config/database';

dotenv.config();

const USER_ID = '692cc21f39450017d7b59ef7';

const CATEGORIES = {
    SALARY: '692cc1ff39450017d7b59ecb', // Income
    FOOD: '692cc1e339450017d7b59ec0',   // Expense
    DOG_FOOD: '692cc24239450017d7b59f32' // Expense
};

const getRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomAmount = (min: number, max: number) => {
    return Number((Math.random() * (max - min) + min).toFixed(2));
};

const seedData = async () => {
    try {
        await connectToDatabase();
        console.log('Connected to database...');

        const transactions = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6); // Last 6 months
        const endDate = new Date();

        // Generate 30 Income Transactions (Salary)
        console.log('Generating 30 income transactions...');
        for (let i = 0; i < 30; i++) {
            transactions.push({
                userId: USER_ID,
                categoryId: CATEGORIES.SALARY,
                amount: getRandomAmount(1800, 2500), // Realistic salary range variation
                type: 'income',
                description: `Salario ${i + 1}`,
                date: getRandomDate(startDate, endDate),
            });
        }

        // Generate 30 Expense Transactions (Food & Dog Food)
        console.log('Generating 30 expense transactions...');
        for (let i = 0; i < 30; i++) {
            const isDogFood = Math.random() > 0.5;
            transactions.push({
                userId: USER_ID,
                categoryId: isDogFood ? CATEGORIES.DOG_FOOD : CATEGORIES.FOOD,
                amount: isDogFood ? getRandomAmount(30, 80) : getRandomAmount(15, 50),
                type: 'expense',
                description: isDogFood ? 'Comida perro' : 'Almuerzo/Cena',
                date: getRandomDate(startDate, endDate),
            });
        }

        // Sort by date just for niceness (not required by DB)
        transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

        await Transaction.insertMany(transactions);
        console.log(`Successfully inserted ${transactions.length} transactions!`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
