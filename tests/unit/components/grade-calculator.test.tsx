import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { calculateGPA, type Grade } from '@/lib/calculations'

// Simple GPA Calculator component to test
interface GradeCalculatorProps {
  onGpaCalculated?: (gpa: number) => void
}

const GradeCalculator: React.FC<GradeCalculatorProps> = ({ onGpaCalculated }) => {
  const [grades, setGrades] = React.useState<Grade[]>([])
  const [currentGrade, setCurrentGrade] = React.useState({
    letter: 'A' as const,
    credits: 1,
    isHonors: false
  })
  const [scale, setScale] = React.useState<4.0 | 5.0>(4.0)

  const addGrade = () => {
    const newGrades = [...grades, currentGrade]
    setGrades(newGrades)
    const gpa = calculateGPA(newGrades, scale)
    onGpaCalculated?.(gpa)
  }

  const clearGrades = () => {
    setGrades([])
    onGpaCalculated?.(0)
  }

  const currentGpa = calculateGPA(grades, scale)

  return (
    <div data-testid="grade-calculator">
      <div>
        <label htmlFor="letter">Grade Letter:</label>
        <select
          id="letter"
          value={currentGrade.letter}
          onChange={(e) => setCurrentGrade({
            ...currentGrade, 
            letter: e.target.value as 'A' | 'B' | 'C' | 'D' | 'F'
          })}
          data-testid="letter-select"
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="F">F</option>
        </select>
      </div>

      <div>
        <label htmlFor="credits">Credits:</label>
        <input
          id="credits"
          type="number"
          value={currentGrade.credits}
          onChange={(e) => setCurrentGrade({
            ...currentGrade, 
            credits: parseFloat(e.target.value)
          })}
          min="0.5"
          max="2"
          step="0.5"
          data-testid="credits-input"
        />
      </div>

      <div>
        <label htmlFor="honors">
          <input
            id="honors"
            type="checkbox"
            checked={currentGrade.isHonors}
            onChange={(e) => setCurrentGrade({
              ...currentGrade, 
              isHonors: e.target.checked
            })}
            data-testid="honors-checkbox"
          />
          Honors Course
        </label>
      </div>

      <div>
        <label htmlFor="scale">GPA Scale:</label>
        <select
          id="scale"
          value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value) as 4.0 | 5.0)}
          data-testid="scale-select"
        >
          <option value={4.0}>4.0 Scale</option>
          <option value={5.0}>5.0 Scale (Weighted)</option>
        </select>
      </div>

      <button onClick={addGrade} data-testid="add-grade">
        Add Grade
      </button>
      
      <button onClick={clearGrades} data-testid="clear-grades">
        Clear All
      </button>

      <div data-testid="current-gpa">
        Current GPA: {currentGpa.toFixed(2)}
      </div>

      <div data-testid="grade-count">
        Total Grades: {grades.length}
      </div>

      <div data-testid="total-credits">
        Total Credits: {grades.reduce((sum, grade) => sum + grade.credits, 0)}
      </div>
    </div>
  )
}

// Import React for the component
import React from 'react'

