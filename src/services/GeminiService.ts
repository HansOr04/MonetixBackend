import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('GEMINI_API_KEY is not defined. AI alerts will be disabled.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey || '');
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    private async wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generateFinancialAlerts(
        monthlyData: { month: string; amount: number; type: 'income' | 'expense' | 'net' }[]
    ): Promise<string[]> {
        if (!process.env.GEMINI_API_KEY) {
            return ['AI alerts functionality is not configured.'];
        }

        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                // Limit to last 3 months to strictly minimize token usage (Free Tier optimization)
                const recentData = monthlyData.slice(-3);

                if (!recentData || recentData.length === 0) {
                    return ['No hay suficientes datos para generar alertas.'];
                }

                const prompt = `
            Actúa como un asesor financiero personal experto. Analiza los siguientes datos de transacciones mensuales:
            ${JSON.stringify(recentData)}

            Genera 3 alertas o consejos cortos y directos (máximo 2 frases cada uno).
            Enfócate en identificar en qué meses se gastó mucho y da una recomendación práctica para los meses futuros.
            El formato de salida debe ser un ARRAY JSON de strings simple, por ejemplo:
            ["En enero gastaste mucho en comida, intenta cocinar más.", "Tu ahorro fue bajo en febrero, revisa tus suscripciones."]
            
            NO incluyas markdown, solo el array JSON puro.
          `;

                console.log(`Gemini Attempt ${attempt + 1}: Sending request...`);
                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                // console.log('Gemini Raw Response:', text); // Commented to reduce noise

                // Clean the text to ensure it's valid JSON
                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

                try {
                    const alerts = JSON.parse(cleanedText);
                    if (Array.isArray(alerts)) {
                        return alerts.map(String); // Ensure they are strings
                    }
                    return [cleanedText]; // Fallback if not an array
                } catch (parseError) {
                    console.error('Error parsing AI response:', parseError);
                    return [text]; // Return raw text if parsing fails
                }

            } catch (error: any) {
                console.error(`Gemini Error (Attempt ${attempt + 1}):`, error.status || error.message);

                // Handle Rate Limit (429) - Retry logic
                if (error.status === 429 || (error.message && error.message.includes('429'))) {
                    attempt++;
                    if (attempt < maxRetries) {
                        const delay = 2000 * attempt; // Exponential backoff: 2s, 4s, 6s...
                        console.log(`Rate limit hit. Retrying in ${delay}ms...`);
                        await this.wait(delay);
                        continue;
                    } else {
                        return ['La IA está ocupada (Límite de cuota). Intenta de nuevo más tarde.'];
                    }
                }

                // Other errors - don't retry, just return truncated error
                const errorMsg = `Error: ${error.message || 'Desconocido'}`;
                return [errorMsg.substring(0, 200)];
            }
        }
        return ['Error desconocido generando alertas.'];
    }
}

export const geminiService = new GeminiService();
