# Documentación ULTRA Didáctica: GeminiService.ts

**Ubicación:** `src/services/GeminiService.ts`

**Propósito:** Este archivo es el **enlace con la Inteligencia Artificial**. Se encarga de comunicar el backend de Monetix con la API de Google Gemini para transformar datos financieros crudos en consejos prácticos y humanos.

---

## 🎯 ¿Para qué sirve este archivo?

Imagina un asesor financiero que lee tus transacciones y te habla en lenguaje natural:

```
❌ Sin GeminiService:
- Solo ves gráficos estáticos
- "Gastaste $500 en comida" (dato frío)

✅ Con GeminiService:
- "En enero gastaste mucho en comida, intenta cocinar más en casa."
- "Tu ahorro fue bajo en febrero, revisa tus suscripciones."
```

**El servicio hace:**
1. ✅ Recibe tus transacciones mensuales
2. ✅ Selecciona los datos relevantes (últimos 3 meses)
3. ✅ Envía un prompt (instrucción) a Google Gemini
4. ✅ Recibe la respuesta de la IA
5. ✅ Limpia y formatea la respuesta como JSON
6. ✅ Maneja errores (como límites de cuota)

---

## 📚 Estructura del Archivo

```
┌──────────────────────────────────────────┐
│  CONFIGURACIÓN (líneas 1-17)            │
│  ├─ Importar GoogleGenerativeAI         │
│  ├─ Constructor (API Key)               │
│  └─ Definir modelo (gemini-2.5-flash)   │
├──────────────────────────────────────────┤
│  MÉTODOS PÚBLICOS (líneas 19-80)        │
│  └─ generateFinancialAlerts()           │
├──────────────────────────────────────────┤
│  MÉTODOS PRIVADOS (líneas 15-17)        │
│  └─ wait() (para reintentos)            │
├──────────────────────────────────────────┤
│  EXPORTACIÓN (línea 83)                 │
│  └─ geminiService (instancia única)     │
└──────────────────────────────────────────┘
```

---

## 📖 Análisis de Funcionalidades Clave

### 1. Manejo de Cuotas y Reintentos

La API gratuita de Gemini tiene límites de uso. Este servicio implementa un sistema inteligente de **reintentos con espera exponencial**:

```typescript
// Si recibimos error 429 (Too Many Requests):
if (error.status === 429) {
    attempt++;
    const delay = 2000 * attempt; // Espera 2s, luego 4s...
    await this.wait(delay);
    continue; // Reintenta
}
```

Esto evita que la aplicación falle simplemente porque hubo muchas peticiones seguidas.

### 2. Optimización de Tokens

Para asegurar respuestas rápidas y no saturar la cuota, filtramos los datos antes de enviarlos:

```typescript
// Limit to last 3 months to strictly minimize token usage
const recentData = monthlyData.slice(-3);
```

### 3. Ingeniería de Prompts

El "prompt" es la instrucción que le damos a la IA. Está diseñado cuidadosamente para obtener JSON puro:

```typescript
const prompt = `
    Actúa como un asesor financiero personal experto.
    Genera 3 alertas o consejos cortos.
    El formato de salida debe ser un ARRAY JSON de strings simple.
    NO incluyas markdown.
    ...
`;
```

---

## ⚠️ Errores Comunes y Soluciones

1.  **"GEMINI_API_KEY is not defined"**:
    *   Falta la variable en el archivo `.env`.
    *   Solución: Agregar `GEMINI_API_KEY=tu_clave` en `.env`.

2.  **"La IA está ocupada (Límite de cuota)"**:
    *   Se excedió el límite gratuito de Google.
    *   El sistema reintentará automáticamente, pero si persiste, devuelve este mensaje amigable.

3.  **Respuestas vacías**:
    *   Ocurre si no hay suficientes transacciones (menos de 3 meses).
    *   El servicio valida esto antes de llamar a la API.
