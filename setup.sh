#!/bin/bash

# Setup script for Backend CRUD API
echo "🚀 Setting up Backend CRUD API..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Database Configuration
# Replace with your PostgreSQL connection details
# Format: postgresql://username:password@host:port/database_name
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crud_db

# Server Configuration
PORT=8000

# Environment
NODE_ENV=development
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Database Setup Instructions:"
echo "=================================="
echo ""
echo "1. Make sure PostgreSQL is running:"
echo "   - macOS: brew services start postgresql@16"
echo "   - Linux: sudo systemctl start postgresql"
echo "   - Windows: Start PostgreSQL service from Services"
echo ""
echo "2. Update .env file with your PostgreSQL credentials:"
echo "   DATABASE_URL=postgresql://username:password@localhost:5432/crud_db"
echo ""
echo "3. Create the database (if it doesn't exist):"
echo "   psql -U postgres -c 'CREATE DATABASE crud_db;'"
echo ""
echo "   Or connect to PostgreSQL and run:"
echo "   CREATE DATABASE crud_db;"
echo ""
echo "4. Start the server:"
echo "   npm start"
echo ""
echo "   Or for development with auto-reload:"
echo "   npm run dev"
echo ""
echo "5. Open your browser:"
echo "   http://localhost:8000"
echo ""
echo "✨ Setup complete! Follow the instructions above to configure your database."
