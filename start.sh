#!/bin/bash

echo "🚀 بدء تشغيل تطبيق Game Server Ayham"
echo "====================================="

# تثبيت الحزم إذا لم تكن مثبتة
if [ ! -d "node_modules" ]; then
    echo "📦 تثبيت الحزم..."
    npm install
fi

# تشغيل السيرفر
echo "⚡ تشغيل السيرفر على المنفذ 3000..."
node server.js
