"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/trpc/react";
import { GradeForm } from "./grade-form";

interface StudentGradesPageProps {
  studentId: string;
}

export function StudentGradesPage({ studentId }: StudentGradesPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);

  // Fetch student data
  const { data: student } = api.student.getById.useQuery({ id: studentId });
  
  // Fetch student's grades with course information
  const { data: gradeData, refetch } = api.grade.getByStudent.useQuery({ studentId });
  
  // Fetch student's courses to show courses without grades
  const { data: courses } = api.course.getByStudent.useQuery({ studentId });
  
  // Fetch GPA calculation
  const { data: gpaData } = api.grade.calculateGPA.useQuery({ studentId });

  const handleAddGrade = (courseId: string) => {
    setEditingCourse(courseId);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCourse(null);
    void refetch();
  };

  if (!student) {
    return <div>Loading...</div>;
  }

  // Create a map of courses that have grades
  const coursesWithGrades = new Map(gradeData?.map(item => [item.course.id, item.grade]) ?? []);
  
  // Get courses without grades
  const coursesWithoutGrades = courses?.filter(course => !coursesWithGrades.has(course.id)) ?? [];

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
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Transcripts
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Student Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-indigo-600 hover:text-indigo-800 mb-2 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Students
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {student.firstName} {student.lastName} - Grades
              </h1>
              <p className="text-gray-600">Class of {student.graduationYear}</p>
            </div>
          </div>
        </div>

        {/* GPA Summary */}
        {gpaData && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {gpaData.gpa.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  Cumulative GPA ({gpaData.gpaScale} scale)
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {gpaData.totalCredits}
                </div>
                <div className="text-sm text-gray-500">Total Credits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {gpaData.courseCount}
                </div>
                <div className="text-sm text-gray-500">Courses Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {gpaData.totalQualityPoints.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Quality Points</div>
              </div>
            </div>
          </div>
        )}

        {/* Courses with Grades */}
        {gradeData && gradeData.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Completed Courses</h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Course</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Subject</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Level</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Credits</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Grade</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Points</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeData.map(({ course, grade }) => (
                      <tr key={course.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {course.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{course.subject}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            course.level === "Advanced Placement" 
                              ? "bg-purple-100 text-purple-800"
                              : course.level === "Honors"
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {course.level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{course.creditHours}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded font-medium text-sm ${
                            grade.grade === "A" 
                              ? "bg-green-100 text-green-800"
                              : grade.grade === "B"
                              ? "bg-blue-100 text-blue-800"
                              : grade.grade === "C"
                              ? "bg-yellow-100 text-yellow-800"
                              : grade.grade === "D"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {grade.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{grade.gpaPoints}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleAddGrade(course.id)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Courses without Grades */}
        {coursesWithoutGrades.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Courses Pending Grades ({coursesWithoutGrades.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coursesWithoutGrades.map((course) => (
                  <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{course.name}</h3>
                        <p className="text-sm text-gray-600">{course.subject}</p>
                        <p className="text-sm text-gray-500">{course.academicYear}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        course.level === "Advanced Placement" 
                          ? "bg-purple-100 text-purple-800"
                          : course.level === "Honors"
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {course.level}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-500">
                        {course.creditHours} credit{Number(course.creditHours) !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddGrade(course.id)}
                      className="w-full bg-indigo-600 text-white py-2 px-3 rounded text-sm hover:bg-indigo-700 transition-colors"
                    >
                      Add Grade
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!gradeData?.length && !coursesWithoutGrades.length && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add some courses for this student first.
            </p>
            <div className="mt-6">
              <Link
                href="/courses"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Courses
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Grade Form Modal */}
      {showForm && editingCourse && (
        <GradeForm
          courseId={editingCourse}
          studentId={studentId}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}