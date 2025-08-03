import { SignIn } from '@clerk/nextjs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - PDFTrackr',
  description: 'Sign in to your PDFTrackr account to manage your PDF sharing and analytics.',
  robots: 'noindex, nofollow',
  alternates: {
    canonical: 'https://pdftrackr.com/sign-in',
  },
};

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back to PDFTrackr
          </p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg"
            }
          }}
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}