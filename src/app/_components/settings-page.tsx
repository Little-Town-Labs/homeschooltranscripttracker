"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

import { api } from "@/trpc/react";
import type { UserRole } from "@/types/core/domain-types";

export function SettingsPage() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    primaryEmail: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  // Fetch tenant settings and family members
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const { data: tenantSettings, refetch: refetchSettings } = (api as any).settings.getTenantSettings.useQuery();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const { data: familyMembers, refetch: refetchMembers } = (api as any).settings.getFamilyMembers.useQuery();

  // Update form data when tenant settings are loaded
  useEffect(() => {
    if (tenantSettings) {
      setFormData({
        name: tenantSettings.name,
        primaryEmail: tenantSettings.primaryEmail ?? "",
        address: tenantSettings.address ?? "",
        city: tenantSettings.city ?? "",
        state: tenantSettings.state ?? "",
        zipCode: tenantSettings.zipCode ?? "",
        phone: tenantSettings.phone ?? "",
      });
    }
  }, [tenantSettings]);

  // Mutations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const updateSettings = (api as any).settings.updateTenantSettings.useMutation({
    onSuccess: () => {
      void refetchSettings();
      setIsEditing(false);
      alert("Settings updated successfully!");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.error("Failed to update settings:", error);
      alert("Failed to update settings. Please try again.");
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const updateUserRole = (api as any).settings.updateUserRole.useMutation({
    onSuccess: () => {
      void refetchMembers();
      alert("User role updated successfully!");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.error("Failed to update user role:", error);
      alert(error.message ?? "Failed to update user role. Please try again.");
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const deactivateUser = (api as any).settings.deactivateUser.useMutation({
    onSuccess: () => {
      void refetchMembers();
      alert("User deactivated successfully!");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.error("Failed to deactivate user:", error);
      alert(error.message ?? "Failed to deactivate user. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync(formData);
  };

  const handleCancel = () => {
    if (tenantSettings) {
      setFormData({
        name: tenantSettings.name,
        primaryEmail: tenantSettings.primaryEmail ?? "",
        address: tenantSettings.address ?? "",
        city: tenantSettings.city ?? "",
        state: tenantSettings.state ?? "",
        zipCode: tenantSettings.zipCode ?? "",
        phone: tenantSettings.phone ?? "",
      });
    }
    setIsEditing(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      await updateUserRole.mutateAsync({ userId, role: newRole });
    }
  };

  const handleDeactivate = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to deactivate ${userName}? They will no longer be able to access the system.`)) {
      await deactivateUser.mutateAsync({ userId });
    }
  };

  const isPrimaryGuardian = session?.user?.role === "primary_guardian";

  if (!tenantSettings || !familyMembers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
            <span className="border-b-2 border-indigo-500 py-4 px-1 text-sm font-medium text-indigo-600">
              Settings
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your family information and account settings</p>
        </div>

        <div className="space-y-6">
          {/* Family/School Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Family/School Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Family/School Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.primaryEmail}
                      onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateSettings.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {updateSettings.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Family/School Name</p>
                    <p className="text-gray-900 font-medium">{tenantSettings.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Primary Email</p>
                    <p className="text-gray-900 font-medium">{tenantSettings.primaryEmail ?? "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900 font-medium">{tenantSettings.address ?? "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="text-gray-900 font-medium">{tenantSettings.city ?? "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="text-gray-900 font-medium">{tenantSettings.state ?? "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Zip Code</p>
                    <p className="text-gray-900 font-medium">{tenantSettings.zipCode ?? "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900 font-medium">{tenantSettings.phone ?? "Not set"}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 italic pt-2">
                  This information will appear on generated transcripts and official documents.
                </p>
              </div>
            )}
          </div>

          {/* Family Members */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Family Members</h2>
            <p className="text-sm text-gray-600 mb-4">
              Manage users who have access to your family's academic records.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {isPrimaryGuardian && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {familyMembers?.map((member: any) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {member.name?.[0] ?? "?"}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.name}
                              {member.id === session?.user?.id && (
                                <span className="ml-2 text-xs text-gray-500">(You)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPrimaryGuardian && member.id !== session?.user?.id ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="primary_guardian">Primary Guardian</option>
                            <option value="guardian">Guardian</option>
                            <option value="student">Student</option>
                          </select>
                        ) : (
                          <span className="text-sm text-gray-900">
                            {member.role === "primary_guardian" && "Primary Guardian"}
                            {member.role === "guardian" && "Guardian"}
                            {member.role === "student" && "Student"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            member.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      {isPrimaryGuardian && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {member.id !== session?.user?.id && member.isActive && (
                            <button
                              onClick={() => handleDeactivate(member.id, member.name ?? "this user")}
                              className="text-red-600 hover:text-red-900"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isPrimaryGuardian && (
              <p className="text-sm text-gray-500 italic mt-4">
                Only the primary guardian can manage family member roles and access.
              </p>
            )}
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Your Role</p>
                <p className="text-gray-900 font-medium">
                  {session?.user?.role === "primary_guardian" && "Primary Guardian"}
                  {session?.user?.role === "guardian" && "Guardian"}
                  {session?.user?.role === "student" && "Student"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Your Email</p>
                <p className="text-gray-900 font-medium">{session?.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <p className="text-gray-900 font-medium">
                  {familyMembers?.find((m: any) => m.id === session?.user?.id)?.createdAt
                    ? new Date(familyMembers.find((m: any) => m.id === session?.user?.id)!.createdAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
