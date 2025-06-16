// Next.js App: Responsive Travel Map with Summary Table
// Install dependencies: npm install react react-dom next react-leaflet leaflet tailwindcss

// pages/_app.tsx'use client';
'use client';
// pages/index.tsx
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { LatLngExpression } from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';

// Responsive map components (no SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import('react-leaflet').then(m => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import('react-leaflet').then(m => m.Marker),       { ssr: false });
const Tooltip      = dynamic(() => import('react-leaflet').then(m => m.Tooltip),      { ssr: false });
const Polyline     = dynamic(() => import('react-leaflet').then(m => m.Polyline),     { ssr: false });
const ZoomControl  = dynamic(() => import('react-leaflet').then(m => m.ZoomControl),  { ssr: false });

// Trip data
const itinerary = [
  { city: 'Oakland, CA', coords: [37.8044, -122.2711], arrival: '2025-06-26', departure: '2025-06-26', nights: 0 },
  { city: 'Denver, CO', coords: [39.7392, -104.9903], arrival: '2025-06-27', departure: '2025-06-27', nights: 0 },
  { city: 'Lincoln, NE', coords: [40.8136, -96.7026], arrival: '2025-06-28', departure: '2025-06-28', nights: 0 },
  { city: 'Chicago, IL', coords: [41.8781, -87.6298], arrival: '2025-06-28', departure: '2025-06-28', nights: 0 },
  { city: 'New York, NY', coords: [40.7128, -74.0060], arrival: '2025-06-28', departure: '2025-06-30', nights: 2 },
  { city: 'Washington, DC', coords: [38.9072, -77.0369], arrival: '2025-06-30', departure: '2025-07-02', nights: 2 },
  { city: 'Raleigh, NC', coords: [35.7796, -78.6382], arrival: '2025-07-02', departure: '2025-07-03', nights: 1 },
  { city: 'Atlanta, GA', coords: [33.7490, -84.3880], arrival: '2025-07-03', departure: '2025-07-04', nights: 1 },
  { city: 'Fort Worth, TX', coords: [32.7555, -97.3308], arrival: '2025-07-04', departure: '2025-07-04', nights: 0 },
  { city: 'Oklahoma City, OK', coords: [35.4676, -97.5164], arrival: '2025-07-05', departure: '2025-07-05', nights: 0 },
  { city: 'Los Angeles, CA', coords: [34.0522, -118.2437], arrival: '2025-07-06', departure: '2025-07-07', nights: 1 },
  { city: 'Oakland, CA', coords: [37.8044, -122.2711], arrival: '2025-07-08', departure: '2025-07-08', nights: 0 },
];

const segments = [
  { name: 'California Zephyr (OAK→DEN)', from: 'Oakland, CA', to: 'Denver, CO', date: 'Jun 26', depart: '7:15 AM', arrive: '6:38 AM (Jun 27)' },
  { name: 'California Zephyr (DEN→LIN)', from: 'Denver, CO', to: 'Lincoln, NE', date: 'Jun 27', depart: '7:00 AM', arrive: '1:30 PM (Jun 27)' },
  { name: 'California Zephyr (LIN→CHI)', from: 'Lincoln, NE', to: 'Chicago, IL', date: 'Jun 28', depart: '6:00 AM', arrive: '2:50 PM (Jun 28)' },
  { name: 'Lake Shore Limited', from: 'Chicago, IL', to: 'New York, NY', date: 'Jun 28', depart: '3:55 PM', arrive: '6:30 PM (Jun 29)' },
  { name: 'Regional', from: 'New York, NY', to: 'Washington, DC', date: 'Jun 30', depart: '10:00 AM', arrive: '1:10 PM (Jun 30)' },
  { name: 'Carolinian', from: 'Washington, DC', to: 'Raleigh, NC', date: 'Jul 1', depart: '7:05 AM', arrive: '3:05 PM (Jul 1)' },
  { name: 'Crescent', from: 'Raleigh, NC', to: 'Atlanta, GA', date: 'Jul 3', depart: '6:30 AM', arrive: '4:00 PM (Jul 3)' },
  { name: 'Texas Eagle', from: 'Atlanta, GA', to: 'Fort Worth, TX', date: 'Jul 4', depart: '10:00 AM', arrive: '10:00 PM (Jul 4)' },
  { name: 'Heartland Flyer', from: 'Fort Worth, TX', to: 'Oklahoma City, OK', date: 'Jul 5', depart: '8:25 AM', arrive: '12:21 PM (Jul 5)' },
  { name: 'Southwest Chief', from: 'Oklahoma City, OK', to: 'Los Angeles, CA', date: 'Jul 6', depart: '6:00 AM', arrive: '8:00 PM (Jul 6)' },
  { name: 'Coast Starlight', from: 'Los Angeles, CA', to: 'Oakland, CA', date: 'Jul 7', depart: '10:10 AM', arrive: '9:32 PM (Jul 8)' },
];

