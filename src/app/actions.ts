'use server';

import { type FormState, initialFormState } from './types';

/**
 * Server action that proxies to API route
 * This avoids bundling firebase-admin into client code
 */
export async function generateImageAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const prompt = formData.get('prompt') as string;
  const userId = formData.get('userId') as string;

  if (!prompt || prompt.length < 3) {
    return {
      success: false,
      message: 'Prompt must be at least 3 characters long.',
      image: null,
      prompt: null,
    };
  }

  try {
    // Call the API route instead of using Firebase Admin directly
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9000'}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, userId }),
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Something went wrong.',
        image: null,
        prompt: prompt,
      };
    }

    return {
      success: true,
      message: result.message,
      image: result.image,
      prompt: result.prompt,
    };
  } catch (error: any) {
    console.error('Error in generateImageAction:', error);
    return {
      success: false,
      message: `❌ ${error.message || 'Something went wrong. Please try again.'}`,
      image: null,
      prompt: prompt,
    };
  }
}

export const getImageDataUri = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error("Failed to read image as data URL."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
