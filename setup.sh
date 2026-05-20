#!/bin/bash

# Setup script for Hani Jar Clone

echo "🚀 Setting up Hani Jar Clone..."

# Create .env file
echo "📝 Creating .env file..."
cp .env.example .env

echo ""
echo "⚠️ IMPORTANT: Update .env with your MongoDB URI and JWT_SECRET"
echo "📄 Open .env file and fill in the required values"
echo ""

# Install Backend dependencies
echo "📦 Installing Backend dependencies..."
npm install

# Setup Android
echo "📱 Setting up Android..."
cd android
echo "Android setup: Please open in Android Studio and sync Gradle"
cd ..

# Setup Admin Dashboard
echo "🎛️ Setting up Admin Dashboard..."
cd admin
npm install
cd ..

echo ""
echo "✅ Setup completed!"
echo ""
echo "📖 Next steps:"
echo "1. Update .env file with your MongoDB URI"
echo "2. Run 'node server.js' to start Backend"
echo "3. Run 'npm start' in admin/ to start Admin Dashboard"
echo "4. Open android/ in Android Studio to run the app"
echo ""
echo "📚 Read QUICK_START.md for more details"
