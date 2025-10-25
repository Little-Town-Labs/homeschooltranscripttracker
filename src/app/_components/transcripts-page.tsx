"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

import { api } from "@/trpc/react";
import { TranscriptPreview } from "./transcript-preview";

export function TranscriptsPage() {
  const { data: session } = useSession();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("standard");
  const [showPreview, setShowPreview] = useState(false);

  // Fetch students
  const { data: students } = api.student.getAll.useQuery();
  
  // Fetch transcript formats
  const { data: formats } = api.transcript.getTranscriptFormats.useQuery();

  const handleGenerateTranscript = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedStudentId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded bg-indigo-600"></div>
              <span className="text-xl font-bold text-gray-900">
                Homeschool Transcript Tracker
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Dashboard
            </Link>
            <Link
              href="/students"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Students
            </Link>
            <Link
              href="/courses"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Courses
            </Link>
            <Link
              href="/transcripts"
              className="border-b-2 border-indigo-500 py-4 px-1 text-sm font-medium text-indigo-600"
            >
              Transcripts
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transcripts</h1>
          <p className="text-gray-600">
            Generate professional transcripts for your students
          </p>
        </div>

        {/* Format Selection */}
        {formats && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Choose Transcript Format
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formats.templates.map((template) => (
                <div
                  key={template.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedFormat === template.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedFormat(template.id)}
                >
                  <div className="text-center">
                    <div className="h-32 bg-gray-100 rounded mb-3 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Preview</span>
                    </div>
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Students</h2>
          </div>
          
          <div className="p-6">
            {students && students.length > 0 ? (
              <div className="space-y-4">
                {students.map((student) => (
                  <StudentTranscriptCard
                    key={student.id}
                    student={student}
                    selectedFormat={selectedFormat}
                    onGenerate={() => handleGenerateTranscript(student.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5h6m-8 8h6m-6 4h6" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No students</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add students first to generate transcripts.
                </p>
                <div className="mt-6">
                  <Link
                    href="/students"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Add Students
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Transcript Preview Modal */}
      {showPreview && selectedStudentId && (
        <TranscriptPreview
          studentId={selectedStudentId}
          format={selectedFormat}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}

interface StudentTranscriptCardProps {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    graduationYear: number;
    gpaScale: "4.0" | "5.0" | null;
  };
  selectedFormat: string;
  onGenerate: () => void;
}

function StudentTranscriptCard({ student, selectedFormat, onGenerate }: StudentTranscriptCardProps) {
  // Get transcript validation
  const { data: validation } = api.transcript.validateTranscriptGeneration.useQuery({
    studentId: student.id,
  });

  // Get graduation requirements
  const { data: requirements } = api.transcript.getGraduationRequirements.useQuery({
    studentId: student.id,
  });

  // Get transcript stats
  const { data: stats } = api.transcript.getTranscriptStats.useQuery({
    studentId: student.id,
  });

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            {student.firstName} {student.lastName}
          </h3>
          <p className="text-gray-600">Class of {student.graduationYear}</p>
          
          {stats && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Courses:</span>
                <span className="ml-2 font-medium">{stats.totalCourses}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Credits:</span>
                <span className="ml-2 font-medium">{stats.totalCredits}</span>
              </div>
              <div>
                <span className="text-gray-500">GPA Scale:</span>
                <span className="ml-2 font-medium">{student.gpaScale ?? "Not set"}</span>
              </div>
              <div>
                <span className="text-gray-500">Format:</span>
                <span className="ml-2 font-medium capitalize">{selectedFormat}</span>
              </div>
            </div>
          )}

          {requirements && (
            <div className="mt-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Graduation Progress:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      requirements.summary.meetsRequirements ? "bg-green-500" : "bg-yellow-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (requirements.summary.totalEarned / requirements.summary.totalRequired) * 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {requirements.summary.totalEarned}/{requirements.summary.totalRequired} credits
                </span>
              </div>
              {!requirements.summary.meetsRequirements && (
                <p className="text-sm text-yellow-600 mt-1">
                  {requirements.summary.creditsRemaining} credits remaining for graduation
                </p>
              )}
            </div>
          )}

          {validation && validation.issues.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-red-800">Issues:</h4>
              <ul className="text-sm text-red-600 mt-1 space-y-1">
                {validation.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {validation?.warnings && validation.warnings.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-amber-800">Transcript Status:</h4>
              <ul className="text-sm text-amber-600 mt-1 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="ml-6 space-y-2">
          <button
            onClick={onGenerate}
            disabled={validation && !validation.canGenerate}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              validation?.canGenerate
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {validation?.transcriptStatus === "partial" 
              ? "Generate Partial Transcript" 
              : "Generate Transcript"}
          </button>
          
          {validation && validation.requiresSubscription && (
            <p className="text-xs text-amber-600">
              Subscription required for PDF export
            </p>
          )}
        </div>
      </div>
    </div>
  );
}