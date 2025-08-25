"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Star, MessageCircle, AlertCircle, CheckCircle } from "lucide-react";
import { useApi } from "@/hooks/useApi";

interface FeedbackData {
  message: string;
  rating?: number;
  category?: "bug" | "feature" | "general" | "improvement";
}

interface RateLimitStatus {
  canSubmit: boolean;
  remainingTime: number;
  remainingMinutes: number;
  lastSubmitted?: string;
}

export default function FeedbackModal() {
  const { isSignedIn } = useAuth();
  const api = useApi();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData>({
    message: "",
    rating: undefined,
    category: undefined,
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  // Check rate limit status
  const checkRateLimit = async () => {
    try {
      const response = await api.feedback.getRateLimit();
      if (response.success) {
        setRateLimitStatus(response.data as RateLimitStatus);
      }
    } catch (error) {
      console.error("Error checking rate limit:", error);
    }
  };

  // Load rate limit status when modal opens
  useEffect(() => {
    if (isOpen && isSignedIn) {
      checkRateLimit();
    }
  }, [isOpen, isSignedIn]);

  // Auto-close success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setFeedback({ message: "", rating: undefined, category: undefined });
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.message.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await api.feedback.submit(feedback);

      if (response.success) {
        setSuccess(true);
        setError("");
        // Update rate limit status
        await checkRateLimit();
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || "Failed to submit feedback";
        setError(errorMessage);
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes === 1) return "1 minute";
    return `${minutes} minutes`;
  };

  if (!isSignedIn) return null;

  return (
    <>
      {/* Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-105"
        title="Send Feedback"
      >
        <MessageCircle size={24} />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Send Feedback</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Rate Limit Warning */}
            {rateLimitStatus && !rateLimitStatus.canSubmit && (
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
                <div className="flex items-center">
                  <AlertCircle className="text-yellow-400 mr-2" size={20} />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Rate limit reached</p>
                    <p>
                      You can submit feedback once every 5 minutes. Please try again in{" "}
                      {formatTimeRemaining(rateLimitStatus.remainingMinutes)}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border-l-4 border-green-400">
                <div className="flex items-center">
                  <CheckCircle className="text-green-400 mr-2" size={20} />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Feedback submitted successfully!</p>
                    <p>Thank you for your feedback. We'll review it shortly.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            {!success && (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating (optional)
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedback({ ...feedback, rating: star })}
                        className={`p-1 transition-colors ${
                          feedback.rating && feedback.rating >= star
                            ? "text-yellow-400"
                            : "text-gray-300 hover:text-yellow-300"
                        }`}
                      >
                        <Star size={24} fill={feedback.rating && feedback.rating >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category (optional)
                  </label>
                  <select
                    value={feedback.category || ""}
                    onChange={(e) => setFeedback({ ...feedback, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="improvement">Improvement</option>
                    <option value="general">General Feedback</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={feedback.message}
                    onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                    placeholder="Tell us what you think about PDFTrackr..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {feedback.message.length}/1000
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || (rateLimitStatus && !rateLimitStatus.canSubmit)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
