import test from 'node:test';
import assert from 'node:assert/strict';
import { repository } from '../src/lib/db.mjs';
import { handler } from '../src/handlers/seed.mjs';

test('console seed starts at zero and repeated runs preserve existing records', async () => {
  const original = repository.create;
  const stored = new Map();
  repository.create = async place => {
    if (stored.has(place.placeId)) throw Object.assign(new Error('Exists'), { name: 'ConditionalCheckFailedException' });
    stored.set(place.placeId, { ...place });
  };
  try {
    const first = await handler();
    assert.ok(first.inserted > 0);
    assert.equal(first.inserted, first.total);
    for (const place of stored.values()) {
      assert.equal(place.confirmCount, 0);
      assert.equal(place.reportCount, 0);
      assert.equal(place.createdBy, 'seed');
    }
    const existing = stored.values().next().value;
    existing.confirmCount = 2;
    const second = await handler();
    assert.equal(second.inserted, 0);
    assert.equal(existing.confirmCount, 2);
  } finally { repository.create = original; }
});

test('console seed propagates infrastructure errors', async () => {
  const original = repository.create;
  repository.create = async () => { throw new Error('Service unavailable'); };
  try { await assert.rejects(handler, /Service unavailable/); }
  finally { repository.create = original; }
});
