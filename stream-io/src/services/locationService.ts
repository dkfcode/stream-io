import { handleError, handleAsyncError } from './errorHandler';

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  dmaCode: string; // Designated Market Area code for TV markets
  timezone: string;
}

export interface TVMarket {
  dma: string;
  name: string;
  timezone: string;
  zipCodes: string[];
}

// US TV Markets (Designated Market Areas) - Top 50 markets
const TV_MARKETS: TVMarket[] = [
  { dma: "501", name: "New York, NY", timezone: "America/New_York", zipCodes: ["10001", "10002", "10003", "11201", "11215"] },
  { dma: "803", name: "Los Angeles, CA", timezone: "America/Los_Angeles", zipCodes: ["90210", "90028", "91601", "90401", "90210"] },
  { dma: "602", name: "Chicago, IL", timezone: "America/Chicago", zipCodes: ["60601", "60611", "60614", "60654", "60661"] },
  { dma: "504", name: "Philadelphia, PA", timezone: "America/New_York", zipCodes: ["19101", "19102", "19103", "19106", "19107"] },
  { dma: "623", name: "Dallas-Ft. Worth, TX", timezone: "America/Chicago", zipCodes: ["75201", "75202", "75203", "76102", "76103"] },
  { dma: "807", name: "San Francisco-Oakland-San Jose, CA", timezone: "America/Los_Angeles", zipCodes: ["94102", "94103", "94104", "94105", "95112"] },
  { dma: "511", name: "Washington, DC (Hagerstown, MD)", timezone: "America/New_York", zipCodes: ["20001", "20002", "20003", "20004", "20005"] },
  { dma: "539", name: "Tampa-St. Petersburg (Sarasota), FL", timezone: "America/New_York", zipCodes: ["33602", "33603", "33604", "33605", "33606"] },
  { dma: "505", name: "Boston, MA (Manchester, NH)", timezone: "America/New_York", zipCodes: ["02101", "02102", "02103", "02104", "02105"] },
  { dma: "506", name: "Detroit, MI", timezone: "America/Detroit", zipCodes: ["48201", "48202", "48226", "48234", "48235"] },
  // Add more markets as needed
];

class LocationService {
  private static instance: LocationService;
  private cachedLocation: LocationData | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Get user's current location using browser geolocation API
   */
  async getUserLocation(): Promise<LocationData> {
    // Return cached location if available
    if (this.cachedLocation) {
      return this.cachedLocation;
    }

    try {
      // First try to get precise location from browser
      const position = await this.getCurrentPosition();
      const location = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
      
      this.cachedLocation = location;
      return location;
    } catch (error) {
      handleError('Failed to get precise location, falling back to IP-based location', {
        context: { error: error instanceof Error ? error.message : String(error) }
      });
      
      // Fallback to IP-based location
      try {
        const location = await this.getLocationFromIP();
        this.cachedLocation = location;
        return location;
      } catch (ipError) {
        handleAsyncError(ipError as Error, {
          operation: 'getIPLocationFallback'
        });
        throw ipError;
      }
    }
  }

  /**
   * Get TV market information for a given DMA code
   */
  getTVMarket(dmaCode: string): TVMarket | null {
    return TV_MARKETS.find(market => market.dma === dmaCode) || null;
  }

  /**
   * Get all available TV markets
   */
  getAllTVMarkets(): TVMarket[] {
    return TV_MARKETS;
  }

  /**
   * Get channels available for a specific provider in a TV market
   */
  getAllChannelsForProvider(): any[] {
    // This would typically come from a TV listings API
    // For now, return mock data structure
    return [];
  }

  /**
   * Clear cached location (force refresh)
   */
  clearLocationCache(): void {
    this.cachedLocation = null;
  }

  /**
   * Private method to get current position from browser
   */
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000 // Cache for 10 minutes
        }
      );
    });
  }

  /**
   * Reverse geocode coordinates to get location details
   */
  private async reverseGeocode(lat: number, lng: number): Promise<LocationData> {
    try {
      // Use a free geocoding service
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const data = await response.json();

      // Find matching DMA code based on location
      const dmaCode = this.findDMACode(data.city, data.principalSubdivision);
      
      return {
        latitude: lat,
        longitude: lng,
        city: data.city || data.locality || 'Unknown',
        state: data.principalSubdivisionCode || data.principalSubdivision || 'Unknown',
        zipCode: data.postcode || '00000',
        country: data.countryCode || 'US',
        dmaCode: dmaCode,
        timezone: this.getTimezoneFromLocation(lat, lng)
      };
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'reverseGeocode',
        latitude: lat,
        longitude: lng
      });
      throw error;
    }
  }

  /**
   * Get location from IP address
   */
  private async getLocationFromIP(): Promise<LocationData> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      const dmaCode = this.findDMACode(data.city, data.region_code);

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        state: data.region_code,
        zipCode: data.postal,
        country: data.country_code,
        dmaCode: dmaCode,
        timezone: data.timezone
      };
    } catch (error) {
      handleAsyncError(error as Error, {
        operation: 'getIPLocation'
      });
      throw error;
    }
  }

  /**
   * Find DMA code based on city and state
   */
  private findDMACode(city: string, state: string): string {
    // Simple matching logic - in production, this would use a comprehensive mapping
    const cityLower = city?.toLowerCase() || '';
    const stateLower = state?.toLowerCase() || '';

    if (cityLower.includes('new york') || stateLower.includes('ny')) {
      return '501';
    } else if (cityLower.includes('los angeles') || (cityLower.includes('la') && stateLower.includes('ca'))) {
      return '803';
    } else if (cityLower.includes('chicago') || stateLower.includes('il')) {
      return '602';
    } else if (cityLower.includes('philadelphia') || (cityLower.includes('philly') && stateLower.includes('pa'))) {
      return '504';
    } else if (cityLower.includes('dallas') || cityLower.includes('fort worth') || (stateLower.includes('tx') && (cityLower.includes('dallas') || cityLower.includes('fort worth')))) {
      return '623';
    } else if (cityLower.includes('san francisco') || cityLower.includes('oakland') || cityLower.includes('san jose')) {
      return '807';
    } else if (cityLower.includes('washington') || cityLower.includes('dc')) {
      return '511';
    } else if (cityLower.includes('tampa') || cityLower.includes('st. petersburg') || cityLower.includes('sarasota')) {
      return '539';
    } else if (cityLower.includes('boston') || stateLower.includes('ma')) {
      return '505';
    } else if (cityLower.includes('detroit') || stateLower.includes('mi')) {
      return '506';
    }

    // Default to New York market if no match
    return '501';
  }

  /**
   * Get timezone from coordinates
   */
  private getTimezoneFromLocation(lat: number, lng: number): string {
    // Simple timezone detection based on longitude
    if (lng >= -68) return 'America/New_York';      // Eastern
    if (lng >= -87) return 'America/Chicago';       // Central  
    if (lng >= -104) return 'America/Denver';       // Mountain
    return 'America/Los_Angeles';                   // Pacific
  }
}

export const locationService = LocationService.getInstance();
export default locationService; 