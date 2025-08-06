"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

export default function FloatingUploadButton() {
  return (
    <Link
      href="/dashboard/files/upload"
      className="fixed bottom-6 right-4 z-50 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 group touch-manipulation focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none sm:bottom-8 sm:right-6"
      aria-label="Upload new PDF file"
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">Upload PDF</span>
    </Link>
  );
}
