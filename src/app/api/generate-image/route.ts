// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb, getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { generateColoringPageFromPrompt } from '@/ai/flows/generate-coloring-page-from-prompt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  prompt: z.string().min(3),
  userId: z.string(),
});

const FREE_GENERATION_LIMIT = 5;

export async function POST(request: NextRequest) {
  try {
    // Get initialized Firebase instances using centralized helper
    const admin = getFirebaseAdmin();
    const db = getDb();

    const body = await request.json();
    const validatedFields = schema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          success: false,
          message: validatedFields.error.flatten().fieldErrors.prompt?.join(', ') ?? 'Invalid input.',
        },
        { status: 400 }
      );
    }

    const { prompt, userId } = validatedFields.data;
    const FieldValue = admin.firestore.FieldValue;

    // 1. Check user's generation limit
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'User profile not found.' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const isPro = userData?.isSubscribed === true;
    const generationCount = userData?.generationCount || 0;

    if (!isPro && generationCount >= FREE_GENERATION_LIMIT) {
      return NextResponse.json(
        { success: false, message: 'Free generation limit reached. Please upgrade to Pro.' },
        { status: 403 }
      );
    }

    // 2. Call the AI flow to generate the image
    const result = await generateColoringPageFromPrompt({ prompt, userId });

    // 3. Save image to user's subcollection and increment count
    const imageRecord = {
      imageUrl: result.imageUrl,
      prompt: prompt,
      createdAt: FieldValue.serverTimestamp(),
      userId: userId,
    };
    await db.collection(`users/${userId}/generatedImages`).add(imageRecord);

    // Only increment if the user is not a Pro member
    if (!isPro) {
      await userDocRef.update({
        generationCount: FieldValue.increment(1),
      });
    }

    // 4. Return success
    return NextResponse.json({
      success: true,
      message: '✅ Coloring page ready!',
      image: {
        ...result,
        prompt: prompt,
      },
      prompt: prompt,
    });
  } catch (error: any) {
    console.error('Error in generate-image API:', error);
    return NextResponse.json(
      {
        success: false,
        message: `❌ ${error.message || 'Something went wrong. Please try again.'}`,
      },
      { status: 500 }
    );
  }
}
