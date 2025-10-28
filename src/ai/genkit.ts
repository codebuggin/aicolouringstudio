import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({
    apiVersion: 'v1beta',
    apiKey: process.env.GEMINI_API_KEY,
  })],
});
