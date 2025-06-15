// Next.js App: Responsive Travel Map with Summary Table
// Install dependencies: npm install react react-dom next react-leaflet leaflet tailwindcss

// pages/_app.tsx'use client';
'use client';
// pages/index.tsx
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';

// Responsive map components (no SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import('react-leaflet').then(m => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import('react-leaflet').then(m => m.Marker),       { ssr: false });
const Tooltip      = dynamic(() => import('react-leaflet').then(m => m.Tooltip),      { ssr: false });
const Polyline     = dynamic(() => import('react-leaflet').then(m => m.Polyline),     { ssr: false });

// Trip data
const itinerary = [
  { city: 'Oakland, CA', coords: [37.8044, -122.2711] as LatLngExpression, arrival: '2025-06-28', departure: '2025-06-28', nights: 0 },
  { city: 'Los Angeles, CA', coords: [34.0522, -118.2437] as LatLngExpression, arrival: '2025-07-01', departure: '2025-07-02', nights: 1 },
  { city: 'Atlanta, GA', coords: [33.7490, -84.3880] as LatLngExpression, arrival: '2025-07-02', departure: '2025-07-03', nights: 1 },
  { city: 'Washington, DC', coords: [38.9072, -77.0369] as LatLngExpression, arrival: '2025-07-03', departure: '2025-07-06', nights: 3 },
  { city: 'New York, NY', coords: [40.7128, -74.0060] as LatLngExpression, arrival: '2025-07-05', departure: '2025-07-06', nights: 1 },
  { city: 'Raleigh, NC', coords: [35.7796, -78.6382] as LatLngExpression, arrival: '2025-07-06', departure: '2025-07-08', nights: 2 },
  { city: 'Chicago, IL', coords: [41.8781, -87.6298] as LatLngExpression, arrival: '2025-07-08', departure: '2025-07-08', nights: 0 },
  { city: 'Lincoln, NE', coords: [40.8136, -96.7026] as LatLngExpression, arrival: '2025-07-09', departure: '2025-07-10', nights: 1 },
  { city: 'Denver, CO', coords: [39.7392, -104.9903] as LatLngExpression, arrival: '2025-07-10', departure: '2025-07-12', nights: 2 },
  { city: 'Oakland, CA', coords: [37.8044, -122.2711] as LatLngExpression, arrival: '2025-07-12', departure: '2025-07-12', nights: 0 },
];

const segments = [
  { name: 'Coast Starlight', from: 'Oakland, CA', to: 'Los Angeles, CA', date: 'Jun 28', depart: '9:21 PM', arrive: '9:06 PM (Jun 28)' },
  { name: 'Sunset Limited → Crescent', from: 'Los Angeles, CA', to: 'Atlanta, GA', date: 'Jun 29', depart: '10:00 PM', arrive: '11:29 PM (Jun 30)' },
  { name: 'Crescent', from: 'Atlanta, GA', to: 'Washington, DC', date: 'Jun 30', depart: '7:55 PM', arrive: '5:31 AM (Jul 2)' },
  { name: 'Northeast Regional', from: 'Washington, DC', to: 'New York, NY', date: 'Jul 5', depart: '8:05 AM', arrive: '12:25 PM (Jul 5)' },
  { name: 'Carolinian', from: 'New York, NY', to: 'Raleigh, NC', date: 'Jul 6', depart: '7:04 AM', arrive: '6:15 PM (Jul 6)' },
  { name: 'Carolinian ↝ Capitol Limited', from: 'Raleigh, NC', to: 'Chicago, IL', date: 'Jul 8', depart: '4:05 PM', arrive: '8:45 AM (Jul 9)' },
  { name: 'California Zephyr (CHI→LIN)', from: 'Chicago, IL', to: 'Lincoln, NE', date: 'Jul 9', depart: '2:00 PM', arrive: '7:20 PM (Jul 9)' },
  { name: 'California Zephyr (LIN→DEN)', from: 'Lincoln, NE', to: 'Denver, CO', date: 'Jul 10', depart: '8:05 AM', arrive: '1:30 PM (Jul 10)' },
  { name: 'California Zephyr (DEN→OAK)', from: 'Denver, CO', to: 'Oakland, CA', date: 'Jul 12', depart: '7:15 PM', arrive: '8:25 PM (Jul 12)' },
];

const routeColors = ['#1a237e','#283593','#303f9f','#3949ab','#3f51b5','#5c6bc0','#7986cb','#9fa8da','#c5cae9'];

