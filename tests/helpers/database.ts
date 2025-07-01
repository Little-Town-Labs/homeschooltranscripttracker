// Database testing helpers for WSL2 environment
import { beforeEach, afterEach } from 'vitest'

// Mock database interface for testing
export interface MockDatabase {
  students: any[]
  courses: any[]
  grades: any[]
  tenants: any[]
  users: any[]
}

// In-memory test database
let testDb: MockDatabase = {
  students: [],
  courses: [],
  grades: [],
  tenants: [],
  users: []
}

// Reset database before each test
export const setupTestDatabase = () => {
  beforeEach(() => {
    testDb = {
      students: [],
      courses: [],
      grades: [],
      tenants: [],
      users: []
    }
  })
}

// Get test database instance
export const getTestDb = (): MockDatabase => testDb

// Helper to create test tenant
export const createTestTenant = (overrides: any = {}) => {
  const tenant = {
    id: `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Family',
    primaryEmail: 'test@example.com',
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  testDb.tenants.push(tenant)
  return tenant
}

// Helper to create test user
export const createTestUser = (tenantId: string, overrides: any = {}) => {
  const user = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: 'user@example.com',
    name: 'Test User',
    tenantId,
    role: 'primary_guardian',
    emailVerified: new Date(),
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  testDb.users.push(user)
  return user
}

// Helper to create test student
export const createTestStudent = (tenantId: string, overrides: any = {}) => {
  const student = {
    id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Student',
    grade: 9,
    tenantId,
    gpaScale: 4.0,
    graduationYear: new Date().getFullYear() + 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  testDb.students.push(student)
  return student
}

// Helper to create test course
export const createTestCourse = (studentId: string, tenantId: string, overrides: any = {}) => {
  const course = {
    id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Course',
    subject: 'Mathematics',
    level: 'Regular',
    credits: 1.0,
    studentId,
    tenantId,
    academicYear: '2023-2024',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  testDb.courses.push(course)
  return course
}

// Helper to create test grade
export const createTestGrade = (courseId: string, studentId: string, tenantId: string, overrides: any = {}) => {
  const grade = {
    id: `grade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    letter: 'A' as const,
    percentage: 95,
    semester: 'Fall',
    year: 2023,
    courseId,
    studentId,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  testDb.grades.push(grade)
  return grade
}

// Mock database operations
export const mockDbOperations = {
  // Find students by tenant
  findStudentsByTenant: (tenantId: string) => {
    return testDb.students.filter(student => student.tenantId === tenantId)
  },

  // Find student by ID and tenant (for security)
  findStudentByIdAndTenant: (id: string, tenantId: string) => {
    return testDb.students.find(student => 
      student.id === id && student.tenantId === tenantId
    )
  },

  // Find courses by student and tenant
  findCoursesByStudentAndTenant: (studentId: string, tenantId: string) => {
    return testDb.courses.filter(course => 
      course.studentId === studentId && course.tenantId === tenantId
    )
  },

  // Find grades by course and tenant
  findGradesByCourseAndTenant: (courseId: string, tenantId: string) => {
    return testDb.grades.filter(grade => 
      grade.courseId === courseId && grade.tenantId === tenantId
    )
  },

  // Find all grades for a student
  findGradesByStudentAndTenant: (studentId: string, tenantId: string) => {
    return testDb.grades.filter(grade => 
      grade.studentId === studentId && grade.tenantId === tenantId
    )
  },

  // Create operations
  createStudent: (data: any) => {
    const student = createTestStudent(data.tenantId, data)
    return student
  },

  createCourse: (data: any) => {
    const course = createTestCourse(data.studentId, data.tenantId, data)
    return course
  },

  createGrade: (data: any) => {
    const grade = createTestGrade(data.courseId, data.studentId, data.tenantId, data)
    return grade
  },

  // Update operations
  updateStudent: (id: string, tenantId: string, data: any) => {
    const studentIndex = testDb.students.findIndex(s => s.id === id && s.tenantId === tenantId)
    if (studentIndex === -1) return null
    
    testDb.students[studentIndex] = {
      ...testDb.students[studentIndex],
      ...data,
      updatedAt: new Date()
    }
    return testDb.students[studentIndex]
  },

  // Delete operations
  deleteStudent: (id: string, tenantId: string) => {
    const studentIndex = testDb.students.findIndex(s => s.id === id && s.tenantId === tenantId)
    if (studentIndex === -1) return false
    
    testDb.students.splice(studentIndex, 1)
    return true
  }
}

// Verify multi-tenant isolation (returns data for manual verification in tests)
export const verifyTenantIsolation = (tenantId1: string, tenantId2: string) => {
  // Create data for two different tenants
  const student1 = createTestStudent(tenantId1, { name: 'Student 1' })
  const student2 = createTestStudent(tenantId2, { name: 'Student 2' })

  // Get data for verification
  const tenant1Students = mockDbOperations.findStudentsByTenant(tenantId1)
  const tenant2Students = mockDbOperations.findStudentsByTenant(tenantId2)

  return { student1, student2, tenant1Students, tenant2Students }
}