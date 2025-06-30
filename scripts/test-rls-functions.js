import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
const conn = postgres(DATABASE_URL);

async function testRLSFunctions() {
  console.log("🧪 Testing RLS functions...");
  
  try {
    // Create a test tenant
    const [tenant] = await conn`
      INSERT INTO app_tenant (name, primary_email) 
      VALUES ('Test Family', 'test@example.com')
      RETURNING id, name
    `;
    console.log(`Created tenant: ${tenant.id}`);
    
    // Test 1: Check function without setting context
    console.log("\n1. Testing get_current_tenant_id() without context:");
    const result1 = await conn`SELECT get_current_tenant_id() as tenant_id`;
    console.log(`Result: ${result1[0].tenant_id}`);
    
    // Test 2: Set context and test function
    console.log("\n2. Setting context and testing function:");
    await conn.unsafe(`SET app.current_tenant_id = '${tenant.id}'`);
    await conn.unsafe(`SET app.user_role = 'primary_guardian'`);
    
    const result2 = await conn`SELECT get_current_tenant_id() as tenant_id`;
    console.log(`Result with context: ${result2[0].tenant_id}`);
    
    // Test 3: Test has_tenant_access function
    console.log("\n3. Testing has_tenant_access function:");
    const result3 = await conn`SELECT has_tenant_access(${tenant.id}) as has_access`;
    console.log(`Has access to tenant: ${result3[0].has_access}`);
    
    // Test 4: Clear context and test again
    console.log("\n4. Clearing context and testing:");
    await conn.unsafe(`RESET app.current_tenant_id`);
    await conn.unsafe(`RESET app.user_role`);
    
    const result4 = await conn`SELECT get_current_tenant_id() as tenant_id, has_tenant_access(${tenant.id}) as has_access`;
    console.log(`Without context - tenant_id: ${result4[0].tenant_id}, has_access: ${result4[0].has_access}`);
    
    // Test 5: Test as super admin
    console.log("\n5. Testing as super admin:");
    await conn.unsafe(`SET app.user_role = 'super_admin'`);
    
    const result5 = await conn`SELECT has_tenant_access(${tenant.id}) as has_access`;
    console.log(`Super admin has access: ${result5[0].has_access}`);
    
    // Cleanup
    await conn`DELETE FROM app_tenant WHERE id = ${tenant.id}`;
    
    console.log("\n✅ Function test completed");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await conn.end();
  }
}

testRLSFunctions();