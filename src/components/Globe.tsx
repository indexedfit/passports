import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import GlobeGL from 'react-globe.gl';
import { scaleLinear } from 'd3-scale';
import { feature } from 'topojson-client';
import { useAppStore } from '../stores/appStore';
import { countriesByIso2, countriesByIso3 } from '../lib/data';
import type { Country } from '../lib/types';
import type { Topology } from 'topojson-specification';

// GeoJSON feature type
interface GeoFeature {
  type: 'Feature';
  id?: string | number;
  properties: {
    ISO_A2?: string;
    ISO_A3?: string;
    ADMIN?: string;
    name?: string;
    [key: string]: unknown;
  };
  geometry: unknown;
}

interface GeoJSON {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

// Map from world-atlas numeric IDs to ISO3 codes
const COUNTRY_ID_TO_ISO3: Record<string, string> = {
  '4': 'AFG', '8': 'ALB', '12': 'DZA', '24': 'AGO', '32': 'ARG', '36': 'AUS',
  '40': 'AUT', '50': 'BGD', '56': 'BEL', '68': 'BOL', '76': 'BRA', '100': 'BGR',
  '104': 'MMR', '116': 'KHM', '120': 'CMR', '124': 'CAN', '140': 'CAF', '148': 'TCD',
  '152': 'CHL', '156': 'CHN', '170': 'COL', '178': 'COG', '180': 'COD', '188': 'CRI',
  '191': 'HRV', '192': 'CUB', '196': 'CYP', '203': 'CZE', '208': 'DNK', '214': 'DOM',
  '218': 'ECU', '818': 'EGY', '222': 'SLV', '232': 'ERI', '233': 'EST', '231': 'ETH',
  '246': 'FIN', '250': 'FRA', '266': 'GAB', '270': 'GMB', '268': 'GEO', '276': 'DEU',
  '288': 'GHA', '300': 'GRC', '320': 'GTM', '324': 'GIN', '328': 'GUY', '332': 'HTI',
  '340': 'HND', '348': 'HUN', '352': 'ISL', '356': 'IND', '360': 'IDN', '364': 'IRN',
  '368': 'IRQ', '372': 'IRL', '376': 'ISR', '380': 'ITA', '384': 'CIV', '388': 'JAM',
  '392': 'JPN', '400': 'JOR', '398': 'KAZ', '404': 'KEN', '408': 'PRK', '410': 'KOR',
  '414': 'KWT', '417': 'KGZ', '418': 'LAO', '422': 'LBN', '426': 'LSO', '430': 'LBR',
  '434': 'LBY', '440': 'LTU', '442': 'LUX', '450': 'MDG', '454': 'MWI', '458': 'MYS',
  '466': 'MLI', '478': 'MRT', '484': 'MEX', '496': 'MNG', '504': 'MAR', '508': 'MOZ',
  '516': 'NAM', '524': 'NPL', '528': 'NLD', '554': 'NZL', '558': 'NIC', '562': 'NER',
  '566': 'NGA', '578': 'NOR', '512': 'OMN', '586': 'PAK', '591': 'PAN', '598': 'PNG',
  '600': 'PRY', '604': 'PER', '608': 'PHL', '616': 'POL', '620': 'PRT', '630': 'PRI',
  '634': 'QAT', '642': 'ROU', '643': 'RUS', '646': 'RWA', '682': 'SAU', '686': 'SEN',
  '688': 'SRB', '694': 'SLE', '702': 'SGP', '703': 'SVK', '705': 'SVN', '706': 'SOM',
  '710': 'ZAF', '724': 'ESP', '144': 'LKA', '736': 'SDN', '740': 'SUR', '752': 'SWE',
  '756': 'CHE', '760': 'SYR', '158': 'TWN', '762': 'TJK', '834': 'TZA', '764': 'THA',
  '768': 'TGO', '780': 'TTO', '788': 'TUN', '792': 'TUR', '795': 'TKM', '800': 'UGA',
  '804': 'UKR', '784': 'ARE', '826': 'GBR', '840': 'USA', '858': 'URY', '860': 'UZB',
  '862': 'VEN', '704': 'VNM', '887': 'YEM', '894': 'ZMB', '716': 'ZWE', '728': 'SSD',
  '499': 'MNE', '807': 'MKD', '70': 'BIH', '428': 'LVA', '112': 'BLR', '31': 'AZE',
  '51': 'ARM', '48': 'BHR', '64': 'BTN', '72': 'BWA', '96': 'BRN', '108': 'BDI',
  '132': 'CPV', '174': 'COM', '262': 'DJI', '226': 'GNQ', '238': 'FLK', '242': 'FJI',
  '254': 'GUF', '258': 'PYF', '260': 'ATF', '304': 'GRL', '312': 'GLP', '316': 'GUM',
  '831': 'GGY', '344': 'HKG', '833': 'IMN', '832': 'JEY', '446': 'MAC', '462': 'MDV',
  '474': 'MTQ', '480': 'MUS', '175': 'MYT', '492': 'MCO', '500': 'MSR', '520': 'NRU',
  '530': 'ANT', '540': 'NCL', '570': 'NIU', '574': 'NFK', '580': 'MNP', '275': 'PSE',
  '612': 'PCN', '638': 'REU', '652': 'BLM', '654': 'SHN', '659': 'KNA', '660': 'AIA',
  '662': 'LCA', '663': 'MAF', '666': 'SPM', '670': 'VCT', '882': 'WSM', '674': 'SMR',
  '678': 'STP', '690': 'SYC', '748': 'SWZ', '776': 'TON', '796': 'TCA', '798': 'TUV',
  '850': 'VIR', '876': 'WLF', '732': 'ESH', '90': 'SLB', '548': 'VUT', '583': 'FSM',
  '584': 'MHL', '585': 'PLW', '296': 'KIR', '-99': 'CYN', '10': 'ATA'
};

// Country centroid coordinates (approximate)
const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  // Americas
  USA: { lat: 39.8, lng: -98.5 },
  CAN: { lat: 56.1, lng: -106.3 },
  MEX: { lat: 23.6, lng: -102.6 },
  BRA: { lat: -14.2, lng: -51.9 },
  ARG: { lat: -38.4, lng: -63.6 },
  CHL: { lat: -35.7, lng: -71.5 },
  COL: { lat: 4.6, lng: -74.1 },
  PER: { lat: -9.2, lng: -75.0 },
  VEN: { lat: 6.4, lng: -66.6 },
  // Europe
  GBR: { lat: 54.0, lng: -2.0 },
  FRA: { lat: 46.6, lng: 2.3 },
  DEU: { lat: 51.2, lng: 10.4 },
  ITA: { lat: 41.9, lng: 12.6 },
  ESP: { lat: 40.5, lng: -3.7 },
  PRT: { lat: 39.4, lng: -8.2 },
  NLD: { lat: 52.1, lng: 5.3 },
  BEL: { lat: 50.5, lng: 4.5 },
  CHE: { lat: 46.8, lng: 8.2 },
  AUT: { lat: 47.5, lng: 14.6 },
  POL: { lat: 51.9, lng: 19.1 },
  SWE: { lat: 60.1, lng: 18.6 },
  NOR: { lat: 60.5, lng: 8.5 },
  DNK: { lat: 56.3, lng: 9.5 },
  FIN: { lat: 61.9, lng: 25.7 },
  IRL: { lat: 53.4, lng: -8.2 },
  GRC: { lat: 39.1, lng: 21.8 },
  CZE: { lat: 49.8, lng: 15.5 },
  HUN: { lat: 47.2, lng: 19.5 },
  ROU: { lat: 45.9, lng: 25.0 },
  UKR: { lat: 48.4, lng: 31.2 },
  // Asia
  RUS: { lat: 61.5, lng: 105.3 },
  CHN: { lat: 35.9, lng: 104.2 },
  JPN: { lat: 36.2, lng: 138.3 },
  KOR: { lat: 35.9, lng: 127.8 },
  IND: { lat: 20.6, lng: 79.0 },
  THA: { lat: 15.9, lng: 100.9 },
  VNM: { lat: 14.1, lng: 108.3 },
  IDN: { lat: -0.8, lng: 113.9 },
  MYS: { lat: 4.2, lng: 101.9 },
  SGP: { lat: 1.4, lng: 103.8 },
  PHL: { lat: 12.9, lng: 121.8 },
  PAK: { lat: 30.4, lng: 69.3 },
  BGD: { lat: 23.7, lng: 90.4 },
  TUR: { lat: 38.9, lng: 35.2 },
  SAU: { lat: 23.9, lng: 45.1 },
  ARE: { lat: 23.4, lng: 53.8 },
  ISR: { lat: 31.0, lng: 34.9 },
  // Africa
  ZAF: { lat: -30.6, lng: 22.9 },
  EGY: { lat: 26.8, lng: 30.8 },
  NGA: { lat: 9.1, lng: 8.7 },
  KEN: { lat: -0.0, lng: 38.0 },
  MAR: { lat: 31.8, lng: -7.1 },
  ETH: { lat: 9.1, lng: 40.5 },
  GHA: { lat: 7.9, lng: -1.0 },
  // Oceania
  AUS: { lat: -25.3, lng: 133.8 },
  NZL: { lat: -40.9, lng: 174.9 },
};

