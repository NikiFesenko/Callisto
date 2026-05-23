// @ts-nocheck
/**
 * Geopolitical hotspot markers for the globe.
 * These are displayed as diamond/warning shapes (via htmlElementsData).
 * Clicking one fetches real geopolitical news from RSS.
 */

export interface GeoHotspot {
  id: string;
  name: string;          // e.g. "Gaza Conflict"
  region: string;        // e.g. "Middle East"
  lat: number;
  lng: number;
  severity: 'critical' | 'high' | 'medium';
  tag: string;           // short label shown on globe: "⚠ CONFLICT"
  color: string;
  newsQuery: string;     // RSS query string to fetch relevant news
}

export const GEO_HOTSPOTS: GeoHotspot[] = [
  // ── Middle East ──────────────────────────────────────────────────
  {
    id: 'gaza',
    name: 'Gaza Conflict',
    region: 'Middle East',
    lat: 31.5, lng: 34.47,
    severity: 'critical',
    tag: '⚠ CONFLICT',
    color: '#F43F5E',
    newsQuery: 'Gaza Israel war ceasefire oil market',
  },
  {
    id: 'iran-sanctions',
    name: 'Iran Sanctions',
    region: 'Middle East',
    lat: 32.43, lng: 53.69,
    severity: 'high',
    tag: '⚠ SANCTIONS',
    color: '#FB923C',
    newsQuery: 'Iran nuclear sanctions oil supply OPEC',
  },
  {
    id: 'red-sea',
    name: 'Red Sea Shipping',
    region: 'Middle East',
    lat: 15.5, lng: 42.5,
    severity: 'high',
    tag: '⚠ SHIPPING',
    color: '#FB923C',
    newsQuery: 'Red Sea Houthi shipping supply chain oil',
  },
  {
    id: 'saudi-oil',
    name: 'Saudi OPEC+ Cuts',
    region: 'Middle East',
    lat: 24.7, lng: 46.7,
    severity: 'high',
    tag: '◆ OPEC',
    color: '#FFB800',
    newsQuery: 'Saudi Arabia OPEC oil production cut crude price',
  },

  // ── Europe ───────────────────────────────────────────────────────
  {
    id: 'ukraine-war',
    name: 'Russia-Ukraine War',
    region: 'Europe',
    lat: 48.38, lng: 31.17,
    severity: 'critical',
    tag: '⚠ WAR',
    color: '#F43F5E',
    newsQuery: 'Ukraine Russia war sanctions energy gas Europe market',
  },
  {
    id: 'eu-energy',
    name: 'EU Energy Crisis',
    region: 'Europe',
    lat: 50.5, lng: 10.0,
    severity: 'medium',
    tag: '◆ ENERGY',
    color: '#FFB800',
    newsQuery: 'EU Europe energy crisis gas prices inflation ECB',
  },

  // ── Asia ─────────────────────────────────────────────────────────
  {
    id: 'taiwan-strait',
    name: 'Taiwan Strait Tensions',
    region: 'Asia Pacific',
    lat: 23.7, lng: 120.9,
    severity: 'critical',
    tag: '⚠ TENSIONS',
    color: '#F43F5E',
    newsQuery: 'Taiwan China tensions semiconductor supply chain TSMC',
  },
  {
    id: 'china-economy',
    name: 'China Economic Slowdown',
    region: 'Asia Pacific',
    lat: 35.0, lng: 105.0,
    severity: 'high',
    tag: '◆ ECONOMY',
    color: '#FB923C',
    newsQuery: 'China economy slowdown real estate debt deflation market',
  },
  {
    id: 'north-korea',
    name: 'North Korea Missiles',
    region: 'Asia Pacific',
    lat: 40.0, lng: 127.5,
    severity: 'medium',
    tag: '⚠ GEOPOLITICS',
    color: '#FB923C',
    newsQuery: 'North Korea missile nuclear sanctions Asia market',
  },
  {
    id: 'india-pakistan',
    name: 'India-Pakistan Border',
    region: 'Asia Pacific',
    lat: 30.5, lng: 73.5,
    severity: 'high',
    tag: '⚠ CONFLICT',
    color: '#F43F5E',
    newsQuery: 'India Pakistan border tensions military ceasefire market',
  },

  // ── Americas ─────────────────────────────────────────────────────
  {
    id: 'us-china-trade',
    name: 'US–China Trade War',
    region: 'North America',
    lat: 38.9, lng: -100.0,
    severity: 'high',
    tag: '◆ TARIFFS',
    color: '#FFB800',
    newsQuery: 'US China trade war tariffs tech chips semiconductor',
  },
  {
    id: 'latam-political',
    name: 'Latin America Political Risk',
    region: 'Latin America',
    lat: -15.0, lng: -55.0,
    severity: 'medium',
    tag: '◆ POLITICAL',
    color: '#9D6FFF',
    newsQuery: 'Latin America political instability Argentina Brazil economy',
  },

  // ── Africa ───────────────────────────────────────────────────────
  {
    id: 'sahel-instability',
    name: 'Sahel Instability',
    region: 'Africa',
    lat: 14.0, lng: 2.0,
    severity: 'medium',
    tag: '⚠ INSTABILITY',
    color: '#FB923C',
    newsQuery: 'Sahel Africa coup instability commodities mining',
  },
];

// Severity → CSS animation speed
export const SEVERITY_PULSE: Record<string, string> = {
  critical: '0.8s',
  high: '1.4s',
  medium: '2.2s',
};
