# PostgreSQL Connection Guide

## Your Database Credentials
Based on your `.env` file:
- **Username**: `root`
- **Password**: `Sql23!`
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `crud_db`

---

## Method 1: Connect with Password Prompt (Recommended)

This is the most secure method as it prompts for password:

```bash
psql -U root -h localhost -p 5432 -d crud_db
```

When prompted, enter your password: `Sql23!`

**If the database doesn't exist yet**, connect to the default `postgres` database first:
```bash
psql -U root -h localhost -p 5432 -d postgres
```

Then create your database:
```sql
CREATE DATABASE crud_db;
```

---

## Method 2: Connect with Password in Command (Less Secure)

**⚠️ Warning**: This method exposes your password in command history.

```bash
PGPASSWORD='Sql23!' psql -U root -h localhost -p 5432 -d crud_db
```

---

## Method 3: Using Connection String

```bash
psql "postgresql://root:Sql23!@localhost:5432/crud_db"
```

---

## Method 4: Connect Without Specifying Database

Connect to PostgreSQL server (will connect to default database):

```bash
psql -U root -h localhost -p 5432
```

Then switch to your database:
```sql
\c crud_db
```

---

## Common PostgreSQL Commands

Once connected, here are useful commands:

### Database Operations
```sql
-- List all databases
\l

-- Connect to a database
\c crud_db

-- List all tables in current database
\dt

-- Describe a table structure
\d users
\d posts

-- Show table data
SELECT * FROM users;
SELECT * FROM posts;
```

### Create Database (if needed)
```sql
CREATE DATABASE crud_db;
```

### Exit PostgreSQL
```sql
\q
```
or press `Ctrl+D`

---

## Troubleshooting

### Error: "psql: error: connection to server failed"

**Solution**: Make sure PostgreSQL is running:
```bash
# macOS (Homebrew)
brew services start postgresql@16
# or
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Check if running
brew services list | grep postgresql
```

### Error: "database does not exist"

**Solution**: Create the database first:
```bash
# Connect to default postgres database
psql -U root -h localhost -p 5432 -d postgres

# Then create your database
CREATE DATABASE crud_db;
```

### Error: "password authentication failed"

**Solution**: 
1. Verify your password is correct: `Sql23!`
2. Check if the user `root` exists in PostgreSQL
3. Try connecting with your system username instead:
   ```bash
   psql -U $(whoami) -h localhost -p 5432
   ```

### Error: "role does not exist"

**Solution**: The user `root` might not exist. Try:
```bash
# Connect with your system username
psql -U $(whoami) -h localhost -p 5432

# Or create the root user (requires superuser access)
CREATE USER root WITH PASSWORD 'Sql23!';
ALTER USER root WITH SUPERUSER;
```

---

## Quick Test Connection

Test if you can connect:
```bash
psql -U root -h localhost -p 5432 -d crud_db -c "SELECT version();"
```

If successful, you'll see PostgreSQL version information.

---

## Setting Up Your Database

If you need to set up the database from scratch:

1. **Connect to PostgreSQL:**
   ```bash
   psql -U root -h localhost -p 5432 -d postgres
   ```

2. **Create the database:**
   ```sql
   CREATE DATABASE crud_db;
   \q
   ```

3. **Connect to your new database:**
   ```bash
   psql -U root -h localhost -p 5432 -d crud_db
   ```

4. **The tables will be created automatically** when you start your Node.js server (the server runs the schema.sql file on first connection).

---

## Alternative: Using pgAdmin or DBeaver

If you prefer a GUI tool:
- **pgAdmin**: Official PostgreSQL GUI tool
- **DBeaver**: Universal database tool

Connection settings:
- Host: `localhost`
- Port: `5432`
- Database: `crud_db`
- Username: `root`
- Password: `Sql23!`
