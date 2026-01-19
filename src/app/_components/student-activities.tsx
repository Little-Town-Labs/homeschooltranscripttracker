"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { StudentActivityForm } from "./student-activity-form";
import type { StudentActivityMetadata } from "@/types/core/domain-types";

interface StudentActivitiesProps {
  studentId: string;
}

export function StudentActivities({ studentId }: StudentActivitiesProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);

  const { data: activities, refetch } = api.studentActivity.getByStudent.useQuery({ studentId });

  const deleteActivity = api.studentActivity.delete.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const handleEdit = (activityId: string) => {
    setEditingActivity(activityId);
    setShowForm(true);
  };

  const handleDelete = async (activityId: string, activityName: string) => {
    if (window.confirm(`Are you sure you want to delete "${activityName}"?`)) {
      await deleteActivity.mutateAsync({ id: activityId });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingActivity(null);
    void refetch();
  };

  // Group by category
  const activitiesByCategory =
    activities?.reduce(
      (acc, activity) => {
        const category = activity.category;
        acc[category] ??= [];
        acc[category].push(activity);
        return acc;
      },
      {} as Record<string, typeof activities>
    ) ?? {};

  // Helper to format date range
  const formatDateRange = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    if (!endDate) return `${start} - Present`;
    const end = new Date(endDate).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    return `${start} - ${end}`;
  };

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Extracurricular Activities
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Sports, clubs, community service, leadership, and more
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          Add Activity
        </button>
      </div>

      {/* Activities by Category */}
      {Object.keys(activitiesByCategory).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(activitiesByCategory)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryActivities]) => (
              <div key={category} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                  <span className="text-sm text-gray-500">
                    {categoryActivities.length} activit
                    {categoryActivities.length !== 1 ? "ies" : "y"}
                  </span>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Activity
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Organization
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Role
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Dates
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Awards/Honors
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryActivities
                          .sort(
                            (a, b) =>
                              new Date(b.startDate).getTime() -
                              new Date(a.startDate).getTime()
                          )
                          .map((activity) => {
                            const metadata = activity.metadata as StudentActivityMetadata | null;
                            return (
                              <tr key={activity.id} className="border-b border-gray-100">
                                <td className="py-3 px-4">
                                  <div className="font-medium text-gray-900">
                                    {activity.activityName}
                                  </div>
                                  {!activity.endDate && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                                      Active
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-gray-900">
                                  {activity.organization ?? "—"}
                                </td>
                                <td className="py-3 px-4 text-gray-900">
                                  {activity.role ?? "—"}
                                </td>
                                <td className="py-3 px-4 text-gray-600 text-sm">
                                  {formatDateRange(activity.startDate, activity.endDate)}
                                </td>
                                <td className="py-3 px-4 text-gray-600 text-sm">
                                  {metadata?.awards && metadata.awards.length > 0
                                    ? metadata.awards.join(", ")
                                    : "—"}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEdit(activity.id)}
                                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDelete(activity.id, activity.activityName)
                                      }
                                      className="text-red-600 hover:text-red-800 text-sm"
                                      disabled={deleteActivity.isPending}
                                    >
                                      {deleteActivity.isPending ? "Deleting..." : "Delete"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 48 48"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 14l9-5 9 5m-9 7v-7m0 0l-9 5m9-5l9 5m-18 0v14a2 2 0 002 2h14a2 2 0 002-2V19"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No extracurricular activities yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Track sports, clubs, community service, and leadership activities.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add First Activity
            </button>
          </div>
        </div>
      )}

      {/* Activity Form Modal */}
      {showForm && (
        <StudentActivityForm
          studentId={studentId}
          activityId={editingActivity}
          onClose={handleFormClose}
        />
      )}
    </main>
  );
}
