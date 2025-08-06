"use client";

import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Zap, 
  TrendingUp, 
  Users,
  Award,
  Activity
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface UserProfile {
  email: string;
  documentsViewed: number;
  totalViews: number;
  avgEngagement: number;
  firstVisit: string;
  lastVisit: string;
  loyaltyScore: number;
  preferredReadingTimes: number[];
}

interface ReadingBehaviorProps {
  shareId?: string;
  userEmail?: string;
  showUserProfile?: boolean;
}

export default function ReadingBehaviorAnalytics({ 
  shareId, 
  userEmail, 
  showUserProfile = false 
}: ReadingBehaviorProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showUserProfile && userEmail) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [userEmail, showUserProfile]);

  const fetchUserProfile = async () => {
    if (!userEmail) return;

    try {
      setLoading(true);
      const response = await apiClient.analytics.getUserProfile(userEmail);

      if (response.success) {
        setUserProfile(response.data as UserProfile);
      } else {
        setError(typeof response.error === 'string' ? response.error : 'Failed to fetch user profile');
      }
    } catch (err) {
      setError('Failed to load reading behavior');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const getLoyaltyLevel = (score: number) => {
    if (score >= 80) return { level: 'VIP Reader', color: 'text-purple-600 bg-purple-50', icon: '👑' };
    if (score >= 60) return { level: 'Power User', color: 'text-blue-600 bg-blue-50', icon: '⚡' };
    if (score >= 40) return { level: 'Regular Reader', color: 'text-green-600 bg-green-50', icon: '📚' };
    if (score >= 20) return { level: 'Casual Reader', color: 'text-yellow-600 bg-yellow-50', icon: '👀' };
    return { level: 'New Reader', color: 'text-gray-600 bg-gray-50', icon: '🆕' };
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { level: 'Highly Engaged', color: 'text-green-600 bg-green-50' };
    if (score >= 60) return { level: 'Well Engaged', color: 'text-blue-600 bg-blue-50' };
    if (score >= 40) return { level: 'Moderately Engaged', color: 'text-yellow-600 bg-yellow-50' };
    return { level: 'Low Engagement', color: 'text-red-600 bg-red-50' };
  };

  if (!showUserProfile) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Reading Behavior Analytics</h3>
          <p className="mt-1 text-sm text-gray-500">
            Enable user email tracking to see detailed reading behavior insights.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No User Data</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error || 'User reading behavior data will appear after engagement.'}
          </p>
        </div>
      </div>
    );
  }

  const loyalty = getLoyaltyLevel(userProfile.loyaltyScore);
  const engagement = getEngagementLevel(userProfile.avgEngagement);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Reading Behavior Profile
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {userProfile.email}'s reading patterns and engagement insights
        </p>
      </div>

      {/* User Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Loyalty Score */}
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {userProfile.loyaltyScore}
                </p>
                <p className="text-sm text-gray-500">Loyalty Score</p>
              </div>
              <div className="text-2xl">{loyalty.icon}</div>
            </div>
            <div className={`mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${loyalty.color}`}>
              {loyalty.level}
            </div>
          </div>
        </div>

        {/* Engagement Score */}
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {userProfile.avgEngagement}
                </p>
                <p className="text-sm text-gray-500">Engagement</p>
              </div>
              <Zap className="h-6 w-6 text-yellow-500" />
            </div>
            <div className={`mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${engagement.color}`}>
              {engagement.level}
            </div>
          </div>
        </div>

        {/* Total Views */}
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {userProfile.totalViews}
                </p>
                <p className="text-sm text-gray-500">Total Views</p>
              </div>
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Documents Viewed */}
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {userProfile.documentsViewed}
                </p>
                <p className="text-sm text-gray-500">Documents</p>
              </div>
              <BookOpen className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Reading Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preferred Reading Times */}
        <div className="card">
          <div className="card-header">
            <h4 className="text-base font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Preferred Reading Times
            </h4>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {userProfile.preferredReadingTimes.map((hour, index) => (
                <div key={hour} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatTime(hour)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Peak time
                  </div>
                </div>
              ))}
            </div>
            
            {userProfile.preferredReadingTimes.length === 0 && (
              <p className="text-sm text-gray-500 italic text-center py-4">
                Not enough data to determine reading patterns yet
              </p>
            )}
          </div>
        </div>

        {/* Visit History */}
        <div className="card">
          <div className="card-header">
            <h4 className="text-base font-medium flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Visit History
            </h4>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">📅</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">First Visit</p>
                  <p className="text-sm text-gray-600">
                    {new Date(userProfile.firstVisit).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">🕐</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Latest Visit</p>
                  <p className="text-sm text-gray-600">
                    {new Date(userProfile.lastVisit).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">📊</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Reading Frequency</p>
                  <p className="text-sm text-gray-600">
                    {userProfile.totalViews > userProfile.documentsViewed 
                      ? `${Math.round(userProfile.totalViews / userProfile.documentsViewed)} views per document`
                      : 'Single view per document'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="card">
        <div className="card-header">
          <h4 className="text-base font-medium flex items-center">
            <Target className="mr-2 h-4 w-4" />
            Insights & Recommendations
          </h4>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {/* High Engagement Insight */}
            {userProfile.avgEngagement >= 70 && (
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Highly Engaged Reader
                  </p>
                  <p className="text-sm text-green-700">
                    This user shows exceptional engagement. Consider sending them priority updates 
                    or exclusive content to maintain their interest.
                  </p>
                </div>
              </div>
            )}

            {/* Return Visitor Insight */}
            {userProfile.totalViews > userProfile.documentsViewed && (
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Repeat Visitor
                  </p>
                  <p className="text-sm text-blue-700">
                    This user returns to view documents multiple times. They're likely a 
                    qualified lead - consider direct outreach.
                  </p>
                </div>
              </div>
            )}

            {/* Timing Recommendation */}
            {userProfile.preferredReadingTimes.length > 0 && (
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    Optimal Contact Time
                  </p>
                  <p className="text-sm text-purple-700">
                    Best time to reach this user is around{' '}
                    {formatTime(userProfile.preferredReadingTimes[0])} 
                    when they're most active reading documents.
                  </p>
                </div>
              </div>
            )}

            {/* Low Engagement Warning */}
            {userProfile.avgEngagement < 30 && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Low Engagement Detected
                  </p>
                  <p className="text-sm text-yellow-700">
                    This user shows limited engagement. Consider shortening your content 
                    or providing more compelling introductions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}