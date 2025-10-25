import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
const conn = postgres(DATABASE_URL);

async function resetRLS() {
  console.log("🔄 Resetting RLS policies...");
  
  try {
    // Drop existing policies
    console.log("Dropping existing policies...");
    await conn.unsafe(`
      DROP POLICY IF EXISTS tenant_isolation ON app_tenant;
      DROP POLICY IF EXISTS user_tenant_isolation ON app_user;
      DROP POLICY IF EXISTS student_tenant_isolation ON app_student;
      DROP POLICY IF EXISTS course_tenant_isolation ON app_course;
      DROP POLICY IF EXISTS grade_tenant_isolation ON app_grade;
      DROP POLICY IF EXISTS test_score_tenant_isolation ON app_test_score;
      DROP POLICY IF EXISTS invitation_tenant_isolation ON app_invitation;
      DROP POLICY IF EXISTS audit_log_tenant_isolation ON app_audit_log;
    `);
    
    // Force RLS on all tables
    console.log("Enabling FORCE RLS...");
    await conn.unsafe(`
      ALTER TABLE app_tenant FORCE ROW LEVEL SECURITY;
      ALTER TABLE app_user FORCE ROW LEVEL SECURITY;
      ALTER TABLE app_student FORCE ROW LEVEL SECURITY;
      ALTER TABLE app_course FORCE ROW LEVEL SECURITY;
      ALTER TABLE app_grade FORCE ROW LEVEL SECURITY;
      ALTER TABLE app_test_score FORCE ROW LEVEL SECURITY;
      ALTER TABLE app_invitation FORCE ROW LEVEL SECURITY;
      ALTER TABLE app_audit_log FORCE ROW LEVEL SECURITY;
    `);
    
    // Recreate policies
    console.log("Creating new policies...");
    await conn.unsafe(`
      -- Tenant isolation policy
      CREATE POLICY tenant_isolation ON app_tenant
          FOR ALL
          USING (id = get_current_tenant_id() OR current_setting('app.user_role', true) = 'super_admin');

      -- User tenant isolation
      CREATE POLICY user_tenant_isolation ON app_user
          FOR ALL
          USING (has_tenant_access(tenant_id));

      -- Student tenant isolation
      CREATE POLICY student_tenant_isolation ON app_student
          FOR ALL
          USING (has_tenant_access(tenant_id));

      -- Course tenant isolation
      CREATE POLICY course_tenant_isolation ON app_course
          FOR ALL
          USING (has_tenant_access(tenant_id));

      -- Grade tenant isolation (through course)
      CREATE POLICY grade_tenant_isolation ON app_grade
          FOR ALL
          USING (
              EXISTS (
                  SELECT 1 FROM app_course 
                  WHERE app_course.id = app_grade.course_id 
                  AND has_tenant_access(app_course.tenant_id)
              )
          );

      -- Test score tenant isolation
      CREATE POLICY test_score_tenant_isolation ON app_test_score
          FOR ALL
          USING (has_tenant_access(tenant_id));

      -- Invitation tenant isolation
      CREATE POLICY invitation_tenant_isolation ON app_invitation
          FOR ALL
          USING (has_tenant_access(tenant_id));

      -- Audit log tenant isolation
      CREATE POLICY audit_log_tenant_isolation ON app_audit_log
          FOR ALL
          USING (has_tenant_access(tenant_id) OR current_setting('app.user_role', true) = 'super_admin');
    `);
    
    console.log("✅ RLS policies reset successfully!");
    
  } catch (error) {
    console.error("❌ Reset failed:", error);
  } finally {
    await conn.end();
  }
}

resetRLS();