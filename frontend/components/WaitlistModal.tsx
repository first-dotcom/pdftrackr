"use client";

import { useState } from "react";
import { Bell, X, CheckCircle } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { sanitizeUserInput } from "@/utils/security";

export default function WaitlistModal() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("starter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const api = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const sanitizedEmail = sanitizeUserInput(email).toLowerCase().trim();

      if (!sanitizedEmail || !sanitizedEmail.includes("@")) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }

      const response = await api.waitlist.join({
        email: sanitizedEmail,
        plan: sanitizeUserInput(plan),
        source: "modal",
      });

      if (response.success) {
        setSubmitted(true);
        setTimeout(() => {
          closeModal();
        }, 3000);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || "Failed to join waitlist. Please try again.";
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to join waitlist:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    document.getElementById("waitlist-modal")?.classList.add("hidden");
    setEmail("");
    setPlan("starter");
    setSubmitted(false);
    setError("");
  };

  return (
    <div
      id="waitlist-modal"
      className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          closeModal();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-modal-title"
    >
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="waitlist-modal-title" className="text-lg font-semibold text-gray-900">
            Join the Waitlist
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!submitted ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border border-primary-200">
              <Bell className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0" />
              <p className="text-sm text-primary-700 font-medium">
                Be the first to know when paid plans launch in Q3 2025!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(sanitizeUserInput(e.target.value))}
                  required
                  maxLength={254}
                  className="input w-full"
                  placeholder="your@email.com"
                />
                {error && (
                  <p className="text-sm text-red-600 mt-2 flex items-center">
                    <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                    {error}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interested Plan
                </label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="input w-full"
                >
                  <option value="starter">Starter Plan ($4/month)</option>
                  <option value="pro">Pro Plan ($9/month)</option>
                  <option value="business">Business Plan ($19/month)</option>
                  <option value="either">Either plan</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  We'll notify you when your preferred plan becomes available
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 btn-outline btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary btn-md flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    "Join Waitlist"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                You're on the list!
              </h3>
              <p className="text-gray-600 mb-4">
                We'll email you when paid plans launch in Q3 2025.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">
                  This window will close automatically in a few seconds...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
