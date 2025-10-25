// app/api/verify-payment/test-firebase/route.ts
import { NextResponse } from 'next/server';
import { getDb, getFirebaseAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('🧪 Test Firebase endpoint called');

    // Get the initialized admin instance
    const admin = getFirebaseAdmin();
    const db = getDb();
    const testRef = db.collection('_healthcheck').doc('test');

    await testRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      test: 'Firebase Admin is working!',
    });

    const testDoc = await testRef.get();

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin initialized successfully! 🎉',
      details: {
        appsCount: admin.apps.length,
        appName: admin.app().name,
        firestoreWorking: true,
        testDocExists: testDoc.exists,
      },
    });

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Firebase Admin test failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}