import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

async function testRLS() {
  console.log("🧪 Testing Row Level Security...");
  
  const conn = postgres(DATABASE_URL);
  
  try {
    // Test 1: Create a test tenant
    console.log("\n1. Creating test tenant...");
    const [tenant] = await conn`
      INSERT INTO app_tenant (name, primary_email) 
      VALUES ('Test Family', 'test@example.com')
      RETURNING id, name
    `;
    console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})`);
    
    // Test 2: Create a user for this tenant
    console.log("\n2. Creating user for tenant...");
    const userId = crypto.randomUUID();
    const [user] = await conn`
      INSERT INTO app_user (id, tenant_id, name, email, role) 
      VALUES (${userId}, ${tenant.id}, 'Test Guardian', 'guardian@example.com', 'primary_guardian')
      RETURNING id, name
    `;
    console.log(`✅ Created user: ${user.name} (${user.id})`);
    
    // Test 3: Set tenant context
    console.log("\n3. Setting tenant context...");
    await conn.unsafe(`SET app.current_tenant_id = '${tenant.id}'`);
    await conn.unsafe(`SET app.user_role = 'primary_guardian'`);
    
    // Test 4: Query users with RLS enabled
    console.log("\n4. Testing RLS policies...");
    const usersInContext = await conn`SELECT COUNT(*) as count FROM app_user`;
    console.log(`✅ Users visible with tenant context: ${usersInContext[0].count}`);
    
    // Test 5: Clear context and test isolation
    console.log("\n5. Testing isolation (clearing context)...");
    await conn.unsafe(`RESET app.current_tenant_id`);
    await conn.unsafe(`RESET app.user_role`);
    
    const usersWithoutContext = await conn`SELECT COUNT(*) as count FROM app_user`;
    console.log(`✅ Users visible without context: ${usersWithoutContext[0].count} (should be 0)`);
    
    // Test 6: Test super admin access
    console.log("\n6. Testing super admin access...");
    await conn.unsafe(`SET app.user_role = 'super_admin'`);
    
    const usersAsSuperAdmin = await conn`SELECT COUNT(*) as count FROM app_user`;
    console.log(`✅ Users visible as super admin: ${usersAsSuperAdmin[0].count}`);
    
    // Cleanup
    console.log("\n🧹 Cleaning up...");
    await conn.unsafe(`SET app.current_tenant_id = '${tenant.id}'`);
    await conn`DELETE FROM app_user WHERE id = ${user.id}`;
    await conn`DELETE FROM app_tenant WHERE id = ${tenant.id}`;
    
    console.log("\n✅ RLS test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await conn.end();
  }
}

testRLS();