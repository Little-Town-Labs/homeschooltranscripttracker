"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import type { StudentActivityMetadata } from "@/types/core/domain-types";

interface StudentActivityFormProps {
  studentId: string;
  activityId?: string | null;
  onClose: () => void;
}

export function StudentActivityForm({
  studentId,
  activityId,
  onClose,
}: StudentActivityFormProps) {
  const [formData, setFormData] = useState({
    activityName: "",
    category: "Sports" as const,
    organization: "",
    startDate: "",
    endDate: "",
    role: "",
    awards: "",
    description: "",
    notes: "",
  });

  const { data: existingActivity } = api.studentActivity.getById.useQuery(
    { id: activityId! },
    { enabled: !!activityId }
  );

  const createActivity = api.studentActivity.create.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  const updateActivity = api.studentActivity.update.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  useEffect(() => {
    if (existingActivity) {
      const metadata = existingActivity.metadata as StudentActivityMetadata | null;

      setFormData({
        activityName: existingActivity.activityName,
        category: existingActivity.category as typeof formData.category,
        organization: existingActivity.organization ?? "",
        startDate: new Date(existingActivity.startDate).toISOString().split("T")[0]!,
        endDate: existingActivity.endDate
          ? new Date(existingActivity.endDate).toISOString().split("T")[0]!
          : "",
        role: existingActivity.role ?? "",
        awards: metadata?.awards ? metadata.awards.join(", ") : "",
        description: existingActivity.description ?? "",
        notes: existingActivity.notes ?? "",
      });
    }
  }, [existingActivity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const metadata: StudentActivityMetadata = {};

    if (formData.awards) {
      metadata.awards = formData.awards
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    const submitData = {
      studentId,
      activityName: formData.activityName,
      category: formData.category,
      organization: formData.organization || undefined,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      role: formData.role || undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      description: formData.description || undefined,
      notes: formData.notes || undefined,
    };

    if (activityId) {
      await updateActivity.mutateAsync({ id: activityId, ...submitData });
    } else {
      await createActivity.mutateAsync(submitData);
    }
  };

  const categories = [
    "Sports",
    "Scouting/Youth Groups",
    "Community Service",
    "Academic Clubs",
    "Arts/Performance",
    "Leadership",
    "Other",
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {activityId ? "Edit Activity" : "Add Extracurricular Activity"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Activity Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity Name *
            </label>
            <input
              type="text"
              value={formData.activityName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, activityName: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Varsity Soccer, Boy Scouts, Debate Club"
              required
            />
          </div>

          {/* Category & Organization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value as typeof formData.category,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization/Sponsor
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, organization: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Troop 123, YMCA Soccer League"
              />
            </div>
          </div>

          {/* Start & End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank for ongoing activities
              </p>
            </div>
          </div>

          {/* Leadership Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leadership Role/Position
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, role: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Team Captain, Troop Leader, President"
            />
          </div>

          {/* Awards/Honors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Awards/Honors Earned
            </label>
            <input
              type="text"
              value={formData.awards}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, awards: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Black Belt, Eagle Scout, MVP (comma-separated)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter awards separated by commas
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Brief description of the activity and your involvement..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Private notes (not shown on transcripts)..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createActivity.isPending || updateActivity.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {createActivity.isPending || updateActivity.isPending
                ? "Saving..."
                : activityId
                ? "Update Activity"
                : "Add Activity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
