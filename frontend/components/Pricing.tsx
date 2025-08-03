'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import WaitlistModal from './WaitlistModal';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for personal use and testing',
    features: [
      '500 MB storage',
      '25 files maximum',
      '25 share links',
      '10 MB max file size',
      'Password protection',
      '30-day analytics retention',
      'Email support',
    ],
    cta: 'Get Started',
    href: '/sign-up',
    featured: false,
    available: true,
  },
  {
    name: 'Pro',
    price: '$19',
    description: 'Ideal for professionals and content creators',
    features: [
      '5 GB storage',
      '200 files maximum',
      'Unlimited share links',
      '50 MB max file size',
      'Custom branding',
      'Remove PDFTrackr branding',
      'Advanced analytics',
      '1-year analytics retention',
      'Priority support',
    ],
    cta: 'Coming Soon',
    href: '#waitlist',
    featured: true,
    available: false,
  },
  {
    name: 'Business',
    price: '$49',
    description: 'For teams and growing businesses',
    features: [
      '25 GB storage',
      'Unlimited files & links',
      '100 MB max file size',
      '5 team members',
      'Email verification required',
      'Screenshot protection',
      'Custom domain',
      'Webhooks & API access',
      '2-year analytics retention',
      '24h priority support',
    ],
    cta: 'Coming Soon',
    href: '#waitlist',
    featured: false,
    available: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Start with our free plan. Premium plans with advanced features launching soon!
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 relative ${
                plan.featured
                  ? 'border-primary-200 shadow-lg ring-1 ring-primary-200'
                  : ''
              } ${
                !plan.available ? 'opacity-75' : ''
              }`}
            >
              {!plan.available && (
                <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                  Coming Soon
                </div>
              )}
              <div className="p-6">
                {plan.featured && (
                  <p className="text-sm font-medium text-primary-600 mb-2">
                    Most Popular
                  </p>
                )}
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /month
                  </span>
                </p>
                {plan.available ? (
                  <Link
                    href={plan.href}
                    className={`mt-8 block w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-center ${
                      plan.featured
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <div className="mt-8">
                    <button
                      onClick={() => document.getElementById('waitlist-modal')?.classList.remove('hidden')}
                      className="block w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-center bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      {plan.cta} - Join Waitlist
                    </button>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Payment processing integration coming soon
                    </p>
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
      </div>
      <WaitlistModal />
    </section>
  );
}