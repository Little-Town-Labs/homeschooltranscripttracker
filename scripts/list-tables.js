import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

async function listTables() {
  console.log("🔍 Checking what tables exist in the database...");
  
  const conn = postgres(DATABASE_URL);
  
  try {
    // List all tables
    const tables = await conn`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log("\n📋 Tables in database:");
    if (tables.length === 0) {
      console.log("  No tables found - database might not be migrated yet");
    } else {
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
    // If we have NextAuth tables, check for users
    const authTables = tables.filter(t => t.table_name === 'User' || t.table_name === 'users');
    if (authTables.length > 0) {
      console.log("\n👤 Checking NextAuth User table:");
      try {
        const users = await conn`SELECT id, email, name FROM "User" LIMIT 5`;
        users.forEach(user => {
          console.log(`  ${user.email} (${user.name}) - ID: ${user.id}`);
        });
      } catch (e) {
        try {
          const users = await conn`SELECT id, email, name FROM users LIMIT 5`;
          users.forEach(user => {
            console.log(`  ${user.email} (${user.name}) - ID: ${user.id}`);
          });
        } catch (e2) {
          console.log("  Could not read user data:", e2.message);
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await conn.end();
  }
}

listTables().catch(console.error);