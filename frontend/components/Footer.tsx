import { FileText } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold text-white">PDFTrackr</span>
            </Link>
            <p className="text-gray-400 text-base">
              Secure PDF sharing and analytics platform for professionals and businesses.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Product
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="#features" className="text-base text-gray-300 hover:text-white">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#pricing" className="text-base text-gray-300 hover:text-white">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs" className="text-base text-gray-300 hover:text-white">
                      Documentation
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Support
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/help" className="text-base text-gray-300 hover:text-white">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-base text-gray-300 hover:text-white">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/status" className="text-base text-gray-300 hover:text-white">
                      Status
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Company
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/about" className="text-base text-gray-300 hover:text-white">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-base text-gray-300 hover:text-white">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="text-base text-gray-300 hover:text-white">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Legal
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/privacy" className="text-base text-gray-300 hover:text-white">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-base text-gray-300 hover:text-white">
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            © 2024 PDFTrackr. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
