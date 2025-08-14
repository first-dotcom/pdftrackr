import { Upload, Link, BarChart, Shield } from "lucide-react";
import { getFileSizeLimitDisplay } from "@/shared/types";

const steps = [
  {
    number: "1",
    title: "Upload Your PDF",
    description: `Drag and drop or select your PDF file (up to ${getFileSizeLimitDisplay("free")}). We'll scan it for security.`,
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
    description: "Send your secure link and watch real-time analytics roll in.",
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
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-x-8 md:gap-y-10">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-600 text-white">
                      <step.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-4xl font-bold text-gray-200">{step.number}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-base text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full">
                    <div className="w-full border-t-2 border-dashed border-gray-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
