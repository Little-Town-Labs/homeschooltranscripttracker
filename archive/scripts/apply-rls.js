import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

async function applyRLS() {
  console.log("Connecting to database...");
  
  // Create connection
  const conn = postgres(DATABASE_URL);
  
  try {
    // Read the RLS policy file
    const rlsSQL = readFileSync(join(__dirname, "../drizzle/rls-policies.sql"), "utf8");
    
    console.log("Applying Row Level Security policies...");
    
    // Execute the RLS policies
    await conn.unsafe(rlsSQL);
    
    console.log("✅ Row Level Security policies applied successfully!");
    
  } catch (error) {
    console.error("❌ Error applying RLS policies:", error);
  } finally {
    await conn.end();
  }
}

applyRLS();