import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
const conn = postgres(DATABASE_URL);

async function checkUsers() {
  console.log("🔍 Checking existing users...");
  
  try {
    // Check all users and their tenant_id
    const users = await conn`
      SELECT id, name, email, tenant_id, role 
      FROM app_user 
      ORDER BY created_at
    `;
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name || 'No name'} (${user.email}) - Tenant: ${user.tenant_id || 'NULL'} - Role: ${user.role}`);
    });
    
    // Check users without tenant_id
    const usersWithoutTenant = await conn`
      SELECT COUNT(*) as count 
      FROM app_user 
      WHERE tenant_id IS NULL
    `;
    
    console.log(`\nUsers without tenant_id: ${usersWithoutTenant[0].count}`);
    
    if (usersWithoutTenant[0].count > 0) {
      console.log("⚠️  Users without tenant_id will bypass RLS policies!");
    }
    
  } catch (error) {
    console.error("❌ Check failed:", error);
  } finally {
    await conn.end();
  }
}

checkUsers();