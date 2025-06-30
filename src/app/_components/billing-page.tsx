"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

import { api } from "@/trpc/react";

export function BillingPage() {
  const { data: session } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch billing data
  const { data: billingStatus, refetch } = api.billing.getSubscriptionStatus.useQuery();
  const { data: billingHistory } = api.billing.getBillingHistory.useQuery();

  // Mutations
  const createCheckout = api.billing.createCheckoutSession.useMutation();
  const updateSubscription = api.billing.updateSubscription.useMutation();
  const createPortalSession = api.billing.createPortalSession.useMutation();

  const handleSubscribe = async () => {
    if (!billingStatus) return;
    
    setIsProcessing(true);
    try {
      const result = await createCheckout.mutateAsync({
        priceType: selectedPlan,
        studentCount: billingStatus.students.count,
      });
      
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      alert("Failed to start checkout process. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const result = await createPortalSession.mutateAsync();
      if (result.portalUrl) {
        window.location.href = result.portalUrl;
      }
    } catch (error) {
      console.error("Failed to create portal session:", error);
      alert("Failed to open billing portal. Please try again.");
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.")) {
      return;
    }
    
    try {
      await updateSubscription.mutateAsync({ action: "cancel" });
      await refetch();
      alert("Subscription cancelled successfully. You'll retain access until the end of your current billing period.");
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      alert("Failed to cancel subscription. Please try again.");
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      await updateSubscription.mutateAsync({ action: "reactivate" });
      await refetch();
      alert("Subscription reactivated successfully!");
    } catch (error) {
      console.error("Failed to reactivate subscription:", error);
      alert("Failed to reactivate subscription. Please try again.");
    }
  };

  if (!billingStatus) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>;
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
              Billing
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Current Status */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <CurrentStatusCard 
            billingStatus={billingStatus}
            onManageBilling={handleManageBilling}
            onCancel={handleCancelSubscription}
            onReactivate={handleReactivateSubscription}
          />
        </div>

        {/* Trial Banner */}
        {billingStatus.trial.isActive && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-amber-800">Free Trial Active</h3>
                <p className="text-amber-700">
                  You have {billingStatus.trial.daysRemaining} days remaining in your free trial. 
                  Subscribe now to continue accessing all features without interruption.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Required Banner */}
        {!billingStatus.trial.isActive && !billingStatus.subscription && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-red-800">Subscription Required</h3>
                <p className="text-red-700">
                  Your free trial has ended. Subscribe now to continue using Homeschool Transcript Tracker.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        {(!billingStatus.subscription || billingStatus.trial.isActive) && (
          <div className="mb-8">
            <PricingPlans
              billingStatus={billingStatus}
              selectedPlan={selectedPlan}
              onPlanChange={setSelectedPlan}
              onSubscribe={handleSubscribe}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {/* Billing History */}
        {billingHistory && billingHistory.invoices.length > 0 && (
          <BillingHistory history={billingHistory} />
        )}
      </main>
    </div>
  );
}

// Helper Components
interface CurrentStatusCardProps {
  billingStatus: any;
  onManageBilling: () => void;
  onCancel: () => void;
  onReactivate: () => void;
}

function CurrentStatusCard({ billingStatus, onManageBilling, onCancel, onReactivate }: CurrentStatusCardProps) {
  const subscription = billingStatus.subscription;
  const trial = billingStatus.trial;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
          
          {trial.isActive ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
                <span className="font-medium text-gray-900">Free Trial</span>
              </div>
              <p className="text-gray-600">
                {trial.daysRemaining} days remaining
              </p>
              <p className="text-sm text-gray-500">
                Trial ends: {trial.endsAt ? new Date(trial.endsAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
          ) : subscription ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${
                  subscription.status === "active" ? "bg-green-500" :
                  subscription.status === "past_due" ? "bg-red-500" :
                  subscription.status === "canceled" ? "bg-gray-500" : "bg-yellow-500"
                }`}></span>
                <span className="font-medium text-gray-900 capitalize">{subscription.status}</span>
              </div>
              
              {subscription.cancelAtPeriodEnd && (
                <p className="text-amber-600 font-medium">
                  Cancels at period end
                </p>
              )}
              
              <p className="text-gray-600">
                Next billing: {subscription.currentPeriodEnd.toLocaleDateString()}
              </p>
              
              <div className="text-sm text-gray-500">
                <p>Students: {billingStatus.students.count}</p>
                <p>Monthly cost: ${billingStatus.pricing.monthlyTotal.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                <span className="font-medium text-gray-900">No Active Subscription</span>
              </div>
              <p className="text-gray-600">
                Subscribe to access all features
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {subscription && (
            <>
              <button
                onClick={onManageBilling}
                className="block px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800"
              >
                Manage Billing
              </button>
              
              {subscription.cancelAtPeriodEnd ? (
                <button
                  onClick={onReactivate}
                  className="block px-4 py-2 text-sm text-green-600 hover:text-green-800"
                >
                  Reactivate
                </button>
              ) : (
                <button
                  onClick={onCancel}
                  className="block px-4 py-2 text-sm text-red-600 hover:text-red-800"
                >
                  Cancel Subscription
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface PricingPlansProps {
  billingStatus: any;
  selectedPlan: "monthly" | "annual";
  onPlanChange: (plan: "monthly" | "annual") => void;
  onSubscribe: () => void;
  isProcessing: boolean;
}

function PricingPlans({ billingStatus, selectedPlan, onPlanChange, onSubscribe, isProcessing }: PricingPlansProps) {
  const pricing = billingStatus.pricing;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Choose Your Plan</h2>
      </div>
      
      <div className="p-6">
        {/* Plan Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => onPlanChange("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPlan === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => onPlanChange("annual")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPlan === "annual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual (Save 16.7%)
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="border-2 border-indigo-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Professional Plan
            </h3>
            <div className="text-3xl font-bold text-indigo-600">
              ${selectedPlan === "monthly" ? pricing.monthlyTotal.toFixed(2) : pricing.annualTotal.toFixed(2)}
              <span className="text-lg text-gray-600 font-normal">
                /{selectedPlan === "monthly" ? "month" : "year"}
              </span>
            </div>
            {selectedPlan === "annual" && (
              <p className="text-sm text-green-600 mt-1">
                Save ${pricing.savings.annual.toFixed(2)} per year
              </p>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-700">{pricing.studentCount} student{pricing.studentCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-700">Unlimited courses and grades</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-700">Professional transcript generation</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-700">Test score tracking</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-700">Academic progress analytics</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-700">Email support</span>
            </div>
          </div>

          {pricing.discountPercentage > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-green-800 text-center font-medium">
                {pricing.discountPercentage}% Family Discount Applied!
              </p>
              <p className="text-xs text-green-600 text-center">
                Save ${pricing.savings.multiStudent.toFixed(2)}/month with multiple students
              </p>
            </div>
          )}

          <button
            onClick={onSubscribe}
            disabled={isProcessing}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : `Subscribe ${selectedPlan === "monthly" ? "Monthly" : "Annually"}`}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
}

function BillingHistory({ history }: { history: any }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Billing History</h2>
      </div>
      
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Invoice</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.invoices.map((invoice: any) => (
                <tr key={invoice.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900">
                    {invoice.number || invoice.id.slice(-8)}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {invoice.created.toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-900">
                    ${invoice.amountPaid.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      invoice.status === "paid" ? "bg-green-100 text-green-800" :
                      invoice.status === "open" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {invoice.invoicePdf && (
                      <a
                        href={invoice.invoicePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        Download PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {history.paymentMethods.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Payment Methods</h3>
            <div className="space-y-2">
              {history.paymentMethods.map((pm: any) => (
                <div key={pm.id} className="flex items-center space-x-3">
                  <div className="w-8 h-5 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 uppercase">
                      {pm.brand}
                    </span>
                  </div>
                  <span className="text-gray-900">•••• {pm.last4}</span>
                  <span className="text-gray-500 text-sm">
                    Expires {pm.expMonth}/{pm.expYear}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}