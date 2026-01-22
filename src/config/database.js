import pkg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse connection string or use individual parameters
// This handles special characters in passwords properly
let poolConfig;

if (process.env.DATABASE_URL || process.env.POSTGRES_URI) {
    // Use connection string if provided
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URI;
    poolConfig = {
        connectionString: connectionString
    };
} else {
    // Use individual parameters as fallback
    poolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'crud_db',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'Sql2394!',
    };
}

const pool = new Pool(poolConfig);

const connectDB = async () => {
    try {
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('\n PostgreSQL connected successfully');

        // Initialize schema
        const schemaPath = join(__dirname, 'schema.sql');
        const schema = readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        console.log('Database schema initialized');
    } catch (error) {
        console.log("PostgreSQL connection failed", error);
        process.exit(1);
    }
};

export { pool };
export default connectDB;