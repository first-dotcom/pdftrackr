"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Logo from "./Logo";
import TrustBadges from "./TrustBadges";

export default function Footer() {
  const { isSignedIn } = useAuth();

  return (
    <footer className="bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href="/">
              <Logo size="lg" variant="white" />
            </Link>
            <p className="text-gray-400 text-base">
              Secure PDF sharing and analytics platform for freelancers and small teams.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Product
                </h3>
                <ul className="mt-4 space-y-4">
                  {!isSignedIn ? (
                    <>
                      <li>
                        <Link
                          href="/#features"
                          className="text-base text-gray-300 hover:text-white"
                        >
                          Features
                        </Link>
                      </li>
                      <li>
                        <Link href="/#pricing" className="text-base text-gray-300 hover:text-white">
                          Pricing
                        </Link>
                      </li>
                      <li>
                        <Link href="/demo" className="text-base text-gray-300 hover:text-white">
                          Demo
                        </Link>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link
                          href="/dashboard"
                          className="text-base text-gray-300 hover:text-white"
                        >
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/files"
                          className="text-base text-gray-300 hover:text-white"
                        >
                          My Files
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Legal
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/pdf-privacy-policy" className="text-base text-gray-300 hover:text-white">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookies" className="text-base text-gray-300 hover:text-white">
                      Cookie Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/pdf-sharing-terms" className="text-base text-gray-300 hover:text-white">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-base text-gray-400">© 2025 PDFTrackr. All rights reserved.</p>
            <TrustBadges variant="footer" />
          </div>
        </div>
      </div>
    </footer>
  );
}
