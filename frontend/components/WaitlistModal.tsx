'use client';

import { useState } from 'react';
import { X, Mail, Bell } from 'lucide-react';

export default function WaitlistModal() {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('pro');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, plan }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          closeModal();
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to join waitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    document.getElementById('waitlist-modal')?.classList.add('hidden');
    setEmail('');
    setPlan('pro');
    setSubmitted(false);
  };

  return (
    <div
      id="waitlist-modal"
      className="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Join the Waitlist
          </h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <Bell className="h-5 w-5 text-primary-600 mr-2" />
                <p className="text-sm text-gray-600">
                  Be the first to know when premium plans launch!
                </p>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interested Plan
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="pro">Pro Plan ($9/month)</option>
                <option value="team">Team Plan ($29/month)</option>
                <option value="either">Either plan</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Join Waitlist'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <Mail className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              You're on the list!
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We'll email you as soon as premium plans are available.
            </p>
            <p className="text-xs text-gray-500">
              This window will close automatically...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}