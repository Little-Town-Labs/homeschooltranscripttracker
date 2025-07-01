import { describe, it, expect, beforeEach } from 'vitest'
import { 
  setupTestDatabase, 
  createTestTenant, 
  createTestUser,
  createTestStudent,
  createTestCourse,
  createTestGrade,
  mockDbOperations,
  verifyTenantIsolation 
} from '../../helpers/database'

describe('Multi-Tenant Data Isolation', () => {
  setupTestDatabase()

  describe('Tenant Creation and User Assignment', () => {
    it('should create tenant with unique ID', () => {
      const tenant1 = createTestTenant({ name: 'Smith Family' })
      const tenant2 = createTestTenant({ name: 'Johnson Family' })

      expect(tenant1.id).not.toBe(tenant2.id)
      expect(tenant1.name).toBe('Smith Family')
      expect(tenant2.name).toBe('Johnson Family')
    })

    it('should assign users to specific tenants', () => {
      const tenant = createTestTenant()
      const user1 = createTestUser(tenant.id, { name: 'Parent 1' })
      const user2 = createTestUser(tenant.id, { name: 'Parent 2' })

      expect(user1.tenantId).toBe(tenant.id)
      expect(user2.tenantId).toBe(tenant.id)
      expect(user1.id).not.toBe(user2.id)
    })
  })

  describe('Student Data Isolation', () => {
    it('should isolate student data by tenant', () => {
      const tenant1 = createTestTenant()
      const tenant2 = createTestTenant()

      const { tenant1Students, tenant2Students } = verifyTenantIsolation(tenant1.id, tenant2.id)
      
      expect(tenant1Students).toHaveLength(1)
      expect(tenant1Students[0].name).toBe('Student 1')
      expect(tenant2Students).toHaveLength(1)
      expect(tenant2Students[0].name).toBe('Student 2')
    })

    it('should prevent cross-tenant student access', () => {
      const tenant1 = createTestTenant()
      const tenant2 = createTestTenant()
      
      const student1 = createTestStudent(tenant1.id, { name: 'Alice' })
      const student2 = createTestStudent(tenant2.id, { name: 'Bob' })

      // Tenant 1 should not see tenant 2's student
      const tenant1Student = mockDbOperations.findStudentByIdAndTenant(student2.id, tenant1.id)
      expect(tenant1Student).toBeUndefined()

      // Tenant 2 should not see tenant 1's student
      const tenant2Student = mockDbOperations.findStudentByIdAndTenant(student1.id, tenant2.id)
      expect(tenant2Student).toBeUndefined()

      // But each tenant should see their own student
      expect(mockDbOperations.findStudentByIdAndTenant(student1.id, tenant1.id)).toBeDefined()
      expect(mockDbOperations.findStudentByIdAndTenant(student2.id, tenant2.id)).toBeDefined()
    })
  })

  describe('Course Data Isolation', () => {
    it('should isolate course data by tenant and student', () => {
      const tenant1 = createTestTenant()
      const tenant2 = createTestTenant()
      
      const student1 = createTestStudent(tenant1.id)
      const student2 = createTestStudent(tenant2.id)
      
      const course1 = createTestCourse(student1.id, tenant1.id, { name: 'Algebra I' })
      const course2 = createTestCourse(student2.id, tenant2.id, { name: 'Biology' })

      // Tenant 1 should only see their courses
      const tenant1Courses = mockDbOperations.findCoursesByStudentAndTenant(student1.id, tenant1.id)
      expect(tenant1Courses).toHaveLength(1)
      expect(tenant1Courses[0].name).toBe('Algebra I')

      // Tenant 2 should only see their courses
      const tenant2Courses = mockDbOperations.findCoursesByStudentAndTenant(student2.id, tenant2.id)
      expect(tenant2Courses).toHaveLength(1)
      expect(tenant2Courses[0].name).toBe('Biology')

      // Cross-tenant access should return empty
      const crossTenantCourses = mockDbOperations.findCoursesByStudentAndTenant(student1.id, tenant2.id)
      expect(crossTenantCourses).toHaveLength(0)
    })
  })

  describe('Grade Data Isolation', () => {
    it('should isolate grade data by tenant', () => {
      const tenant1 = createTestTenant()
      const tenant2 = createTestTenant()
      
      const student1 = createTestStudent(tenant1.id)
      const student2 = createTestStudent(tenant2.id)
      
      const course1 = createTestCourse(student1.id, tenant1.id)
      const course2 = createTestCourse(student2.id, tenant2.id)
      
      const grade1 = createTestGrade(course1.id, student1.id, tenant1.id, { letter: 'A' })
      const grade2 = createTestGrade(course2.id, student2.id, tenant2.id, { letter: 'B' })

      // Each tenant should only see their own grades
      const tenant1Grades = mockDbOperations.findGradesByStudentAndTenant(student1.id, tenant1.id)
      expect(tenant1Grades).toHaveLength(1)
      expect(tenant1Grades[0].letter).toBe('A')

      const tenant2Grades = mockDbOperations.findGradesByStudentAndTenant(student2.id, tenant2.id)
      expect(tenant2Grades).toHaveLength(1)
      expect(tenant2Grades[0].letter).toBe('B')

      // Cross-tenant access should return empty
      const crossTenantGrades = mockDbOperations.findGradesByStudentAndTenant(student1.id, tenant2.id)
      expect(crossTenantGrades).toHaveLength(0)
    })
  })

  describe('CRUD Operations with Tenant Isolation', () => {
    it('should enforce tenant isolation during create operations', () => {
      const tenant1 = createTestTenant()
      const tenant2 = createTestTenant()

      // Create student for tenant 1
      const studentData = {
        name: 'John Doe',
        grade: 10,
        tenantId: tenant1.id,
        gpaScale: 4.0,
        graduationYear: 2026
      }

      const student = mockDbOperations.createStudent(studentData)
      expect(student.tenantId).toBe(tenant1.id)

      // Verify tenant 2 cannot see this student
      const tenant2Students = mockDbOperations.findStudentsByTenant(tenant2.id)
      expect(tenant2Students).toHaveLength(0)
    })

    it('should enforce tenant isolation during update operations', () => {
      const tenant1 = createTestTenant()
      const tenant2 = createTestTenant()
      
      const student = createTestStudent(tenant1.id, { name: 'Original Name' })

      // Tenant 1 should be able to update their student
      const updated = mockDbOperations.updateStudent(student.id, tenant1.id, { name: 'Updated Name' })
      expect(updated?.name).toBe('Updated Name')

      // Tenant 2 should not be able to update tenant 1's student
      const notUpdated = mockDbOperations.updateStudent(student.id, tenant2.id, { name: 'Hacked Name' })
      expect(notUpdated).toBeNull()

      // Verify the student name wasn't changed by the invalid update
      const studentCheck = mockDbOperations.findStudentByIdAndTenant(student.id, tenant1.id)
      expect(studentCheck?.name).toBe('Updated Name')
    })

    it('should enforce tenant isolation during delete operations', () => {
      const tenant1 = createTestTenant()
      const tenant2 = createTestTenant()
      
      const student = createTestStudent(tenant1.id)

      // Tenant 2 should not be able to delete tenant 1's student
      const deleteResult1 = mockDbOperations.deleteStudent(student.id, tenant2.id)
      expect(deleteResult1).toBe(false)

      // Verify student still exists
      expect(mockDbOperations.findStudentByIdAndTenant(student.id, tenant1.id)).toBeDefined()

      // Tenant 1 should be able to delete their own student
      const deleteResult2 = mockDbOperations.deleteStudent(student.id, tenant1.id)
      expect(deleteResult2).toBe(true)

      // Verify student is now deleted
      expect(mockDbOperations.findStudentByIdAndTenant(student.id, tenant1.id)).toBeUndefined()
    })
  })

  describe('Complex Multi-Entity Scenarios', () => {
    it('should maintain isolation across related entities', () => {
      const tenant1 = createTestTenant()
      const tenant2 = createTestTenant()

      // Create complete academic records for both tenants
      const student1 = createTestStudent(tenant1.id, { name: 'Student 1' })
      const student2 = createTestStudent(tenant2.id, { name: 'Student 2' })

      const course1 = createTestCourse(student1.id, tenant1.id, { name: 'Math 1' })
      const course2 = createTestCourse(student2.id, tenant2.id, { name: 'Math 2' })

      const grade1 = createTestGrade(course1.id, student1.id, tenant1.id, { letter: 'A' })
      const grade2 = createTestGrade(course2.id, student2.id, tenant2.id, { letter: 'B' })

      // Verify complete isolation
      expect(mockDbOperations.findStudentsByTenant(tenant1.id)).toHaveLength(1)
      expect(mockDbOperations.findStudentsByTenant(tenant2.id)).toHaveLength(1)
      
      expect(mockDbOperations.findCoursesByStudentAndTenant(student1.id, tenant1.id)).toHaveLength(1)
      expect(mockDbOperations.findCoursesByStudentAndTenant(student2.id, tenant2.id)).toHaveLength(1)
      
      expect(mockDbOperations.findGradesByStudentAndTenant(student1.id, tenant1.id)).toHaveLength(1)
      expect(mockDbOperations.findGradesByStudentAndTenant(student2.id, tenant2.id)).toHaveLength(1)

      // Verify no cross-tenant data leakage
      expect(mockDbOperations.findCoursesByStudentAndTenant(student1.id, tenant2.id)).toHaveLength(0)
      expect(mockDbOperations.findGradesByStudentAndTenant(student1.id, tenant2.id)).toHaveLength(0)
    })
  })
})