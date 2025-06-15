'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { LatLngExpression } from 'leaflet';

// Dynamically import react-leaflet components (no SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(m => m.Tooltip), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });

// Gradient colors for routes (blue to purple)
const routeColors = [
  '#1a237e', // Deep Blue
  '#283593', // Indigo
  '#303f9f', // Deep Indigo
  '#3949ab', // Indigo
  '#3f51b5', // Indigo
  '#5c6bc0', // Indigo
  '#7986cb', // Light Indigo
  '#9fa8da', // Light Indigo
  '#c5cae9', // Very Light Indigo
];

// Map themes
const mapThemes = {
  default: {
    name: 'Default',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  dark: {
    name: 'Dark',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '&copy; Stadia Maps, &copy; OpenMapTiles'
  },
  light: {
    name: 'Light',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    attribution: '&copy; Stadia Maps, &copy; OpenMapTiles'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri'
  },
  topo: {
    name: 'Topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap, &copy; OpenStreetMap contributors'
  },

  positron: {
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; CartoDB, &copy; OpenStreetMap contributors'
  },
  darkMatter: {
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution: '&copy; CartoDB, &copy; OpenStreetMap contributors'
  }
};
// Define extended itinerary including Chicago
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

// Detailed segment definitions
const segments = [
  { from: 'Oakland, CA', to: 'Los Angeles, CA', coords: [[37.8044,-122.2711],[34.0522,-118.2437]] as LatLngExpression[], date: 'Jun 28', departTime: '9:21 PM', arrival: '9:06 PM', arrivalDate: 'Jun 28', name: 'Coast Starlight', nights: 0 },
  { from: 'Los Angeles, CA', to: 'Atlanta, GA', coords: [[34.0522,-118.2437],[33.7490,-84.3880]] as LatLngExpression[], date: 'Jun 29', departTime: '10:00 PM', arrival: '11:29 PM', arrivalDate: 'Jun 30', name: 'Sunset Limited → Crescent', nights: 1 },
  { from: 'Atlanta, GA', to: 'Washington, DC', coords: [[33.7490,-84.3880],[38.9072,-77.0369]] as LatLngExpression[], date: 'Jun 30', departTime: '7:55 PM', arrival: '5:31 AM', arrivalDate: 'Jul 2', name: 'Crescent', nights: 3 },
  { from: 'Washington, DC', to: 'New York, NY', coords: [[38.9072,-77.0369],[40.7128,-74.0060]] as LatLngExpression[], date: 'Jul 5', departTime: '8:05 AM', arrival: '12:25 PM', arrivalDate: 'Jul 5', name: 'Northeast Regional', nights: 1 },
  { from: 'New York, NY', to: 'Raleigh, NC', coords: [[40.7128,-74.0060],[35.7796,-78.6382]] as LatLngExpression[], date: 'Jul 6', departTime: '7:04 AM', arrival: '6:15 PM', arrivalDate: 'Jul 6', name: 'Carolinian', nights: 2 },
  { from: 'Raleigh, NC', to: 'Chicago, IL', coords: [[35.7796,-78.6382],[41.8781,-87.6298]] as LatLngExpression[], date: 'Jul 8', departTime: '4:05 PM', arrival: '8:45 AM', arrivalDate: 'Jul 9', name: 'Carolinian ↝ Capitol Limited (through-fare)', nights: 0 },
  { from: 'Chicago, IL', to: 'Lincoln, NE', coords: [[41.8781,-87.6298],[40.8136,-96.7026]] as LatLngExpression[], date: 'Jul 9', departTime: '2:00 PM', arrival: '7:20 PM', arrivalDate: 'Jul 9', name: 'California Zephyr (CHI→LIN)', nights: 1 },
  { from: 'Lincoln, NE', to: 'Denver, CO', coords: [[40.8136,-96.7026],[39.7392,-104.9903]] as LatLngExpression[], date: 'Jul 10', departTime: '8:05 AM', arrival: '1:30 PM', arrivalDate: 'Jul 10', name: 'California Zephyr (LIN→DEN)', nights: 2 },
  { from: 'Denver, CO', to: 'Oakland, CA', coords: [[39.7392,-104.9903],[37.8044,-122.2711]] as LatLngExpression[], date: 'Jul 12', departTime: '7:15 PM', arrival: '8:25 PM', arrivalDate: 'Jul 12', name: 'California Zephyr (DEN→OAK)', nights: 0 },
];

export default function Home() {
  const [today, setToday] = useState(new Date());
  const [currentTheme, setCurrentTheme] = useState('default');
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  const center: LatLngExpression = [39.8283, -98.5795];

  // Determine current segment
  const currentIndex = segments.findIndex(seg => {
    const segDate = new Date(`${seg.date} 2025`);
    const arrDate = new Date(`${seg.arrivalDate} 2025`);
    return today >= segDate && today < new Date(arrDate.getTime() + 24*60*60*1000);
  });

  // Create numbered icon
  const getNumberIcon = (num: number) => {
    if (!L) return null;
    return new L.DivIcon({
      html: `<div style="background:#fff;border:2px solid #4287f5;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#4287f5;">${num}</div>`,
      className: ''
    });
  };

  return (
    <div className="h-screen w-screen relative">
      {/* Theme selector */}
      <div className="absolute top-4 right-4 z-[1000] bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
        <select 
          value={currentTheme}
          onChange={(e) => setCurrentTheme(e.target.value)}
          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded border border-gray-300 dark:border-gray-600"
        >
          {Object.entries(mapThemes).map(([key, theme]) => (
            <option key={key} value={key}>{theme.name}</option>
          ))}
        </select>
      </div>

      {/* Map key */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
        <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Route Progress</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-8 h-2 bg-blue-500 mr-2"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Current Segment</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-2 bg-gray-400 mr-2"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Upcoming</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-2 bg-gray-200 mr-2"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
          </div>
        </div>
      </div>

      <MapContainer 
        center={center} 
        zoom={4} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution={mapThemes[currentTheme as keyof typeof mapThemes].attribution}
          url={mapThemes[currentTheme as keyof typeof mapThemes].url}
        />

        {/* Markers with numbered icons */}
        {itinerary.map((stop, idx) => (
          <Marker
            key={idx}
            position={stop.coords}
            icon={getNumberIcon(idx + 1)}
          >
            <Tooltip>
              <div>
                <strong>#{idx + 1} {stop.city}</strong><br />
                Arrival: {stop.arrival}<br />
                Departure: {stop.departure}<br />
                Nights: {stop.nights}
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* Polylines with detailed tooltips */}
        {segments.map((seg, idx) => (
          <Polyline
            key={idx}
            positions={seg.coords}
            pathOptions={{
              color: routeColors[idx % routeColors.length],
              weight: idx === currentIndex ? 8 : 4,
              dashArray: idx > currentIndex ? '8,4' : undefined,
              opacity: 0.9,
            }}
            eventHandlers={{
              mouseover: (e) => e.target.setStyle({ weight: 10 }),
              mouseout: (e) => e.target.setStyle({ weight: idx === currentIndex ? 8 : 4 }),
            }}
          >
            <Tooltip sticky>
              <div>
                <strong>Segment {idx + 1}: {seg.name}</strong><br />
                Date: {seg.date}<br />
                {seg.from} → {seg.to}<br />
                Departs: {seg.departTime}<br />
                Arrives: {seg.arrival} ({seg.arrivalDate})<br />
                Nights at stop: {seg.nights}
        </div>
            </Tooltip>
          </Polyline>
        ))}
      </MapContainer>
    </div>
  );
}
