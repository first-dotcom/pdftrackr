import React from 'react';
import { Metadata } from 'next';
import SharePageClient from './SharePageClient';

interface SharePageProps {
  params: { shareId: string };
}

// Fetch share data for metadata generation
async function fetchShareData(shareId: string) {
  try {
    const apiUrl = 'http://backend:3001';
    const response = await fetch(`${apiUrl}/api/share/${shareId}`, {
      cache: 'no-store', // Always fetch fresh data for SEO
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
  } catch (error) {
    console.error('Failed to fetch share data for metadata:', error);
  }
  return null;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const shareData = await fetchShareData(params.shareId);
  
  if (!shareData?.shareLink) {
    return {
      title: 'Shared Document - PDFTrackr',
      description: 'View a shared PDF document on PDFTrackr',
      robots: 'noindex, nofollow',
    };
  }

  const { shareLink } = shareData;
  const title = shareLink.title || shareLink.file.title || 'Shared Document';
  const description = shareLink.description || `View ${shareLink.file.title || 'document'} shared via PDFTrackr`;
  
  return {
    title: `${title} - PDFTrackr`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://pdftrackr.com/view/${params.shareId}`,
      images: [
        {
          url: 'https://pdftrackr.com/og-image.jpg',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://pdftrackr.com/og-image.jpg'],
    },
    alternates: {
      canonical: `https://pdftrackr.com/view/${params.shareId}`,
    },
    robots: 'index, follow',
  };
}

export default function SharePage({ params }: SharePageProps) {
  return <SharePageClient shareId={params.shareId} />;
}