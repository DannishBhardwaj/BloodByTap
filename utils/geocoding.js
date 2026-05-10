const axios = require('axios');

const NOMINATIM_BASE_URL = process.env.GEOCODING_BASE_URL || 'https://nominatim.openstreetmap.org';
const NOMINATIM_USER_AGENT = process.env.GEOCODING_USER_AGENT || 'BloodByTap/1.0 (contact: admin@bloodbytap.local)';
const NOMINATIM_CONTACT_EMAIL = process.env.GEOCODING_CONTACT_EMAIL || '';
const GEOCODING_MIN_INTERVAL_MS = Number(process.env.GEOCODING_MIN_INTERVAL_MS || 1100);
const GEOCODING_MAX_RETRIES = Number(process.env.GEOCODING_MAX_RETRIES || 2);
const GEOCODING_CACHE_TTL_MS = Number(process.env.GEOCODING_CACHE_TTL_MS || 24 * 60 * 60 * 1000);
const GEOCODING_CACHE_MAX_SIZE = Number(process.env.GEOCODING_CACHE_MAX_SIZE || 1000);
const GEOCODING_TIMEOUT_MS = Number(process.env.GEOCODING_TIMEOUT_MS || 10000);

const nominatimClient = axios.create({
  baseURL: NOMINATIM_BASE_URL,
  headers: {
    'User-Agent': NOMINATIM_USER_AGENT,
    Accept: 'application/json'
  },
  timeout: GEOCODING_TIMEOUT_MS
});

let nextAllowedRequestAt = 0;
const geocodingCache = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cacheGet = (key) => {
  const hit = geocodingCache.get(key);
  if (!hit) {
    return null;
  }

  if (Date.now() > hit.expiresAt) {
    geocodingCache.delete(key);
    return null;
  }

  return hit.value;
};

const cacheSet = (key, value) => {
  if (geocodingCache.size >= GEOCODING_CACHE_MAX_SIZE) {
    const oldestKey = geocodingCache.keys().next().value;
    if (oldestKey) {
      geocodingCache.delete(oldestKey);
    }
  }

  geocodingCache.set(key, {
    value,
    expiresAt: Date.now() + GEOCODING_CACHE_TTL_MS
  });
};

const waitForRateWindow = async () => {
  const now = Date.now();
  const waitMs = Math.max(0, nextAllowedRequestAt - now);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  nextAllowedRequestAt = Date.now() + GEOCODING_MIN_INTERVAL_MS;
};

const getRetryDelayMs = (error, attemptIndex) => {
  const retryAfterHeader = error.response?.headers?.['retry-after'];
  if (retryAfterHeader) {
    const parsed = Number(retryAfterHeader);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed * 1000;
    }
  }

  return Math.min(5000, 500 * (2 ** attemptIndex));
};

const requestWithRetry = async (path, params) => {
  let attempt = 0;

  while (attempt <= GEOCODING_MAX_RETRIES) {
    try {
      await waitForRateWindow();
      return await nominatimClient.get(path, { params });
    } catch (error) {
      const status = error.response?.status;
      const retriable = status === 429 || (status >= 500 && status < 600);

      if (!retriable || attempt >= GEOCODING_MAX_RETRIES) {
        throw error;
      }

      const delay = getRetryDelayMs(error, attempt);
      await sleep(delay);
      attempt += 1;
    }
  }

  throw new Error('Geocoding request failed after retries');
};

/**
 * Geocode an address to coordinates using OpenStreetMap Nominatim
 * @param {String} address - Full address string
 * @returns {Promise<Object>} {latitude, longitude} or null
 */
const geocodeAddress = async (address) => {
  try {
    if (!address || typeof address !== 'string') {
      return null;
    }

    const normalizedAddress = address.trim();
    if (!normalizedAddress) {
      return null;
    }

    const cacheKey = `fwd:${normalizedAddress.toLowerCase()}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const params = {
      q: normalizedAddress,
      format: 'jsonv2',
      limit: 1,
      addressdetails: 1
    };

    if (NOMINATIM_CONTACT_EMAIL) {
      params.email = NOMINATIM_CONTACT_EMAIL;
    }

    const response = await requestWithRetry('/search', params);

    if (Array.isArray(response.data) && response.data.length > 0) {
      const location = response.data[0];
      const parsed = {
        latitude: Number(location.lat),
        longitude: Number(location.lon)
      };

      if (Number.isFinite(parsed.latitude) && Number.isFinite(parsed.longitude)) {
        cacheSet(cacheKey, parsed);
        return parsed;
      }
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
};

/**
 * Reverse geocode coordinates to address
 * @param {Number} latitude
 * @param {Number} longitude
 * @returns {Promise<String>} Formatted address or null
 */
const reverseGeocode = async (latitude, longitude) => {
  try {
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

    const cacheKey = `rev:${lat.toFixed(6)},${lon.toFixed(6)}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const params = {
      lat,
      lon,
      format: 'jsonv2'
    };

    if (NOMINATIM_CONTACT_EMAIL) {
      params.email = NOMINATIM_CONTACT_EMAIL;
    }

    const response = await requestWithRetry('/reverse', params);

    if (response.data && response.data.display_name) {
      const result = response.data.display_name;
      cacheSet(cacheKey, result);
      return result;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return null;
  }
};

module.exports = {
  geocodeAddress,
  reverseGeocode
};
