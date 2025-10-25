// app/api/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, getFirebaseAdmin } from '@/lib/firebaseAdmin';

// Force dynamic rendering for this API route to ensure fresh execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
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
    const admin = getFirebaseAdmin();
    const db = getDb();
    const userRef = db.collection('users').doc(userId);

    await userRef.update({
      isSubscribed: true,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      upgradedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ User ${userId} upgraded to Pro`);

    return NextResponse.json({
      success: true,
      message: 'Payment verified and user upgraded to Pro!',
    });

  } catch (error: any) {
    console.error('❌ Payment verification error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Payment verification failed',
      },
      { status: 500 }
    );
  }
}