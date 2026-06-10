import client from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY  = 'ta_app_version_cache_v1';
const CACHE_TTL  = 6 * 60 * 60 * 1000; // 6 hours in ms

export const appVersionService = {
  /**
   * Fetch active version config from backend.
   *
   * Strategy:
   *  1. Always try the network first.
   *  2. On success, cache the response with a timestamp.
   *  3. On network failure, return the cached response (if any) so the app
   *     can still launch in offline conditions.
   *  4. If cache is stale (> 6h) AND network fails, return null so the app
   *     allows entry rather than permanently blocking a user with old data.
   */
  async getVersionConfig() {
    try {
      const res  = await client.get('/api/app-version');
      const data = res.data;

      // Cache successful response
      if (data?.data) {
        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: data.data, cachedAt: Date.now() })
        );
      }

      return data?.data || null;
    } catch (err) {
      // Network error — try cache
      if (err?.isNetworkError || err?.isTimeout) {
        return appVersionService._getFromCache();
      }
      // Other errors (4xx, 5xx) — don't block the app
      return null;
    }
  },

  async _getFromCache() {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { data, cachedAt } = JSON.parse(raw);
      // Return stale cache only within TTL
      if (Date.now() - cachedAt < CACHE_TTL) return data;
      return null; // Cache expired — allow entry rather than blocking
    } catch {
      return null;
    }
  },
};
