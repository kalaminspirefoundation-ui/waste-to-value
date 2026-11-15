import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  APILoadingStatus,
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Building2, Clock, Compass, ExternalLink, MapPin, Navigation, Route as RouteIcon, Truck } from 'lucide-react';
import { LanguageCode } from '../../i18n/translations';
import { ServiceZone } from '../../types/punarchakra';
import { Button } from '../ui/Primitives';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || '';

const ATTRIBUTION_IDS = ['gmp_mcp_codeassist_v1_aistudio'];
const MAP_ID = 'DEMO_MAP_ID';

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export const PUNARCHAKRA_HQ: LatLngPoint & { name: string; address: string } = {
  lat: 13.0628,
  lng: 77.5892,
  name: 'Punarchakra Solar W2V & EV Recovery Hub',
  address: 'Sahakara Nagar / Hebbal Ring Road Corridor, Bengaluru 560092',
};

// Deterministic Bengaluru PIN & Corridor lookup table (Zero legacy Geocoder usage)
export const BENGALURU_ZONE_COORDS: Record<
  string,
  LatLngPoint & { area: string; segment: 'b2c' | 'b2b' | 'hq' }
> = {
  'zone-blr-north-hebbal': {
    lat: 13.0585,
    lng: 77.5865,
    area: 'Hebbal · Sahakara Nagar · RT Nagar',
    segment: 'b2c',
  },
  'zone-blr-north-yelahanka': {
    lat: 13.1007,
    lng: 77.5963,
    area: 'Yelahanka · Jakkur · Kogilu',
    segment: 'b2c',
  },
  'zone-blr-north-vidyaranyapura': {
    lat: 13.0766,
    lng: 77.5578,
    area: 'Vidyaranyapura · Jalahalli · Mathikere',
    segment: 'b2c',
  },
  'zone-blr-north-hennur': {
    lat: 13.0389,
    lng: 77.6388,
    area: 'Hennur · Kalyan Nagar · Banaswadi',
    segment: 'b2c',
  },
  'zone-blr-ind-peenya': {
    lat: 13.0285,
    lng: 77.5197,
    area: 'Peenya Phases I–IV · Yeshwanthpur',
    segment: 'b2b',
  },
  'zone-blr-ind-bommasandra': {
    lat: 12.8286,
    lng: 77.6845,
    area: 'Bommasandra · Jigani · Electronic City',
    segment: 'b2b',
  },
  'zone-blr-ind-whitefield': {
    lat: 12.9817,
    lng: 77.7276,
    area: 'Whitefield EPIP · Hoodi · Mahadevapura',
    segment: 'b2b',
  },
  'zone-blr-ind-west': {
    lat: 12.9877,
    lng: 77.5495,
    area: 'Rajajinagar · Bommanahalli · Kumbalgodu',
    segment: 'b2b',
  },
};

