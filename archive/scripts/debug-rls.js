import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
const conn = postgres(DATABASE_URL);

async function debugRLS() {
  console.log("🔍 Debugging RLS setup...");
  
  try {
    // Check if RLS is enabled on tables
    console.log("\n1. Checking RLS status on tables:");
    const rlsStatus = await conn`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename LIKE 'app_%' 
      ORDER BY tablename
    `;
    
    rlsStatus.forEach(row => {
      console.log(`   ${row.tablename}: RLS ${row.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
    });
    
    // Check if policies exist
    console.log("\n2. Checking existing policies:");
    const policies = await conn`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies 
      WHERE tablename LIKE 'app_%'
      ORDER BY tablename, policyname
    `;
    
    policies.forEach(policy => {
      console.log(`   ${policy.tablename}.${policy.policyname}: ${policy.cmd} for ${policy.roles}`);
    });
    
    // Check if functions exist
    console.log("\n3. Checking RLS functions:");
    const functions = await conn`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname IN ('get_current_tenant_id', 'has_tenant_access')
    `;
    
    functions.forEach(func => {
      console.log(`   Function: ${func.proname} exists`);
    });
    
    console.log("\n✅ RLS debug completed");
    
  } catch (error) {
    console.error("❌ Debug failed:", error);
  } finally {
    await conn.end();
  }
}

debugRLS();