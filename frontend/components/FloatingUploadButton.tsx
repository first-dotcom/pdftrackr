"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

export default function FloatingUploadButton() {
  return (
    <Link
      href="/dashboard/files/upload"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all duration-200 group"
    >
      <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
      <span className="sr-only">Upload PDF</span>
    </Link>
  );
}
