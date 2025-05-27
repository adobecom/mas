#!/bin/bash

# NALA Test Generator - Cursor Setup Script
# This script sets up the NALA Test Generator for use with Cursor

echo "🚀 Setting up NALA Test Generator for Cursor..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Please run this script from the nala-test-generator-mcp directory"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Install Playwright
echo "🎭 Installing Playwright..."
npm install playwright

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Playwright"
    exit 1
fi

# Install Chromium
echo "🌐 Installing Chromium browser..."
npx playwright install chromium

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Chromium"
    exit 1
fi

# Test basic functionality
echo "🧪 Testing basic functionality..."
node cursor-integration.js example > /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Basic functionality test failed"
    exit 1
fi

echo "✅ Basic functionality test passed"

# Create .vscode directory if it doesn't exist
mkdir -p .vscode

# Check if VS Code configuration files exist
if [ -f ".vscode/tasks.json" ]; then
    echo "✅ VS Code tasks configuration already exists"
else
    echo "❌ VS Code tasks configuration not found"
    echo "   Please ensure .vscode/tasks.json was created properly"
fi

if [ -f ".vscode/settings.json" ]; then
    echo "✅ VS Code settings configuration already exists"
else
    echo "❌ VS Code settings configuration not found"
    echo "   Please ensure .vscode/settings.json was created properly"
fi

if [ -f ".vscode/keybindings.json" ]; then
    echo "✅ VS Code keybindings configuration already exists"
else
    echo "❌ VS Code keybindings configuration not found"
    echo "   Please ensure .vscode/keybindings.json was created properly"
fi

# Make scripts executable
chmod +x cursor-integration.js
chmod +x test-auto-extract.js

echo ""
echo "🎉 Setup complete! Here's how to use NALA Test Generator in Cursor:"
echo ""
echo "📋 Quick Commands:"
echo "   node cursor-integration.js example                    # Get example config"
echo "   node cursor-integration.js auto-extract CARD_ID BRANCH # Auto extract"
echo "   node cursor-integration.js complete-suite config.json  # Generate tests"
echo ""
echo "⌨️  Keyboard Shortcuts (in Cursor):"
echo "   Cmd+Shift+E  # Auto Extract Card Properties"
echo "   Cmd+Shift+G  # Generate Complete Test Suite"
echo "   Cmd+Shift+B  # Generate Browser Extraction Script"
echo "   Cmd+Shift+P  # Generate Playwright Extraction Script"
echo "   Cmd+Shift+X  # Create Example Configuration"
echo ""
echo "🔧 Task Runner (in Cursor):"
echo "   Cmd+Shift+P → 'Tasks: Run Task' → Select NALA task"
echo ""
echo "📚 Documentation:"
echo "   - CURSOR_CONFIGURATION.md  # Complete setup guide"
echo "   - AUTOMATIC_EXTRACTION.md  # Automatic extraction guide"
echo "   - QUICK_REFERENCE.md       # Quick command reference"
echo ""
echo "🧪 Test your setup:"
echo "   node cursor-integration.js auto-extract \"YOUR_CARD_ID\" \"main\""
echo ""
echo "✨ Ready to generate NALA tests! 🚀" 