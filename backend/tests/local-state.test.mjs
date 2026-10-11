import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadLocalState } from '../src/lib/local-state.mjs';

const seeds = [...JSON.parse(readFileSync('data/osm_places.json', 'utf8')), ...JSON.parse(readFileSync('data/manual_places.json', 'utf8'))];

test('fresh local install includes all source categories at zero votes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kahaan-state-'));
  try {
    const state = loadLocalState(join(dir, 'state.json'), seeds);
    assert.equal(state.places.length, seeds.length);
    assert.deepEqual([...new Set(state.places.map(p => p.type))].sort(), ['dustbin', 'ewaste', 'recycling', 'toilet']);
    assert.ok(state.places.every(p => p.confirmCount === 0 && p.reportCount === 0));
  } finally { rmSync(dir, { recursive: true }); }
});

test('local catalogue upgrade preserves user places and votes and is repeatable', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kahaan-state-'));
  const path = join(dir, 'state.json');
  const contributed = { ...seeds[0], placeId: 'local-contribution', source: 'user', createdBy: 'demo-asha', note: 'Keep this contribution' };
  const voted = { ...seeds[0], name: 'Old source metadata', confirmCount: 2, reportCount: 1 };
  const vote = { placeId: voted.placeId, userId: 'demo-rahul', voteType: 'confirm' };
  try {
    writeFileSync(path, JSON.stringify({ places: [voted, contributed], votes: [vote] }));
    const state = loadLocalState(path, seeds);
    assert.equal(state.places.length, seeds.length + 1);
    assert.deepEqual(state.places.find(p => p.placeId === contributed.placeId), contributed);
    assert.equal(state.places[0].name, seeds[0].name);
    assert.equal(state.places[0].confirmCount, 2);
    assert.equal(state.places[0].reportCount, 1);
    assert.deepEqual(state.votes, [vote]);
    assert.deepEqual(loadLocalState(path, seeds), state);
  } finally { rmSync(dir, { recursive: true }); }
});

test('corrupt or malformed local state is not replaced', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kahaan-state-'));
  const path = join(dir, 'state.json');
  try {
    for (const content of ['{broken', '{"places":[]}']) {
      writeFileSync(path, content);
      assert.throws(() => loadLocalState(path, seeds));
      assert.equal(readFileSync(path, 'utf8'), content);
    }
  } finally { rmSync(dir, { recursive: true }); }
});
