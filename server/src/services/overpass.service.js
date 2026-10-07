const { haversine } = require('../utils/haversine');

/**
 * Overpass Service
 * Queries OpenStreetMap data via public Overpass API endpoints,
 * normalizes place records, handles rate limiting, timeouts, and caching.
 */

const DEFAULT_ENDPOINTS = [
  process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

// In-memory cache: key -> { timestamp, data }
const cache = new Map();
const inFlightRequests = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

/**
 * Generate cache key based on rounded coordinates (~1km grid) and radius
 */
function getCacheKey(lat, lon, radiusKm) {
  const roundLat = Math.round(Number(lat) * 100) / 100;
  const roundLon = Math.round(Number(lon) * 100) / 100;
  return `restaurants:${roundLat}:${roundLon}:${radiusKm}`;
}

/**
 * Build Overpass QL query string
 */
function buildOverpassQuery(lat, lon, radiusMeters) {
  return `[out:json][timeout:10];
(
  node["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
);
out body 100;`;
}

/**
 * Parse and normalize OpenStreetMap cuisine tag
 */
function normalizeCuisine(rawCuisine) {
  if (!rawCuisine || typeof rawCuisine !== 'string') {
    return 'Cuisine not specified';
  }

  const parts = rawCuisine
    .split(/[;,]/)
    .map((s) => s.trim().replace(/_/g, ' '))
    .filter((s) => s.length > 0)
    .map((s) =>
      s
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    );

  if (parts.length === 0) {
    return 'Cuisine not specified';
  }

  return parts.join(', ');
}

/**
 * Build human-readable address from OSM addr:* tags
 */
function buildAddress(tags, fallbackArea = '') {
  const parts = [];

  const houseNumber = tags['addr:housenumber'];
  const street = tags['addr:street'];
  const suburb = tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:district'];
  const city = tags['addr:city'] || tags['addr:town'] || tags['addr:village'];
  const state = tags['addr:state'];
  const postcode = tags['addr:postcode'];

  if (houseNumber && street) {
    parts.push(`${houseNumber}, ${street}`);
  } else if (street) {
    parts.push(street);
  }

  if (suburb && !parts.some((p) => p.includes(suburb))) {
    parts.push(suburb);
  }

  if (city && !parts.some((p) => p.includes(city))) {
    parts.push(city);
  }

  if (state && !parts.some((p) => p.includes(state))) {
    parts.push(state);
  }

  if (postcode) {
    parts.push(postcode);
  }

  if (parts.length === 0) {
    return fallbackArea ? `${fallbackArea} Area` : 'Address details in OpenStreetMap';
  }

  return parts.join(', ');
}

/**
 * Evaluate OSM opening_hours string conservatively
 * Distinguishes: OPEN (true), CLOSED (false), HOURS UNKNOWN (null)
 */
function evaluateOpeningStatus(rawHours, now = new Date()) {
  if (!rawHours || typeof rawHours !== 'string') {
    return {
      isOpen: null,
      openStatus: 'HOURS_UNKNOWN',
      openStatusText: 'Hours Unknown',
      todayHours: 'Hours not available',
    };
  }

  const clean = rawHours.trim();

  if (clean.toLowerCase() === '24/7') {
    return {
      isOpen: true,
      openStatus: 'OPEN',
      openStatusText: 'Open Now',
      todayHours: 'Open 24/7',
    };
  }

  // Attempt to parse standard HH:MM-HH:MM pattern (e.g. "11:00-23:00")
  const simpleMatch = clean.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (simpleMatch) {
    const startHour = parseInt(simpleMatch[1], 10);
    const startMin = parseInt(simpleMatch[2], 10);
    const endHour = parseInt(simpleMatch[3], 10);
    const endMin = parseInt(simpleMatch[4], 10);

    const nowHour = now.getHours();
    const nowMin = now.getMinutes();
    const nowTotalMins = nowHour * 60 + nowMin;
    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;

    let isCurrentOpen = false;
    if (endTotal >= startTotal) {
      isCurrentOpen = nowTotalMins >= startTotal && nowTotalMins <= endTotal;
    } else {
      // Overnight
      isCurrentOpen = nowTotalMins >= startTotal || nowTotalMins <= endTotal;
    }

    return {
      isOpen: isCurrentOpen,
      openStatus: isCurrentOpen ? 'OPEN' : 'CLOSED',
      openStatusText: isCurrentOpen ? 'Open Now' : 'Closed',
      todayHours: clean,
    };
  }

  // Fallback for complex syntax (e.g., "Mo-Fr 10:00-22:00; Sa-Su 11:00-23:00")
  return {
    isOpen: null,
    openStatus: 'HOURS_UNKNOWN',
    openStatusText: 'Hours Unknown',
    todayHours: clean,
  };
}

/**
 * Normalize a single OSM element into standard TablePulse structure
 */
function normalizeOsmElement(element, userLat, userLon) {
  const tags = element.tags || {};
  const name = tags.name || tags['name:en'] || null;

  if (!name) return null; // Reject unnamed nodes per requirements

  // Coordinates
  const lat = element.lat !== undefined ? element.lat : element.center?.lat;
  const lon = element.lon !== undefined ? element.lon : element.center?.lon;

  if (lat === undefined || lon === undefined || lat === null || lon === null) {
    return null;
  }

  const numericLat = Number(lat);
  const numericLon = Number(lon);

  if (Number.isNaN(numericLat) || !Number.isFinite(numericLat) || Number.isNaN(numericLon) || !Number.isFinite(numericLon)) {
    return null;
  }
  if (numericLat < -90 || numericLat > 90 || numericLon < -180 || numericLon > 180) {
    return null;
  }

  // Exact Haversine distance from user location
  let distanceKm = null;
  if (userLat !== null && userLon !== null) {
    const d = haversine(userLat, userLon, numericLat, numericLon);
    distanceKm = Math.round(d * 10) / 10;
  }

  const { isOpen, openStatus, openStatusText, todayHours } = evaluateOpeningStatus(tags.opening_hours);
  const cuisineType = normalizeCuisine(tags.cuisine || tags.food);
  const address = buildAddress(tags, tags['addr:suburb'] || tags['addr:city']);

  // Extract phone & website
  const phone = tags.phone || tags['contact:phone'] || null;
  const website = tags.website || tags['contact:website'] || null;

  // Extract legitimate image tag or provide neutral TablePulse placeholder
  const rawPhoto = tags.image || tags['image:url'] || tags.photo || null;
  const coverPhotoUrl =
    rawPhoto && typeof rawPhoto === 'string' && rawPhoto.startsWith('http')
      ? rawPhoto
      : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';

  const osmId = `${element.type}/${element.id}`;
  const stableId = `osm:${element.type}:${element.id}`;

  return {
    id: stableId,
    source: 'openstreetmap',
    osm_id: osmId,
    osm_type: element.type,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `osm-${element.id}`,
    description: tags.description || `Real-world dining spot on OpenStreetMap`,
    cuisineType,
    address,
    area: tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:city'] || null,
    city: tags['addr:city'] || null,
    state: tags['addr:state'] || null,
    postcode: tags['addr:postcode'] || null,
    latitude: numericLat,
    longitude: numericLon,
    phone,
    website,
    coverPhotoUrl,
    distanceKm,
    isOpen,
    openStatus,
    openStatusText,
    todayHours,
    openingHours: tags.opening_hours || null,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    // Smart Table Operational Flags (Explicit separation)
    tablepulse_registered: false,
    smart_table_registered: false,
    operational_data_available: false,
    tableAvailability: null,
    crowdLevel: null,
    waitEstimation: null,
    estimatedWaitMinutes: null,
  };
}

/**
 * Fetch raw elements from Overpass endpoint with fallback rotation
 */
async function executeOverpassQuery(query) {
  // Unique list of endpoints to try
  const uniqueEndpoints = [...new Set(DEFAULT_ENDPOINTS)];
  let lastError = null;

  for (const endpoint of uniqueEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Smart-Table-AI/1.0 (OpenStreetMap Integration; contact: admin@smarttable.ai)',
          'Accept': '*/*',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(10000), // 10s per endpoint attempt
      });

      if (!res.ok) {
        throw new Error(`Overpass HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      if (!json || !Array.isArray(json.elements)) {
        throw new Error('Malformed Overpass response: missing elements array');
      }

      return json.elements;
    } catch (err) {
      lastError = err;
      // Try next endpoint in loop
    }
  }

  throw lastError || new Error('All Overpass API endpoints failed');
}

/**
 * Normalize and deduplicate an array of raw OSM elements
 */
function normalizeOsmElements(rawElements, userLat, userLon, radiusKm) {
  if (!rawElements || !Array.isArray(rawElements)) return [];
  const seenIds = new Set();
  const normalizedList = [];

  for (const el of rawElements) {
    if (!el || !el.id || !el.type) continue;
    const uniqueKey = `${el.type}:${el.id}`;
    if (seenIds.has(uniqueKey)) continue;
    seenIds.add(uniqueKey);

    const normalized = normalizeOsmElement(el, userLat, userLon);
    if (normalized) {
      // Double-check radius with precise Haversine
      if (radiusKm === undefined || radiusKm === null || normalized.distanceKm === null || normalized.distanceKm <= Number(radiusKm)) {
        normalizedList.push(normalized);
      }
    }
  }

  return normalizedList;
}

/**
 * Discover restaurants near coordinates via OpenStreetMap / Overpass API
 */
async function fetchRestaurantsFromOverpass(lat, lon, radiusKm) {
  const cacheKey = getCacheKey(lat, lon, radiusKm);

  // 1. Check in-memory cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. Prevent duplicate concurrent in-flight requests for the same area
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const radiusMeters = Math.min(25000, Math.max(1000, Math.round(Number(radiusKm) * 1000)));
  const query = buildOverpassQuery(lat, lon, radiusMeters);

  const requestPromise = (async () => {
    try {
      const rawElements = await executeOverpassQuery(query);
      const normalizedList = normalizeOsmElements(rawElements, lat, lon, radiusKm);

      // Save to cache
      cache.set(cacheKey, {
        timestamp: Date.now(),
        data: normalizedList,
      });

      return normalizedList;
    } catch (err) {
      // Graceful fallback: check if we have any cached data for the same coordinate grid
      const roundLat = Math.round(Number(lat) * 100) / 100;
      const roundLon = Math.round(Number(lon) * 100) / 100;
      for (const [key, val] of cache.entries()) {
        if (key.startsWith(`restaurants:${roundLat}:${roundLon}:`) && val.data && val.data.length > 0) {
          console.warn(`[Overpass Cache Fallback] Using cached results from ${key} due to upstream error: ${err.message}`);
          return val.data.filter(
            (r) => r.distanceKm === null || radiusKm === undefined || radiusKm === null || r.distanceKm <= Number(radiusKm)
          );
        }
      }
      throw err;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Lookup a single OSM restaurant by OSM ID (e.g., 'osm:node:123456' or 'node/123456')
 */
async function getOsmRestaurantById(osmId) {
  const cleanId = String(osmId).replace(/^osm:/, '').trim();
  const parts = cleanId.includes('/') ? cleanId.split('/') : cleanId.split(':');
  const type = parts[0];
  const id = parts[1];

  if (!type || !id || !['node', 'way', 'relation'].includes(type)) {
    return null;
  }

  // Check cache for this restaurant in existing cached areas
  for (const entry of cache.values()) {
    const found = entry.data.find((r) => r.osm_id === `${type}/${id}` || r.id === `osm:${type}:${id}`);
    if (found) return found;
  }

  // 1. Try official OpenStreetMap REST API directly (fastest & most resilient for single node/way)
  try {
    const osmRes = await fetch(`https://api.openstreetmap.org/api/0.6/${type}/${id}.json`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Smart-Table-AI/1.0 (OpenStreetMap Integration; contact: admin@smarttable.ai)',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (osmRes.ok) {
      const osmJson = await osmRes.json();
      if (osmJson && Array.isArray(osmJson.elements) && osmJson.elements.length > 0) {
        return normalizeOsmElement(osmJson.elements[0], null, null);
      }
    }
  } catch (err) {
    console.warn(`[OSM Direct Fetch Notice] ${type}/${id} fallback to Overpass: ${err.message}`);
  }

  // 2. Query Overpass directly for this specific element
  const query = `[out:json][timeout:15];${type}(${id});out center tags;`;
  const rawElements = await executeOverpassQuery(query);

  if (!rawElements || rawElements.length === 0) {
    return null;
  }

  return normalizeOsmElement(rawElements[0], null, null);
}

/**
 * Clear or prune cache (for testing or memory management)
 */
function clearCache() {
  cache.clear();
  inFlightRequests.clear();
}

module.exports = {
  fetchRestaurantsFromOverpass,
  getOsmRestaurantById,
  buildOverpassQuery,
  normalizeOsmElement,
  normalizeOsmElements,
  normalizeCuisine,
  buildAddress,
  evaluateOpeningStatus,
  getCacheKey,
  clearCache,
  DEFAULT_ENDPOINTS,
};
