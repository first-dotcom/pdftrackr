"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import WaitlistModal from "./WaitlistModal";

const plans = [
  {
    name: "Free Forever",
    price: "$0",
    description: "Everything you need to get started",
    features: [
      "500MB storage space",
      "Up to 25 PDF files",
      "25 share links per file",
      "10MB max file size",
      "Password protection",
      "Email gating",
      "Full analytics for 30 days",
      "Watermarking",
      "Download control",
      "Virus scanning",
    ],
    cta: "Get Started Free",
    href: "/sign-up",
    featured: true,
    available: true,
    badge: "START HERE",
    badgeColor: "bg-green-100 text-green-800",
  },
  {
    name: "Pro",
    price: "$19",
    description: "For professionals who need more resources",
    features: [
      "Everything in Free, plus:",
      "5GB storage",
      "200 files",
      "Unlimited share links",
      "50MB max file size",
      "Priority support",
    ],
    cta: "Join Waitlist",
    href: "#waitlist",
    featured: false,
    available: false,
    badge: "Coming Q1 2025",
    badgeColor: "bg-gray-100 text-gray-800",
  },
  {
    name: "Business",
    price: "$49",
    description: "For teams and growing businesses",
    features: [
      "Everything in Pro, plus:",
      "25GB storage",
      "Unlimited files",
      "100MB max file size",
      "Team collaboration",
      "Custom branding",
      "API access",
    ],
    cta: "Join Waitlist",
    href: "#waitlist",
    featured: false,
    available: false,
    badge: "Coming Q1 2025",
    badgeColor: "bg-gray-100 text-gray-800",
  },
];

export default function Pricing() {
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

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 relative ${
                plan.featured ? "border-primary-200 shadow-lg ring-1 ring-primary-200" : ""
              } ${!plan.available ? "opacity-75" : ""}`}
            >
              <div className={`absolute top-4 right-4 ${plan.badgeColor} text-xs font-medium px-2 py-1 rounded-full`}>
                {plan.badge}
              </div>
              <div className="p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-base font-medium text-gray-500">/month</span>
                </p>
                {plan.available ? (
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
                ) : (
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("waitlist-modal")?.classList.remove("hidden")
                      }
                      className="block w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-center bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors"
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
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            All plans include secure hosting, GDPR compliance, and automatic backups
          </p>
        </div>
      </div>
      <WaitlistModal />
    </section>
  );
}
