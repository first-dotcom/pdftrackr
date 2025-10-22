"use client";

import { formatFileSize } from "@/utils/formatters";
import { Eye, FileText, RefreshCw, Share, Share2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import React, { useCallback, useRef, useState } from "react";
import type { File } from "@/shared/types";

export interface FileCardProps {
  file: File;
  onShare: (file: File) => void;
  onDelete: (fileId: number) => void;
  onView: (fileId: number) => void;
  isDeleting?: boolean;
  isSharing?: boolean;
  hideActions?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onShare,
  onDelete,
  onView,
  isDeleting = false,
  isSharing = false,
  hideActions = false,
}) => {
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const getActiveShareLinks = useCallback((shareLinks: Array<{ isActive: boolean }> = []) => {
    return shareLinks.filter((link) => link.isActive).length;
  }, []);

  const formatDate = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Invalid date";
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className="group relative card-elevated p-4 sm:p-6 transition-all duration-200 focus-ring"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      tabIndex={0}
      role="article"
      aria-label={`File: ${file.title || "Untitled Document"}`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
            <FileText className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onView(file.id)}
                className="text-left w-full"
                onKeyDown={(e) => handleKeyDown(e, () => onView(file.id))}
                disabled={isDeleting || isSharing}
              >
                <h3 className="text-base font-medium text-gray-900 truncate hover:text-primary-600 transition-colors focus:outline-none focus:text-primary-600">
                  {file.title || "Untitled Document"}
                </h3>
              </button>

              <div className="mt-2 sm:hidden space-y-1">
                <div className="text-sm text-gray-600 font-medium">{formatFileSize(file.size)}</div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                    {file.viewCount || 0} views
                  </span>
                  <span className="flex items-center">
                    <Share2 className="h-4 w-4 mr-1" aria-hidden="true" />
                    {getActiveShareLinks(file.shareLinks)} share links
                  </span>
                </div>
                <div className="text-sm text-gray-500">{formatDate(file.createdAt)}</div>
              </div>

              <div className="hidden sm:flex sm:items-center sm:space-x-6 sm:mt-2 text-sm text-gray-500">
                <span className="font-medium">{formatFileSize(file.size)}</span>
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                  {file.viewCount || 0} views
                </span>
                <span className="flex items-center">
                  <Share2 className="h-4 w-4 mr-1" aria-hidden="true" />
                  {getActiveShareLinks(file.shareLinks)} share links
                </span>
                <span>{formatDate(file.createdAt)}</span>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 sm:ml-4">
              <div className="sm:hidden flex space-x-2">
                {!hideActions && (
                  <>
                <button
                  type="button"
                  onClick={() => onShare(file)}
                  disabled={isSharing || isDeleting}
                  className="btn-icon-lg text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Create share link"
                  onKeyDown={(e) => handleKeyDown(e, () => onShare(file))}
                >
                  {isSharing ? (
                    <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Share className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(file.id)}
                  disabled={isDeleting || isSharing}
                  className="btn-icon-lg text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors focus-ring-red disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Delete file"
                  onKeyDown={(e) => handleKeyDown(e, () => onDelete(file.id))}
                >
                  {isDeleting ? (
                    <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
                  </>
                )}
              </div>

              <div className="hidden sm:block">
                {!hideActions && (
                  <div className={`flex space-x-2 transition-opacity duration-200 ${showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    <button
                      type="button"
                      onClick={() => onShare(file)}
                      disabled={isSharing || isDeleting}
                      className="btn-icon-md text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Create share link"
                      onKeyDown={(e) => handleKeyDown(e, () => onShare(file))}
                    >
                      {isSharing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Share className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(file.id)}
                      disabled={isDeleting || isSharing}
                      className="btn-icon-md text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors focus-ring-red disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Delete file"
                      onKeyDown={(e) => handleKeyDown(e, () => onDelete(file.id))}
                    >
                      {isDeleting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


