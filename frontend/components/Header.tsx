"use client";

import { useAuth } from "@clerk/nextjs";
import { Menu, Upload, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";
import CTAButton from "./CTAButton";

export default function Header() {
  const { isSignedIn } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center px-3 rounded-md hover:bg-gray-50">
              <Logo size="md" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {!isSignedIn ? (
              // Unauthenticated user navigation
              <>
                <Link href="#features" className="text-gray-600 hover:text-gray-900">
                  Features
                </Link>
                <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                  Pricing
                </Link>
                <Link href="/demo" className="text-gray-600 hover:text-gray-900">
                  Demo
                </Link>
                <Link href="/sign-in" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>
                <CTAButton size="sm">
                  Get Started
                </CTAButton>
              </>
            ) : (
              // Authenticated user navigation
              <>
                <Link
                  href="/dashboard/files"
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </Link>
                <Link href="/dashboard/settings" className="text-gray-600 hover:text-gray-900">
                  Settings
                </Link>
                <CTAButton size="sm">
                  Dashboard
                </CTAButton>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              {!isSignedIn ? (
                // Unauthenticated user mobile navigation
                <>
                  <Link
                    href="#features"
                    className="text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    href="#pricing"
                    className="text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/demo"
                    className="text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Demo
                  </Link>
                  <Link
                    href="/sign-in"
                    className="text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <div onClick={() => setIsMenuOpen(false)}>
                    <CTAButton size="sm">
                      Get Started
                    </CTAButton>
                  </div>
                </>
              ) : (
                // Authenticated user mobile navigation
                <>
                  <Link
                    href="/dashboard/files"
                    className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="text-gray-600 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <div onClick={() => setIsMenuOpen(false)}>
                    <CTAButton size="sm">
                      Dashboard
                    </CTAButton>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
