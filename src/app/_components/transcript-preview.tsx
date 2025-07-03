"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { usePdfGenerator } from "@/hooks/use-pdf-generator";

interface TranscriptPreviewProps {
  studentId: string;
  format: string;
  onClose: () => void;
}

export function TranscriptPreview({ studentId, format, onClose }: TranscriptPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch transcript data
  const { data: transcriptData, isLoading } = api.transcript.getTranscriptData.useQuery({
    studentId,
  });

  // Get transcript formats for current format info
  const { data: formats } = api.transcript.getTranscriptFormats.useQuery();

  // PDF generation hook
  const { generatePdf } = usePdfGenerator();

  const currentFormat = formats?.templates.find(t => t.id === format);

  const handleDownloadPDF = async () => {
    if (!transcriptData?.tenant) return;
    
    try {
      setIsGenerating(true);
      
      // Generate PDF blob
      const pdfBlob = await generatePdf(transcriptData, {
        format: format as 'standard' | 'detailed' | 'college-prep',
        includeWatermark: false, // TODO: Check subscription status
      });
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${transcriptData.student.firstName}_${transcriptData.student.lastName}_Transcript.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // TODO: Show error toast/message to user
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading transcript data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!transcriptData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">Unable to load transcript data.</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { student, tenant, coursesByYear, gpaByYear, cumulativeGPA, totalCredits, testScores } = transcriptData;

  // Type guard for test scores
  const getTestScoreValue = (scores: unknown, key: string): string | number | undefined => {
    if (typeof scores === 'object' && scores !== null && key in scores) {
      return (scores as Record<string, unknown>)[key] as string | number | undefined;
    }
    return undefined;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with actions */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Transcript Preview</h2>
            <p className="text-sm text-gray-600">
              {currentFormat?.name} - {student.firstName} {student.lastName}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>

        {/* Transcript Content */}
        <div className="p-8 bg-white print:p-4" style={{ minHeight: "11in" }}>
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              OFFICIAL HIGH SCHOOL TRANSCRIPT
            </h1>
            <div className="text-lg font-semibold text-gray-800">
              {tenant?.name ?? "Homeschool"}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Generated on {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Transcript Status Indicator */}
          {totalCredits < 20 && (
            <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 print:bg-white print:border-gray-400">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-amber-800">
                    Partial Transcript - Academic Work in Progress
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    This transcript reflects {totalCredits} credits completed to date. Standard graduation typically requires 20+ credits.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Student Information */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300">
                Student Information
              </h2>
              <div className="space-y-1 text-sm">
                <div><strong>Name:</strong> {student.firstName} {student.lastName}</div>
                <div><strong>Date of Birth:</strong> {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "N/A"}</div>
                <div><strong>Graduation Year:</strong> {student.graduationYear}</div>
                <div><strong>Student ID:</strong> {student.id.slice(-8).toUpperCase()}</div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300">
                Academic Summary
              </h2>
              <div className="space-y-1 text-sm">
                <div><strong>Cumulative GPA:</strong> {cumulativeGPA.toFixed(2)} ({student.gpaScale} scale)</div>
                <div><strong>Total Credits:</strong> {totalCredits}</div>
                <div><strong>Minimum Required for Graduation:</strong> {student.minCreditsForGraduation ?? 24}</div>
                <div><strong>Graduation Status:</strong> {totalCredits >= Number(student.minCreditsForGraduation ?? 24) ? "Meets Requirements" : "In Progress"}</div>
              </div>
            </div>
          </div>

          {/* Academic Record by Year */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-300">
              Academic Record
            </h2>
            
            {Object.entries(coursesByYear)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([year, yearCourses]) => (
                <div key={year} className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800">{year} Academic Year</h3>
                    {gpaByYear[year] && (
                      <div className="text-sm text-gray-600">
                        Year GPA: {gpaByYear[year].gpa.toFixed(2)} | Credits: {gpaByYear[year].credits}
                      </div>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-left">Course</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">Level</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">Credits</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">Grade</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">Quality Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearCourses
                          .sort((a, b) => a.course.name.localeCompare(b.course.name))
                          .map((item) => (
                            <tr key={item.course.id}>
                              <td className="border border-gray-300 px-3 py-2">
                                {item.course.name}
                                {item.course.subject && (
                                  <div className="text-xs text-gray-500">({item.course.subject})</div>
                                )}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                {item.course.level}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                {item.course.creditHours}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                                {item.grade?.grade ?? "IP"}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                {item.grade ? (Number(item.grade.gpaPoints) * Number(item.course.creditHours)).toFixed(1) : "—"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </div>

          {/* Test Scores */}
          {testScores && testScores.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300">
                Standardized Test Scores
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {testScores.map((score) => {
                  const total = getTestScoreValue(score.scores, 'total');
                  const maxScore = getTestScoreValue(score.scores, 'maxScore');
                  const percentile = getTestScoreValue(score.scores, 'percentile');
                  
                  return (
                    <div key={score.id} className="border border-gray-300 p-3 rounded">
                      <div className="font-semibold text-gray-900">{score.testType}</div>
                      <div className="text-lg font-bold text-indigo-600">
                        {total ?? 'N/A'}
                        {maxScore && ` / ${maxScore}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(score.testDate).toLocaleDateString()}
                      </div>
                      {percentile && (
                        <div className="text-sm text-gray-500">
                          {percentile}th percentile
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GPA Scale Legend */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-300">
              Grading Scale
            </h2>
            <div className="text-sm grid grid-cols-2 md:grid-cols-5 gap-4">
              <div><strong>A:</strong> 4.0</div>
              <div><strong>B:</strong> 3.0</div>
              <div><strong>C:</strong> 2.0</div>
              <div><strong>D:</strong> 1.0</div>
              <div><strong>F:</strong> 0.0</div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              * {student.gpaScale} scale used. Honors and AP courses may receive weighted credit.
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-800 pt-4 text-center text-sm text-gray-600">
            <div className="mb-2">
              This transcript is an official record of coursework completed in a homeschool setting.
            </div>
            <div className="mb-4">
              Issued by: {tenant?.name ?? "Homeschool"} | Contact: {tenant?.primaryEmail ?? "contact@homeschool.edu"}
            </div>
            <div className="flex justify-between items-center">
              <div>
                Transcript ID: TR-{student.id.slice(-8).toUpperCase()}
              </div>
              <div>
                Page 1 of 1
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}