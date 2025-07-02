import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

async function checkDatabase() {
  console.log("🔍 Checking database for user/tenant data...");
  
  const conn = postgres(DATABASE_URL);
  
  try {
    // Check users table
    console.log("\n📋 Users in database:");
    const users = await conn`
      SELECT id, email, name, tenant_id, role, created_at 
      FROM app_user 
      ORDER BY created_at DESC
    `;
    
    if (users.length === 0) {
      console.log("  No users found");
    } else {
      users.forEach(user => {
        console.log(`  ${user.email} (${user.name})`);
        console.log(`    ID: ${user.id}`);
        console.log(`    Tenant ID: ${user.tenant_id || 'NOT SET'}`);
        console.log(`    Role: ${user.role || 'NOT SET'}`);
        console.log(`    Created: ${user.created_at}`);
        console.log('');
      });
    }
    
    // Check tenants table
    console.log("\n🏠 Tenants in database:");
    const tenants = await conn`
      SELECT id, name, primary_email, created_at 
      FROM app_tenant 
      ORDER BY created_at DESC
    `;
    
    if (tenants.length === 0) {
      console.log("  No tenants found");
    } else {
      tenants.forEach(tenant => {
        console.log(`  ${tenant.name} (${tenant.primary_email})`);
        console.log(`    ID: ${tenant.id}`);
        console.log(`    Created: ${tenant.created_at}`);
        console.log('');
      });
    }
    
    // Check for orphaned users
    const orphanedUsers = users.filter(user => !user.tenant_id);
    if (orphanedUsers.length > 0) {
      console.log("⚠️  Users without tenant assignments:");
      orphanedUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.name})`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await conn.end();
  }
}

checkDatabase().catch(console.error);