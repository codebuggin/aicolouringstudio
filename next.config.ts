import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // CRITICAL: Prevent Next.js from bundling firebase-admin
  // This ensures only ONE instance of firebase-admin is loaded
  serverExternalPackages: ['firebase-admin'],

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Webpack configuration to preserve Firebase Admin initialization
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent tree-shaking of Firebase Admin module initialization
      // This ensures the IIFE in firebaseAdmin.ts is executed
      config.optimization = config.optimization || {};
      config.optimization.sideEffects = true;

      // Mark firebase-admin as having side effects to prevent removal
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /firebaseAdmin\.ts$/,
        sideEffects: true,
      });

      console.log('✅ Webpack configured to preserve Firebase Admin side effects');
    } else {
      // CRITICAL: Completely exclude firebase-admin from client bundles
      // This prevents "Firebase app does not exist" errors in the browser
      config.externals = config.externals || [];
      config.externals.push({
        'firebase-admin': 'commonjs firebase-admin',
        'firebase-admin/app': 'commonjs firebase-admin/app',
        'firebase-admin/auth': 'commonjs firebase-admin/auth',
        'firebase-admin/firestore': 'commonjs firebase-admin/firestore',
      });

      // Also mark any imports from @/lib/firebaseAdmin as external for client
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};

      console.log('✅ Webpack configured to exclude Firebase Admin from client bundle');
    }
    return config;
  },
};

export default nextConfig;
