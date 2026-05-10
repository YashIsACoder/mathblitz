#!/bin/bash

# MathBlitz Setup Script for Mac/Linux
# This script automates the entire setup process

echo "🚀 Setting up MathBlitz..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm (comes with Node.js)"
    exit 1
fi

echo "✅ npm found: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Set up database
echo "🗄️  Setting up database..."
npx prisma migrate dev --name init

if [ $? -ne 0 ]; then
    echo "❌ Failed to set up database"
    exit 1
fi

echo "✅ Database set up"

# Generate Prisma client
echo "⚙️  Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the app, run:"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
