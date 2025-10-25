"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";

interface StudentLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default function StudentLayout({ children, params }: StudentLayoutProps) {
  const { id } = use(params);
  const pathname = usePathname();

  const tabs = [
    {
      name: "Grades",
      href: `/students/${id}/grades`,
      current: pathname === `/students/${id}/grades`,
    },
    {
      name: "Test Scores",
      href: `/students/${id}/test-scores`,
      current: pathname === `/students/${id}/test-scores`,
    },
    {
      name: "Achievements",
      href: `/students/${id}/achievements`,
      current: pathname === `/students/${id}/achievements`,
    },
  ];

  return (
    <div>
      {/* Student Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={`border-b-2 py-4 px-1 text-sm font-medium ${
                  tab.current
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {children}
    </div>
  );
}
