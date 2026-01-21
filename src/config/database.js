import pkg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URI,
});

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