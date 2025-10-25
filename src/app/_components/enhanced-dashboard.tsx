"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

import { api } from "@/trpc/react";
import type { DashboardRecentActivity, DashboardUpcomingTask, DashboardStudentProgress } from "@/types/core/domain-types";

export function EnhancedDashboard() {
  const { data: session } = useSession();
  const [selectedView, setSelectedView] = useState<"overview" | "progress" | "trends">("overview");

  // Fetch dashboard data
  const { data: overview } = api.dashboard.getOverview.useQuery();
  const { data: studentProgress } = api.dashboard.getStudentProgress.useQuery();
  const { data: academicTrends } = api.dashboard.getAcademicTrends.useQuery();
  const { data: upcomingTasks } = api.dashboard.getUpcomingTasks.useQuery();

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
            <span className="border-b-2 border-indigo-500 py-4 px-1 text-sm font-medium text-indigo-600">
              Dashboard
            </span>
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
            <Link
              href="/billing"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Billing
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard View Selector */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedView("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedView === "overview"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedView("progress")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedView === "progress"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Student Progress
              </button>
              <button
                onClick={() => setSelectedView("trends")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedView === "trends"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Academic Trends
              </button>
            </nav>
          </div>
        </div>

        {/* Overview View */}
        {selectedView === "overview" && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Active Students"
                value={overview?.stats.students ?? 0}
                icon="users"
                color="blue"
              />
              <StatCard
                title="Total Courses"
                value={overview?.stats.courses ?? 0}
                icon="book"
                color="green"
              />
              <StatCard
                title="Grades Recorded"
                value={overview?.stats.grades ?? 0}
                icon="academic-cap"
                color="purple"
              />
              <StatCard
                title="Test Scores"
                value={overview?.stats.testScores ?? 0}
                icon="clipboard-check"
                color="amber"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <RecentActivity activity={overview?.recentActivity} />
              </div>

              {/* Upcoming Tasks */}
              <div>
                <UpcomingTasks tasks={upcomingTasks} />
              </div>
            </div>

            {/* Quick Actions */}
            <QuickActions />
          </div>
        )}

        {/* Student Progress View */}
        {selectedView === "progress" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Student Progress Overview</h2>
              </div>
              <div className="p-6">
                {studentProgress && studentProgress.length > 0 ? (
                  <div className="space-y-6">
                    {studentProgress.map((student) => (
                      <StudentProgressCard key={student.student.id} student={student} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No student progress data available.</p>
                    <Link
                      href="/students"
                      className="mt-2 text-indigo-600 hover:text-indigo-800"
                    >
                      Add students to get started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Academic Trends View */}
        {selectedView === "trends" && (
          <div className="space-y-6">
            {academicTrends && (
              <>
                {/* GPA Trends */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">GPA Trends by Academic Year</h2>
                  </div>
                  <div className="p-6">
                    {academicTrends.gpaByYear.length > 0 ? (
                      <div className="space-y-4">
                        {academicTrends.gpaByYear.map((year) => (
                          <div key={year.year} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <h3 className="font-medium text-gray-900">{year.year}</h3>
                              <p className="text-sm text-gray-600">
                                {year.studentCount} student{year.studentCount !== 1 ? 's' : ''} • {year.credits} credits
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-indigo-600">
                                {year.gpa.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">GPA</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No GPA trend data available yet.</p>
                    )}
                  </div>
                </div>

                {/* Grade Distribution */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Grade Distribution</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-5 gap-4">
                      {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => {
                        const count = academicTrends.gradeDistribution[grade] ?? 0;
                        const total = Object.values(academicTrends.gradeDistribution).reduce((sum, val) => sum + val, 0);
                        const percentage = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div key={grade} className="text-center">
                            <div className={`text-3xl font-bold ${
                              grade === 'A' ? 'text-green-600' :
                              grade === 'B' ? 'text-blue-600' :
                              grade === 'C' ? 'text-yellow-600' :
                              grade === 'D' ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {count}
                            </div>
                            <div className="text-sm font-medium text-gray-900">{grade}</div>
                            <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Subject Performance */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Performance by Subject</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {academicTrends.subjectPerformance.map((subject) => (
                        <div key={subject.subject} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <h3 className="font-medium text-gray-900">{subject.subject}</h3>
                            <p className="text-sm text-gray-600">
                              {subject.courseCount} courses • {subject.totalCredits} credits
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              subject.averageGPA >= 3.5 ? 'text-green-600' :
                              subject.averageGPA >= 3.0 ? 'text-blue-600' :
                              subject.averageGPA >= 2.0 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {subject.averageGPA.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">Avg GPA</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Helper Components
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "purple" | "amber";
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {icon === "users" && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              )}
              {icon === "book" && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              )}
              {icon === "academic-cap" && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              )}
              {icon === "clipboard-check" && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              )}
            </svg>
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

function RecentActivity({ activity }: { activity?: DashboardRecentActivity }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="p-6">
        {activity && (activity.grades.length > 0 || activity.testScores.length > 0) ? (
          <div className="space-y-4">
            {activity.grades.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{item.student.firstName} {item.student.lastName}</span> received a{" "}
                    <span className="font-semibold text-green-600">{item.grade.grade}</span> in{" "}
                    <span className="font-medium">{item.course.name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.grade.updatedAt ?? new Date()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {activity.testScores.slice(0, 2).map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{item.student.firstName} {item.student.lastName}</span> scored{" "}
                    <span className="font-semibold text-blue-600">{typeof item.testScore.scores === 'object' && item.testScore.scores && 'total' in item.testScore.scores ? (item.testScore.scores as {total: number}).total : 'N/A'}</span> on{" "}
                    <span className="font-medium">{item.testScore.testType}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.testScore.testDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
}

function UpcomingTasks({ tasks }: { tasks?: DashboardUpcomingTask[] }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Tasks</h3>
      </div>
      <div className="p-6">
        {tasks && tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  task.priority === "high" ? "bg-red-500" :
                  task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-600">{task.description}</p>
                  {task.dueDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No upcoming tasks</p>
        )}
      </div>
    </div>
  );
}

function StudentProgressCard({ student }: { student: DashboardStudentProgress }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{student.student.name}</h3>
          <p className="text-sm text-gray-600">Class of {student.student.graduationYear}</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${
            student.academics.gpa >= 3.5 ? 'text-green-600' :
            student.academics.gpa >= 3.0 ? 'text-blue-600' :
            student.academics.gpa >= 2.0 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {student.academics.gpa > 0 ? student.academics.gpa.toFixed(2) : "N/A"}
          </div>
          <div className="text-sm text-gray-500">GPA ({student.student.gpaScale})</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-lg font-semibold text-gray-900">
            {student.academics.completedCourses}/{student.academics.totalCourses}
          </div>
          <div className="text-sm text-gray-600">Courses Complete</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-lg font-semibold text-gray-900">
            {student.academics.completedCredits}
          </div>
          <div className="text-sm text-gray-600">Credits Earned</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-lg font-semibold text-gray-900">
            {student.academics.completionRate.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
      </div>

      {/* Graduation Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Graduation Progress</span>
          <span className="text-sm text-gray-600">
            {student.graduation.progress.toFixed(0)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              student.graduation.meetsRequirements ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(100, student.graduation.progress)}%` }}
          ></div>
        </div>
        {student.graduation.creditsRemaining > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {student.graduation.creditsRemaining} credits remaining
          </p>
        )}
      </div>

      <div className="flex space-x-2">
        <Link
          href={`/students/${student.student.id}/grades`}
          className="flex-1 bg-indigo-600 text-white py-2 px-3 rounded text-sm text-center hover:bg-indigo-700 transition-colors"
        >
          View Grades
        </Link>
        <Link
          href={`/students/${student.student.id}/test-scores`}
          className="flex-1 bg-gray-600 text-white py-2 px-3 rounded text-sm text-center hover:bg-gray-700 transition-colors"
        >
          Test Scores
        </Link>
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/students" className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Add Student</span>
          </Link>

          <Link href="/courses" className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Add Course</span>
          </Link>

          <Link href="/transcripts" className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Generate Transcript</span>
          </Link>

          <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Record Grades</span>
          </button>
        </div>
      </div>
    </div>
  );
}