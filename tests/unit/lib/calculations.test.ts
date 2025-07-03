import { describe, it, expect } from 'vitest'
import { 
  calculateGPA, 
  calculateWeightedGPA, 
  percentageToLetter, 
  calculateTotalCredits,
  type Grade 
} from '@/lib/calculations'

describe('GPA Calculations - Real Business Logic', () => {
  describe('calculateGPA - Core Student GPA Logic', () => {
    it('should calculate correct GPA for real student grades on 4.0 scale', () => {
      const studentGrades: Grade[] = [
        { letter: 'A', credits: 4 }, // Biology - 4.0 * 4 = 16
        { letter: 'B', credits: 3 }, // Math - 3.0 * 3 = 9  
        { letter: 'A', credits: 2 }, // Art - 4.0 * 2 = 8
        { letter: 'C', credits: 1 }  // PE - 2.0 * 1 = 2
      ]
      
      const gpa = calculateGPA(studentGrades, 4.0)
      
      // Total: 35 points / 10 credits = 3.5 GPA
      expect(gpa).toBe(3.5)
    })

    it('should handle honors courses correctly on 5.0 scale', () => {
      const honorsGrades: Grade[] = [
        { letter: 'A', credits: 4, isHonors: true },  // AP Bio: 5.0 * 4 = 20
        { letter: 'B', credits: 3, isHonors: true },  // AP Math: 4.0 * 3 = 12
        { letter: 'A', credits: 3, isHonors: false }, // Regular English: 4.0 * 3 = 12
        { letter: 'F', credits: 1, isHonors: true }   // Failed honors class: 0 * 1 = 0 (no boost for F)
      ]
      
      const gpa = calculateGPA(honorsGrades, 5.0)
      
      // Total: 44 points / 11 credits = 4.0 GPA
      expect(gpa).toBe(4.0)
    })

    it('should handle edge case of no grades', () => {
      const noGrades: Grade[] = []
      expect(calculateGPA(noGrades, 4.0)).toBe(0)
      expect(calculateGPA(noGrades, 5.0)).toBe(0)
    })

    it('should handle student with all failing grades', () => {
      const failingGrades: Grade[] = [
        { letter: 'F', credits: 3 },
        { letter: 'F', credits: 4 },
        { letter: 'F', credits: 2 }
      ]
      
      expect(calculateGPA(failingGrades, 4.0)).toBe(0)
    })

    it('should handle perfect 4.0 student', () => {
      const perfectGrades: Grade[] = [
        { letter: 'A', credits: 4 },
        { letter: 'A', credits: 3 },
        { letter: 'A', credits: 2 },
        { letter: 'A', credits: 3 }
      ]
      
      expect(calculateGPA(perfectGrades, 4.0)).toBe(4.0)
    })

    it('should round GPA to 2 decimal places correctly', () => {
      const mixedGrades: Grade[] = [
        { letter: 'A', credits: 1 }, // 4 points
        { letter: 'B', credits: 1 }, // 3 points  
        { letter: 'C', credits: 1 }  // 2 points
      ]
      
      const gpa = calculateGPA(mixedGrades, 4.0)
      
      // 9 points / 3 credits = 3.0 exactly
      expect(gpa).toBe(3.0)
    })

    it('should handle complex real-world scenario', () => {
      // Simulating a real high school transcript
      const realTranscript: Grade[] = [
        // Freshman Year
        { letter: 'B', credits: 1.0 }, // English I
        { letter: 'A', credits: 1.0 }, // Algebra I
        { letter: 'A', credits: 1.0 }, // World History
        { letter: 'B', credits: 1.0 }, // Biology
        
        // Sophomore Year  
        { letter: 'A', credits: 1.0 }, // English II
        { letter: 'B', credits: 1.0 }, // Geometry
        { letter: 'A', credits: 1.0 }, // Chemistry
        { letter: 'C', credits: 0.5 }, // Art
        
        // Junior Year (some AP classes)
        { letter: 'A', credits: 1.0, isHonors: true }, // AP English
        { letter: 'B', credits: 1.0, isHonors: true }, // AP History
        { letter: 'A', credits: 1.0 }, // Physics
        { letter: 'A', credits: 0.5 }  // Music
      ]
      
      const gpa40 = calculateGPA(realTranscript, 4.0)
      const gpa50 = calculateGPA(realTranscript, 5.0)
      
      // On 4.0 scale, honors doesn't matter
      expect(gpa40).toBeGreaterThan(3.0)
      expect(gpa40).toBeLessThan(4.0)
      
      // On 5.0 scale, should be higher due to AP bonus
      expect(gpa50).toBeGreaterThan(gpa40)
    })
  })

  describe('percentageToLetter - Grade Conversion Logic', () => {
    it('should convert percentages to correct letter grades', () => {
      // Test boundary conditions and typical grades
      expect(percentageToLetter(100)).toBe('A')
      expect(percentageToLetter(95)).toBe('A') 
      expect(percentageToLetter(90)).toBe('A')  // Boundary
      expect(percentageToLetter(89)).toBe('B')
      expect(percentageToLetter(85)).toBe('B')
      expect(percentageToLetter(80)).toBe('B')  // Boundary
      expect(percentageToLetter(79)).toBe('C')
      expect(percentageToLetter(75)).toBe('C')
      expect(percentageToLetter(70)).toBe('C')  // Boundary
      expect(percentageToLetter(69)).toBe('D')
      expect(percentageToLetter(65)).toBe('D')
      expect(percentageToLetter(60)).toBe('D')  // Boundary
      expect(percentageToLetter(59)).toBe('F')
      expect(percentageToLetter(30)).toBe('F')
      expect(percentageToLetter(0)).toBe('F')
    })

    it('should handle edge cases correctly', () => {
      // Test exact boundary values
      expect(percentageToLetter(89.9)).toBe('B')
      expect(percentageToLetter(90.0)).toBe('A')
      expect(percentageToLetter(79.9)).toBe('C')
      expect(percentageToLetter(80.0)).toBe('B')
      expect(percentageToLetter(69.9)).toBe('D')
      expect(percentageToLetter(70.0)).toBe('C')
      expect(percentageToLetter(59.9)).toBe('F')
      expect(percentageToLetter(60.0)).toBe('D')
    })
  })

  describe('calculateTotalCredits - Credit Tracking', () => {
    it('should calculate total credits correctly', () => {
      const grades: Grade[] = [
        { letter: 'A', credits: 4.0 },
        { letter: 'B', credits: 3.0 },
        { letter: 'C', credits: 2.5 },
        { letter: 'A', credits: 1.0 }
      ]
      
      expect(calculateTotalCredits(grades)).toBe(10.5)
    })

    it('should handle empty grades array', () => {
      expect(calculateTotalCredits([])).toBe(0)
    })

    it('should handle partial credits correctly', () => {
      const partialCredits: Grade[] = [
        { letter: 'A', credits: 0.5 }, // Half credit course
        { letter: 'B', credits: 1.5 }, // 1.5 credit course
        { letter: 'A', credits: 3.0 }  // 3 credit course
      ]
      
      expect(calculateTotalCredits(partialCredits)).toBe(5.0)
    })
  })

  describe('calculateWeightedGPA - Alias Function', () => {
    it('should work identically to calculateGPA', () => {
      const grades: Grade[] = [
        { letter: 'A', credits: 3, isHonors: true },
        { letter: 'B', credits: 4, isHonors: false }
      ]
      
      // Both functions should return identical results
      expect(calculateWeightedGPA(grades, 4.0)).toBe(calculateGPA(grades, 4.0))
      expect(calculateWeightedGPA(grades, 5.0)).toBe(calculateGPA(grades, 5.0))
    })
  })

  describe('Integration - Real World Scenarios', () => {
    it('should handle complete student transcript workflow', () => {
      // Start with percentage grades from teacher
      const examScores = [92, 88, 95, 76, 83]
      
      // Convert to letter grades  
      const letterGrades = examScores.map(score => percentageToLetter(score))
      expect(letterGrades).toEqual(['A', 'B', 'A', 'C', 'B'])
      
      // Create grade objects with credits
      const courseGrades: Grade[] = letterGrades.map((letter, index) => ({
        letter,
        credits: index === 3 ? 0.5 : 1.0 // PE is half credit
      }))
      
      // Calculate total credits
      const totalCredits = calculateTotalCredits(courseGrades)
      expect(totalCredits).toBe(4.5)
      
      // Calculate final GPA
      const finalGPA = calculateGPA(courseGrades, 4.0)
      expect(finalGPA).toBeGreaterThan(3.0)
      expect(finalGPA).toBeLessThan(4.0)
    })

    it('should demonstrate honors vs regular class impact', () => {
      const sameGrades: Grade[] = [
        { letter: 'A', credits: 1 },
        { letter: 'B', credits: 1 },
        { letter: 'A', credits: 1 }
      ]
      
      const honorsGrades: Grade[] = [
        { letter: 'A', credits: 1, isHonors: true },
        { letter: 'B', credits: 1, isHonors: true },
        { letter: 'A', credits: 1, isHonors: false }
      ]
      
      const regularGPA = calculateGPA(sameGrades, 5.0)
      const mixedGPA = calculateGPA(honorsGrades, 5.0)
      
      // Mixed should be higher due to honors boost
      expect(mixedGPA).toBeGreaterThan(regularGPA)
    })

    it('should validate homeschool graduation requirements', () => {
      // Typical homeschool high school graduation requirements
      const fourYearTranscript: Grade[] = [
        // English (4 credits required)
        { letter: 'A', credits: 1 }, // English 9
        { letter: 'A', credits: 1 }, // English 10  
        { letter: 'B', credits: 1 }, // English 11
        { letter: 'A', credits: 1 }, // English 12
        
        // Math (3 credits required)
        { letter: 'B', credits: 1 }, // Algebra I
        { letter: 'A', credits: 1 }, // Geometry
        { letter: 'A', credits: 1 }, // Algebra II
        
        // Science (3 credits required)
        { letter: 'A', credits: 1 }, // Biology
        { letter: 'B', credits: 1 }, // Chemistry
        { letter: 'A', credits: 1 }, // Physics
        
        // Social Studies (3 credits required)
        { letter: 'A', credits: 1 }, // World History
        { letter: 'B', credits: 1 }, // US History  
        { letter: 'A', credits: 1 }, // Government
        
        // Electives
        { letter: 'A', credits: 0.5 }, // Art
        { letter: 'B', credits: 0.5 }, // Music
        { letter: 'A', credits: 1 },   // Foreign Language
        { letter: 'B', credits: 0.5 }, // PE
        { letter: 'A', credits: 0.5 }  // Health
      ]
      
      const totalCredits = calculateTotalCredits(fourYearTranscript)
      const gpa = calculateGPA(fourYearTranscript, 4.0)
      
      // Should meet typical graduation requirements
      expect(totalCredits).toBeGreaterThanOrEqual(16) // Minimum credits
      expect(gpa).toBeGreaterThan(3.5) // Good academic standing
    })
  })
})