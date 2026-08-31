#!/bin/bash

echo "=========================================="
echo "🚀 Render Deployment Setup"
echo "=========================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git repository already initialized"
fi

# Add all files
echo ""
echo "📝 Adding files to Git..."
git add .

# Commit
echo ""
echo "💾 Creating commit..."
git commit -m "Setup Django backend for Render deployment" || echo "⚠️  No changes to commit or already committed"

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Create GitHub repository:"
echo "   https://github.com/new"
echo ""
echo "2. Push to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy on Render:"
echo "   - Go to https://render.com"
echo "   - Sign up/Login with GitHub"
echo "   - Click 'New +' → 'Blueprint'"
echo "   - Connect your repository"
echo "   - Click 'Apply'"
echo ""
echo "4. Add environment variables in Render:"
echo "   DB_NAME=postgres"
echo "   DB_USER=postgres"
echo "   DB_PASSWORD=YatruSathi@123"
echo "   DB_HOST=db.jdgzbxycotncnwxusqxy.supabase.co"
echo "   DB_PORT=5432"
echo "   DEBUG=False"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo "=========================================="
