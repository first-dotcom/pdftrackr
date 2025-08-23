// Example usage of analytics tracking functions
// This file demonstrates how to use the GDPR-compliant analytics system

import { trackEvent, trackPageView } from '@/hooks/useAnalyticsConsent';
import { useEffect } from 'react';

// Example: Track a button click
export function ExampleButton() {
  const handleClick = () => {
    // This will only track if user has given consent
    trackEvent('button_click', {
      'event_category': 'engagement',
      'event_label': 'example_button',
      'value': 1
    });
  };

  return (
    <button onClick={handleClick}>
      Click me (tracked if consent given)
    </button>
  );
}

// Example: Track form submission
export function ExampleForm() {
  const handleSubmit = (formData: any) => {
    // Track form submission
    trackEvent('form_submit', {
      'event_category': 'form',
      'event_label': 'contact_form',
      'form_name': 'contact'
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}

// Example: Track file upload
export function ExampleFileUpload() {
  const handleFileUpload = (file: File) => {
    trackEvent('file_upload', {
      'event_category': 'file',
      'event_label': 'pdf_upload',
      'file_size': file.size,
      'file_type': file.type
    });
  };

  return (
    <input 
      type="file" 
      accept=".pdf"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
      }}
    />
  );
}

// Example: Track page view manually (if needed)
export function ExamplePageTracker() {
  useEffect(() => {
    // This is already handled by AnalyticsPageTracker component
    // But you can use this for custom page tracking if needed
    trackPageView('/custom-page');
  }, []);

  return <div>Custom page content</div>;
}

// Example: Track user engagement
export function ExampleEngagementTracker() {
  const trackEngagement = (action: string) => {
    trackEvent('user_engagement', {
      'event_category': 'engagement',
      'event_label': action,
      'engagement_time_msec': 1000 // Example engagement time
    });
  };

  return (
    <div>
      <button onClick={() => trackEngagement('video_play')}>
        Play Video
      </button>
      <button onClick={() => trackEngagement('download_click')}>
        Download
      </button>
    </div>
  );
}
