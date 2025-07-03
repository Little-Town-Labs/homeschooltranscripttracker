import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { TranscriptPDFTemplate } from '@/components/transcript-pdf-template';

// Types that match our transcript data structure
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  graduationYear: number;
  gpaScale: string | null;
  minCreditsForGraduation: number | null;
}

interface Tenant {
  name: string | null;
  primaryEmail: string | null;
}

interface Course {
  id: string;
  name: string;
  subject: string | null;
  level: string;
  creditHours: number;
}

interface Grade {
  grade: string;
  gpaPoints: number;
}

interface CourseWithGrade {
  course: Course;
  grade: Grade | null;
}

interface TestScoreData {
  total?: number;
  maxScore?: number;
  percentile?: number;
  [key: string]: unknown;
}

interface TestScore {
  id: string;
  testType: string;
  testDate: string;
  scores: TestScoreData;
}

interface TranscriptData {
  student: Student;
  tenant: Tenant;
  coursesByYear: Record<string, CourseWithGrade[]>;
  gpaByYear: Record<string, { gpa: number; credits: number }>;
  cumulativeGPA: number;
  totalCredits: number;
  testScores: TestScore[];
  generatedAt: Date;
}

interface PDFGenerationOptions {
  format: 'standard' | 'detailed' | 'college-prep';
  includeWatermark?: boolean;
  includeSignature?: boolean;
}

export class PDFGenerator {
  /**
   * Generate a PDF buffer from transcript data
   */
  static async generateTranscriptPDF(
    transcriptData: TranscriptData,
    options: PDFGenerationOptions
  ): Promise<Buffer> {
    try {
      // Create the PDF document using our template
      const pdfDocument = (
        <TranscriptPDFTemplate
          data={transcriptData}
          format={options.format}
          includeWatermark={options.includeWatermark ?? false}
        />
      );

      // Render the PDF to a buffer
      const buffer = await renderToBuffer(pdfDocument);
      
      return buffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a filename for the transcript PDF
   */
  static generateFilename(student: Student, format: string): string {
    const sanitizedFirstName = student.firstName.replace(/[^a-zA-Z0-9]/g, '');
    const sanitizedLastName = student.lastName.replace(/[^a-zA-Z0-9]/g, '');
    const year = new Date().getFullYear();
    
    return `transcript-${sanitizedFirstName}-${sanitizedLastName}-${year}-${format}.pdf`;
  }

  /**
   * Validate transcript data before PDF generation
   */
  static validateTranscriptData(data: TranscriptData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate student data
    if (!data.student) {
      errors.push('Student information is required');
    } else {
      if (!data.student.firstName?.trim()) {
        errors.push('Student first name is required');
      }
      if (!data.student.lastName?.trim()) {
        errors.push('Student last name is required');
      }
      if (!data.student.graduationYear || data.student.graduationYear < 1900 || data.student.graduationYear > 2100) {
        errors.push('Valid graduation year is required');
      }
    }

    // Validate tenant data
    if (!data.tenant) {
      errors.push('School/tenant information is required');
    }

    // Validate courses data
    if (!data.coursesByYear || Object.keys(data.coursesByYear).length === 0) {
      errors.push('At least one course is required to generate a transcript');
    }

    // Validate GPA data
    if (typeof data.cumulativeGPA !== 'number' || data.cumulativeGPA < 0 || data.cumulativeGPA > 5) {
      errors.push('Valid cumulative GPA is required');
    }

    // Validate credits
    if (typeof data.totalCredits !== 'number' || data.totalCredits < 0) {
      errors.push('Valid total credits is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get PDF generation options based on subscription level
   */
  static getOptionsForSubscription(
    subscriptionLevel: 'trial' | 'basic' | 'premium',
    requestedFormat: string
  ): PDFGenerationOptions {
    switch (subscriptionLevel) {
      case 'trial':
        return {
          format: 'standard',
          includeWatermark: true,
          includeSignature: false,
        };
      
      case 'basic':
        return {
          format: requestedFormat as 'standard' | 'detailed' | 'college-prep',
          includeWatermark: false,
          includeSignature: true,
        };
      
      case 'premium':
        return {
          format: requestedFormat as 'standard' | 'detailed' | 'college-prep',
          includeWatermark: false,
          includeSignature: true,
        };
      
      default:
        return {
          format: 'standard',
          includeWatermark: true,
          includeSignature: false,
        };
    }
  }

  /**
   * Convert buffer to base64 for client transmission
   */
  static bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
  }

  /**
   * Estimate PDF size for validation
   */
  static estimatePDFSize(transcriptData: TranscriptData): number {
    // Basic estimation based on content
    const courseCount = Object.values(transcriptData.coursesByYear)
      .reduce((total, courses) => total + courses.length, 0);
    const testScoreCount = transcriptData.testScores?.length ?? 0;
    
    // Rough estimate: base size + courses + test scores
    const estimatedSizeKB = 50 + (courseCount * 2) + (testScoreCount * 1);
    
    return estimatedSizeKB * 1024; // Convert to bytes
  }
} 