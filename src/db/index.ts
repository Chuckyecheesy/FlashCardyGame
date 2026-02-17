import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

// Create the connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

// Export all schema tables for easy importing
export * from './schema';