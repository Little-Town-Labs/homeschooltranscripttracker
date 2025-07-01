// Academic calculation utilities for GPA and transcript generation

export interface Grade {
  letter: 'A' | 'B' | 'C' | 'D' | 'F'
  credits: number
  isHonors?: boolean
}

/**
 * Calculate GPA based on grades and scale
 */
export const calculateGPA = (grades: Grade[], scale: 4.0 | 5.0 = 4.0): number => {
  if (grades.length === 0) return 0

  const gradePoints: Record<string, number> = {
    'A': scale === 4.0 ? 4.0 : 4.0,
    'B': scale === 4.0 ? 3.0 : 3.0,
    'C': scale === 4.0 ? 2.0 : 2.0,
    'D': scale === 4.0 ? 1.0 : 1.0,
    'F': 0.0
  }

  let totalPoints = 0
  let totalCredits = 0

  grades.forEach(grade => {
    let points = gradePoints[grade.letter] || 0
    
    // Add honors bonus for 5.0 scale only
    if (scale === 5.0 && grade.isHonors && grade.letter !== 'F') {
      points += 1.0
    }
    
    totalPoints += points * grade.credits
    totalCredits += grade.credits
  })

  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0
}

/**
 * Calculate weighted GPA (alias for calculateGPA with scale parameter)
 */
export const calculateWeightedGPA = (grades: Grade[], baseScale: 4.0 | 5.0 = 4.0): number => {
  return calculateGPA(grades, baseScale)
}

/**
 * Convert percentage to letter grade
 */
export const percentageToLetter = (percentage: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

/**
 * Calculate total credits from grades
 */
export const calculateTotalCredits = (grades: Grade[]): number => {
  return grades.reduce((total, grade) => total + grade.credits, 0)
}