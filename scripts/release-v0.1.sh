#!/bin/bash

# Release v0.1.0 Script for Convergence AI
# This script commits the current state and pushes to GitHub to trigger the release

set -e

echo "🎉 Preparing Convergence AI v0.1.0 Release"
echo "============================================"

# Check if we're in git repo
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please run from project root."
    exit 1
fi

# Check current branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "⚠️  Currently on branch: $BRANCH"
    echo "🔄 Switching to main branch..."
    git checkout main
fi

# Stage all changes
echo "📦 Staging all changes..."
git add .

# Create commit with conventional format
echo "💾 Creating release commit..."
git commit -m "feat: release v0.1.0 - Basic Agent Court System

🎉 Complete basic court system with:
- Core judicial functionality (cases, evidence, rulings)
- Auto-rules engine for common violations
- Panel voting system with judge selection
- REST API with authentication
- Real-time dashboard
- MCP integration for Claude Desktop
- Convex-first serverless architecture
- Comprehensive documentation

This establishes the foundation for the future v0.2.0 
Complete Government OS with legislative, executive, 
and federation capabilities.

BREAKING CHANGE: Initial release of Convergence AI"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Release commit pushed successfully!"
echo ""
echo "🔗 Next steps:"
echo "   1. Check GitHub Actions: https://github.com/vbkotecha/convergenceai/actions"
echo "   2. Monitor release creation: https://github.com/vbkotecha/convergenceai/releases"
echo "   3. Once released, the version will be tagged as v0.1.0"
echo ""
echo "🌟 Your Convergence AI v0.1.0 is ready for the world!"
echo ""
echo "📊 What's included:"
echo "   • Complete basic court system"
echo "   • 50+ Convex functions"
echo "   • 10+ API endpoints"  
echo "   • Real-time dashboard"
echo "   • MCP integration"
echo "   • Comprehensive documentation"
echo ""
echo "🚀 Coming in v0.2.0: Complete Government OS with legislative,"
echo "   executive branches, federation protocol, and agent-inclusive identity"
