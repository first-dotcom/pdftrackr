import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import UseCases from "@/components/UseCases";
import CTAButton from "@/components/CTAButton";
import LearnMoreSection from "@/components/LearnMoreSection";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await currentUser();
  const isSignedIn = !!user;

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero isSignedIn={isSignedIn} />
        <HowItWorks />
        <Features />
        <UseCases />
        <Pricing />

        {/* Learn More Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <LearnMoreSection 
              title="Learn More About PDF Tracking"
              guides={[
                {
                  href: "/document-tracking-system",
                  title: "Document Tracking System",
                  description: "Learn about our comprehensive document tracking system for freelancers and small teams.",
                  label: "Learn More"
                },
                {
                  href: "/track-documents-online",
                  title: "Track Documents Online",
                  description: "Discover how to track documents online with our cloud-based platform.",
                  label: "Learn More"
                },
                {
                  href: "/how-to-track-pdf-views",
                  title: "How to Track PDF Views",
                  description: "Complete step-by-step guide to PDF tracking setup and implementation.",
                  label: "Read Guide"
                },
                {
                  href: "/free-pdf-tracking",
                  title: "Free PDF Tracking",
                  description: "Start tracking PDFs for free with 500MB storage and no credit card required.",
                  label: "Learn More"
                }
              ]}
            />
          </div>
        </section>

        {/* SEO-friendly CTA for authenticated users */}
        {isSignedIn && (
          <div className="bg-primary-50 py-12 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome back! Ready to manage your PDFs?
              </h2>
              <div className="flex flex-col items-center">
                <CTAButton size="lg">
                  Go to Dashboard
                </CTAButton>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
