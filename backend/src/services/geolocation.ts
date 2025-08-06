import { logger } from '../utils/logger';

export interface LocationData {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  timezone?: string;
  isp?: string;
  lat?: number;
  lon?: number;
}

class GeolocationService {
  private cache = new Map<string, LocationData>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // 🌍 FREE GEOLOCATION SERVICES (No API key required for basic usage)
  private readonly FALLBACK_SERVICES = [
    {
      name: 'ipapi.co',
      url: (ip: string) => `https://ipapi.co/${ip}/json/`,
      parser: (data: any): LocationData => ({
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
        isp: data.org,
        lat: data.latitude,
        lon: data.longitude,
      }),
    },
    {
      name: 'ip-api.com',
      url: (ip: string) => `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,timezone,isp,lat,lon`,
      parser: (data: any): LocationData => ({
        country: data.country,
        countryCode: data.countryCode,
        region: data.regionName,
        city: data.city,
        timezone: data.timezone,
        isp: data.isp,
        lat: data.lat,
        lon: data.lon,
      }),
    },
  ];

  async getLocationFromIP(ip: string): Promise<LocationData> {
    // Skip private/local IPs
    if (this.isPrivateIP(ip)) {
      return { country: 'Local', countryCode: 'LOCAL', city: 'Development' };
    }

    // Check cache first
    const cached = this.cache.get(ip);
    if (cached && this.isCacheValid(ip)) {
      return cached;
    }

    // Try each service until one works
    for (const service of this.FALLBACK_SERVICES) {
      try {
        logger.debug(`Attempting geolocation via ${service.name} for IP: ${ip}`);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(service.url(ip), {
          signal: controller.signal,
          headers: {
            'User-Agent': 'PDFTrackr-Analytics/1.0',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Check for API-specific error formats
        if (data.status === 'fail' || data.error) {
          throw new Error(data.message || 'API error');
        }

        const location = service.parser(data);
        
        // Validate we got useful data
        if (!location.country && !location.city) {
          throw new Error('No useful location data');
        }

        // Cache the result
        this.cache.set(ip, {
          ...location,
          _cachedAt: Date.now(),
        } as LocationData & { _cachedAt: number });

        logger.debug(`Geolocation success via ${service.name}: ${location.city}, ${location.country}`);
        return location;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`Geolocation failed via ${service.name}:`, errorMessage);
        continue;
      }
    }

    // All services failed, return default
    const fallback: LocationData = {
      country: 'Unknown',
      countryCode: 'UNK',
      city: 'Unknown',
    };

    // Cache the fallback for a shorter time
    this.cache.set(ip, {
      ...fallback,
      _cachedAt: Date.now(),
    } as LocationData & { _cachedAt: number });

    logger.warn(`All geolocation services failed for IP: ${ip}`);
    return fallback;
  }

  // 🌍 ENHANCED ANALYTICS FUNCTIONS
  async enrichAuditLogWithLocation(ip: string, existingMetadata: any = {}): Promise<any> {
    try {
      const location = await this.getLocationFromIP(ip);
      
      return {
        ...existingMetadata,
        location: {
          country: location.country,
          countryCode: location.countryCode,
          region: location.region,
          city: location.city,
          timezone: location.timezone,
        },
        coordinates: location.lat && location.lon ? {
          lat: location.lat,
          lon: location.lon,
        } : undefined,
      };
    } catch (error) {
      logger.error('Failed to enrich with location:', error);
      return existingMetadata;
    }
  }

  // Get aggregated geographic analytics
  async getGeographicBreakdown(auditLogs: any[]): Promise<any> {
    const locationCounts: Record<string, { country: string; count: number; cities: Set<string> }> = {};
    
    for (const log of auditLogs) {
      const location = log.metadata?.location;
      if (!location?.country) continue;
      
      const countryCode = location.countryCode || 'UNK';
      
      if (!locationCounts[countryCode]) {
        locationCounts[countryCode] = {
          country: location.country,
          count: 0,
          cities: new Set(),
        };
      }
      
      locationCounts[countryCode].count++;
      if (location.city) {
        locationCounts[countryCode].cities.add(location.city);
      }
    }

    // Convert to sorted array
    return Object.entries(locationCounts)
      .map(([code, data]) => ({
        countryCode: code,
        country: data.country,
        views: data.count,
        cities: Array.from(data.cities),
        cityCount: data.cities.size,
      }))
      .sort((a, b) => b.views - a.views);
  }

  // 🔧 HELPER METHODS
  private isPrivateIP(ip: string): boolean {
    if (!ip || ip === '::1' || ip === '127.0.0.1') return true;
    
    // Remove IPv6 prefix if present
    const cleanIP = ip.replace(/^::ffff:/, '');
    
    // Check private IP ranges
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./, // Link-local
    ];
    
    return privateRanges.some(range => range.test(cleanIP));
  }

  private isCacheValid(ip: string): boolean {
    const cached = this.cache.get(ip) as any;
    if (!cached?._cachedAt) return false;
    
    return (Date.now() - cached._cachedAt) < this.CACHE_TTL;
  }

  // Clean up old cache entries
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [ip, data] of this.cache.entries()) {
      if ((data as any)._cachedAt && (now - (data as any)._cachedAt) > this.CACHE_TTL) {
        this.cache.delete(ip);
      }
    }
  }

  // Get cache stats
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

export const geolocationService = new GeolocationService();

// Clean up expired cache entries every hour
setInterval(() => {
  geolocationService.clearExpiredCache();
}, 60 * 60 * 1000);