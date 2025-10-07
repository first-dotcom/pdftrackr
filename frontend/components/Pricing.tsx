"use client";

import { getFileSizeLimitDisplay } from "@/shared/types";
import { Check } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import WaitlistModal from "./WaitlistModal";
import CTAButton from "./CTAButton";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Everything you need to get started",
    features: [
      "500MB storage space",
      "Up to 25 PDF files",
      "25 share links",
      `${getFileSizeLimitDisplay("free")} max file size`,
      "Password protection",
      "Email gating",
      "Link expiration",
      "Download control",
      "Virus scanning",
      "Full analytics (30 days)",
      "Page-by-page tracking",
      "Geography & device analytics",
    ],
    cta: "Get Started Free",
    href: "/sign-up",
    featured: true,
    available: true,
    badge: "START HERE",
    badgeColor: "bg-green-100 text-green-800",
  },
  {
    name: "Starter",
    price: "$4",
    description: "Perfect for individuals and small projects",
    features: [
      "Everything in Free, plus:",
      "2GB storage space",
      "Up to 100 PDF files",
      "100 share links",
      `${getFileSizeLimitDisplay("starter")} max file size`,
      "Email notifications",
    ],
    cta: "Join Waitlist",
    href: "#",
    featured: false,
    available: false,
    badge: "COMING SOON",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    name: "Pro",
    price: "$9",
    description: "For professionals who need more resources",
    features: [
      "Everything in Starter, plus:",
      "10GB storage space",
      "Up to 500 PDF files",
      "Unlimited share links",
      `${getFileSizeLimitDisplay("pro")} max file size`,
      "Bulk operations",
      "Export analytics",
    ],
    cta: "Join Waitlist",
    href: "#",
    featured: false,
    available: false,
    badge: "COMING Q4 2025",
    badgeColor: "bg-purple-100 text-purple-800",
  },
  {
    name: "Business",
    price: "$19",
    description: "For growing businesses and power users",
    features: [
      "Everything in Pro, plus:",
      "50GB storage space",
      "Unlimited PDF files",
      `${getFileSizeLimitDisplay("business")} max file size`,
      "Custom branding",
      "Priority support",
      "API access",
    ],
    cta: "Join Waitlist",
    href: "#",
    featured: false,
    available: false,
    badge: "COMING Q4 2025",
    badgeColor: "bg-orange-100 text-orange-800",
  },
];

export default function Pricing() {
  const { isSignedIn } = useAuth();

  return (
    <section id="pricing" className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Start Free, Upgrade When You Need More
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            No credit card required. Your first 500MB is completely free.
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-6xl lg:mx-auto xl:max-w-none xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 relative ${
                plan.featured ? "border-primary-200 shadow-lg ring-1 ring-primary-200" : ""
              } ${!plan.available ? "opacity-75" : ""}`}
            >
              <div
                className={`absolute top-4 right-4 ${plan.badgeColor} text-xs font-medium px-2 py-1 rounded-full`}
              >
                {plan.badge}
              </div>
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-sm text-gray-600">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-base font-medium text-gray-600">/month</span>
                </p>
                {plan.available ? (
                  plan.name === "Free" ? (
                    <div className="mt-8">
                      <CTAButton size="md" className="w-full">
                        {isSignedIn ? "Go to Dashboard" : plan.cta}
                      </CTAButton>
                    </div>
                  ) : (
                    <Link
                      href={plan.href}
                      className={`mt-8 block w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-center ${
                        plan.featured
                          ? "bg-primary-600 text-white hover:bg-primary-700"
                          : "bg-primary-50 text-primary-700 hover:bg-primary-100"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  )
                ) : (
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("waitlist-modal")?.classList.remove("hidden")
                      }
                      className="block w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-center bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors"
                      aria-label={`Join waitlist for ${plan.name} plan`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                )}
              </div>
              <div className="pt-6 pb-8 px-6">
                <h4 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                  What's included
                </h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>


        {/* Additional Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 mb-4">
            All plans include secure hosting, GDPR compliance, and automatic backups
          </p>
          <div className="bg-gray-50 rounded-lg p-6 max-w-4xl mx-auto">
            <h4 className="text-sm font-medium text-gray-900 mb-3">All Plans Include:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Full analytics
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Password protection
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Link expiration
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Email gating
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Download control
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Virus scanning
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                30-day analytics history
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Geography & device tracking
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Page-by-page analytics
              </div>
            </div>
          </div>
        </div>
      </div>
      <WaitlistModal />
    </section>
  );
}
