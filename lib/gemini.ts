import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

export const hasRealApiKey = Boolean(apiKey && apiKey !== 'placeholder' && apiKey.length > 10);

export const genAI = hasRealApiKey ? new GoogleGenAI({ apiKey }) : null;

export const MODEL = 'gemini-2.0-flash';
