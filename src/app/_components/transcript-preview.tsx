"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

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

  const currentFormat = formats?.templates.find(t => t.id === format);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    // TODO: Implement PDF generation
    setTimeout(() => {
      setIsGenerating(false);
      alert("PDF generation will be implemented in the next phase!");
    }, 2000);
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
              {tenant?.name || "Homeschool"}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Generated on {new Date().toLocaleDateString()}
            </div>
          </div>

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
                <div><strong>Class Rank:</strong> N/A (Homeschooled)</div>
                <div><strong>Graduation Status:</strong> {totalCredits >= 24 ? "Meets Requirements" : "In Progress"}</div>
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
                        Year GPA: {gpaByYear[year]!.gpa.toFixed(2)} | Credits: {gpaByYear[year]!.credits}
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
                                {item.grade?.grade || "IP"}
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
                  const scores = typeof score.scores === 'object' && score.scores ? score.scores as any : {};
                  return (
                    <div key={score.id} className="border border-gray-300 p-3 rounded">
                      <div className="font-semibold text-gray-900">{score.testType}</div>
                      <div className="text-lg font-bold text-indigo-600">
                        {scores.total || 'N/A'}
                        {scores.maxScore && ` / ${scores.maxScore}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(score.testDate).toLocaleDateString()}
                      </div>
                      {scores.percentile && (
                        <div className="text-sm text-gray-500">
                          {scores.percentile}th percentile
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
              Issued by: {tenant?.name || "Homeschool"} | Contact: {tenant?.primaryEmail || "contact@homeschool.edu"}
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