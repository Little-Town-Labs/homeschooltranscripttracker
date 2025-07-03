"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";

interface CourseFormProps {
  courseId?: string | null;
  preselectedStudentId?: string | null;
  onClose: () => void;
}

export function CourseForm({ courseId, preselectedStudentId, onClose }: CourseFormProps) {
  const [formData, setFormData] = useState({
    studentId: preselectedStudentId ?? "",
    name: "",
    subject: "" as "English" | "Mathematics" | "Science" | "Social Studies" | "Foreign Language" | "Fine Arts" | "Physical Education" | "Career/Technical Education" | "Elective" | "Other" | "",
    level: "Regular" as "Regular" | "Honors" | "Advanced Placement",
    creditHours: 1,
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    description: "",
  });

  const isEditing = !!courseId;

  // Fetch students for dropdown
  const { data: students } = api.student.getAll.useQuery();

  // Fetch course data if editing
  const { data: course } = api.course.getById.useQuery(
    { id: courseId! },
    { enabled: isEditing }
  );

  const createCourse = api.course.create.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  const updateCourse = api.course.update.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  // Populate form with course data when editing
  useEffect(() => {
    if (course) {
      setFormData({
        studentId: course.studentId,
        name: String(course.name),
        subject: course.subject,
        level: course.level as "Regular" | "Honors" | "Advanced Placement",
        creditHours: Number(course.creditHours),
        academicYear: String(course.academicYear),
        description: String(course.description ?? ""),
      });
    }
  }, [course]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        await updateCourse.mutateAsync({
          id: courseId,
          courseName: formData.name,
          subject: formData.subject as any,
          level: formData.level,
          credits: formData.creditHours,
          academicYear: formData.academicYear,
          description: formData.description || undefined,
        });
      } else {
        await createCourse.mutateAsync({
          courseName: formData.name,
          subject: formData.subject as any,
          level: formData.level,
          credits: formData.creditHours,
          studentId: formData.studentId,
          academicYear: formData.academicYear,
          description: formData.description || undefined,
        });
      }
    } catch (error) {
      console.error("Error saving course:", error);
    }
  };

  // Generate academic year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const startYear = currentYear + i - 2;
    return `${startYear}-${startYear + 1}`;
  });

  // Common subjects
  const subjectOptions = [
    "English",
    "Mathematics",
    "Science",
    "Computer Science",
    "Social Studies",
    "Foreign Language",
    "Fine Arts",
    "Physical Education",
    "Career/Technical Education",
    "Elective",
    "Other"
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Course" : "Add New Course"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                Student *
              </label>
              <select
                id="studentId"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.studentId}
                onChange={(e) => handleInputChange("studentId", e.target.value)}
              >
                <option value="">Select a student</option>
                {students?.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700">
                Academic Year *
              </label>
              <select
                id="academicYear"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.academicYear}
                onChange={(e) => handleInputChange("academicYear", e.target.value)}
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">
              Course Name *
            </label>
            <input
              type="text"
              id="courseName"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Algebra I, American History, Biology"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject *
              </label>
              <select
                id="subject"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
              >
                <option value="">Select a subject</option>
                {subjectOptions.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              {formData.subject === "Other" && (
                <input
                  type="text"
                  className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter custom subject"
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                />
              )}
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                Course Level *
              </label>
              <select
                id="level"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.level}
                onChange={(e) => handleInputChange("level", e.target.value)}
              >
                <option value="Regular">Regular</option>
                <option value="Honors">Honors</option>
                <option value="Advanced Placement">Advanced Placement (AP)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="credits" className="block text-sm font-medium text-gray-700">
                Credits *
              </label>
              <input
                type="number"
                id="credits"
                required
                min="0"
                max="10"
                step="0.5"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.creditHours}
                onChange={(e) => handleInputChange("creditHours", parseFloat(e.target.value))}
              />
            </div>

          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Course Description (Optional)
            </label>
            <textarea
              id="description"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Brief description of the course content and objectives"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCourse.isPending || updateCourse.isPending}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {createCourse.isPending || updateCourse.isPending
                ? "Saving..."
                : isEditing
                ? "Update Course"
                : "Add Course"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}