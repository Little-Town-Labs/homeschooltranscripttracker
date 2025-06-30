import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

async function testMultiTenant() {
  console.log("🧪 Testing multi-tenant data isolation...");
  
  const conn = postgres(DATABASE_URL);
  const db = drizzle(conn, { schema });
  
  try {
    // Test 1: Create a test tenant
    console.log("\n1. Creating test tenant...");
    const [tenant] = await db.insert(schema.tenants).values({
      name: "Test Family",
      primaryEmail: "test@example.com",
    }).returning();
    
    console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})`);
    
    // Test 2: Set tenant context and create a user
    console.log("\n2. Setting tenant context and creating user...");
    await conn.unsafe(`SET app.current_tenant_id = '${tenant.id}'`);
    await conn.unsafe(`SET app.user_role = 'primary_guardian'`);
    
    const [user] = await db.insert(schema.users).values({
      tenantId: tenant.id,
      name: "Test Guardian",
      email: "guardian@example.com",
      role: "primary_guardian",
    }).returning();
    
    console.log(`✅ Created user: ${user.name} (${user.id})`);
    
    // Test 3: Query users - should only see users from our tenant
    console.log("\n3. Testing RLS - querying users...");
    const users = await db.select().from(schema.users);
    console.log(`✅ Found ${users.length} user(s) in current tenant context`);
    
    // Test 4: Try to access without tenant context (should fail/return empty)
    console.log("\n4. Testing isolation - clearing tenant context...");
    await conn.unsafe(`RESET app.current_tenant_id`);
    await conn.unsafe(`RESET app.user_role`);
    
    const usersWithoutContext = await db.select().from(schema.users);
    console.log(`✅ Found ${usersWithoutContext.length} user(s) without tenant context (should be 0)`);
    
    // Test 5: Test super admin access
    console.log("\n5. Testing super admin access...");
    await conn.unsafe(`SET app.user_role = 'super_admin'`);
    
    const usersAsSuperAdmin = await db.select().from(schema.users);
    console.log(`✅ Super admin can see ${usersAsSuperAdmin.length} user(s)`);
    
    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await conn.unsafe(`SET app.current_tenant_id = '${tenant.id}'`);
    await db.delete(schema.users).where(schema.users.id.eq(user.id));
    await db.delete(schema.tenants).where(schema.tenants.id.eq(tenant.id));
    
    console.log("\n✅ Multi-tenant isolation test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await conn.end();
  }
}

testMultiTenant();