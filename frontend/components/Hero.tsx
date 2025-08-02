import Link from 'next/link';
import { ArrowRight, Shield, BarChart3, Share2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Secure PDF</span>
                <span className="block text-primary-600">Sharing & Analytics</span>
              </h1>
              
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Upload PDFs, generate secure smart links, and track who views them with comprehensive analytics. 
                Perfect for job seekers, consultants, and businesses.
              </p>
              
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    href="/sign-up"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
                
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link
                    href="#features"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <div className="h-56 w-full bg-gradient-to-br from-primary-50 to-primary-100 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
          <div className="grid grid-cols-2 gap-4 p-8">
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary-600" />
              <span className="text-sm font-medium">Secure Links</span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary-600" />
              <span className="text-sm font-medium">Analytics</span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-2">
              <Share2 className="h-6 w-6 text-primary-600" />
              <span className="text-sm font-medium">Easy Sharing</span>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-2">
              <div className="h-6 w-6 bg-primary-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">PDF</span>
              </div>
              <span className="text-sm font-medium">Any Document</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}