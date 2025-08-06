"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { sanitizeUserInput } from "@/utils/security";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistModal() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("pro");
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
    setPlan("pro");
    setSubmitted(false);
    setError("");
  };

  return (
    <div
      id="waitlist-modal"
      className="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
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
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 id="waitlist-modal-title" className="text-lg font-medium text-gray-900">
            Join the Waitlist
          </h3>
          <button
            type="button"
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <Bell className="h-5 w-5 text-primary-600 mr-2" />
                <p className="text-sm text-gray-600">
                  Be the first to know when premium plans launch!
                </p>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(sanitizeUserInput(e.target.value))}
                required
                maxLength={254}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="your@email.com"
              />
              {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interested Plan
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="pro">Pro Plan ($9/month)</option>
                <option value="team">Team Plan ($29/month)</option>
                <option value="either">Either plan</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Joining..." : "Join Waitlist"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-600 mb-4">
              We'll email you as soon as premium plans are available.
            </p>
            <p className="text-xs text-gray-500">This window will close automatically...</p>
          </div>
        )}
      </div>
    </div>
  );
}