const routeColors = ['#1a237e','#283593','#303f9f','#3949ab','#3f51b5','#5c6bc0','#7986cb','#9fa8da','#c5cae9'];

export default function Home() {
  const [today, setToday] = useState(new Date());
  const [showSummary, setShowSummary] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [L, setL] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [map, setMap] = useState<LeafletMap | null>(null);

  const themeOrder = ['night','default', 'dark', 'light', 'satellite', 'terrain', 'topo',  'minimal'];
  
  const cycleTheme = () => {
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setCurrentTheme(themeOrder[nextIndex]);
  };

  useEffect(() => {
    // Import Leaflet only on client side
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
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

  const getIcon = (num: number) => {
    if (!L) return null;
    return new L.DivIcon({
      html: `<div class="w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full text-xs">${num}</div>`,
      className: ''
    });
  };

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

  if (!L) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading map...</div>;
  }

  return (
    <div className="h-screen w-screen relative flex">
      {/* Sidebar */}
      <div 
        className={`fixed md:relative z-[1000] h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-[300px] md:w-[350px]' : 'w-0'} 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-12'}`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white whitespace-nowrap">Trip Itinerary</h2>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          </div>

          {/* Amtrak Info */}
          <div className={`p-4 border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/30 transition-all duration-300
            ${isSidebarOpen ? 'opacity-100 max-h-[200px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Amtrak 10-Segment Pass</p>
                <p className="text-xs">This itinerary uses Amtrak's 10-segment pass, allowing flexible travel across multiple routes. Each connection between cities counts as one segment. If a connection is missed or delayed, that segment is NOT counted!</p>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {segments.map((seg, idx) => {
                const fromCity = itinerary.find(s => s.city === seg.from);
                const toCity = itinerary.find(s => s.city === seg.to);
                const isStandalone = seg.from === 'New York, NY' && seg.to === 'Washington, DC';
                return (
                  <div 
                    key={idx}
                    className={`p-4 rounded-lg border dark:border-gray-700 transition-all
                      ${idx === currentIndex ? 'bg-blue-50 dark:bg-blue-900' : 'bg-white dark:bg-gray-800'}
                      ${isStandalone ? 'border-yellow-400 dark:border-yellow-500' : ''}
                      hover:shadow-md cursor-pointer`}
                    onClick={() => {
                      // Center map on the route
                      const mapElement = document.querySelector('.leaflet-container');
                      const map = (mapElement as any)?._leaflet_map as LeafletMap;
                      if (map && fromCity && toCity) {
                        const bounds = L.latLngBounds([fromCity.coords, toCity.coords]);
                        map.fitBounds(bounds, { padding: [50, 50] });
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 flex items-center justify-center text-white rounded-full text-xs
                        ${isStandalone ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium dark:text-white">{seg.name}</h3>
                        {isStandalone && (
                          <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                            Standalone Travel
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex justify-between mb-1">
                        <span>{seg.from}</span>
                        <span>→</span>
                        <span>{seg.to}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>{seg.date} {seg.depart}</span>
                        <span>{seg.arrive}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t dark:border-gray-700 text-center">
              <a 
                href="https://mjrobillard.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                by Matthew Robillard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer 
          center={center} 
          zoom={4} 
          className="w-full h-full"
          zoomControl={false}
          ref={(mapInstance) => setMap(mapInstance)}
        >
          <TileLayer 
            url={mapThemes[currentTheme as keyof typeof mapThemes].url}
            attribution={mapThemes[currentTheme as keyof typeof mapThemes].attribution}
          />

          {/* Custom Zoom Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
            <button
              onClick={() => map?.zoomIn()}
              className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => map?.zoomOut()}
              className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Markers */}
          {itinerary.map((stop, idx) => (
            <Marker 
              key={idx} 
              position={stop.coords as LatLngExpression} 
              icon={getIcon(idx+1)}
            >
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
                positions={fromCity && toCity ? [fromCity.coords, toCity.coords] as LatLngExpression[] : []}
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
        <div className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-2">
          {/* Theme selector */}
          <button
            onClick={cycleTheme}
            className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={`Current: ${currentTheme} - Click to cycle`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </button>
        </div>
      </div>
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
