"use client";

import { useApi } from "@/hooks/useApi";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useState } from "react";

export default function DataRightsForm() {
  const { isSignedIn } = useAuth();
  const api = useApi();
  const [formData, setFormData] = useState({
    requestType: "access" as "access" | "deletion" | "rectification" | "portability",
    description: "",
    fields: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [responseData, setResponseData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      setSubmitStatus("error");
      setResponseData({ message: "Please sign in to submit a data rights request." });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const requestData = {
        requestType: formData.requestType,
        description: formData.description,
        ...(formData.requestType === "rectification" && { fields: formData.fields }),
      };

      const response = await api.dataRights.request(requestData);

      if (response.success) {
        setSubmitStatus("success");
        setResponseData(response.data);

        // Reset form for new requests
        setFormData({
          requestType: "access",
          description: "",
          fields: { firstName: "", lastName: "", email: "" },
        });
      } else {
        setSubmitStatus("error");
        // If backend returns 401, guide the user to sign in
        if ((response as any)?.error?.toString?.().includes("401")) {
          setResponseData({
            message: "You must be signed in to submit a request. Please sign in and try again.",
          });
        }
      }
    } catch (error) {
      console.error("Data rights request failed:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("fields.")) {
      const fieldName = name.split(".")[1] as keyof typeof formData.fields;
      setFormData((prev) => ({
        ...prev,
        fields: {
          ...prev.fields,
          [fieldName]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Exercise Your Data Rights</h2>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Rights Under GDPR</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • <strong>Right of Access:</strong> Request a copy of your personal data
            </li>
            <li>
              • <strong>Right to Rectification:</strong> Request correction of inaccurate data
            </li>
            <li>
              • <strong>Right to Erasure:</strong> Request deletion of your personal data
            </li>
            <li>
              • <strong>Right to Restrict Processing:</strong> Request limitation of data processing
            </li>
            <li>
              • <strong>Right to Data Portability:</strong> Request transfer of your data
            </li>
            <li>
              • <strong>Right to Object:</strong> Object to processing based on legitimate interests
            </li>
            <li>
              • <strong>Right to Withdraw Consent:</strong> Withdraw consent for analytics
            </li>
          </ul>
        </div>

        {!isSignedIn && (
          <div className="mb-6 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
            <p className="mb-2 font-medium">Sign in required</p>
            <p className="text-sm">You need to be signed in to submit a data rights request.</p>
            <div className="mt-3">
              <SignInButton>
                <button
                  type="button"
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Sign in
                </button>
              </SignInButton>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" aria-disabled={!isSignedIn}>
          <div>
            <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 mb-2">
              Type of Request *
            </label>
            <select
              id="requestType"
              name="requestType"
              value={formData.requestType}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="access">Right of Access - Get a copy of my data</option>
              <option value="rectification">Right to Rectification - Correct my data</option>
              <option value="deletion">Right to Erasure - Delete my data</option>
              <option value="portability">Right to Data Portability - Transfer my data</option>
            </select>
          </div>

          {formData.requestType === "rectification" && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Fields to Update</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fields.firstName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="fields.firstName"
                    name="fields.firstName"
                    value={formData.fields.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new first name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="fields.lastName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="fields.lastName"
                    name="fields.lastName"
                    value={formData.fields.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new last name"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="fields.email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="fields.email"
                  name="fields.email"
                  value={formData.fields.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new email address"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description of Your Request *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Please describe your request in detail. For data access requests, specify what data you want to see. For deletion requests, specify what data you want deleted."
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">Important Information</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• We will respond to your request within 30 days</li>
              <li>• We may need to verify your identity before processing</li>
              <li>• Some requests may be subject to legal exceptions</li>
              <li>
                • For help, use the{" "}
                <a href="/data-rights" className="underline">
                  Data Rights Request form
                </a>
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isSignedIn}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>

        {submitStatus === "success" && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Request Processed Successfully
            </h3>
            <p className="text-green-700">
              {formData.requestType === "deletion" &&
                "Your account and all associated data have been permanently deleted. You will be logged out automatically."}
              {formData.requestType === "access" &&
                "Your data access request has been processed. You can view your data below."}
              {formData.requestType === "portability" &&
                "Your data has been exported in machine-readable format. You can download it below."}
              {formData.requestType === "rectification" &&
                "Your data has been updated successfully."}
            </p>
            {responseData && (
              <div className="mt-4">
                <details className="bg-white rounded border p-3">
                  <summary className="cursor-pointer font-medium text-green-800">
                    View Response Data
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-64 bg-gray-50 p-2 rounded">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}

        {submitStatus === "error" && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Submission Failed</h3>
            <p className="text-red-700">
              There was an error submitting your request. Please try again, or use the{" "}
              <a href="/data-rights" className="underline">
                Data Rights Request form
              </a>{" "}
              later.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <p className="text-sm text-gray-600">
            Use the{" "}
            <a href="/data-rights" className="underline">
              Data Rights Request form
            </a>{" "}
            or see our{" "}
            <a href="/privacy" className="underline">
              Privacy Policy
            </a>{" "}
            for details on how to exercise your rights.
          </p>
        </div>
      </div>
    </div>
  );
}
