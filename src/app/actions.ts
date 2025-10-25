'use server';

import { z } from 'zod';
import { generateColoringPageFromPrompt } from '@/ai/flows/generate-coloring-page-from-prompt';
import { type FormState, initialFormState } from './types';
import { doc, getDoc, increment, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebaseAdmin';

const schema = z.object({
  prompt: z.string({
    required_error: 'Please enter a prompt.',
  }).min(3, {
    message: 'Prompt must be at least 3 characters long.',
  }),
  userId: z.string(),
});

const FREE_GENERATION_LIMIT = 5;

export async function generateImageAction(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = schema.safeParse({
    prompt: formData.get('prompt'),
    userId: formData.get('userId'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.prompt?.join(', ') ?? 'Invalid input.',
      image: null,
      prompt: null,
    };
  }
  
  const { prompt, userId } = validatedFields.data;
  const db = getDb();

  try {
    // 1. Check user's generation limit
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return { ...initialFormState, success: false, message: 'User profile not found.' };
    }

    const userData = userDoc.data();
    const isPro = userData.isSubscribed === true;
    const generationCount = userData.generationCount || 0;

    if (!isPro && generationCount >= FREE_GENERATION_LIMIT) {
      return { ...initialFormState, success: false, message: 'Free generation limit reached. Please upgrade to Pro.' };
    }

    // 2. Call the AI flow to generate the image
    const result = await generateColoringPageFromPrompt({ prompt, userId });

    // 3. Save image to user's subcollection and increment count
    const imageRecord = {
      imageUrl: result.imageUrl,
      prompt: prompt,
      createdAt: serverTimestamp(),
      userId: userId,
    };
    await addDoc(collection(db, `users/${userId}/generatedImages`), imageRecord);
    
    // Only increment if the user is not a Pro member
    if (!isPro) {
        await updateDoc(userDocRef, {
            generationCount: increment(1)
        });
    }

    // 4. Return success state
    return {
      success: true,
      message: '✅ Coloring page ready!',
      image: {
        ...result,
        prompt: prompt,
      },
      prompt: prompt,
    };

  } catch (error: any) {
    console.error("Error in generateImageAction:", error);
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
