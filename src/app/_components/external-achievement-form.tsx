"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";

interface ExternalAchievementFormProps {
  studentId: string;
  achievementId?: string | null;
  onClose: () => void;
}

export function ExternalAchievementForm({
  studentId,
  achievementId,
  onClose,
}: ExternalAchievementFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    provider: "",
    category: "Online Course" as const,
    certificateDate: "",
    certificateUrl: "",
    verificationUrl: "",
    score: "",
    duration: "",
    skills: "",
    description: "",
    notes: "",
  });

  // Fetch existing achievement if editing
  const { data: existingAchievement } = api.externalAchievement.getById.useQuery(
    { id: achievementId! },
    { enabled: !!achievementId }
  );

  const createAchievement = api.externalAchievement.create.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  const updateAchievement = api.externalAchievement.update.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  // Load existing data when editing
  useEffect(() => {
    if (existingAchievement) {
      const metadata = existingAchievement.metadata as any;

      setFormData({
        title: existingAchievement.title,
        provider: existingAchievement.provider,
        category: existingAchievement.category as typeof formData.category,
        certificateDate: new Date(existingAchievement.certificateDate)
          .toISOString()
          .split("T")[0] as string,
        certificateUrl: existingAchievement.certificateUrl ?? "",
        verificationUrl: existingAchievement.verificationUrl ?? "",
        score: metadata?.score ? String(metadata.score) : "",
        duration: metadata?.duration ?? "",
        skills: Array.isArray(metadata?.skills) ? metadata.skills.join(", ") : "",
        description: existingAchievement.description ?? "",
        notes: existingAchievement.notes ?? "",
      });
    }
  }, [existingAchievement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build metadata object
    const metadata: any = {};

    if (formData.score) {
      metadata.score = parseFloat(formData.score);
    }

    if (formData.duration) {
      metadata.duration = formData.duration;
    }

    if (formData.skills) {
      metadata.skills = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    const submitData = {
      studentId,
      title: formData.title,
      provider: formData.provider,
      category: formData.category,
      certificateDate: formData.certificateDate,
      certificateUrl: formData.certificateUrl || undefined,
      verificationUrl: formData.verificationUrl || undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      description: formData.description || undefined,
      notes: formData.notes || undefined,
    };

    if (achievementId) {
      await updateAchievement.mutateAsync({ id: achievementId, ...submitData });
    } else {
      await createAchievement.mutateAsync(submitData);
    }
  };

  const categories = [
    "Online Course",
    "Certification",
    "Badge",
    "Award",
    "Other",
  ] as const;

  const providerSuggestions = [
    "Coursera",
    "edX",
    "Udemy",
    "Khan Academy",
    "LinkedIn Learning",
    "Codecademy",
    "DataCamp",
    "Pluralsight",
    "MIT OpenCourseWare",
    "Harvard Online",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {achievementId ? "Edit External Achievement" : "Add External Achievement"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Machine Learning Specialization"
              required
            />
          </div>

          {/* Provider and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider *
              </label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, provider: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Coursera"
                list="provider-suggestions"
                required
              />
              <datalist id="provider-suggestions">
                {providerSuggestions.map((provider) => (
                  <option key={provider} value={provider} />
                ))}
              </datalist>
            </div>

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
          </div>

          {/* Certificate Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completion/Certificate Date *
            </label>
            <input
              type="date"
              value={formData.certificateDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, certificateDate: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Certificate URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificate URL
            </label>
            <input
              type="url"
              value={formData.certificateUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, certificateUrl: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Link to the certificate or credential
            </p>
          </div>

          {/* Verification URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification URL
            </label>
            <input
              type="url"
              value={formData.verificationUrl}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  verificationUrl: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Link to verify the credential (if different from certificate URL)
            </p>
          </div>

          {/* Score and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score/Grade
              </label>
              <input
                type="number"
                value={formData.score}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, score: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., 95"
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, duration: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., 12 weeks, 40 hours"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills Learned
            </label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, skills: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Python, Machine Learning, TensorFlow (comma-separated)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter skills separated by commas
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
              placeholder="Brief description of the achievement..."
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
              disabled={createAchievement.isPending || updateAchievement.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {createAchievement.isPending || updateAchievement.isPending
                ? "Saving..."
                : achievementId
                ? "Update Achievement"
                : "Add Achievement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
