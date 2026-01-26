import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const listModels = async () => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    try {
        console.log('Listing available models...');
        // Note: The SDK might not expose listModels directly on the main class in all versions,
        // but typically it's available via a ModelManager or similar. 
        // Actually, in the Node SDK, it's often not straightforward to list models without using the REST API directly 
        // or the specific manager if exposed. 
        // Let's try to just use a known stable model or catch the error more gracefully.

        // However, let's try to hit the specific endpoint if possible, or just print the library version.

        // Alternative: Try to generate content with 'gemini-1.0-pro' which is also common.
        const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
        const result = await model.generateContent('Hello');
        console.log('Success with gemini-1.0-pro:', await result.response.text());

    } catch (error: any) {
        console.error('Error with gemini-1.0-pro:', error.message);
    }

    try {
        const model2 = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result2 = await model2.generateContent('Hello');
        console.log('Success with gemini-pro:', await result2.response.text());
    } catch (error: any) {
        console.error('Error with gemini-pro:', error.message);
    }
};

listModels();
