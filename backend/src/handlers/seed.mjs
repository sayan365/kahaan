// One-time console seed handler. Never attached to an HTTP route.
// Temporarily choose src/handlers/seed.handler in Lambda, invoke {}, then restore api.handler.
import { readFileSync } from 'node:fs';
import { repository } from '../lib/db.mjs';
import { validatePlace } from '../lib/domain.mjs';
const area = JSON.parse(readFileSync(new URL('../../area.json', import.meta.url), 'utf8'));
const places = JSON.parse(readFileSync(new URL('../../seed_places.json', import.meta.url), 'utf8'));
export async function handler() {
  let inserted = 0;
  for (const place of places) {
    validatePlace(place, area.bbox);
    if (!place.placeId) throw new Error('Seed needs a stable ID.');
    try {
      await repository.create({ ...place, area: area.id, createdBy: 'seed', confirmCount: 0, reportCount: 0 });
      inserted++;
    } catch (error) {
      if (error.name !== 'ConditionalCheckFailedException') throw error;
    }
  }
  return { inserted, total: places.length, note: 'Existing places and votes preserved.' };
}
