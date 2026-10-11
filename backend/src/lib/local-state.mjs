import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';

// Update source metadata, preserving local contributions and every recorded vote.
export function mergeLocalSeeds(state, seeds) {
  if (!state || !Array.isArray(state.places) || !Array.isArray(state.votes)) {
    throw new Error('Invalid local state. Back up .local-data/state.json before repairing it.');
  }
  const byId = new Map(seeds.map(place => [place.placeId, place]));
  const existingIds = new Set(state.places.map(place => place.placeId));
  return {
    ...state,
    places: [
      ...state.places.map(place => {
        const seed = byId.get(place.placeId);
        if (!seed || place.source === 'user' || place.createdBy !== 'seed') return place;
        return { ...seed, createdBy: 'seed', confirmCount: place.confirmCount, reportCount: place.reportCount };
      }),
      ...seeds.filter(place => !existingIds.has(place.placeId)).map(place => ({ ...place, createdBy: 'seed', confirmCount: 0, reportCount: 0 })),
    ],
    votes: state.votes,
  };
}

export function saveLocalState(path, state) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(`${path}.tmp`, JSON.stringify(state, null, 2));
  renameSync(`${path}.tmp`, path);
}

export function loadLocalState(path, seeds) {
  let state;
  try { state = JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    state = { places: [], votes: [] };
  }
  const merged = mergeLocalSeeds(state, seeds);
  saveLocalState(path, merged);
  return merged;
}
