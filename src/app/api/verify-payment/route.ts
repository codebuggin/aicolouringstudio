// app/api/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, getFirebaseAdmin } from '@/lib/firebaseAdmin';

// Force dynamic rendering and Node.js runtime for Firebase Admin
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Payment verification endpoint called');

    // Get initialized Firebase instances using centralized helper
    const admin = getFirebaseAdmin();
    const db = getDb();

    console.log(`📊 Firebase Admin apps: ${admin.apps.length}`);

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = body;

    console.log('💳 Payment verification started for user:', userId);

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!razorpaySecret) {
      console.error('❌ RAZORPAY_KEY_SECRET not found in environment');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('❌ Invalid payment signature');
      return NextResponse.json(
        { success: false, message: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    console.log('✅ Payment signature verified');

    // Payment verified ✅ — Update Firestore
    const FieldValue = admin.firestore.FieldValue;
    console.log('✅ Got Firestore instance, updating user...');
    const userRef = db.collection('users').doc(userId);

    await userRef.update({
      isSubscribed: true,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      upgradedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ User ${userId} upgraded to Pro`);

    return NextResponse.json({
      success: true,
      message: 'Payment verified and user upgraded to Pro!',
    });

  } catch (error: any) {
    console.error('❌ Payment verification error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);

    // Provide detailed error info for Firebase-related failures
    const isFirebaseError = error.message?.includes('Firebase') ||
                           error.message?.includes('default') ||
                           error.message?.includes('app does not exist');

    if (isFirebaseError) {
      console.error('🔥 Firebase initialization state:');
      console.error('  - GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Set' : 'Not set');
      console.error('  - FIREBASE_CONFIG:', process.env.FIREBASE_CONFIG ? 'Set' : 'Not set');
      console.error('  - NODE_ENV:', process.env.NODE_ENV);
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Payment verification failed',
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            errorName: error.name,
            stack: error.stack,
            isFirebaseError,
          }
        })
      },
      { status: 500 }
    );
  }
}