export const BENGALURU_PIN_COORDS: Record<string, LatLngPoint & { area: string }> = {
  '560024': { lat: 13.0358, lng: 77.597, area: 'Hebbal' },
  '560032': { lat: 13.0247, lng: 77.5948, area: 'RT Nagar' },
  '560092': { lat: 13.0628, lng: 77.5892, area: 'Sahakara Nagar' },
  '560094': { lat: 13.0329, lng: 77.5752, area: 'Sanjaynagar' },
  '560064': { lat: 13.1007, lng: 77.5963, area: 'Yelahanka' },
  '560065': { lat: 13.0912, lng: 77.6194, area: 'Jakkur' },
  '560106': { lat: 13.1121, lng: 77.6184, area: 'Kogilu' },
  '560097': { lat: 13.0766, lng: 77.5578, area: 'Vidyaranyapura' },
  '560013': { lat: 13.0477, lng: 77.5469, area: 'Jalahalli' },
  '560054': { lat: 13.0334, lng: 77.564, area: 'Mathikere' },
  '560043': { lat: 13.0285, lng: 77.6416, area: 'Hennur / Banaswadi' },
  '560045': { lat: 13.0369, lng: 77.6204, area: 'Nagawara' },
  '560077': { lat: 13.0631, lng: 77.6487, area: 'Kothanur' },
  '560058': { lat: 13.0285, lng: 77.5197, area: 'Peenya Industrial Area' },
  '560022': { lat: 13.025, lng: 77.5499, area: 'Yeshwanthpur Industrial' },
  '560066': { lat: 12.9784, lng: 77.7273, area: 'Whitefield EPIP' },
  '560048': { lat: 12.9912, lng: 77.7072, area: 'Hoodi / Mahadevapura' },
  '560099': { lat: 12.8178, lng: 77.6924, area: 'Bommasandra Industrial' },
  '560100': { lat: 12.8452, lng: 77.6602, area: 'Electronic City' },
  '560105': { lat: 12.7824, lng: 77.6386, area: 'Jigani Industrial Estate' },
  '560010': { lat: 12.9915, lng: 77.5533, area: 'Rajajinagar Industrial' },
  '560068': { lat: 12.9036, lng: 77.6248, area: 'Bommanahalli Belt' },
  '560074': { lat: 12.8891, lng: 77.4508, area: 'Kumbalgodu KIADB' },
};

export function resolveOrderCoordinates(
  lat?: number,
  lng?: number,
  pinCode?: string,
  zoneId?: string
): LatLngPoint {
  if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  if (pinCode && BENGALURU_PIN_COORDS[pinCode.trim()]) {
    const p = BENGALURU_PIN_COORDS[pinCode.trim()];
    return { lat: p.lat, lng: p.lng };
  }
  if (zoneId && BENGALURU_ZONE_COORDS[zoneId]) {
    const z = BENGALURU_ZONE_COORDS[zoneId];
    return { lat: z.lat, lng: z.lng };
  }
  return { lat: 13.0358, lng: 77.597 };
}

function isQuotaErrorMessage(err: unknown): boolean {
  const text =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : JSON.stringify(err || '');
  return (
    text.includes('OverQuotaMapError') ||
    text.includes('RESOURCE_EXHAUSTED') ||
    text.includes('OVER_QUERY_LIMIT') ||
    text.includes('429')
  );
}

type AdvancedMarkerInstance = NonNullable<ReturnType<typeof useAdvancedMarkerRef>[1]>;

interface PolylineLike {
  setOptions: (opts: Record<string, unknown>) => void;
  setMap: (map: unknown) => void;
}

type FitBoundsArg = Parameters<NonNullable<ReturnType<typeof useMap>>['fitBounds']>[0];

interface AdvancedMarkerWithRefProps {
  position: LatLngPoint;
  title?: string;
  zIndex?: number;
  onMarkerClick: (marker: AdvancedMarkerInstance) => void;
  children?: React.ReactNode;
}

const AdvancedMarkerWithRef: React.FC<AdvancedMarkerWithRefProps> = ({
  position,
  title,
  zIndex,
  onMarkerClick,
  children,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      title={title}
      zIndex={zIndex}
      onClick={() => {
        if (marker) onMarkerClick(marker);
      }}
    >
      {children}
    </AdvancedMarker>
  );
};

const MapsStatusMonitor: React.FC<{
  onFailure: (reason: string) => void;
}> = ({ onFailure }) => {
  const status = useApiLoadingStatus();
  useEffect(() => {
    if (status === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      onFailure('Maps authorization or demo quota limit reached.');
    } else if (status === APILoadingStatus.FAILED) {
      onFailure('Google Maps script failed to load.');
    }
  }, [status, onFailure]);
  return null;
};

/* ============================================================================
 * 1. BENGALURU CORRIDORS MAP (Public Website — North B2C & Industrial B2B)
 * ==========================================================================*/
interface BengaluruCorridorsMapProps {
  zones: ServiceZone[];
  selectedPin?: string;
  language?: LanguageCode;
  onSelectPinForBooking?: (segment: 'b2c' | 'b2b', pinCode: string) => void;
}

