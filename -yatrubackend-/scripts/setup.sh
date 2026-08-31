#!/bin/bash

echo "=========================================="
echo "Yatrusathi Backend Setup Script"
echo "=========================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✅ Dependencies installed"

# Check database connection
echo "Checking database connection..."
python3 manage.py check --database default

# Run migrations
echo "Running migrations..."
python3 manage.py makemigrations
python3 manage.py migrate
echo "✅ Migrations completed"

# Create media directories
echo "Creating media directories..."
mkdir -p media/avatars
mkdir -p media/event_images
mkdir -p media/event_gallery
mkdir -p media/kyc_docs
echo "✅ Media directories created"

echo ""
echo "=========================================="
echo "✅ Setup completed successfully!"
echo "=========================================="
echo ""
echo "To start the server:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Run server: python3 manage.py runserver"
echo ""
echo "To test the API:"
echo "python3 test_api.py"
echo ""
echo "API Documentation: See API_DOCUMENTATION.md"
echo "=========================================="
