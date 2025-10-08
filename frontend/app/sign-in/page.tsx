import Logo from "@/components/Logo";
import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - PDFTrackr",
  description: "Sign in to your PDFTrackr account to manage your PDF tracking and analytics for freelancers and small teams.",
  robots: "noindex, nofollow",
  alternates: {
    canonical: "https://pdftrackr.com/sign-in",
  },
};

export default function Page({ searchParams }: { searchParams: { redirect_url?: string } }) {
  const target = searchParams?.redirect_url || "/dashboard";
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6">
            <Logo size="xl" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">PDFTrackr</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">
            Sign in to your account
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Welcome back! Access your PDF sharing and analytics dashboard.
          </p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border border-gray-200 bg-white/80 backdrop-blur-sm",
              headerTitle: "text-2xl font-bold text-gray-900",
              headerSubtitle: "text-gray-600 text-sm",
              formButtonPrimary:
                "bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md",
              formButtonSecondary:
                "bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200",
              footerActionLink:
                "text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200",
              formFieldInput:
                "border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200",
              formFieldLabel: "text-sm font-medium text-gray-700 mb-2",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-500 text-sm font-medium",
              socialButtonsBlockButton:
                "border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors duration-200",
              socialButtonsBlockButtonText: "text-gray-700 font-medium",
              formFieldLabelRow: "mb-2",
              formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-700",
              formResendCodeLink: "text-primary-600 hover:text-primary-700 font-medium",
              formHeaderTitle: "text-2xl font-bold text-gray-900",
              formHeaderSubtitle: "text-gray-600 text-sm",
              footer: "text-center",
              footerAction: "text-primary-600 hover:text-primary-700 font-medium",
              identityPreviewText: "text-gray-700",
              identityPreviewEditButton: "text-primary-600 hover:text-primary-700",
              formFieldAction: "text-primary-600 hover:text-primary-700 font-medium text-sm",
              alert: "rounded-lg p-4 mb-4",
              alertText: "text-sm",
              alertIcon: "w-5 h-5",
            },
            variables: {
              colorPrimary: "#3B82F6",
              colorBackground: "#FFFFFF",
              colorText: "#1F2937",
              colorTextSecondary: "#6B7280",
              colorTextOnPrimaryBackground: "#FFFFFF",
              colorInputBackground: "#FFFFFF",
              colorInputText: "#1F2937",
              colorSuccess: "#10B981",
              colorDanger: "#EF4444",
              colorWarning: "#F59E0B",
            },
          }}
          redirectUrl={target}
          afterSignInUrl={target}
        />
      </div>
    </div>
  );
}
