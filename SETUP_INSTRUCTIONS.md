# Setup Instructions

## Quick Start Guide

### Step 1: Install Dependencies
```bash
npm install
```
✅ **Already completed!**

### Step 2: Configure Environment Variables

The `.env` file has been created with default values. You need to update it with your PostgreSQL credentials.

**Current .env file:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crud_db
PORT=8000
NODE_ENV=development
```

**Update the DATABASE_URL with your actual PostgreSQL credentials:**
- Replace `postgres` (username) with your PostgreSQL username
- Replace `postgres` (password) with your PostgreSQL password
- Replace `crud_db` with your database name (or keep it if you want to use this name)

**Example:**
```
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/crud_db
```

### Step 3: Set Up PostgreSQL Database

#### Option A: Using psql command line
```bash
# Connect to PostgreSQL (you may need to enter your password)
psql -U postgres

# Create the database
CREATE DATABASE crud_db;

# Exit psql
\q
```

#### Option B: If you don't have a password set
```bash
# Try connecting without password (if your PostgreSQL allows it)
psql -U postgres -c "CREATE DATABASE crud_db;"
```

#### Option C: Using your system username
If your PostgreSQL uses your system username instead of 'postgres':
```bash
# Check your username
whoami

# Try creating database with your username
createdb crud_db

# Or connect and create
psql -c "CREATE DATABASE crud_db;"
```

### Step 4: Start PostgreSQL Service (if not running)

**macOS (Homebrew):**
```bash
brew services start postgresql@16
# or
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
```

**Windows:**
- Start PostgreSQL service from Services panel

### Step 5: Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Step 6: Access the Application

Open your browser and navigate to:
```
http://localhost:8000
```

## Troubleshooting

### Database Connection Errors

**Error: "PostgreSQL connection failed"**

1. **Check PostgreSQL is running:**
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   ```

2. **Verify your credentials in .env file:**
   - Make sure username, password, and database name are correct
   - Check if you need to use `localhost` or `127.0.0.1`

3. **Test connection manually:**
   ```bash
   psql -U your_username -d crud_db -h localhost
   ```

4. **Create database if it doesn't exist:**
   ```bash
   psql -U postgres -c "CREATE DATABASE crud_db;"
   ```

### Port Already in Use

If port 8000 is already in use, change it in `.env`:
```
PORT=3000
```

### Module Not Found Errors

If you see module errors, reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## What Happens When Server Starts

1. ✅ Connects to PostgreSQL database
2. ✅ Creates tables automatically (users, posts) if they don't exist
3. ✅ Sets up indexes for performance
4. ✅ Starts Express server on configured port
5. ✅ Serves frontend files at root URL

## Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with correct database credentials
- [ ] PostgreSQL service is running
- [ ] Database `crud_db` exists (or your chosen name)
- [ ] Server starts without errors
- [ ] Can access `http://localhost:8000` in browser
- [ ] Can register a new user
- [ ] Can login with registered user
- [ ] Can create, edit, and delete posts

## Next Steps

Once everything is running:
1. Register a new user account
2. Login with your credentials
3. Create your first post
4. Test editing and deleting posts

Enjoy your CRUD API! 🚀
