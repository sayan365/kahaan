export const PLACE_TYPES = ['ewaste', 'recycling', 'dustbin', 'toilet'];
export class AppError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
export function computeStatus({ confirmCount = 0, reportCount = 0 }) {
  if (confirmCount >= 2 && confirmCount > reportCount) return 'verified';
  if (reportCount >= 2 && reportCount >= confirmCount) return 'reported';
  return 'unverified';
}
export function insideArea(lat, lng, bbox) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= bbox.south && lat <= bbox.north && lng >= bbox.west && lng <= bbox.east;
}
export function haversine(a, b) {
  const rad = n => n * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, x)), Math.sqrt(Math.max(0, 1 - x)));
}
export function validatePlace(body, bbox) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AppError(400, 'invalid_input');
  if (!PLACE_TYPES.includes(body.type)) throw new AppError(400, 'invalid_type');
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 80) throw new AppError(400, 'invalid_name');
  if (!insideArea(body.lat, body.lng, bbox)) throw new AppError(400, 'outside_area');
  if (body.note !== undefined && (typeof body.note !== 'string' || body.note.length > 200)) throw new AppError(400, 'invalid_note');
  return { type: body.type, name: body.name.trim(), lat: body.lat, lng: body.lng, note: (body.note || '').trim() };
}
export function validateVote(type, body = {}) {
  if (!['confirm', 'report'].includes(type)) throw new AppError(400, 'invalid_vote');
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AppError(400, 'invalid_input');
  if (body.reason !== undefined && (typeof body.reason !== 'string' || body.reason.length > 200)) throw new AppError(400, 'invalid_reason');
  return type === 'report' ? (body.reason || '').trim() : '';
}
export function publicPlace(place) {
  const { createdBy, area, ...rest } = place;
  return { ...rest, status: computeStatus(place) };
}
export function nearestDestination(places, placeTypes, origin) {
  for (const type of placeTypes) {
    const matches = places.filter(p => p.type === type && computeStatus(p) !== 'reported' && p.recommendable !== false);
    matches.sort((a, b) => haversine(origin, a) - haversine(origin, b));
    if (matches.length) return matches[0];
  }
  return null;
}
