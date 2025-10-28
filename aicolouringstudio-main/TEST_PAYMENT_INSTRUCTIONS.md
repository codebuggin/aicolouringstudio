# Test Payment Flow Without Paying

## Option 1: Use Razorpay Test Mode Credentials

1. Open browser DevTools (F12)
2. Go to `/subscribe` page
3. Click "Upgrade to Pro"
4. When Razorpay modal opens, use these **test credentials**:

   **Test Card:** `4111 1111 1111 1111`
   **CVV:** Any 3 digits (e.g., `123`)
   **Expiry:** Any future date (e.g., `12/25`)
   **OTP:** `123456`

This will complete the payment flow without charging real money.

## Option 2: Check Browser Console for Errors

1. Open browser DevTools (F12) → Console tab
2. Go to `/subscribe` page  
3. Click "Upgrade to Pro"
4. Look for errors in the console

**Before the fix:** You would see "The default Firebase app does not exist"
**After the fix:** No Firebase errors, Razorpay modal should open cleanly

## Option 3: Just Open the Page

Simply open: https://studio-8922232553-e9354.web.app/subscribe

- If you see the red error toast immediately = Still broken
- If no error appears and page loads normally = Fixed ✅

## Verify Fix Without Payment

```bash
# Check if firebase-admin is in client bundle (should be 0)
curl -s https://studio-8922232553-e9354.web.app/_next/static/chunks/*.js | grep -c "firebase-admin"

# Test API route works (should return "Invalid payment signature")
curl -X POST https://studio-8922232553-e9354.web.app/api/verify-payment \
  -H "Content-Type: application/json" \
  -d '{"razorpay_order_id":"test","razorpay_payment_id":"test","razorpay_signature":"test","userId":"test"}'
```

## Current Status

✅ firebase-admin removed from client bundles
✅ Payment API route works correctly
✅ Server actions now proxy to API routes
✅ Ready for testing
