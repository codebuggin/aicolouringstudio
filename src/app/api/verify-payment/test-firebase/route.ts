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
    
    console.log('✅ Got admin and db instances');

    const testRef = db.collection('_healthcheck').doc('test');

    await testRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      test: 'Firebase Admin is working!',
      testRun: new Date().toISOString(),
    });

    console.log('✅ Write successful');

    const testDoc = await testRef.get();
    console.log('✅ Read successful');

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin initialized successfully! 🎉',
      details: {
        firestoreWorking: true,
        testDocExists: testDoc.exists,
        testData: testDoc.data(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Firebase Admin test failed',
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}