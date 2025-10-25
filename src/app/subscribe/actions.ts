'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { z } from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const createOrderSchema = z.object({
  userId: z.string(),
});

interface CreateOrderState {
  success: boolean;
  message: string;
  orderId?: string;
  amount?: number;
}

export async function createRazorpayOrder(input: z.infer<typeof createOrderSchema>): Promise<CreateOrderState> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    const message = 'Razorpay API keys are not configured on the server.';
    console.error(message);
    return { success: false, message };
  }

  const razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const validatedFields = createOrderSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid input for creating order.',
    };
  }
  
  const { userId } = validatedFields.data;
  const amountInPaise = 10 * 100; // ₹10

  try {
    const receiptId = `receipt_${crypto.randomBytes(6).toString('hex')}`;
    const orderOptions = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: {
            firebase_uid: userId,
        },
    };

    const order = await razorpayInstance.orders.create(orderOptions);

    if (!order) {
      return { success: false, message: 'Failed to create order with Razorpay.' };
    }

    return {
      success: true,
      message: 'Order created successfully.',
      orderId: order.id,
      amount: order.amount,
    };

  } catch (error: any) {
    console.error('Razorpay order creation failed:', error.error ? JSON.stringify(error.error) : error.message);
    const errorMessage = error.error?.description || error.message || 'An unexpected error occurred.';
    return {
      success: false,
      message: errorMessage,
    };
  }
}
