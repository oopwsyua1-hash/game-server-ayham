#!/bin/bash

# Deploy script for Hani Jar Clone

echo "🚀 Starting deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t hanijar:latest .

# Run Docker container
echo "▶️ Running Docker container..."
docker-compose up -d

echo "✅ Deployment completed!"
echo "🌐 Server running at http://localhost:3000"
