#!/bin/bash

# Deployment script for AI Coloring Studio
# This script builds and deploys the app to Firebase Hosting + Cloud Run

set -e  # Exit on error

echo "🚀 AI Coloring Studio - Deployment Script"
echo "=========================================="
echo ""

# Step 1: Clean previous build
echo "🧹 Step 1: Cleaning previous build..."
rm -rf .next
echo "✅ Build directory cleaned"
echo ""

# Step 2: Build the application
echo "🔨 Step 2: Building Next.js application..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build completed successfully!"
else
  echo "❌ Build failed!"
  exit 1
fi
echo ""

# Step 3: Deploy to Firebase
echo "🚀 Step 3: Deploying to Firebase Hosting + Cloud Run..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
  echo ""
  echo "=========================================="
  echo "✅ DEPLOYMENT SUCCESSFUL!"
  echo "=========================================="
  echo ""
  echo "📊 Next Steps:"
  echo ""
  echo "1. Monitor Cloud Run logs:"
  echo "   https://console.cloud.google.com/run/detail/us-central1/ssrstudio8922232553e935/logs"
  echo ""
  echo "2. Test the live site:"
  echo "   https://studio-8922232553-e9354.web.app"
  echo ""
  echo "3. Look for these messages in Cloud Run logs:"
  echo "   ✅ Firebase Admin initialized via FIREBASE_CONFIG"
  echo "   or"
  echo "   ✅ Firebase Admin initialized with NO params"
  echo ""
  echo "4. Test payment flow:"
  echo "   - Sign in with Google"
  echo "   - Go to /subscribe"
  echo "   - Click 'Upgrade to Pro'"
  echo "   - Use test card: 4111 1111 1111 1111"
  echo ""
  echo "🎉 Deployment complete!"
  echo "=========================================="
else
  echo ""
  echo "=========================================="
  echo "❌ DEPLOYMENT FAILED!"
  echo "=========================================="
  echo ""
  echo "Possible issues:"
  echo "1. Not authenticated: Run 'firebase login'"
  echo "2. Insufficient permissions: Check Firebase project access"
  echo "3. Network error: Check internet connection"
  echo ""
  exit 1
fi
