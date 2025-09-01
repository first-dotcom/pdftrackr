import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import LearnMoreSection from "@/components/LearnMoreSection";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Cookie Policy</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> August 25, 2025
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. What Are Cookies?</h2>
            <p className="text-gray-600 mb-4">
              Cookies are small text files that are stored on your device when you visit our
              website. They help us provide you with a better experience by remembering your
              preferences and analyzing how you use our site.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Cookies</h2>
            <p className="text-gray-600 mb-4">We use cookies for the following purposes:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>
                <strong>Essential Cookies:</strong> Required for the website to function properly
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how visitors use our site
              </li>
              <li>
                <strong>Preference Cookies:</strong> Remember your settings and choices
              </li>
              <li>
                <strong>Security Cookies:</strong> Help protect against fraud and security threats
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              3. Types of Cookies We Use
            </h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3.1 Essential Cookies</h3>
            <p className="text-gray-600 mb-4">
              These cookies are necessary for the website to function and cannot be disabled. They
              do not store any personally identifiable information.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Cookie Name</th>
                    <th className="text-left py-2">Purpose</th>
                    <th className="text-left py-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">session_id</td>
                    <td className="py-2">Maintains your session while using the site</td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">csrf_token</td>
                    <td className="py-2">Protects against cross-site request forgery</td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="py-2">consent_status</td>
                    <td className="py-2">Remembers your cookie consent choice</td>
                    <td className="py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3.2 Analytics Cookies</h3>
            <p className="text-gray-600 mb-4">
              These cookies help us understand how visitors interact with our website. They are only
              set with your explicit consent.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Cookie Name</th>
                    <th className="text-left py-2">Purpose</th>
                    <th className="text-left py-2">Duration</th>
                    <th className="text-left py-2">Provider</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">_ga</td>
                    <td className="py-2">Distinguishes unique users</td>
                    <td className="py-2">2 years</td>
                    <td className="py-2">Google Analytics</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">_ga_*</td>
                    <td className="py-2">Stores session state</td>
                    <td className="py-2">2 years</td>
                    <td className="py-2">Google Analytics</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">_gid</td>
                    <td className="py-2">Distinguishes users for 24 hours</td>
                    <td className="py-2">24 hours</td>
                    <td className="py-2">Google Analytics</td>
                  </tr>
                  <tr>
                    <td className="py-2">_gat</td>
                    <td className="py-2">Throttles request rate</td>
                    <td className="py-2">1 minute</td>
                    <td className="py-2">Google Analytics</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              3.3 Preference Cookies
            </h3>
            <p className="text-gray-600 mb-4">
              These cookies remember your preferences and settings to provide a personalized
              experience.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Cookie Name</th>
                    <th className="text-left py-2">Purpose</th>
                    <th className="text-left py-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">theme_preference</td>
                    <td className="py-2">Remembers your theme choice (light/dark)</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">language_preference</td>
                    <td className="py-2">Remembers your language preference</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr>
                    <td className="py-2">analytics_consent</td>
                    <td className="py-2">Remembers your analytics consent choice</td>
                    <td className="py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              3.4 Third-Party Cookies
            </h3>
            <p className="text-gray-600 mb-4">
              Some cookies are set by third-party services we use:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Service</th>
                    <th className="text-left py-2">Purpose</th>
                    <th className="text-left py-2">Privacy Policy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">Website analytics and performance monitoring</td>
                    <td className="py-2">
                      <a
                        href="https://policies.google.com/privacy"
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Google Privacy Policy
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Clerk</td>
                    <td className="py-2">Authentication and user management</td>
                    <td className="py-2">
                      <a
                        href="https://clerk.com/privacy"
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Clerk Privacy Policy
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">DigitalOcean</td>
                    <td className="py-2">File storage and CDN services</td>
                    <td className="py-2">
                      <a
                        href="https://www.digitalocean.com/legal/privacy-policy"
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        DigitalOcean Privacy Policy
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              4. Managing Your Cookie Preferences
            </h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4.1 Browser Settings</h3>
            <p className="text-gray-600 mb-4">
              You can control cookies through your browser settings:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>
                <strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site
                data
              </li>
              <li>
                <strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data
              </li>
              <li>
                <strong>Safari:</strong> Preferences → Privacy → Manage Website Data
              </li>
              <li>
                <strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site
                data
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              4.2 Our Consent Banner
            </h3>
            <p className="text-gray-600 mb-4">
              When you first visit our site, you'll see a consent banner that allows you to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Accept all cookies (including analytics)</li>
              <li>Decline non-essential cookies (analytics only)</li>
              <li>Access detailed information about our cookie usage</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              4.3 Changing Your Consent
            </h3>
            <p className="text-gray-600 mb-4">
              You can change your cookie preferences at any time by:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Clearing your browser cookies and refreshing the page</li>
              <li>
                Submitting a request via our{" "}
                <a href="/data-rights" className="underline">
                  Data Rights form
                </a>
              </li>
              <li>Using the browser settings mentioned above</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              5. Impact of Disabling Cookies
            </h2>
            <p className="text-gray-600 mb-4">
              If you disable certain cookies, some features of our website may not work properly:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>
                <strong>Essential Cookies:</strong> The website may not function properly
              </li>
              <li>
                <strong>Analytics Cookies:</strong> We won't be able to improve our service based on
                usage data
              </li>
              <li>
                <strong>Preference Cookies:</strong> Your settings won't be remembered between
                visits
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              6. Cookie Consent and GDPR
            </h2>
            <p className="text-gray-600 mb-4">
              Under the General Data Protection Regulation (GDPR), we are required to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Obtain explicit consent before setting non-essential cookies</li>
              <li>Provide clear information about what cookies we use and why</li>
              <li>Allow users to withdraw consent at any time</li>
              <li>Make it as easy to withdraw consent as to give it</li>
            </ul>
            <p className="text-gray-600 mb-4">
              Our consent banner complies with these requirements by providing clear options and
              information.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              7. Updates to This Policy
            </h2>
            <p className="text-gray-600 mb-4">
              We may update this Cookie Policy from time to time to reflect changes in our practices
              or for legal reasons. We will notify you of any material changes by posting the
              updated policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Contact</h2>
            <p className="text-gray-600 mb-4">
              For cookie-related questions, please use our{" "}
              <a href="/data-rights" className="underline">
                Data Rights form
              </a>{" "}
              or see our{" "}
              <a href="/pdf-privacy-policy" className="underline">
                Privacy Policy
              </a>
              .
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Quick Cookie Management</h3>
              <p className="text-blue-800 mb-4">
                To quickly manage your cookie preferences on this site, you can:
              </p>
              <ul className="list-disc pl-6 text-blue-800">
                <li>
                  Clear your browser cookies and refresh the page to see the consent banner again
                </li>
                <li>Use your browser's incognito/private mode to test different cookie settings</li>
                <li>Contact us if you need help managing your preferences</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Guides Section */}
        <LearnMoreSection 
          title="Learn More About PDF Tracking"
          guides={[
            {
              href: "/pdf-privacy-policy",
              title: "PDF Privacy Policy",
              description: "Learn about our privacy practices and how we protect your data.",
              label: "Read Policy"
            },
            {
              href: "/pdf-sharing-terms",
              title: "PDF Sharing Terms",
              description: "Understand the terms and conditions for using our PDF sharing service.",
              label: "Read Terms"
            },
            {
              href: "/data-rights",
              title: "Data Rights",
              description: "Exercise your GDPR data rights and manage your personal information.",
              label: "Learn More"
            },
            {
              href: "/free-pdf-tracking",
              title: "Free PDF Tracking",
              description: "Start tracking PDFs for free with 500MB storage and no credit card required.",
              label: "Learn More"
            }
          ]}
        />
      </div>
    </div>
  );
}
