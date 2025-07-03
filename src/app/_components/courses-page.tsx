"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

import { api } from "@/trpc/react";
import { CourseForm } from "./course-form";

export function CoursesPage() {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const { data: students } = api.student.getAll.useQuery();
  const { data: coursesByYear, refetch } = api.course.getByAcademicYear.useQuery();

  const deleteCourse = api.course.delete.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const handleEdit = (courseId: string) => {
    setEditingCourse(courseId);
    setShowForm(true);
  };

  const handleDelete = async (courseId: string, courseName: string) => {
    if (window.confirm(`Are you sure you want to remove "${courseName}"? This will hide the course but preserve grade records.`)) {
      await deleteCourse.mutateAsync({ id: courseId });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCourse(null);
    setSelectedStudent(null);
    void refetch();
  };

  const handleAddCourse = (studentId?: string) => {
    setSelectedStudent(studentId ?? null);
    setShowForm(true);
  };

  // Get student name by ID
  const getStudentName = (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Unknown Student";
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
            <span className="border-b-2 border-indigo-500 py-4 px-1 text-sm font-medium text-indigo-600">
              Courses
            </span>
            <Link
              href="/transcripts"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Transcripts
            </Link>
            <Link
              href="/settings"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
            <p className="text-gray-600">Manage course information and academic records</p>
          </div>
          <button
            onClick={() => handleAddCourse()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Course
          </button>
        </div>

        {/* Courses by Academic Year */}
        {coursesByYear && Object.keys(coursesByYear).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(coursesByYear)
              .sort(([a], [b]) => b.localeCompare(a)) // Sort years descending
              .map(([academicYear, courses]) => (
                <div key={academicYear} className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {academicYear} Academic Year
                    </h2>
                    <span className="text-sm text-gray-500">
                      {courses.length} course{courses.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courses.map((course) => (
                        <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{course.name}</h3>
                              <p className="text-sm text-gray-600">{course.subject}</p>
                              <p className="text-sm text-gray-500">
                                {getStudentName(course.studentId)}
                              </p>
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

                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Credits:</span>
                              <span className="text-gray-900">{course.creditHours}</span>
                            </div>
                            {course.academicYear && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Semester:</span>
                                <span className="text-gray-900">{course.academicYear}</span>
                              </div>
                            )}
                          </div>

                          {course.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {course.description}
                            </p>
                          )}

                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(course.id)}
                              className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(course.id, String(course.name))}
                              className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded text-sm hover:bg-red-200 transition-colors"
                              disabled={deleteCourse.isPending}
                            >
                              {deleteCourse.isPending ? "Removing..." : "Remove"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first course.</p>
            <div className="mt-6">
              <button
                onClick={() => handleAddCourse()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Course
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Course Form Modal */}
      {showForm && (
        <CourseForm
          courseId={editingCourse}
          preselectedStudentId={selectedStudent}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}