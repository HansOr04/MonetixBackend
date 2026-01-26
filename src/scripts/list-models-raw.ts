import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const listModelsRaw = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('No API Key found');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        console.log(`Querying: ${url.replace(apiKey, 'HIDDEN')}`);
        const response = await axios.get(url);
        console.log('Status:', response.status);
        console.log('Available Models:');

        const models = response.data.models || [];
        models.forEach((m: any) => {
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                console.log(`- ${m.name}`);
            }
        });

    } catch (error: any) {
        console.error('Error fetching models:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
};

listModelsRaw();
