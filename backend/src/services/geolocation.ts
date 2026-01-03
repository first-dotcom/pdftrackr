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
    // Skip private/local IPs - return empty, not invalid codes
    if (this.isPrivateIP(ip)) {
      return {};
    }

    // Check cache first
    const cached = this.cache.get(ip);
    if (cached && this.isCacheValid(ip)) {
      return cached;
    }

    // Try each service until one works
    for (const service of this.FALLBACK_SERVICES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(service.url(ip), {
          signal: controller.signal,
          headers: { 'User-Agent': 'PDFTrackr-Analytics/1.0' },
        });

        clearTimeout(timeoutId);

        if (!response.ok) continue;

        const data = await response.json();
        if (data.status === 'fail' || data.error) continue;

        const location = service.parser(data);
        if (!location.countryCode && !location.city) continue;

        // Cache and return only valid data
        const result = {
          ...location,
          _cachedAt: Date.now(),
        } as LocationData & { _cachedAt: number };
        
        this.cache.set(ip, result);
        return location;

      } catch {
        continue;
      }
    }

    // All failed - return empty, cache nothing
    return {};
  }

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

  clearExpiredCache(): void {
    const now = Date.now();
    for (const [ip, data] of this.cache.entries()) {
      if ((data as any)._cachedAt && (now - (data as any)._cachedAt) > this.CACHE_TTL) {
        this.cache.delete(ip);
      }
    }
  }
}

export const geolocationService = new GeolocationService();

/**
 * Get validated location from IP - only returns valid 2-char country codes
 */
export async function getValidatedLocationFromIP(ip: string): Promise<{
  country: string | undefined;
  city: string | undefined;
}> {
  try {
    const location = await geolocationService.getLocationFromIP(ip);
    const country = location.countryCode && /^[A-Z]{2}$/.test(location.countryCode)
      ? location.countryCode
      : undefined;
    return { country, city: location.city };
  } catch {
    return { country: undefined, city: undefined };
  }
}

// Clean up expired cache entries every hour
setInterval(() => {
  geolocationService.clearExpiredCache();
}, 60 * 60 * 1000);