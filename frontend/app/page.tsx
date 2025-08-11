import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import UseCases from "@/components/UseCases";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await currentUser();

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <UseCases />
        <Pricing />
        
        {/* SEO-friendly CTA for authenticated users */}
        {user && (
          <div className="bg-primary-50 py-12 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome back! Ready to manage your PDFs?
              </h2>
              <a 
                href="/dashboard" 
                className="btn-primary btn-lg"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
