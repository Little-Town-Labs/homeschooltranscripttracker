import { describe, it, expect } from 'vitest'
import { 
  calculateGPA, 
  calculateWeightedGPA, 
  percentageToLetter, 
  calculateTotalCredits,
  type Grade 
} from '@/lib/calculations'

describe('GPA Calculations', () => {
  describe('calculateGPA', () => {
    it('should return 0 for empty grades array', () => {
      expect(calculateGPA([])).toBe(0)
    })

    it('should calculate 4.0 GPA correctly for all A grades', () => {
      const grades: Grade[] = [
        { letter: 'A', credits: 4 },
        { letter: 'A', credits: 3 },
        { letter: 'A', credits: 3 }
      ]
      expect(calculateGPA(grades, 4.0)).toBe(4.0)
    })

    it('should calculate mixed grades correctly on 4.0 scale', () => {
      const grades: Grade[] = [
        { letter: 'A', credits: 4 }, // 16 points
        { letter: 'B', credits: 3 }, // 9 points
        { letter: 'C', credits: 3 }  // 6 points
      ]
      // Total: 31 points / 10 credits = 3.1
      expect(calculateGPA(grades, 4.0)).toBe(3.1)
    })

    it('should handle F grades correctly', () => {
      const grades: Grade[] = [
        { letter: 'A', credits: 3 }, // 12 points
        { letter: 'F', credits: 3 }  // 0 points
      ]
      // Total: 12 points / 6 credits = 2.0
      expect(calculateGPA(grades, 4.0)).toBe(2.0)
    })
  })

  describe('calculateWeightedGPA', () => {
    it('should add honors bonus on 5.0 scale', () => {
      const grades: Grade[] = [
        { letter: 'A', credits: 4, isHonors: true },  // 5.0 * 4 = 20 points
        { letter: 'B', credits: 3, isHonors: false }  // 3.0 * 3 = 9 points
      ]
      // Total: 29 points / 7 credits = 4.14
      expect(calculateWeightedGPA(grades, 5.0)).toBe(4.14)
    })

    it('should not add honors bonus to F grades', () => {
      const grades: Grade[] = [
        { letter: 'F', credits: 3, isHonors: true }  // 0 * 3 = 0 points
      ]
      expect(calculateWeightedGPA(grades, 5.0)).toBe(0)
    })

    it('should work same as regular GPA on 4.0 scale', () => {
      const grades: Grade[] = [
        { letter: 'A', credits: 4, isHonors: true },
        { letter: 'B', credits: 3, isHonors: true }
      ]
      // Honors doesn't affect 4.0 scale
      expect(calculateWeightedGPA(grades, 4.0)).toBe(3.57)
    })
  })

  describe('edge cases', () => {
    it('should handle single grade', () => {
      const grades: Grade[] = [
        { letter: 'B', credits: 3 }
      ]
      expect(calculateGPA(grades, 4.0)).toBe(3.0)
    })

    it('should round to 2 decimal places', () => {
      const grades: Grade[] = [
        { letter: 'A', credits: 1 }, // 4 points
        { letter: 'B', credits: 2 }  // 6 points
      ]
      // Total: 10 points / 3 credits = 3.333... → 3.33
      expect(calculateGPA(grades, 4.0)).toBe(3.33)
    })

    it('should handle zero credits gracefully', () => {
      const grades: Grade[] = [
        { letter: 'A', credits: 0 }
      ]
      expect(calculateGPA(grades, 4.0)).toBe(0)
    })
  })
})

describe('Percentage to Letter Grade Conversion', () => {
  it('should convert 90+ to A', () => {
    expect(percentageToLetter(90)).toBe('A')
    expect(percentageToLetter(95)).toBe('A')
    expect(percentageToLetter(100)).toBe('A')
  })

  it('should convert 80-89 to B', () => {
    expect(percentageToLetter(80)).toBe('B')
    expect(percentageToLetter(85)).toBe('B')
    expect(percentageToLetter(89)).toBe('B')
  })

  it('should convert 70-79 to C', () => {
    expect(percentageToLetter(70)).toBe('C')
    expect(percentageToLetter(75)).toBe('C')
    expect(percentageToLetter(79)).toBe('C')
  })

  it('should convert 60-69 to D', () => {
    expect(percentageToLetter(60)).toBe('D')
    expect(percentageToLetter(65)).toBe('D')
    expect(percentageToLetter(69)).toBe('D')
  })

  it('should convert below 60 to F', () => {
    expect(percentageToLetter(59)).toBe('F')
    expect(percentageToLetter(30)).toBe('F')
    expect(percentageToLetter(0)).toBe('F')
  })
})

describe('Credit Calculations', () => {
  it('should calculate total credits correctly', () => {
    const grades: Grade[] = [
      { letter: 'A', credits: 4 },
      { letter: 'B', credits: 3 },
      { letter: 'C', credits: 1 }
    ]
    expect(calculateTotalCredits(grades)).toBe(8)
  })

  it('should handle empty grades array', () => {
    expect(calculateTotalCredits([])).toBe(0)
  })

  it('should handle decimal credits', () => {
    const grades: Grade[] = [
      { letter: 'A', credits: 0.5 },
      { letter: 'B', credits: 1.5 }
    ]
    expect(calculateTotalCredits(grades)).toBe(2.0)
  })
})