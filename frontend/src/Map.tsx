import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, Rectangle, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { divIcon } from 'leaflet';
import type { Place, Point, Locale } from './types';
import area from '../../data/area.json';
import { text } from './i18n';
const colours = { toilet: '#5268b5', dustbin: '#176b59', recycling: '#287b91', ewaste: '#a7650e' };
function Events({ point, onPin, immersive, places }: { point?: Point | null; onPin?: (p: Point) => void; immersive: boolean; places: Place[] }) {
  const map = useMap(); useMapEvents({ click(e) { onPin?.({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  useEffect(() => {
    const applyView = (animate: boolean) => {
    if (point) {
      const mobileOffset = immersive && matchMedia('(max-width: 760px)').matches ? map.getSize().y * .2 : 0;
      const centre = map.unproject(map.project([point.lat, point.lng], 16).add([0, mobileOffset]), 16);
      map.flyTo(centre, 16, { animate });
    } else if (immersive) {
      const mobile = matchMedia('(max-width: 760px)').matches;
      const bounds: [number, number][] = places.length ? places.map(p => [p.lat, p.lng]) : [[area.bbox.south, area.bbox.west], [area.bbox.north, area.bbox.east]];
      map.fitBounds(bounds, { maxZoom: places.length === 1 ? 16 : area.zoom, paddingTopLeft: mobile ? [24, Math.min(220, map.getSize().y * .28)] : [24, 180], paddingBottomRight: mobile ? [24, Math.min(100, map.getSize().y * .15)] : [60, 70], animate: false });
    }
    };
    applyView(!matchMedia('(prefers-reduced-motion: reduce)').matches);
    const observer = new ResizeObserver(() => { map.invalidateSize(); applyView(false); });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [point?.lat, point?.lng, map, immersive, places]);
  return null;
}
export function CivicMap({ places, selected, origin, pin, onPin, onSelect, locale, immersive = false }: { places: Place[]; selected?: Place | null; origin?: Point | null; pin?: Point | null; onPin?: (p: Point) => void; onSelect?: (p: Place) => void; locale: Locale; immersive?: boolean }) {
  const b = area.bbox;
  return <div className="map-wrap"><MapContainer center={[area.center.lat, area.center.lng]} zoom={area.zoom} className="civic-map" scrollWheelZoom={immersive} attributionControl zoomControl={false}>
    <ZoomControl key={locale} position={immersive ? 'bottomright' : 'topleft'} zoomInTitle={text(locale,'zoomIn')} zoomOutTitle={text(locale,'zoomOut')}/>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' />
    <Rectangle bounds={[[b.south, b.west], [b.north, b.east]]} pathOptions={{ color: '#176b59', fillOpacity: 0.025, weight: 1, dashArray: '5 5' }}/>
    {places.map(p => immersive ? <Marker key={`${p.placeId}-${locale}-${p.status}`} position={[p.lat, p.lng]} title={`${p.name} · ${text(locale, p.status)}`} alt={p.name} keyboard icon={divIcon({ className: `facility-marker type-${p.type} marker-${p.status} ${p.placeId === selected?.placeId ? 'marker-selected' : ''}`, html: `<span aria-hidden="true">${{ toilet: 'T', dustbin: 'B', recycling: 'R', ewaste: 'E' }[p.type]}</span>`, iconSize: [32, 32], iconAnchor: [16, 16] })} eventHandlers={{ click: () => onSelect?.(p), add: event => { const element = event.target.getElement(); if (element) element.onkeydown = (key: KeyboardEvent) => { if (key.key === "Enter" || key.key === " ") { key.preventDefault(); event.target.fire("click"); } }; } }}><Tooltip>{p.name} · {text(locale, p.status)}</Tooltip></Marker> : <CircleMarker key={p.placeId} center={[p.lat, p.lng]} radius={p.placeId === selected?.placeId ? 11 : 7} pathOptions={{ color: p.status === 'reported' ? '#6b7280' : colours[p.type], fillColor: p.status === 'unverified' ? '#ffffff' : colours[p.type], fillOpacity: 0.95, weight: 3 }} eventHandlers={{ click: () => onSelect?.(p) }}><Tooltip>{p.name} · {text(locale, p.status)}</Tooltip></CircleMarker>)}
    {origin && <CircleMarker center={[origin.lat, origin.lng]} radius={6} pathOptions={{ color: '#fff', fillColor: '#2873c6', fillOpacity: 1, weight: 3 }}><Tooltip>{text(locale, 'yourDistance')}</Tooltip></CircleMarker>}
    {pin && <CircleMarker center={[pin.lat, pin.lng]} radius={10} pathOptions={{ color: '#172e29', fillColor: '#f4c85b', fillOpacity: 1, weight: 3 }}/>}<Events point={pin || selected} onPin={onPin} immersive={immersive} places={places}/>
  </MapContainer><span className="map-caption">{text(locale, 'onlineOnly')}</span></div>;
}
