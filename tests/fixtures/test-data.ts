// Test data fixtures for consistent testing
import { faker } from '@faker-js/faker'

export const createTestTenant = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name() + ' Family',
  primaryEmail: faker.internet.email(),
  trialEndsAt: faker.date.future(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides
})

export const createTestUser = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  tenantId: faker.string.uuid(),
  role: 'primary_guardian',
  emailVerified: faker.date.recent(),
  image: faker.image.avatar(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides
})

export const createTestStudent = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  grade: faker.number.int({ min: 9, max: 12 }),
  tenantId: faker.string.uuid(),
  gpaScale: faker.helpers.arrayElement([4.0, 5.0]),
  graduationYear: faker.number.int({ min: 2024, max: 2030 }),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides
})

export const createTestCourse = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  name: faker.helpers.arrayElement([
    'Algebra II', 'Biology', 'World History', 'English Literature',
    'Chemistry', 'Calculus', 'Physics', 'Government', 'Art History'
  ]),
  subject: faker.helpers.arrayElement([
    'Mathematics', 'Science', 'English', 'History', 'Arts', 'Foreign Language'
  ]),
  level: faker.helpers.arrayElement(['Regular', 'Honors', 'AP', 'Dual Enrollment']),
  credits: faker.helpers.arrayElement([0.5, 1.0, 1.5]),
  studentId: faker.string.uuid(),
  tenantId: faker.string.uuid(),
  academicYear: `${faker.number.int({ min: 2020, max: 2024 })}-${faker.number.int({ min: 2021, max: 2025 })}`,
  isActive: true,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides
})

export const createTestGrade = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  letter: faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'F']),
  percentage: faker.number.int({ min: 60, max: 100 }),
  semester: faker.helpers.arrayElement(['Fall', 'Spring', 'Full Year']),
  year: faker.number.int({ min: 2020, max: 2024 }),
  courseId: faker.string.uuid(),
  studentId: faker.string.uuid(),
  tenantId: faker.string.uuid(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides
})

export const createTestScore = (overrides: Partial<any> = {}) => ({
  id: faker.string.uuid(),
  testType: faker.helpers.arrayElement(['SAT', 'ACT', 'PSAT', 'AP']),
  subject: faker.helpers.arrayElement(['Math', 'English', 'Science', 'History']),
  score: faker.number.int({ min: 200, max: 800 }),
  maxScore: faker.number.int({ min: 800, max: 1600 }),
  testDate: faker.date.recent(),
  studentId: faker.string.uuid(),
  tenantId: faker.string.uuid(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides
})

// Helper to create complete academic records
export const createAcademicRecord = (tenantId?: string, studentId?: string) => {
  const tenant = createTestTenant({ id: tenantId })
  const student = createTestStudent({ 
    id: studentId, 
    tenantId: tenant.id 
  })
  
  const courses = Array.from({ length: 5 }, () => 
    createTestCourse({ 
      studentId: student.id, 
      tenantId: tenant.id 
    })
  )
  
  const grades = courses.map(course => 
    createTestGrade({ 
      courseId: course.id, 
      studentId: student.id, 
      tenantId: tenant.id 
    })
  )
  
  const testScores = Array.from({ length: 3 }, () => 
    createTestScore({ 
      studentId: student.id, 
      tenantId: tenant.id 
    })
  )

  return {
    tenant,
    student,
    courses,
    grades,
    testScores
  }
}

// Specific test scenarios
export const testScenarios = {
  // High-achieving student
  honorStudent: () => {
    const record = createAcademicRecord()
    return {
      ...record,
      grades: record.grades.map(grade => ({ 
        ...grade, 
        letter: 'A', 
        percentage: faker.number.int({ min: 90, max: 100 }) 
      })),
      courses: record.courses.map(course => ({ 
        ...course, 
        level: 'Honors' 
      }))
    }
  },

  // Struggling student
  strugglingStudent: () => {
    const record = createAcademicRecord()
    return {
      ...record,
      grades: record.grades.map(grade => ({ 
        ...grade, 
        letter: faker.helpers.arrayElement(['C', 'D']), 
        percentage: faker.number.int({ min: 60, max: 79 }) 
      }))
    }
  },

  // Mixed performance
  averageStudent: () => {
    const record = createAcademicRecord()
    return {
      ...record,
      grades: record.grades.map(grade => ({ 
        ...grade, 
        letter: faker.helpers.arrayElement(['A', 'B', 'C']), 
        percentage: faker.number.int({ min: 70, max: 95 }) 
      }))
    }
  }
}