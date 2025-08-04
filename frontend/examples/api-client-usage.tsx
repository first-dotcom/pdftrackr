/**
 * Example component showing how to use the new API client
 * This prevents CSRF issues and provides a better developer experience
 */

"use client";

import { useState } from "react";
import { useApi, useApiState } from "../hooks/useApi";

// Example 1: Simple API usage
export function SimpleExample() {
  const api = useApi();
  const [result, setResult] = useState<any>(null);

  const handleCreateShareLink = async () => {
    // No need to manually handle CSRF tokens or auth headers!
    const response = await api.shareLinks.create({
      fileId: 1,
      title: "My Share Link",
      emailGatingEnabled: true,
      downloadEnabled: false,
      watermarkEnabled: true,
    });

    if (response.success) {
      setResult(response.data);
      console.log("Share link created:", response.data);
    } else {
      console.error("Failed to create share link:", response.error);
    }
  };

  const handleUploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", "My Document");

    // Automatic CSRF token handling for file uploads
    const response = await api.files.upload(formData);

    if (response.success) {
      console.log("File uploaded:", response.data);
    } else {
      console.error("Upload failed:", response.error);
    }
  };

  return (
    <div>
      <button onClick={handleCreateShareLink}>Create Share Link</button>
      <input type="file" onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0])} />
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

// Example 2: With loading states
export function WithLoadingStates() {
  const { data, loading, error, execute } = useApiState();

  const handleFetchFiles = () => {
    execute(() => api.files.list());
  };

  const handleDeleteFile = (fileId: number) => {
    execute(() => api.files.delete(fileId));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleFetchFiles}>Fetch Files</button>
      {data?.files?.map((file: any) => (
        <div key={file.id}>
          {file.title}
          <button onClick={() => handleDeleteFile(file.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

// Example 3: Custom API calls
export function CustomApiCalls() {
  const api = useApi();

  const handleCustomCall = async () => {
    // For endpoints not covered by the typed methods
    const response = await api.post("/api/custom-endpoint", {
      customData: "value",
    });

    if (response.success) {
      console.log("Custom call succeeded:", response.data);
    }
  };

  const handlePublicCall = async () => {
    // For public endpoints that don't need auth or CSRF
    const response = await api.get("/api/public-data", {
      skipAuth: true,
      skipCSRF: true,
    });

    if (response.success) {
      console.log("Public data:", response.data);
    }
  };

  return (
    <div>
      <button onClick={handleCustomCall}>Custom API Call</button>
      <button onClick={handlePublicCall}>Public API Call</button>
    </div>
  );
}

/**
 * Benefits of this approach:
 * 
 * ✅ Automatic CSRF token handling
 * ✅ Automatic authentication headers
 * ✅ Consistent error handling
 * ✅ TypeScript support
 * ✅ Loading state management (with useApiState)
 * ✅ No repetitive boilerplate
 * ✅ Easy to test and mock
 * ✅ Centralized configuration
 * 
 * Usage in your components:
 * 1. Import { useApi } from "../hooks/useApi"
 * 2. const api = useApi();
 * 3. Use api.files.*, api.shareLinks.*, etc.
 * 4. No more manual CSRF token generation!
 */