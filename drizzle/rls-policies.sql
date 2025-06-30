-- Row Level Security Policies for Homeschool Transcript Tracker
-- Multi-tenant data isolation using tenant_id

-- Enable RLS on all application tables and force for table owners
ALTER TABLE app_tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_tenant FORCE ROW LEVEL SECURITY;
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user FORCE ROW LEVEL SECURITY;
ALTER TABLE app_student ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_student FORCE ROW LEVEL SECURITY;
ALTER TABLE app_course ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_course FORCE ROW LEVEL SECURITY;
ALTER TABLE app_grade ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_grade FORCE ROW LEVEL SECURITY;
ALTER TABLE app_test_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_test_score FORCE ROW LEVEL SECURITY;
ALTER TABLE app_invitation ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_invitation FORCE ROW LEVEL SECURITY;
ALTER TABLE app_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_audit_log FORCE ROW LEVEL SECURITY;

-- Create function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_current_tenant_id() 
RETURNS UUID AS $$
BEGIN
    -- Get tenant_id from the current user's session
    -- This would be set by the application middleware
    RETURN COALESCE(
        current_setting('app.current_tenant_id', true)::UUID,
        NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has access to tenant
CREATE OR REPLACE FUNCTION has_tenant_access(target_tenant_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    -- Super admins can access any tenant
    IF current_setting('app.user_role', true) = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Regular users can only access their own tenant
    RETURN target_tenant_id = get_current_tenant_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TENANT TABLE POLICIES
-- Tenants can only see their own record
CREATE POLICY tenant_isolation ON app_tenant
    FOR ALL
    USING (id = get_current_tenant_id() OR current_setting('app.user_role', true) = 'super_admin');

-- USER TABLE POLICIES  
-- Users can only see users within their tenant
CREATE POLICY user_tenant_isolation ON app_user
    FOR ALL
    USING (has_tenant_access(tenant_id));

-- STUDENT TABLE POLICIES
-- Students are isolated by tenant
CREATE POLICY student_tenant_isolation ON app_student
    FOR ALL
    USING (has_tenant_access(tenant_id));

-- COURSE TABLE POLICIES
-- Courses are isolated by tenant
CREATE POLICY course_tenant_isolation ON app_course
    FOR ALL
    USING (has_tenant_access(tenant_id));

-- GRADE TABLE POLICIES
-- Grades are isolated by tenant (through course relationship)
CREATE POLICY grade_tenant_isolation ON app_grade
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM app_course 
            WHERE app_course.id = app_grade.course_id 
            AND has_tenant_access(app_course.tenant_id)
        )
    );

-- TEST SCORE TABLE POLICIES
-- Test scores are isolated by tenant
CREATE POLICY test_score_tenant_isolation ON app_test_score
    FOR ALL
    USING (has_tenant_access(tenant_id));

-- INVITATION TABLE POLICIES
-- Invitations are isolated by tenant
CREATE POLICY invitation_tenant_isolation ON app_invitation
    FOR ALL
    USING (has_tenant_access(tenant_id));

-- AUDIT LOG TABLE POLICIES
-- Audit logs are isolated by tenant
CREATE POLICY audit_log_tenant_isolation ON app_audit_log
    FOR ALL
    USING (has_tenant_access(tenant_id) OR current_setting('app.user_role', true) = 'super_admin');

-- Grant usage on the functions to the application user
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION has_tenant_access(UUID) TO PUBLIC;

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_user_tenant_id ON app_user(tenant_id);
CREATE INDEX IF NOT EXISTS idx_student_tenant_id ON app_student(tenant_id);
CREATE INDEX IF NOT EXISTS idx_course_tenant_id ON app_course(tenant_id);
CREATE INDEX IF NOT EXISTS idx_test_score_tenant_id ON app_test_score(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitation_tenant_id ON app_invitation(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON app_audit_log(tenant_id);