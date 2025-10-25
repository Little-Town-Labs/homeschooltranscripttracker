"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { ExternalAchievementForm } from "./external-achievement-form";
import type { ExternalAchievementMetadata } from "@/types/core/domain-types";

interface StudentExternalAchievementsProps {
  studentId: string;
}

export function StudentExternalAchievements({
  studentId,
}: StudentExternalAchievementsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<string | null>(
    null
  );

  // Fetch achievements
  const { data: achievements, refetch } =
    api.externalAchievement.getByStudent.useQuery({ studentId });

  const deleteAchievement = api.externalAchievement.delete.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const handleEdit = (achievementId: string) => {
    setEditingAchievement(achievementId);
    setShowForm(true);
  };

  const handleDelete = async (
    achievementId: string,
    title: string,
    provider: string
  ) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${title}" from ${provider}?`
      )
    ) {
      await deleteAchievement.mutateAsync({ id: achievementId });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAchievement(null);
    void refetch();
  };

  // Group achievements by category
  const achievementsByCategory =
    achievements?.reduce(
      (acc, achievement) => {
        const category = achievement.category;
        acc[category] ??= [];
        acc[category].push(achievement);
        return acc;
      },
      {} as Record<string, typeof achievements>
    ) ?? {};

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            External Achievements
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Online courses, certifications, badges, and awards
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          Add Achievement
        </button>
      </div>

      {/* Achievements by Category */}
      {Object.keys(achievementsByCategory).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(achievementsByCategory)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryAchievements]) => (
              <div key={category} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {categoryAchievements.length} achievement
                    {categoryAchievements.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Title
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Provider
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Date
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Score
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Links
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryAchievements
                          .sort(
                            (a, b) =>
                              new Date(b.certificateDate).getTime() -
                              new Date(a.certificateDate).getTime()
                          )
                          .map((achievement) => {
                            const metadata = achievement.metadata as ExternalAchievementMetadata | null;
                            return (
                              <tr
                                key={achievement.id}
                                className="border-b border-gray-100"
                              >
                                <td className="py-3 px-4">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {achievement.title}
                                    </div>
                                    {metadata?.skills &&
                                      Array.isArray(metadata.skills) &&
                                      metadata.skills.length > 0 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {metadata.skills.join(", ")}
                                        </div>
                                      )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-gray-900">
                                  {achievement.provider}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {new Date(
                                    achievement.certificateDate
                                  ).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {metadata?.score ? (
                                    <span className="font-medium">
                                      {metadata.score}
                                      {metadata.passingScore && (
                                        <span className="text-gray-500">
                                          {" "}
                                          / {metadata.passingScore}
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex space-x-2">
                                    {achievement.certificateUrl && (
                                      <a
                                        href={achievement.certificateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                                        title="View Certificate"
                                      >
                                        <svg
                                          className="w-5 h-5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                          />
                                        </svg>
                                      </a>
                                    )}
                                    {achievement.verificationUrl && (
                                      <a
                                        href={achievement.verificationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-600 hover:text-green-800 text-sm"
                                        title="Verify Credential"
                                      >
                                        <svg
                                          className="w-5 h-5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEdit(achievement.id)}
                                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDelete(
                                          achievement.id,
                                          achievement.title,
                                          achievement.provider
                                        )
                                      }
                                      className="text-red-600 hover:text-red-800 text-sm"
                                      disabled={deleteAchievement.isPending}
                                    >
                                      {deleteAchievement.isPending
                                        ? "Deleting..."
                                        : "Delete"}
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
            No external achievements yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Track online courses, certifications, badges, and awards here.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add First Achievement
            </button>
          </div>
        </div>
      )}

      {/* Achievement Form Modal */}
      {showForm && (
        <ExternalAchievementForm
          studentId={studentId}
          achievementId={editingAchievement}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
