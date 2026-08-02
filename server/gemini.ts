import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

export function isGeminiConfigured(): boolean {
  return GEMINI_API_KEY.length > 0;
}

export async function geminiText(
  prompt: string,
  system?: string,
  timeoutMs?: number,
  maxOutputTokens?: number
): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured. Set it in Vercel environment variables.');

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs || 30000);

  try {
    const contents = [];
    if (system) contents.push({ role: 'user', parts: [{ text: system }] });
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      ...(maxOutputTokens ? { config: { maxOutputTokens } } : {}),
    });

    clearTimeout(timeoutId);
    return response.text?.trim() || '';
  } catch (e: any) {
    clearTimeout(timeoutId);
    throw e;
  }
}
