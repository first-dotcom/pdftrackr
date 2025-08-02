import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PDFTrackr - Secure PDF Sharing & Analytics',
  description: 'Upload PDFs, generate secure smart links, and track viewer analytics with comprehensive insights.',
  keywords: 'pdf, sharing, analytics, tracking, secure, documents',
  author: 'PDFTrackr',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}