🧠 Project Summary

This is a Next.js 15 + Firebase Hosting (SSR) + Razorpay integration project.
It handles payments using Razorpay and stores subscription data in Firestore.

🧩 The Issue

After deployment via firebase deploy --only hosting,functions,
any route using Firebase Admin SDK (like /api/verify-payment/test-firebase) throws:

"The default Firebase app does not exist. Make sure you call initializeApp() before using any of the Firebase services."

The code works locally — fails only when deployed to Firebase Hosting (Cloud Run-based SSR).
The issue is likely due to the Firebase Frameworks adapter not properly persisting the admin.initializeApp() state between SSR instances.

🧰 Tech Stack

Next.js 15.3.3

Firebase Hosting (frameworks integration)

Firestore (via Admin SDK)

Razorpay API

Deployed as SSR Cloud Run function

🧩 Files Involved

/lib/firebaseAdmin.ts → Admin SDK initialization

/api/verify-payment/route.ts → Handles Razorpay payment verification

/api/verify-payment/test-firebase/route.ts → Debug endpoint for Firestore

firebase.json → Hosting + rewrites config

⚙️ Task for Claude

Claude, your mission (if you choose to accept it 🕵️‍♂️):

Analyze how Firebase Admin is being initialized.

Determine why initializeApp() doesn’t persist across deployed SSR invocations.

Suggest and apply a fix (either via initialization refactor or config adjustment).

Ensure /api/verify-payment/test-firebase successfully connects to Firestore post-deploy.