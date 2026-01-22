-- PostgreSQL Database Setup Script
-- Run this script to set up the database and user

-- Create the root user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'root') THEN
        CREATE USER root WITH PASSWORD 'Sql2394!';
        ALTER USER root WITH SUPERUSER;
        RAISE NOTICE 'User root created successfully';
    ELSE
        ALTER USER root WITH PASSWORD 'Sql2394!';
        ALTER USER root WITH SUPERUSER;
        RAISE NOTICE 'User root already exists, password updated';
    END IF;
END
$$;

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE crud_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'crud_db')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE crud_db TO root;

-- Connect to the new database and create tables
\c crud_db

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(25) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    logged_in BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 1 AND age <= 150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Show tables
\dt

-- Show success message
SELECT 'Database setup completed successfully!' AS status;
