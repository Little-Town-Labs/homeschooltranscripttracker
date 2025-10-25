import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
const conn = postgres(DATABASE_URL);

async function fixUserPolicy() {
  console.log("🔧 Fixing user RLS policy...");
  
  try {
    await conn.unsafe(`
      -- Drop and recreate user policy to be more restrictive
      DROP POLICY IF EXISTS user_tenant_isolation ON app_user;
      
      CREATE POLICY user_tenant_isolation ON app_user
          FOR ALL
          USING (
              -- Require tenant_id to be set and accessible
              tenant_id IS NOT NULL 
              AND has_tenant_access(tenant_id)
          );
    `);
    
    console.log("✅ User policy fixed successfully!");
    
  } catch (error) {
    console.error("❌ Fix failed:", error);
  } finally {
    await conn.end();
  }
}

fixUserPolicy();