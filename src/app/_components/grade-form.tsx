"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";

interface GradeFormProps {
  courseId: string;
  studentId: string;
  onClose: () => void;
}

export function GradeForm({ courseId, studentId, onClose }: GradeFormProps) {
  const [formData, setFormData] = useState({
    letterGrade: "A" as "A" | "B" | "C" | "D" | "F",
    semester: "",
    notes: "",
  });

  // Fetch course data
  const { data: course } = api.course.getById.useQuery({ id: courseId });
  
  // Fetch student data for GPA scale
  const { data: student } = api.student.getById.useQuery({ id: studentId });

  // Fetch existing grade if any
  const { data: existingGrades } = api.grade.getByCourse.useQuery({ courseId });

  // Get grade points calculation
  const { data: gradePoints } = api.grade.getGradePoints.useQuery({
    letterGrade: formData.letterGrade,
    gpaScale: student?.gpaScale ?? "4.0",
    isHonorsOrAP: course?.level === "Honors" || course?.level === "Advanced Placement",
  }, { enabled: !!student && !!course });

  const upsertGrade = api.grade.upsert.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  // Populate form with existing grade if editing
  useEffect(() => {
    if (existingGrades && existingGrades.length > 0) {
      const grade = existingGrades[0];
      setFormData({
        letterGrade: grade.letterGrade as "A" | "B" | "C" | "D" | "F",
        semester: grade.semester ?? "",
        notes: String(grade.notes ?? ""),
      });
    }
  }, [existingGrades]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradePoints) {
      alert("Unable to calculate grade points. Please try again.");
      return;
    }

    try {
      await upsertGrade.mutateAsync({
        courseId,
        letterGrade: formData.letterGrade,
        gradePoints: gradePoints,
        semester: formData.semester || undefined,
        notes: formData.notes || undefined,
      });
    } catch (error) {
      console.error("Error saving grade:", error);
      alert("Error saving grade. Please try again.");
    }
  };

  if (!course || !student) {
    return <div>Loading...</div>;
  }

  const isEditing = existingGrades && existingGrades.length > 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Grade" : "Add Grade"}
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

        {/* Course Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h4 className="font-medium text-gray-900">{course.courseName}</h4>
          <p className="text-sm text-gray-600">{course.subject} • {course.credits} credit{course.credits !== 1 ? "s" : ""}</p>
          <p className="text-sm text-gray-500">
            {course.level} • {course.academicYear}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="letterGrade" className="block text-sm font-medium text-gray-700">
              Letter Grade *
            </label>
            <select
              id="letterGrade"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.letterGrade}
              onChange={(e) => handleInputChange("letterGrade", e.target.value)}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="F">F</option>
            </select>
          </div>

          {/* Show calculated grade points */}
          {gradePoints !== undefined && (
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">Grade Points:</span>
                <span className="text-sm font-bold text-blue-900">
                  {gradePoints.toFixed(1)} / {student.gpaScale}
                </span>
              </div>
              {course.level !== "Regular" && (
                <p className="text-xs text-blue-700 mt-1">
                  {course.level} course {student.gpaScale === "5.0" ? "with bonus point" : ""}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
              Semester (Optional)
            </label>
            <select
              id="semester"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.semester}
              onChange={(e) => handleInputChange("semester", e.target.value)}
            >
              <option value="">Full Year</option>
              <option value="Fall">Fall Semester</option>
              <option value="Spring">Spring Semester</option>
              <option value="Summer">Summer Session</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Additional notes about this grade..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
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
              disabled={upsertGrade.isPending}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {upsertGrade.isPending
                ? "Saving..."
                : isEditing
                ? "Update Grade"
                : "Add Grade"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}