"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";

interface TestScoreFormProps {
  studentId: string;
  scoreId?: string | null;
  onClose: () => void;
}

export function TestScoreForm({ studentId, scoreId, onClose }: TestScoreFormProps) {
  const [formData, setFormData] = useState({
    testType: "SAT" as const,
    testDate: "",
    score: "",
    maxScore: "",
    percentile: "",
    subscores: {} as Record<string, number>,
    notes: "",
  });

  const [subsectionInputs, setSubsectionInputs] = useState<Record<string, string>>({});

  // Fetch existing test score if editing
  const { data: existingScore } = api.testScore.getById.useQuery(
    { id: scoreId! },
    { enabled: !!scoreId }
  );

  // Get test info for validation
  const { data: testInfo } = api.testScore.getTestInfo.useQuery({ 
    testType: formData.testType 
  });

  const createTestScore = api.testScore.create.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  const updateTestScore = api.testScore.update.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  // Load existing data when editing
  useEffect(() => {
    if (existingScore) {
      setFormData({
        testType: existingScore.testType,
        testDate: new Date(existingScore.testDate).toISOString().split('T')[0] as string,
        score: String(existingScore.score),
        maxScore: existingScore.maxScore ? String(existingScore.maxScore) : "",
        percentile: existingScore.percentile ? String(existingScore.percentile) : "",
        subscores: (existingScore.subscores ?? {}) as Record<string, number>,
        notes: existingScore.notes ?? "",
      });
      
      // Convert subscores to string inputs
      const subsecInputs: Record<string, string> = {};
      Object.entries((existingScore.subscores ?? {}) as Record<string, unknown>).forEach(([key, value]) => {
        subsecInputs[key] = String(value);
      });
      setSubsectionInputs(subsecInputs);
    }
  }, [existingScore]);

  // Update max score when test type changes
  useEffect(() => {
    if (testInfo) {
      setFormData(prev => ({
        ...prev,
        maxScore: String(testInfo.maxScore),
        subscores: {},
      }));
      setSubsectionInputs({});
    }
  }, [testInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Process subscores
    const processedSubscores: Record<string, number> = {};
    Object.entries(subsectionInputs).forEach(([key, value]) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        processedSubscores[key] = numValue;
      }
    });

    const submitData = {
      studentId,
      testType: formData.testType,
      testDate: formData.testDate,
      score: parseInt(formData.score),
      maxScore: formData.maxScore ? parseInt(formData.maxScore) : undefined,
      percentile: formData.percentile ? parseFloat(formData.percentile) : undefined,
      subscores: Object.keys(processedSubscores).length > 0 ? processedSubscores : undefined,
      notes: formData.notes || undefined,
    };

    if (scoreId) {
      await updateTestScore.mutateAsync({ id: scoreId, ...submitData });
    } else {
      await createTestScore.mutateAsync(submitData);
    }
  };

  const handleSubsectionChange = (section: string, value: string) => {
    setSubsectionInputs(prev => ({
      ...prev,
      [section]: value,
    }));
  };

  const testTypes = [
    "SAT", "ACT", "PSAT", "AP", "CLEP", "SAT Subject", "State Assessment", "Other"
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {scoreId ? "Edit Test Score" : "Add Test Score"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Test Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Type *
            </label>
            <select
              value={formData.testType}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                testType: e.target.value as typeof formData.testType 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              {testTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Test Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Date *
            </label>
            <input
              type="date"
              value={formData.testDate}
              onChange={(e) => setFormData(prev => ({ ...prev, testDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score *
              </label>
              <input
                type="number"
                value={formData.score}
                onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                min={testInfo?.minScore}
                max={testInfo?.maxScore}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {testInfo && (
                <p className="text-xs text-gray-500 mt-1">
                  {testInfo.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Score
              </label>
              <input
                type="number"
                value={formData.maxScore}
                onChange={(e) => setFormData(prev => ({ ...prev, maxScore: e.target.value }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Percentile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Percentile
            </label>
            <input
              type="number"
              value={formData.percentile}
              onChange={(e) => setFormData(prev => ({ ...prev, percentile: e.target.value }))}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Subscores */}
          {testInfo?.sections && testInfo.sections.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Scores
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testInfo.sections.map(section => (
                  <div key={section}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {section}
                    </label>
                    <input
                      type="number"
                      value={subsectionInputs[section] ?? ""}
                      onChange={(e) => handleSubsectionChange(section, e.target.value)}
                      min={testInfo.sectionMinMax.min}
                      max={testInfo.sectionMinMax.max}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`${testInfo.sectionMinMax.min}-${testInfo.sectionMinMax.max}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional notes about the test..."
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
              disabled={createTestScore.isPending || updateTestScore.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {createTestScore.isPending || updateTestScore.isPending
                ? "Saving..."
                : scoreId
                ? "Update Test Score"
                : "Add Test Score"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}