describe('GradeCalculator Component', () => {
  const user = userEvent.setup()

  it('should render with default values', () => {
    render(<GradeCalculator />)
    
    expect(screen.getByTestId('grade-calculator')).toBeInTheDocument()
    expect(screen.getByTestId('current-gpa')).toHaveTextContent('Current GPA: 0.00')
    expect(screen.getByTestId('grade-count')).toHaveTextContent('Total Grades: 0')
    expect(screen.getByTestId('total-credits')).toHaveTextContent('Total Credits: 0')
  })

  it('should add a grade and calculate GPA correctly', async () => {
    render(<GradeCalculator />)
    
    // Set grade to A, 4 credits
    await user.selectOptions(screen.getByTestId('letter-select'), 'A')
    await user.clear(screen.getByTestId('credits-input'))
    await user.type(screen.getByTestId('credits-input'), '4')
    
    // Add the grade
    await user.click(screen.getByTestId('add-grade'))
    
    expect(screen.getByTestId('current-gpa')).toHaveTextContent('Current GPA: 4.00')
    expect(screen.getByTestId('grade-count')).toHaveTextContent('Total Grades: 1')
    expect(screen.getByTestId('total-credits')).toHaveTextContent('Total Credits: 4')
  })

  it('should calculate mixed grades correctly', async () => {
    render(<GradeCalculator />)
    
    // Add grade A (4 credits) = 16 points
    await user.selectOptions(screen.getByTestId('letter-select'), 'A')
    await user.clear(screen.getByTestId('credits-input'))
    await user.type(screen.getByTestId('credits-input'), '4')
    await user.click(screen.getByTestId('add-grade'))
    
    // Add grade B (3 credits) = 9 points
    await user.selectOptions(screen.getByTestId('letter-select'), 'B')
    await user.clear(screen.getByTestId('credits-input'))
    await user.type(screen.getByTestId('credits-input'), '3')
    await user.click(screen.getByTestId('add-grade'))
    
    // Total: 25 points / 7 credits = 3.57
    expect(screen.getByTestId('current-gpa')).toHaveTextContent('Current GPA: 3.57')
    expect(screen.getByTestId('grade-count')).toHaveTextContent('Total Grades: 2')
    expect(screen.getByTestId('total-credits')).toHaveTextContent('Total Credits: 7')
  })

  it('should handle honors weighting on 5.0 scale', async () => {
    render(<GradeCalculator />)
    
    // Switch to 5.0 scale
    await user.selectOptions(screen.getByTestId('scale-select'), '5')
    
    // Add honors A (4 credits) = 20 points (5.0 * 4)
    await user.selectOptions(screen.getByTestId('letter-select'), 'A')
    await user.clear(screen.getByTestId('credits-input'))
    await user.type(screen.getByTestId('credits-input'), '4')
    await user.click(screen.getByTestId('honors-checkbox'))
    await user.click(screen.getByTestId('add-grade'))
    
    // Should be 5.0 GPA for honors A on 5.0 scale
    expect(screen.getByTestId('current-gpa')).toHaveTextContent('Current GPA: 5.00')
  })

  it('should clear all grades when clear button is clicked', async () => {
    render(<GradeCalculator />)
    
    // Add a grade first
    await user.click(screen.getByTestId('add-grade'))
    expect(screen.getByTestId('grade-count')).toHaveTextContent('Total Grades: 1')
    
    // Clear all grades
    await user.click(screen.getByTestId('clear-grades'))
    
    expect(screen.getByTestId('current-gpa')).toHaveTextContent('Current GPA: 0.00')
    expect(screen.getByTestId('grade-count')).toHaveTextContent('Total Grades: 0')
    expect(screen.getByTestId('total-credits')).toHaveTextContent('Total Credits: 0')
  })

  it('should call onGpaCalculated callback when GPA changes', async () => {
    const mockCallback = vi.fn()
    render(<GradeCalculator onGpaCalculated={mockCallback} />)
    
    // Add a grade
    await user.click(screen.getByTestId('add-grade'))
    
    expect(mockCallback).toHaveBeenCalledWith(4.0) // Default A grade, 1 credit = 4.0 GPA
  })

  it('should handle decimal credits correctly', async () => {
    render(<GradeCalculator />)
    
    // Add 0.5 credit A grade
    await user.clear(screen.getByTestId('credits-input'))
    await user.type(screen.getByTestId('credits-input'), '0.5')
    await user.click(screen.getByTestId('add-grade'))
    
    expect(screen.getByTestId('total-credits')).toHaveTextContent('Total Credits: 0.5')
    expect(screen.getByTestId('current-gpa')).toHaveTextContent('Current GPA: 4.00')
  })

  it('should handle F grades correctly', async () => {
    render(<GradeCalculator />)
    
    // Add F grade
    await user.selectOptions(screen.getByTestId('letter-select'), 'F')
    await user.click(screen.getByTestId('add-grade'))
    
    expect(screen.getByTestId('current-gpa')).toHaveTextContent('Current GPA: 0.00')
  })
})