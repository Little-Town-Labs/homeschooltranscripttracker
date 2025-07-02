import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, tenants } from "../src/server/db/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

async function debugUserTenant() {
  console.log("🔍 Debugging user tenant assignments...");
  
  const conn = postgres(DATABASE_URL);
  const db = drizzle(conn, { schema: { users, tenants } });
  
  try {
    // Get all users
    console.log("\n📋 All users in database:");
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      tenantId: users.tenantId,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users);
    
    allUsers.forEach(user => {
      console.log(`  ${user.email} (${user.name})`);
      console.log(`    ID: ${user.id}`);
      console.log(`    Tenant ID: ${user.tenantId || 'NOT SET'}`);
      console.log(`    Role: ${user.role || 'NOT SET'}`);
      console.log(`    Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Get all tenants
    console.log("\n🏠 All tenants in database:");
    const allTenants = await db.select().from(tenants);
    
    allTenants.forEach(tenant => {
      console.log(`  ${tenant.name} (${tenant.primaryEmail})`);
      console.log(`    ID: ${tenant.id}`);
      console.log(`    Created: ${tenant.createdAt}`);
      console.log('');
    });
    
    // Check for users without tenants
    const usersWithoutTenants = allUsers.filter(user => !user.tenantId);
    if (usersWithoutTenants.length > 0) {
      console.log("⚠️  Users without tenant assignments:");
      usersWithoutTenants.forEach(user => {
        console.log(`  - ${user.email} (${user.name})`);
      });
      
      console.log("\n🔧 To fix this, you can either:");
      console.log("1. Delete these users and let them sign in again (will auto-create tenant)");
      console.log("2. Manually assign them to existing tenants");
      console.log("3. Create new tenants for them");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await conn.end();
  }
}

debugUserTenant().catch(console.error); 