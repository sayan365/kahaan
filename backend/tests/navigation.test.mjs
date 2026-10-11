import test from 'node:test';
import assert from 'node:assert/strict';
import { readRoute, routeHash } from '../../frontend/src/navigation.ts';

test('navigation restores multilingual search and filters, with safe defaults', () => {
  for (const query of ['charger', 'চার্জার', 'चार्जर', 'bottle & paper']) {
    const route = { screen: 'nearby', filter: 'ewaste', query };
    assert.deepEqual(readRoute(routeHash(route)), route);
  }
  assert.deepEqual(readRoute('#/unknown?filter=invalid'), { screen: 'start', filter: 'all', query: '' });
  assert.equal(readRoute('#/guide').screen, 'guide');
  assert.equal(readRoute('#/nearby?q=' + 'x'.repeat(300)).query.length, 200);
});
