'use client';

import { useEffect, useState } from 'react';
import { FileText, Eye, Users, Mail } from 'lucide-react';
import { config } from '@/lib/config';

interface DashboardStatsData {
  totalFiles: number;
  totalViews: number;
  totalUniqueViews: number;
  totalEmailCaptures: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData>({
    totalFiles: 0,
    totalViews: 0,
    totalUniqueViews: 0,
    totalEmailCaptures: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${config.api.url}/api/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clerk-token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Files',
      value: stats.totalFiles,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Views',
      value: stats.totalViews,
      icon: Eye,
      color: 'bg-green-500',
    },
    {
      name: 'Unique Viewers',
      value: stats.totalUniqueViews,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'Email Captures',
      value: stats.totalEmailCaptures,
      icon: Mail,
      color: 'bg-orange-500',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="card-body">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div key={stat.name} className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.color} p-2 rounded-md`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}