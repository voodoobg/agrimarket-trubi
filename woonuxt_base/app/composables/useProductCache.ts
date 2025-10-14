/**
 * Composable for caching products with localStorage fallback
 * This provides instant loading from cache while fetching fresh data in the background
 */
export function useProductCache() {
  const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
  const CACHE_VERSION = 'v1';

  /**
   * Get cached data from localStorage
   */
  function getCachedData<T>(key: string): T | null {
    if (import.meta.server) return null;

    try {
      const cached = localStorage.getItem(`${CACHE_VERSION}:${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;

      if (isExpired) {
        localStorage.removeItem(`${CACHE_VERSION}:${key}`);
        return null;
      }

      return data as T;
    } catch (error) {
      console.warn('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Save data to localStorage cache
   */
  function setCachedData<T>(key: string, data: T): void {
    if (import.meta.server) return;

    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`${CACHE_VERSION}:${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Error writing to cache:', error);
    }
  }

  /**
   * Clear all cached products
   */
  function clearProductCache(): void {
    if (import.meta.server) return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(`${CACHE_VERSION}:`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  return {
    getCachedData,
    setCachedData,
    clearProductCache,
  };
}

