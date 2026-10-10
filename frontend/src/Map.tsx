import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Rectangle, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import type { Place, Point, Locale } from './types';
import area from '../../data/area.json';
import { text } from './i18n';
const colours = { toilet: '#5268b5', dustbin: '#176b59', recycling: '#287b91', ewaste: '#a7650e' };
function Events({ point, onPin }: { point?: Point | null; onPin?: (p: Point) => void }) {
  const map = useMap(); useMapEvents({ click(e) { onPin?.({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  useEffect(() => { if (point) map.flyTo([point.lat, point.lng], 16, { animate: !matchMedia('(prefers-reduced-motion: reduce)').matches }); }, [point?.lat, point?.lng, map]);
  useEffect(() => { const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(map.getContainer()); return () => observer.disconnect(); }, [map]);
  return null;
}
export function CivicMap({ places, selected, origin, pin, onPin, onSelect, locale }: { places: Place[]; selected?: Place | null; origin?: Point | null; pin?: Point | null; onPin?: (p: Point) => void; onSelect?: (p: Place) => void; locale: Locale }) {
  const b = area.bbox;
  return <div className="map-wrap"><MapContainer center={[area.center.lat, area.center.lng]} zoom={area.zoom} className="civic-map" scrollWheelZoom={false} attributionControl zoomControl={false}>
    <ZoomControl position="topleft" zoomInTitle={text(locale,'zoomIn')} zoomOutTitle={text(locale,'zoomOut')}/>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' />
    <Rectangle bounds={[[b.south, b.west], [b.north, b.east]]} pathOptions={{ color: '#176b59', fillOpacity: 0.025, weight: 1, dashArray: '5 5' }}/>
    {places.map(p => <CircleMarker key={p.placeId} center={[p.lat, p.lng]} radius={p.placeId === selected?.placeId ? 11 : 7} pathOptions={{ color: p.status === 'reported' ? '#6b7280' : colours[p.type], fillColor: p.status === 'unverified' ? '#ffffff' : colours[p.type], fillOpacity: 0.95, weight: 3 }} eventHandlers={{ click: () => onSelect?.(p) }}><Tooltip>{p.name} · {text(locale, p.status)}</Tooltip></CircleMarker>)}
    {origin && <CircleMarker center={[origin.lat, origin.lng]} radius={6} pathOptions={{ color: '#fff', fillColor: '#2873c6', fillOpacity: 1, weight: 3 }}><Tooltip>{text(locale, 'yourDistance')}</Tooltip></CircleMarker>}
    {pin && <CircleMarker center={[pin.lat, pin.lng]} radius={10} pathOptions={{ color: '#172e29', fillColor: '#f4c85b', fillOpacity: 1, weight: 3 }}/>}<Events point={pin || selected} onPin={onPin}/>
  </MapContainer><span className="map-caption">{text(locale, 'onlineOnly')}</span></div>;
}
