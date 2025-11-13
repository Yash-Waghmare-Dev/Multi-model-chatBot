#!/bin/bash

# Production Deployment Checklist for n8n Agent Assistant
# Run this script to verify everything is ready for production

echo "🚀 Production Deployment Checklist"
echo "=================================="

# Check Node version
echo "✓ Checking Node.js version..."
node --version

# Check npm packages
echo "✓ Checking installed packages..."
npm list --depth=0

# Run type checking
echo "✓ Running TypeScript type checking..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✓ TypeScript build successful"
else
  echo "✗ TypeScript build failed"
  exit 1
fi

# Check for console errors
echo "✓ Build completed successfully"

# Environment variables checklist
echo ""
echo "📋 Environment Variables Checklist:"
echo "===================================="
if [ -z "$VITE_WEBHOOK_URL" ]; then
  echo "⚠ VITE_WEBHOOK_URL not set"
else
  echo "✓ VITE_WEBHOOK_URL is set"
fi

if [ -z "$VITE_GOOGLE_PROJECT_ID" ]; then
  echo "ℹ VITE_GOOGLE_PROJECT_ID not set (optional - translation won't work)"
else
  echo "✓ VITE_GOOGLE_PROJECT_ID is set"
fi

# File structure check
echo ""
echo "📁 Project Structure:"
echo "====================="
[ -d "dist" ] && echo "✓ dist folder exists" || echo "ℹ dist folder will be created on build"
[ -f "package.json" ] && echo "✓ package.json exists" || echo "✗ package.json missing"
[ -f "vite.config.ts" ] && echo "✓ vite.config.ts exists" || echo "✗ vite.config.ts missing"
[ -f "tsconfig.json" ] && echo "✓ tsconfig.json exists" || echo "✗ tsconfig.json missing"

echo ""
echo "✅ Deployment Checklist Complete!"
echo ""
echo "Next Steps:"
echo "1. Verify environment variables on production server"
echo "2. Run: npm run build"
echo "3. Deploy dist/ folder to hosting service"
echo "4. Test all features in production"
echo "5. Monitor logs for errors"