export default function Home() {
  const [today, setToday] = useState(new Date());
  const [showSummary, setShowSummary] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('default');

  const mapThemes = {
    default: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    light: {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    },
    terrain: {
      url: "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png",
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    night: {
      url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    minimal: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    topo: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Hide tooltip after 5 seconds
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const center: LatLngExpression = [39.8283, -98.5795];

  const currentIndex = segments.findIndex((seg, idx) => {
    const start = new Date(`${seg.date} 2025`);
    const endDate = seg.arrive.match(/\((.*?)\)/)?.[1] || seg.date;
    const end = new Date(`${endDate} 2025`);
    return today >= start && today < new Date(end.getTime() + 3600000);
  });

  const getIcon = (num: number) =>
    new L.DivIcon({
      html: `<div class="w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full text-xs">${num}</div>`,
      className: ''
    });

  return (
    <div className="h-screen w-screen relative">
      {/* Map */}
      <MapContainer center={center} zoom={4} className="w-full h-full">
        <TileLayer 
          url={mapThemes[currentTheme as keyof typeof mapThemes].url}
          attribution={mapThemes[currentTheme as keyof typeof mapThemes].attribution}
        />

        {/* Markers */}
        {itinerary.map((stop, idx) => (
          <Marker key={idx} position={stop.coords} icon={getIcon(idx+1)}>
            <Tooltip>
              <div className="text-xs">
                <strong>#{idx+1} {stop.city}</strong><br />
                Arrive: {stop.arrival}<br />
                Depart: {stop.departure}<br />
                Nights: {stop.nights}
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* Routes */}
        {segments.map((seg, idx) => {
          const fromCity = itinerary.find(s => s.city === seg.from);
          const toCity = itinerary.find(s => s.city === seg.to);
          return (
            <Polyline
              key={idx}
              positions={fromCity && toCity ? [fromCity.coords, toCity.coords] : []}
              pathOptions={{
                color: routeColors[idx % routeColors.length],
                weight: idx === currentIndex ? 6 : 3,
                dashArray: idx > currentIndex ? '5,5' : undefined,
                opacity: 0.8,
              }}
              eventHandlers={{
                mouseover: (e) => e.target.setStyle({ weight: 8 }),
                mouseout: (e) => e.target.setStyle({ weight: idx === currentIndex ? 6 : 3 }),
              }}
            >
              <Tooltip sticky>
                <div className="text-xs">
                  <strong>Segment {idx+1}</strong>: {seg.name}<br />
                  {seg.from} → {seg.to}<br />
                  {seg.date} &bull; Dep: {seg.depart} &bull; Arr: {seg.arrive}
                </div>
              </Tooltip>
            </Polyline>
          );
        })}
      </MapContainer>

      {/* Controls */}
      <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2">
        {/* Summary button with tooltip */}
        <div className="relative">
          {showTooltip && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap animate-fade-in">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-800"></div>
              Click to view trip summary
            </div>
          )}
          <button
            onClick={() => {
              setShowSummary(true);
              setShowTooltip(false);
            }}
            className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Theme selector */}
        <div className="relative">
          <select
            value={currentTheme}
            onChange={(e) => setCurrentTheme(e.target.value)}
            className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors appearance-none pl-2 pr-8 text-sm min-w-[140px]"
          >
            <option value="default">Default Map</option>
            <option value="dark">Dark Theme</option>
            <option value="light">Light Theme</option>
            <option value="satellite">Satellite</option>
            <option value="terrain">Terrain</option>
            <option value="topo">Topographic</option>
            <option value="night">Night Mode</option>
            <option value="minimal">Minimal</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Summary modal */}
      {showSummary && (
        <div className="fixed inset-0 z-[2000] bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold dark:text-white">Trip Summary</h2>
                <button
                  onClick={() => setShowSummary(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                  <thead className="bg-gray-200 dark:bg-gray-700">
                    <tr>
                      <th className="px-2 py-1">#</th>
                      <th className="px-2 py-1">Segment</th>
                      <th className="px-2 py-1">From</th>
                      <th className="px-2 py-1">To</th>
                      <th className="px-2 py-1">Date</th>
                      <th className="px-2 py-1">Depart</th>
                      <th className="px-2 py-1">Arrive</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segments.map((seg, idx) => {
                      const fromCity = itinerary.find(s => s.city === seg.from);
                      const toCity = itinerary.find(s => s.city === seg.to);
                      const fromCoords = fromCity?.coords as [number, number];
                      const toCoords = toCity?.coords as [number, number];
                      return (
                        <tr key={idx} className={`${idx === currentIndex ? 'bg-blue-50 dark:bg-blue-900' : ''}`}>
                          <td className="border px-2 py-1">{idx+1}</td>
                          <td className="border px-2 py-1">{seg.name}</td>
                          <td className="border px-2 py-1">
                            <div className="flex items-center gap-2">
                              <span>{seg.from}</span>
                              {fromCoords && (
                                <span className="text-xs text-gray-500">
                                  ({fromCoords[0].toFixed(4)}, {fromCoords[1].toFixed(4)})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="border px-2 py-1">
                            <div className="flex items-center gap-2">
                              <span>{seg.to}</span>
                              {toCoords && (
                                <span className="text-xs text-gray-500">
                                  ({toCoords[0].toFixed(4)}, {toCoords[1].toFixed(4)})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="border px-2 py-1">{seg.date}</td>
                          <td className="border px-2 py-1">{seg.depart}</td>
                          <td className="border px-2 py-1">{seg.arrive}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add this to your global CSS or Tailwind config
const styles = `
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-50%) translateX(10px); }
  to { opacity: 1; transform: translateY(-50%) translateX(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
`;
