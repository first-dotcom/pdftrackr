import { getFileSizeLimitDisplay } from "@/shared/types";
import { BarChart, Link, Shield, Upload } from "lucide-react";

const steps = [
  {
    number: "1",
    title: "Upload Your PDF",
    description: `Drag and drop or select your PDF file (up to ${getFileSizeLimitDisplay(
      "free",
    )}). We'll scan it for security.`,
    icon: Upload,
  },
  {
    number: "2",
    title: "Create Secure Link",
    description: "Set passwords, expiration dates, and choose who can download.",
    icon: Link,
  },
  {
    number: "3",
    title: "Share & Track",
    description: "Send your secure link and watch live analytics roll in.",
    icon: BarChart,
  },
  {
    number: "4",
    title: "Get Insights",
    description: "See who viewed your document, which pages they read, and for how long.",
    icon: Shield,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
            How It Works
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Share PDFs in 4 Simple Steps
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            From upload to insights in minutes. No technical knowledge required.
          </p>
        </div>

        <div className="mt-10">
          <div className="relative">
            {/* Desktop connecting lines */}
            <div className="hidden lg:flex absolute top-6 left-0 w-full justify-between items-center px-6 pointer-events-none">
              {[1, 2, 3].map((_, index) => (
                <div 
                  key={index} 
                  className="flex-1 border-t-2 border-dashed border-gray-300"
                  style={{ 
                    marginLeft: index === 0 ? '12.5%' : '0',
                    marginRight: index === 2 ? '12.5%' : '0'
                  }}
                />
              ))}
            </div>
            
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-x-8 md:gap-y-10">
              {steps.map((step, index) => (
                <div key={step.title} className="relative">
                  <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start lg:flex-col lg:text-center lg:items-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-600 text-white mb-4 md:mb-0 md:mr-4 lg:mb-4 lg:mr-0 relative z-10">
                      <step.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-center md:justify-start lg:justify-center space-x-2 mb-2">
                        <span className="text-2xl font-bold text-primary-600">{step.number}</span>
                      </div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-base text-gray-500">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
