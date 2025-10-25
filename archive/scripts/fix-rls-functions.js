import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
const conn = postgres(DATABASE_URL);

async function fixRLSFunctions() {
  console.log("🔧 Fixing RLS functions...");
  
  try {
    await conn.unsafe(`
      -- Create improved function to get current user's tenant_id
      CREATE OR REPLACE FUNCTION get_current_tenant_id() 
      RETURNS UUID AS $$
      DECLARE
          tenant_setting TEXT;
      BEGIN
          -- Get tenant_id from the current user's session
          tenant_setting := current_setting('app.current_tenant_id', true);
          
          -- Return NULL if not set or empty
          IF tenant_setting IS NULL OR tenant_setting = '' THEN
              RETURN NULL;
          END IF;
          
          -- Try to cast to UUID, return NULL if invalid
          BEGIN
              RETURN tenant_setting::UUID;
          EXCEPTION
              WHEN invalid_text_representation THEN
                  RETURN NULL;
          END;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Create improved function to check if user has access to tenant
      CREATE OR REPLACE FUNCTION has_tenant_access(target_tenant_id UUID) 
      RETURNS BOOLEAN AS $$
      DECLARE
          current_tenant UUID;
          user_role TEXT;
      BEGIN
          -- Get current user role
          user_role := current_setting('app.user_role', true);
          
          -- Super admins can access any tenant
          IF user_role = 'super_admin' THEN
              RETURN TRUE;
          END IF;
          
          -- Get current tenant
          current_tenant := get_current_tenant_id();
          
          -- If no tenant context, deny access
          IF current_tenant IS NULL THEN
              RETURN FALSE;
          END IF;
          
          -- Regular users can only access their own tenant
          RETURN target_tenant_id = current_tenant;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    console.log("✅ RLS functions fixed successfully!");
    
  } catch (error) {
    console.error("❌ Fix failed:", error);
  } finally {
    await conn.end();
  }
}

fixRLSFunctions();