interface CorridorMarkerData {
  id: string;
  title: string;
  segment: 'b2c' | 'b2b' | 'hq';
  position: LatLngPoint;
  pins: string[];
  localities: string[];
  slots: string[];
  zIndex: number;
}

export const BengaluruCorridorsMap: React.FC<BengaluruCorridorsMapProps> = ({
  zones,
  selectedPin,
  language = 'en',
  onSelectPinForBooking,
}) => {
  const [filterSegment, setFilterSegment] = useState<'all' | 'b2c' | 'b2b'>('all');
  const [selectedId, setSelectedId] = useState<string | null>('hq-hub');
  const [selectedMarker, setSelectedMarker] = useState<AdvancedMarkerInstance | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const markers = useMemo<CorridorMarkerData[]>(() => {
    const raw: Omit<CorridorMarkerData, 'zIndex'>[] = [
      {
        id: 'hq-hub',
        title: PUNARCHAKRA_HQ.name,
        segment: 'hq',
        position: { lat: PUNARCHAKRA_HQ.lat, lng: PUNARCHAKRA_HQ.lng },
        pins: ['560092', '560024'],
        localities: ['Sahakara Nagar W2V Hub', 'Hebbal EV Dispatch Bay'],
        slots: ['08:30 AM - 06:30 PM Daily'],
      },
    ];

    zones
      .filter((z) => z.isActive && z.city.toLowerCase() === 'bengaluru')
      .forEach((z) => {
        const coords = BENGALURU_ZONE_COORDS[z.id];
        if (!coords) return;
        const seg = z.serviceSegment === 'b2b' ? 'b2b' : 'b2c';
        if (filterSegment !== 'all' && seg !== filterSegment) return;
        raw.push({
          id: z.id,
          title: z.name,
          segment: seg,
          position: { lat: coords.lat, lng: coords.lng },
          pins: z.pinCodes,
          localities: z.localities || [coords.area],
          slots: z.dailySlots,
        });
      });

    return raw
      .sort((a, b) => b.position.lat - a.position.lat)
      .map((item, idx) => ({ ...item, zIndex: idx + 1 }));
  }, [zones, filterSegment]);

  const highlightedZoneId = useMemo(() => {
    if (!selectedPin) return null;
    const match = zones.find((z) => z.pinCodes.includes(selectedPin.trim()));
    return match?.id || null;
  }, [zones, selectedPin]);

  const activeMarkerData = markers.find((m) => m.id === selectedId) || null;

  const handleMarkerClick = useCallback(
    (id: string, marker: AdvancedMarkerInstance) => {
      setSelectedId(id);
      setSelectedMarker(marker);
      setInfoOpen(true);
    },
    []
  );

  return (
    <div className="mt-6 rounded-2xl border border-[#202820]/10 bg-white overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-[#202820]/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F7F9F6]">
        <div>
          <p className="text-xs font-semibold text-[#28A66A] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {language === 'kn'
                ? 'ಬೆಂಗಳೂರು ಲೈವ್ ಸೇವಾ ವಲಯ ನಕ್ಷೆ'
                : 'Interactive Bengaluru Service Corridor Map'}
            </span>
          </p>
          <h3 className="font-display font-bold text-base sm:text-lg text-[#174B37] mt-0.5">
            {language === 'kn'
              ? 'ಉತ್ತರ ಬೆಂಗಳೂರು (B2C) ಮತ್ತು ಕೈಗಾರಿಕಾ ಪ್ರದೇಶಗಳು (B2B)'
              : 'North Bengaluru Household Corridors (B2C) & Industrial Estates (B2B)'}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white border border-[#202820]/10">
          {(
            [
              { id: 'all', label: language === 'kn' ? 'ಎಲ್ಲಾ ವಲಯಗಳು' : 'All Corridors' },
              { id: 'b2c', label: 'North BLR (B2C)' },
              { id: 'b2b', label: 'Industrial Areas (B2B)' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilterSegment(f.id);
                setInfoOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterSegment === f.id
                  ? 'bg-[#174B37] text-white'
                  : 'text-[#202820]/70 hover:text-[#174B37]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12">
        <div className="lg:col-span-8 relative">
          {!GOOGLE_MAPS_API_KEY || mapError ? (
            <div className="h-[420px] bg-[#F7F9F6] p-6 flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#174B37] uppercase tracking-wide">
                  Bengaluru Service Corridor Coordinates
                </p>
                <p className="text-sm text-[#202820]/70">
                  {mapError ||
                    'Interactive map requires a configured Google Maps key. Active Bengaluru dispatch zones remain verified below:'}
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 my-4 overflow-y-auto">
                {markers.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-white border border-[#202820]/10 text-xs">
                    <p className="font-bold text-[#174B37]">{m.title}</p>
                    <p className="text-[#202820]/65 mt-0.5">{m.localities.join(', ')}</p>
                    <p className="font-mono text-[11px] text-[#28A66A] mt-1">
                      {m.position.lat.toFixed(4)}° N, {m.position.lng.toFixed(4)}° E · PINs: {m.pins.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[420px] w-full">
              <APIProvider
                apiKey={GOOGLE_MAPS_API_KEY}
                libraries={['marker', 'routes']}
                language="en"
                region="IN"
              >
                <MapsStatusMonitor onFailure={setMapError} />
                <Map
                  defaultCenter={{ lat: 12.978, lng: 77.602 }}
                  defaultZoom={11}
                  mapId={MAP_ID}
                  gestureHandling="cooperative"
                  internalUsageAttributionIds={ATTRIBUTION_IDS}
                  className="w-full h-full"
                >
                  {markers.map((m) => {
                    const isSelected = m.id === selectedId || m.id === highlightedZoneId;
                    const bg =
                      m.segment === 'hq'
                        ? '#174B37'
                        : m.segment === 'b2b'
                          ? '#0F766E'
                          : '#28A66A';
                    const border = isSelected ? '#A5D66D' : '#FFFFFF';
                    return (
                      <AdvancedMarkerWithRef
                        key={m.id}
                        position={m.position}
                        title={m.title}
                        zIndex={isSelected ? 1000 : m.zIndex}
                        onMarkerClick={(marker) => handleMarkerClick(m.id, marker)}
                      >
                        <Pin
                          background={bg}
                          borderColor={border}
                          glyphColor={m.segment === 'hq' ? '#A5D66D' : '#FFFFFF'}
                          scale={isSelected ? 1.2 : 1.0}
                        />
                      </AdvancedMarkerWithRef>
                    );
                  })}

                  {infoOpen && selectedMarker && activeMarkerData && (
                    <InfoWindow
                      anchor={selectedMarker}
                      pixelOffset={[0, -4]}
                      onCloseClick={() => setInfoOpen(false)}
                    >
                      <div className="p-1 max-w-[240px] space-y-1.5 text-xs text-[#202820]">
                        <p className="font-bold text-[#174B37] leading-snug">{activeMarkerData.title}</p>
                        <p className="text-[11px] text-[#202820]/70">
                          {activeMarkerData.localities.join(' · ')}
                        </p>
                        <p className="font-mono text-[11px] text-[#28A66A] font-semibold">
                          PINs: {activeMarkerData.pins.join(', ')}
                        </p>
                        {onSelectPinForBooking && activeMarkerData.pins[0] && (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectPinForBooking(
                                activeMarkerData.segment === 'b2b' ? 'b2b' : 'b2c',
                                activeMarkerData.pins[0]
                              )
                            }
                            className="mt-1 px-2.5 py-1 rounded-lg bg-[#174B37] text-white font-semibold text-[11px] hover:bg-[#103527] cursor-pointer"
                          >
                            Book Pickup ({activeMarkerData.pins[0]})
                          </button>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            </div>
          )}
        </div>

        {/* Corridor Inspector Side Panel */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#202820]/10 p-4 flex flex-col justify-between bg-white space-y-3 max-h-[420px] overflow-y-auto">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#202820]/65">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#28A66A]" /> B2C North BLR
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" /> B2B Industrial
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#174B37]" /> W2V Hub
              </span>
            </div>

            <div className="space-y-2">
              {markers.map((m) => {
                const isSelected = m.id === selectedId || m.id === highlightedZoneId;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#174B37] bg-[#F7F9F6]'
                        : 'border-[#202820]/10 bg-white hover:border-[#28A66A]/45'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[#174B37] leading-snug">{m.title}</p>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#174B37]/10 text-[#174B37] uppercase shrink-0">
                        {m.segment}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#202820]/65 mt-1">{m.localities.slice(0, 3).join(', ')}</p>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="font-mono text-[11px] text-[#28A66A]">{m.pins.join(', ')}</span>
                      {onSelectPinForBooking && m.pins[0] && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPinForBooking(m.segment === 'b2b' ? 'b2b' : 'b2c', m.pins[0]);
                          }}
                          className="text-[11px] font-semibold text-[#174B37] hover:text-[#28A66A] underline underline-offset-2 cursor-pointer"
                        >
                          Book →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[#202820]/10 text-[11px] text-[#202820]/60 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#174B37] shrink-0" />
            <span>Click any map pin to inspect Bengaluru PIN codes & daily EV pickup slots.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. BENGALURU LIVE ROUTE MAP (Executive Navigation & B2C Live Tracking)
 * ==========================================================================*/
interface RouteComputeInnerProps {
  origin: LatLngPoint;
  destination: LatLngPoint;
  originLabel: string;
  destinationLabel: string;
  onStats: (stats: { distanceMeters: number; durationMillis: number } | null) => void;
  onError: (msg: string | null) => void;
}

const RouteComputeLayer: React.FC<RouteComputeInnerProps> = ({
  origin,
  destination,
  originLabel,
  destinationLabel,
  onStats,
  onError,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<PolylineLike[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    onError(null);

    const request = {
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
    };

    const routeClass = (routesLib as unknown as { Route?: { computeRoutes: (req: unknown) => Promise<{ routes?: unknown[] }> } }).Route;
    if (!routeClass || typeof routeClass.computeRoutes !== 'function') {
      onError('Routes API library unavailable in current Maps bundle.');
      return;
    }

    let cancelled = false;

    routeClass
      .computeRoutes(request)
      .then((response) => {
        if (cancelled) return;
        const routes = (response?.routes || []) as Array<{
          createPolylines?: () => PolylineLike[];
          viewport?: FitBoundsArg;
          distanceMeters?: number;
          durationMillis?: number;
        }>;
        if (!routes.length) {
          onStats(null);
          onError('No drivable road route found between these coordinates.');
          return;
        }
        const primaryRoute = routes[0];
        if (typeof primaryRoute.createPolylines === 'function') {
          const newPolylines = primaryRoute.createPolylines();
          newPolylines.forEach((pl) => {
            pl.setOptions({
              strokeColor: '#174B37',
              strokeWeight: 6,
              strokeOpacity: 0.9,
            });
            pl.setMap(map);
          });
          polylinesRef.current = newPolylines;
        }
        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }
        onStats({
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? 0,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isQuotaErrorMessage(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onStats(null);
        onError('Unable to compute live road polyline; showing straight-line coordinates.');
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin.lat, origin.lng, destination.lat, destination.lng, onStats, onError]);

  return (
    <>
      <AdvancedMarker position={origin} title={originLabel}>
        <Pin background="#174B37" borderColor="#FFFFFF" glyphColor="#A5D66D" />
      </AdvancedMarker>
      <AdvancedMarker position={destination} title={destinationLabel}>
        <Pin background="#28A66A" borderColor="#FFFFFF" glyphColor="#FFFFFF" />
      </AdvancedMarker>
    </>
  );
};

interface BengaluruRouteMapProps {
  origin: LatLngPoint;
  destination: LatLngPoint;
  originLabel: string;
  destinationLabel: string;
  destinationAddress?: string;
  heightClass?: string;
}

export const BengaluruRouteMap: React.FC<BengaluruRouteMapProps> = ({
  origin,
  destination,
  originLabel,
  destinationLabel,
  destinationAddress,
  heightClass = 'h-[340px]',
}) => {
  const [routeStats, setRouteStats] = useState<{ distanceMeters: number; durationMillis: number } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  const center = useMemo<LatLngPoint>(
    () => ({
      lat: (origin.lat + destination.lat) / 2,
      lng: (origin.lng + destination.lng) / 2,
    }),
    [origin.lat, origin.lng, destination.lat, destination.lng]
  );

  // Straight-line haversine fallback metric
  const approxKm = useMemo(() => {
    const dLat = (destination.lat - origin.lat) * 111;
    const dLng = (destination.lng - origin.lng) * 105;
    return Math.max(0.5, Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 10) / 10);
  }, [origin, destination]);

  return (
    <div className="rounded-2xl border border-[#202820]/10 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-[#F7F9F6] border-b border-[#202820]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#174B37]">
            <Truck className="w-4 h-4 text-[#28A66A]" aria-hidden="true" />
            <span>
              {originLabel} → {destinationLabel}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 font-mono font-bold text-[#174B37]">
            <RouteIcon className="w-3.5 h-3.5 text-[#28A66A]" aria-hidden="true" />
            {routeStats
              ? `${(routeStats.distanceMeters / 1000).toFixed(1)} km`
              : `~${approxKm} km`}
          </span>
          {routeStats && routeStats.durationMillis > 0 && (
            <span className="inline-flex items-center gap-1 font-mono text-[#202820]/75">
              <Clock className="w-3.5 h-3.5 text-[#28A66A]" aria-hidden="true" />
              {Math.max(1, Math.round(routeStats.durationMillis / 60000))} mins ETA
            </span>
          )}
        </div>
        {destinationAddress && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationAddress)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#174B37] hover:text-[#28A66A]"
          >
            <span>Open Turn-by-Turn</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        )}
      </div>

      {!GOOGLE_MAPS_API_KEY || mapLoadError ? (
        <div className={`${heightClass} bg-[#F7F9F6] p-5 flex flex-col justify-between text-xs`}>
          <div className="space-y-2">
            <p className="font-semibold text-[#174B37]">
              Bengaluru EV Route Telemetry ({originLabel} → {destinationLabel})
            </p>
            <p className="text-[#202820]/70">{mapLoadError || 'Maps API key not configured for live map canvas.'}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white border border-[#202820]/10">
              <span className="text-[#202820]/55 block">Origin ({originLabel})</span>
              <span className="font-mono font-bold text-[#174B37]">
                {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#202820]/10">
              <span className="text-[#202820]/55 block">Destination ({destinationLabel})</span>
              <span className="font-mono font-bold text-[#28A66A]">
                {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={`w-full ${heightClass} relative`}>
          <APIProvider
            apiKey={GOOGLE_MAPS_API_KEY}
            libraries={['marker', 'routes']}
            language="en"
            region="IN"
          >
            <MapsStatusMonitor onFailure={setMapLoadError} />
            <Map
              defaultCenter={center}
              defaultZoom={12}
              mapId={MAP_ID}
              gestureHandling="greedy"
              internalUsageAttributionIds={ATTRIBUTION_IDS}
              className="w-full h-full"
            >
              <RouteComputeLayer
                origin={origin}
                destination={destination}
                originLabel={originLabel}
                destinationLabel={destinationLabel}
                onStats={setRouteStats}
                onError={setRouteError}
              />
            </Map>
          </APIProvider>
          {routeError && (
            <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-lg bg-white border border-[#202820]/15 text-[11px] text-[#202820]/75">
              {routeError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 3. BENGALURU PIN PICKER MAP (B2C Add Address Modal)
 * ==========================================================================*/
interface BengaluruPinPickerMapProps {
  lat?: number;
  lng?: number;
  onSelectLocation: (coords: { lat: number; lng: number; pinCode?: string }) => void;
}

const NORTH_BLR_QUICK_PINS: { label: string; pinCode: string; lat: number; lng: number }[] = [
  { label: 'Sahakara Nagar', pinCode: '560092', lat: 13.0628, lng: 77.5892 },
  { label: 'Hebbal', pinCode: '560024', lat: 13.0358, lng: 77.597 },
  { label: 'Yelahanka', pinCode: '560064', lat: 13.1007, lng: 77.5963 },
  { label: 'Vidyaranyapura', pinCode: '560097', lat: 13.0766, lng: 77.5578 },
  { label: 'Hennur', pinCode: '560043', lat: 13.0285, lng: 77.6416 },
];

export const BengaluruPinPickerMap: React.FC<BengaluruPinPickerMapProps> = ({
  lat,
  lng,
  onSelectLocation,
}) => {
  const [mapErr, setMapErr] = useState<string | null>(null);
  const currentPos = useMemo<LatLngPoint>(
    () => ({
      lat: typeof lat === 'number' ? lat : 13.0628,
      lng: typeof lng === 'number' ? lng : 77.5892,
    }),
    [lat, lng]
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {NORTH_BLR_QUICK_PINS.map((preset) => (
          <button
            key={preset.pinCode}
            type="button"
            onClick={() =>
              onSelectLocation({
                lat: preset.lat,
                lng: preset.lng,
                pinCode: preset.pinCode,
              })
            }
            className="px-2 py-1 rounded-md border border-[#174B37]/20 bg-[#F7F9F6] text-[11px] font-medium text-[#174B37] hover:bg-[#174B37] hover:text-white transition-colors cursor-pointer"
          >
            {preset.label} ({preset.pinCode})
          </button>
        ))}
      </div>

      {!GOOGLE_MAPS_API_KEY || mapErr ? (
        <div className="h-[190px] rounded-xl border border-[#202820]/10 bg-[#F7F9F6] p-4 flex flex-col justify-center items-center text-center text-xs text-[#202820]/70">
          <MapPin className="w-5 h-5 text-[#28A66A] mb-1.5" />
          <p className="font-semibold text-[#174B37]">
            Selected Coordinates: {currentPos.lat.toFixed(4)}, {currentPos.lng.toFixed(4)}
          </p>
          <p className="text-[11px] mt-0.5">Select a North Bengaluru neighborhood preset above or use browser GPS.</p>
        </div>
      ) : (
        <div className="h-[210px] w-full rounded-xl overflow-hidden border border-[#202820]/15">
          <APIProvider
            apiKey={GOOGLE_MAPS_API_KEY}
            libraries={['marker', 'routes']}
            language="en"
            region="IN"
          >
            <MapsStatusMonitor onFailure={setMapErr} />
            <Map
              center={currentPos}
              defaultZoom={12}
              mapId={MAP_ID}
              gestureHandling="greedy"
              internalUsageAttributionIds={ATTRIBUTION_IDS}
              onClick={(ev) => {
                const latLng = ev.detail.latLng;
                if (latLng) {
                  onSelectLocation({
                    lat: Math.round(latLng.lat * 10000) / 10000,
                    lng: Math.round(latLng.lng * 10000) / 10000,
                  });
                }
              }}
              className="w-full h-full"
            >
              <AdvancedMarker position={currentPos} title="Selected Pickup Pin">
                <Pin background="#174B37" borderColor="#FFFFFF" glyphColor="#A5D66D" />
              </AdvancedMarker>
            </Map>
          </APIProvider>
        </div>
      )}
      <p className="text-[11px] text-[#202820]/60 flex items-center gap-1">
        <Navigation className="w-3 h-3 text-[#28A66A]" aria-hidden="true" />
        <span>Click anywhere on the North Bengaluru map or tap a locality preset to drop your exact EV pickup pin.</span>
      </p>
    </div>
  );
};
