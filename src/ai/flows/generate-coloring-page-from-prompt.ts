'use server';
/**
 * @fileOverview Generates a coloring page image from a text prompt by calling an external n8n webhook.
 *
 * - generateColoringPageFromPrompt - A function that generates a coloring page image.
 * - GenerateColoringPageFromPromptInput - The input type for the generateColoringPageFromPrompt function.
 * - GenerateColoringPageFromPromptOutput - The return type for the generateColoringPageFromPrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import axios from 'axios';

// The new, stable webhook for image generation
const WEBHOOK_URL = 'https://abu.awsaibot.com/webhook/b7b16f99-0b4c-49c0-8597-5142694811af';

const GenerateColoringPageFromPromptInputSchema = z.object({
  prompt: z.string().describe('The user-provided text prompt to generate a coloring page from.'),
  userId: z.string().describe('The UID of the user requesting the generation.')
});
export type GenerateColoringPageFromPromptInput = z.infer<typeof GenerateColoringPageFromPromptInputSchema>;

const GenerateColoringPageFromPromptOutputSchema = z.object({
  imageUrl: z.string().describe("URL of the generated image."),
});
export type GenerateColoringPageFromPromptOutput = z.infer<typeof GenerateColoringPageFromPromptOutputSchema>;

export async function generateColoringPageFromPrompt(input: GenerateColoringPageFromPromptInput): Promise<GenerateColoringPageFromPromptOutput> {
  return generateColoringPageFromPromptFlow(input);
}

const generateColoringPageFromPromptFlow = ai.defineFlow(
  {
    name: 'generateColoringPageFromPromptFlow',
    inputSchema: GenerateColoringPageFromPromptInputSchema,
    outputSchema: GenerateColoringPageFromPromptOutputSchema,
  },
  async ({ prompt, userId }) => {
    try {
      const response = await axios.post(WEBHOOK_URL, 
        { prompt, userId },
        { timeout: 30000 } // 30-second timeout for the webhook
      );
      
      const responseData = response.data;

      // Validate the response from the webhook
      if (!responseData || typeof responseData.imageUrl !== 'string') {
        throw new Error('Invalid response from image generation service. Image URL is missing or invalid.');
      }
      
      return {
        imageUrl: responseData.imageUrl,
      };

    } catch (error: any) {
      console.error("Error calling n8n webhook:", error.response ? error.response.data : error.message);
      
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
         throw new Error("The image generation service took too long to respond. Please try again in a moment.");
      }

      throw new Error("Failed to generate coloring page. The AI service may be temporarily unavailable.");
    }
  }
);
