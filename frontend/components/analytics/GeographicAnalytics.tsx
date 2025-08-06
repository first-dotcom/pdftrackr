"use client";

import { useEffect, useState } from 'react';
import { Map, Globe, MapPin, Users } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface GeographicData {
  countryCode: string;
  country: string;
  views: number;
  cities: string[];
  cityCount: number;
}

interface GeographicAnalyticsProps {
  shareId: string;
  title?: string;
}

export default function GeographicAnalytics({ shareId, title }: GeographicAnalyticsProps) {
  const [geoData, setGeoData] = useState<GeographicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGeographicData();
  }, [shareId]);

  const fetchGeographicData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.analytics.getGeographicAnalytics(shareId);

      if (response.success) {
        setGeoData(response.data as GeographicData[]);
      } else {
        setError(typeof response.error === 'string' ? response.error : 'Failed to fetch geographic data');
      }
    } catch (err) {
      setError('Failed to load geographic analytics');
    } finally {
      setLoading(false);
    }
  };

  const totalViews = geoData.reduce((sum, item) => sum + item.views, 0);
  const topCountries = geoData.slice(0, 5);

  const getCountryFlag = (countryCode: string) => {
    if (countryCode === 'LOCAL') return '🏠';
    
    // Convert country code to flag emoji
    try {
      return countryCode
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
    } catch {
      return '🌍';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || geoData.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Geographic Data</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error || 'Geographic data will appear once people start viewing your document.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Globe className="mr-2 h-5 w-5" />
          Geographic Analytics
          {title && <span className="ml-2 text-gray-500">— {title}</span>}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Where your readers are located around the world
        </p>
      </div>

      {/* Global Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body p-4 text-center">
            <Globe className="mx-auto h-8 w-8 text-blue-600 mb-2" />
            <p className="text-2xl font-semibold text-gray-900">{geoData.length}</p>
            <p className="text-sm text-gray-500">Countries</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-4 text-center">
            <MapPin className="mx-auto h-8 w-8 text-green-600 mb-2" />
            <p className="text-2xl font-semibold text-gray-900">
              {geoData.reduce((sum, item) => sum + item.cityCount, 0)}
            </p>
            <p className="text-sm text-gray-500">Cities</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-4 text-center">
            <Users className="mx-auto h-8 w-8 text-purple-600 mb-2" />
            <p className="text-2xl font-semibold text-gray-900">{totalViews}</p>
            <p className="text-sm text-gray-500">Total Views</p>
          </div>
        </div>
      </div>

      {/* Top Countries */}
      <div className="card">
        <div className="card-header">
          <h4 className="text-base font-medium flex items-center">
            <Map className="mr-2 h-4 w-4" />
            Top Countries
          </h4>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {topCountries.map((country, index) => {
              const percentage = totalViews > 0 ? (country.views / totalViews) * 100 : 0;
              
              return (
                <div key={country.countryCode} className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mr-3">
                      <span className="text-lg">{getCountryFlag(country.countryCode)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {country.country}
                      </p>
                      <p className="text-xs text-gray-500">
                        {country.cityCount} {country.cityCount === 1 ? 'city' : 'cities'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center ml-4">
                    <div className="text-right mr-4">
                      <p className="text-sm font-medium text-gray-900">{country.views}</p>
                      <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                    </div>
                    
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {geoData.length > 5 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                And {geoData.length - 5} more {geoData.length - 5 === 1 ? 'country' : 'countries'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* City Breakdown for Top Country */}
      {topCountries.length > 0 && topCountries[0].cities.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h4 className="text-base font-medium flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              Top Cities in {topCountries[0].country}
            </h4>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {topCountries[0].cities.slice(0, 6).map((city, index) => (
                <div key={city} className="flex items-center p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {city}
                  </span>
                </div>
              ))}
            </div>
            
            {topCountries[0].cities.length > 6 && (
              <p className="text-sm text-gray-500 text-center mt-3">
                +{topCountries[0].cities.length - 6} more cities
              </p>
            )}
          </div>
        </div>
      )}

      {/* Market Insights */}
      <div className="card">
        <div className="card-header">
          <h4 className="text-base font-medium">🎯 Market Insights</h4>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {geoData.length > 1 && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">📈</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Global Reach
                  </p>
                  <p className="text-sm text-gray-600">
                    Your document is being read in {geoData.length} countries. 
                    Consider localizing content for top markets.
                  </p>
                </div>
              </div>
            )}

            {topCountries.length > 0 && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">🏆</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Primary Market: {topCountries[0].country}
                  </p>
                  <p className="text-sm text-gray-600">
                    {((topCountries[0].views / totalViews) * 100).toFixed(1)}% of your readers 
                    are from {topCountries[0].country}. Focus marketing efforts here.
                  </p>
                </div>
              </div>
            )}

            {geoData.length >= 3 && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">🌟</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Growth Opportunity
                  </p>
                  <p className="text-sm text-gray-600">
                    Strong engagement from {geoData[1].country} and {geoData[2].country}. 
                    Consider expanding your reach in these regions.
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