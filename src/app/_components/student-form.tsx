"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";

interface StudentFormProps {
  studentId?: string | null;
  onClose: () => void;
}

export function StudentForm({ studentId, onClose }: StudentFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    graduationYear: new Date().getFullYear() + 4,
    gpaScale: "4.0" as "4.0" | "5.0",
    minCreditsForGraduation: 24,
  });

  const isEditing = !!studentId;

  // Fetch student data if editing
  const { data: student } = api.student.getById.useQuery(
    { id: studentId! },
    { enabled: isEditing }
  );

  const createStudent = api.student.create.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  const updateStudent = api.student.update.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  // Populate form with student data when editing
  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        dateOfBirth: (student.dateOfBirth 
          ? new Date(student.dateOfBirth).toISOString().split("T")[0] 
          : "") as string,
        graduationYear: student.graduationYear,
        gpaScale: student.gpaScale || "4.0",
        minCreditsForGraduation: student.minCreditsForGraduation ? Number(student.minCreditsForGraduation) : 24,
      });
    }
  }, [student]);

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
        await updateStudent.mutateAsync({
          id: studentId,
          ...formData,
          dateOfBirth: formData.dateOfBirth || undefined,
          minCreditsForGraduation: formData.minCreditsForGraduation,
        });
      } else {
        await createStudent.mutateAsync({
          ...formData,
          dateOfBirth: formData.dateOfBirth || undefined,
          minCreditsForGraduation: formData.minCreditsForGraduation,
        });
      }
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear + i - 5);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Student" : "Add New Student"}
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
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              id="dateOfBirth"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700">
              Expected Graduation Year *
            </label>
            <select
              id="graduationYear"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.graduationYear}
              onChange={(e) => handleInputChange("graduationYear", parseInt(e.target.value))}
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="gpaScale" className="block text-sm font-medium text-gray-700">
              GPA Scale *
            </label>
            <select
              id="gpaScale"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.gpaScale}
              onChange={(e) => handleInputChange("gpaScale", e.target.value)}
            >
              <option value="4.0">4.0 Scale (Standard)</option>
              <option value="5.0">5.0 Scale (Weighted)</option>
            </select>
          </div>

          <div>
            <label htmlFor="minCreditsForGraduation" className="block text-sm font-medium text-gray-700">
              Minimum Credits Required for Graduation
            </label>
            <input
              type="number"
              id="minCreditsForGraduation"
              min={0}
              step={0.5}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.minCreditsForGraduation}
              onChange={(e) => handleInputChange("minCreditsForGraduation", parseFloat(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">Missouri public schools require 24 credits, but you may set your own minimum.</p>
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
              disabled={createStudent.isPending || updateStudent.isPending}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {createStudent.isPending || updateStudent.isPending
                ? "Saving..."
                : isEditing
                ? "Update Student"
                : "Add Student"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}