"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/trpc/react";
import { TestScoreForm } from "./test-score-form";

interface StudentTestScoresPageProps {
  studentId: string;
}

export function StudentTestScoresPage({ studentId }: StudentTestScoresPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [editingScore, setEditingScore] = useState<string | null>(null);

  // Fetch student data
  const { data: student } = api.student.getById.useQuery({ id: studentId });
  
  // Fetch test scores
  const { data: testScores, refetch } = api.testScore.getByStudent.useQuery({ studentId });
  
  // Fetch best scores
  const { data: bestScores } = api.testScore.getBestScores.useQuery({ studentId });

  const deleteTestScore = api.testScore.delete.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const handleEdit = (scoreId: string) => {
    setEditingScore(scoreId);
    setShowForm(true);
  };

  const handleDelete = async (scoreId: string, testType: string, score: number) => {
    if (window.confirm(`Are you sure you want to delete this ${testType} score of ${score}?`)) {
      await deleteTestScore.mutateAsync({ id: scoreId });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingScore(null);
    void refetch();
  };

  if (!student) {
    return <div>Loading...</div>;
  }

  // Group test scores by test type
  const scoresByType = testScores?.reduce((acc, score) => {
    acc[score.testType] ??= [];
    acc[score.testType]!.push(score);
    return acc;
  }, {} as Record<string, typeof testScores>) ?? {};

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
                {student.firstName} {student.lastName} - Test Scores
              </h1>
              <p className="text-gray-600">Class of {student.graduationYear}</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Test Score
            </button>
          </div>
        </div>

        {/* Best Scores Summary */}
        {bestScores && bestScores.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Best Scores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {bestScores.map((score) => (
                <div key={score.id} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {score.score}
                    {score.maxScore && ` / ${score.maxScore}`}
                  </div>
                  <div className="text-sm font-medium text-gray-900">{score.testType}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(score.testDate).toLocaleDateString()}
                  </div>
                  {score.percentile && (
                    <div className="text-xs text-gray-600">
                      {score.percentile}th percentile
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Scores by Type */}
        {Object.keys(scoresByType).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(scoresByType)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([testType, scores]) => (
                <div key={testType} className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">{testType}</h2>
                    <span className="text-sm text-gray-500">
                      {scores.length} test{scores.length !== 1 ? "s" : ""} taken
                    </span>
                  </div>
                  
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900">Score</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900">Percentile</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900">Subscores</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900">Notes</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scores
                            .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
                            .map((score) => (
                              <tr key={score.id} className="border-b border-gray-100">
                                <td className="py-3 px-4 text-gray-900">
                                  {new Date(score.testDate).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-gray-900">
                                    {score.score}
                                    {score.maxScore && (
                                      <span className="text-gray-500"> / {score.maxScore}</span>
                                    )}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {score.percentile ? `${score.percentile}%` : "—"}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {score.subscores && Object.keys(score.subscores).length > 0 ? (
                                    <div className="space-y-1">
                                      {Object.entries(score.subscores as Record<string, number>).map(([section, subscore]) => (
                                        <div key={section} className="text-xs">
                                          {section}: {String(subscore)}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-3 px-4 text-gray-600 max-w-xs">
                                  {score.notes ? (
                                    <span className="truncate block" title={score.notes}>
                                      {score.notes}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEdit(score.id)}
                                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(score.id, score.testType, Number(score.score))}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                      disabled={deleteTestScore.isPending}
                                    >
                                      {deleteTestScore.isPending ? "Deleting..." : "Delete"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No test scores</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first test score.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Test Score
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Test Score Form Modal */}
      {showForm && (
        <TestScoreForm
          studentId={studentId}
          scoreId={editingScore}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}