// Color scale for synergy scores
const synergyColorScale = scaleLinear<string>()
  .domain([0, 50, 100])
  .range(['#ef4444', '#f59e0b', '#10b981']); // red -> amber -> green

export function Globe() {
  const globeRef = useRef<any>(null);
  const [countries, setCountries] = useState<GeoJSON>({ type: 'FeatureCollection', features: [] });
  const [hoverD, setHoverD] = useState<GeoFeature | null>(null);
  const [polygonsReady, setPolygonsReady] = useState(false);

  const {
    selectedPassports,
    synergies,
    selectCountry,
    setHoveredCountry,
  } = useAppStore();

  // Load LOW-RESOLUTION GeoJSON (110m instead of 10m - 50x fewer points)
  useEffect(() => {
    let mounted = true;

    // Use Natural Earth 110m - much simpler geometry, way fewer points per country
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((res) => res.json())
      .then((topology: Topology) => {
        if (!mounted) return;
        // Convert TopoJSON to GeoJSON
        const geojson = feature(topology, topology.objects.countries) as unknown as GeoJSON;

        setCountries(geojson);
        // Small delay to let globe stabilize
        setTimeout(() => {
          if (mounted) setPolygonsReady(true);
        }, 100);
      })
      .catch((err) => console.error('Failed to load countries:', err));

    return () => { mounted = false; };
  }, []);

  // Initialize globe settings once ready
  useEffect(() => {
    if (!globeRef.current) return;

    // Wait a tick for globe to initialize
    const timer = setTimeout(() => {
      if (!globeRef.current) return;

      try {
        const controls = globeRef.current.controls();
        if (controls) {
          // Smooth auto-rotation
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.3;

          // Enable smooth damping for all interactions
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;

          // Zoom settings
          controls.enableZoom = true;
          controls.zoomSpeed = 0.8;
          controls.minDistance = 150;
          controls.maxDistance = 500;

          // Smooth pan/rotate
          controls.rotateSpeed = 0.5;
          controls.enablePan = false; // Disable pan for cleaner UX
        }

        // Set initial view
        globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0);
      } catch (e) {
        console.warn('Globe controls not ready yet');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Update rotation based on selection
  useEffect(() => {
    if (!globeRef.current) return;

    try {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = selectedPassports.length === 0;
      }
    } catch (e) {
      // Controls not ready
    }
  }, [selectedPassports.length]);

  // Focus on selected country
  useEffect(() => {
    if (!globeRef.current || selectedPassports.length === 0) return;

    const lastSelected = selectedPassports[selectedPassports.length - 1];
    const centroid = COUNTRY_CENTROIDS[lastSelected.iso3];

    if (centroid) {
      globeRef.current.pointOfView(
        { lat: centroid.lat, lng: centroid.lng, altitude: 2 },
        1000
      );
    }
  }, [selectedPassports]);

  // Get country from GeoJSON feature (handles both old and new format)
  const getCountryFromFeature = useCallback((feature: GeoFeature): Country | undefined => {
    // Try ISO codes first (old format)
    const iso2 = feature.properties.ISO_A2;
    const iso3 = feature.properties.ISO_A3;
    if (iso2) return countriesByIso2.get(iso2);
    if (iso3) return countriesByIso3.get(iso3);

    // Try numeric ID (world-atlas format uses zero-padded 3-digit strings)
    if (feature.id !== undefined) {
      const idStr = String(feature.id);
      // Try as-is first, then try parsing as number (removes leading zeros)
      let mappedIso3 = COUNTRY_ID_TO_ISO3[idStr];
      if (!mappedIso3) {
        mappedIso3 = COUNTRY_ID_TO_ISO3[String(parseInt(idStr, 10))];
      }
      if (mappedIso3) return countriesByIso3.get(mappedIso3);
    }

    return undefined;
  }, []);

  // Get color for a polygon based on synergy
  const getPolygonColor = useCallback(
    (feature: GeoFeature): string => {
      const country = getCountryFromFeature(feature);

      // Hovered country
      if (feature === hoverD) {
        return '#3b82f6'; // Accent blue
      }

      // Selected passport
      if (country && selectedPassports.some((p) => p.iso3 === country.iso3)) {
        return '#3b82f6'; // Accent blue
      }

      // No selection yet - neutral color
      if (selectedPassports.length === 0) {
        return '#e5e7eb'; // Light gray
      }

      // Get synergy score
      if (country) {
        const synergy = synergies.get(country.iso3);
        if (synergy) {
          if (!synergy.compatible) {
            return '#fca5a5'; // Light red for incompatible
          }
          return synergyColorScale(synergy.score);
        }
      }

      return '#e5e7eb'; // Default gray
    },
    [hoverD, selectedPassports, synergies, getCountryFromFeature]
  );

  // Handle polygon click
  const handlePolygonClick = useCallback(
    (feature: GeoFeature) => {
      const country = getCountryFromFeature(feature);
      if (country) {
        selectCountry(country);
      }
    },
    [getCountryFromFeature, selectCountry]
  );

  // Handle polygon hover
  const handlePolygonHover = useCallback(
    (feature: GeoFeature | null) => {
      setHoverD(feature);
      if (feature) {
        const country = getCountryFromFeature(feature);
        setHoveredCountry(country || null);
      } else {
        setHoveredCountry(null);
      }
    },
    [getCountryFromFeature, setHoveredCountry]
  );

  // Generate polygon label
  const getPolygonLabel = useCallback(
    (feature: GeoFeature): string => {
      const country = getCountryFromFeature(feature);
      if (!country) return feature.properties.ADMIN || feature.properties.name || 'Unknown';

      let label = `<div class="globe-tooltip">
        <strong>${country.name}</strong>`;

      if (selectedPassports.length > 0) {
        const synergy = synergies.get(country.iso3);
        if (synergy) {
          if (synergy.compatible) {
            label += `<br/>Synergy: <span style="color: ${synergyColorScale(synergy.score)}">${synergy.score}</span>`;
          } else {
            label += `<br/><span style="color: #ef4444">${synergy.reason}</span>`;
          }
        }
      }

      // Dual citizenship status
      if (country.dualCitizenship.allowed === true) {
        const isConditional = 'conditional' in country.dualCitizenship && country.dualCitizenship.conditional;
        label += isConditional
          ? '<br/>Dual citizenship: Conditional'
          : '<br/>Dual citizenship: Yes';
      } else if (country.dualCitizenship.allowed === false) {
        label += '<br/>Dual citizenship: No';
      } else {
        label += '<br/>Dual citizenship: Unknown';
      }

      label += '</div>';
      return label;
    },
    [selectedPassports.length, synergies, getCountryFromFeature]
  );

  // Filter out Antarctica (ID 10), only show when ready
  const filteredFeatures = useMemo(
    () => polygonsReady
      ? countries.features.filter((d) => String(d.id) !== '10' && d.properties.ISO_A2 !== 'AQ')
      : [],
    [countries.features, polygonsReady]
  );

  // Track when globe is actually rendered
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Wait for globe to initialize before showing
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="w-full h-full transition-opacity duration-500"
      style={{ opacity: isLoaded ? 1 : 0 }}
    >
      <GlobeGL
        ref={globeRef}
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-day.jpg"
        backgroundColor="rgba(0, 0, 0, 0)"
        atmosphereColor="#93c5fd"
        atmosphereAltitude={0.12}
        polygonsData={filteredFeatures}
        polygonAltitude={(d: object) => (d === hoverD ? 0.015 : 0.005)}
        polygonCapColor={(d: object) => getPolygonColor(d as GeoFeature)}
        polygonSideColor={() => 'rgba(0, 0, 0, 0.05)'}
        polygonStrokeColor={() => '#94a3b8'}
        polygonLabel={(d: object) => getPolygonLabel(d as GeoFeature)}
        onPolygonHover={(polygon: object | null) => handlePolygonHover(polygon as GeoFeature | null)}
        onPolygonClick={(polygon: object) => handlePolygonClick(polygon as GeoFeature)}
        polygonsTransitionDuration={400}
      />
    </div>
  );
}
