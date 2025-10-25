import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
const conn = postgres(DATABASE_URL);

async function testIsolation() {
  console.log("🧪 Testing multi-tenant isolation...");
  
  try {
    // Create two separate tenants
    const [tenant1] = await conn`
      INSERT INTO app_tenant (name, primary_email) 
      VALUES ('Family 1', 'family1@example.com')
      RETURNING id, name
    `;
    
    const [tenant2] = await conn`
      INSERT INTO app_tenant (name, primary_email) 
      VALUES ('Family 2', 'family2@example.com')
      RETURNING id, name
    `;
    
    console.log(`Created tenant 1: ${tenant1.name} (${tenant1.id})`);
    console.log(`Created tenant 2: ${tenant2.name} (${tenant2.id})`);
    
    // Create users for each tenant
    const user1Id = crypto.randomUUID();
    const user2Id = crypto.randomUUID();
    
    await conn`
      INSERT INTO app_user (id, tenant_id, name, email, role) 
      VALUES (${user1Id}, ${tenant1.id}, 'Guardian 1', 'guardian1@example.com', 'primary_guardian')
    `;
    
    await conn`
      INSERT INTO app_user (id, tenant_id, name, email, role) 
      VALUES (${user2Id}, ${tenant2.id}, 'Guardian 2', 'guardian2@example.com', 'primary_guardian')
    `;
    
    console.log("Created users for both tenants");
    
    // Test 1: Set context to tenant 1, should only see tenant 1 users
    console.log("\n1. Testing isolation for Tenant 1:");
    await conn.unsafe(`SET app.current_tenant_id = '${tenant1.id}'`);
    await conn.unsafe(`SET app.user_role = 'primary_guardian'`);
    
    const tenant1Users = await conn`
      SELECT name, email FROM app_user WHERE tenant_id = ${tenant1.id}
    `;
    const allUsers = await conn`SELECT name, email FROM app_user`;
    
    console.log(`   Direct query for tenant 1: ${tenant1Users.length} users`);
    console.log(`   RLS query sees: ${allUsers.length} users`);
    
    if (allUsers.length === tenant1Users.length) {
      console.log("   ✅ RLS is working - only sees tenant 1 users");
    } else {
      console.log("   ❌ RLS not working - sees users from other tenants");
    }
    
    // Test 2: Switch to tenant 2 context
    console.log("\n2. Testing isolation for Tenant 2:");
    await conn.unsafe(`SET app.current_tenant_id = '${tenant2.id}'`);
    
    const tenant2Users = await conn`
      SELECT name, email FROM app_user WHERE tenant_id = ${tenant2.id}
    `;
    const allUsers2 = await conn`SELECT name, email FROM app_user`;
    
    console.log(`   Direct query for tenant 2: ${tenant2Users.length} users`);
    console.log(`   RLS query sees: ${allUsers2.length} users`);
    
    if (allUsers2.length === tenant2Users.length) {
      console.log("   ✅ RLS is working - only sees tenant 2 users");
    } else {
      console.log("   ❌ RLS not working - sees users from other tenants");
    }
    
    // Test 3: Clear context - should see no users
    console.log("\n3. Testing with no tenant context:");
    await conn.unsafe(`RESET app.current_tenant_id`);
    await conn.unsafe(`RESET app.user_role`);
    
    const noContextUsers = await conn`SELECT name, email FROM app_user`;
    console.log(`   RLS query with no context sees: ${noContextUsers.length} users`);
    
    if (noContextUsers.length === 0) {
      console.log("   ✅ RLS is working - no access without context");
    } else {
      console.log("   ❌ RLS not working - can see users without context");
    }
    
    // Cleanup
    console.log("\n🧹 Cleaning up...");
    await conn.unsafe(`SET app.user_role = 'super_admin'`);
    await conn`DELETE FROM app_user WHERE id IN (${user1Id}, ${user2Id})`;
    await conn`DELETE FROM app_tenant WHERE id IN (${tenant1.id}, ${tenant2.id})`;
    
    console.log("✅ Isolation test completed");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await conn.end();
  }
}

testIsolation();