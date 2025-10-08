"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

interface CTAButtonProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  afterAuthPath?: string;
  authMode?: "signin" | "signup"; // default signup for generic CTAs
}

export default function CTAButton({ 
  children, 
  className = "", 
  variant = "primary",
  size = "md",
  afterAuthPath,
  authMode = "signup",
}: CTAButtonProps) {
  const { isSignedIn } = useAuth();

  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200";
  
  const variantClasses = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700"
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  // Determine redirect URL based on auth state
  const targetPath = afterAuthPath || "/dashboard";
  const redirectUrl = isSignedIn
    ? targetPath
    : authMode === "signin"
      ? `/sign-in?redirect_url=${encodeURIComponent(targetPath)}`
      : `/sign-up?redirect_url=${encodeURIComponent(targetPath)}`;

  return (
    <Link href={redirectUrl} className={buttonClasses}>
      {children}
      <ArrowRight className="ml-2 h-5 w-5" />
    </Link>
  );
}
