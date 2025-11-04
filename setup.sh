#!/bin/bash

# Land Registry System Setup Script
echo "🏠 Setting up Blockchain Land Registry System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js version is $NODE_VERSION. Recommended: 18+"
fi

echo "✅ Node.js version: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install --legacy-peer-deps

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create environment files if they don't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend/.env file..."
    cp frontend/env.example frontend/.env
    echo "⚠️  Please update frontend/.env with your contract address"
fi

if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env file..."
    echo "PORT=3001" > backend/.env
    echo "CONTRACT_ADDRESS=" >> backend/.env
    echo "⚠️  Please update backend/.env with your contract address"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy your smart contract (use Remix IDE or Hardhat)"
echo "2. Update .env files with contract address"
echo "3. Start backend: npm run backend"
echo "4. Start frontend: npm run frontend"
echo "5. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For detailed instructions, see README.md and DEPLOYMENT.md"
