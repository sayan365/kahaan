import test from 'node:test';
import assert from 'node:assert/strict';
import { computeStatus, haversine, validatePlace, validateVote, nearestDestination, publicPlace } from '../src/lib/domain.mjs';
const box = { south: 22, north: 23, west: 88, east: 89 };
test('trust thresholds, ties, and asymmetric counts', () => {
  for (const [confirmCount, reportCount, status] of [[0,0,'unverified'],[1,0,'unverified'],[0,1,'unverified'],[1,1,'unverified'],[2,0,'verified'],[2,1,'verified'],[2,2,'reported'],[0,2,'reported'],[5,2,'verified'],[2,3,'reported']]) assert.equal(computeStatus({confirmCount,reportCount}),status);
});
test('coordinates, names, types and optional fields reject malformed input', () => {
  const valid = {type:'ewaste', name:' Charger point ', lat:22.5,lng:88.5};
  assert.equal(validatePlace(valid,box).name,'Charger point');
  for (const bad of [{type:'fake'},{name:''},{name:'x'.repeat(5000)},{lat:NaN},{lng:Infinity},{lat:'22.5'},{lat:21},{note:'x'.repeat(201)},{note:3}]) assert.throws(()=>validatePlace({...valid,...bad},box));
  assert.doesNotThrow(()=>validatePlace({...valid,lat:22,lng:89},box));
  assert.throws(()=>validatePlace(null,box));
  assert.throws(()=>validateVote('report',{reason:'x'.repeat(201)}));
});
test('haversine gives zero, symmetry, a known distance and antipodes', () => {
  assert.equal(haversine({lat:0,lng:0},{lat:0,lng:0}),0);
  assert.ok(Math.abs(haversine({lat:0,lng:0},{lat:0,lng:1})-111195)<2);
  assert.ok(Number.isFinite(haversine({lat:0,lng:0},{lat:0,lng:180})));
  assert.equal(haversine({lat:22,lng:88},{lat:23,lng:89}),haversine({lat:23,lng:89},{lat:22,lng:88}));
});
test('recommendations prefer correct stream and exclude reported or unsuitable points', () => {
  const places = [{placeId:'bin',type:'dustbin',lat:0,lng:0},{placeId:'recycle',type:'recycling',lat:0,lng:1},{placeId:'bad',type:'recycling',lat:0,lng:0,confirmCount:0,reportCount:2}];
  assert.equal(nearestDestination(places,['recycling','dustbin'],{lat:0,lng:0}).placeId,'recycle');
  assert.equal(nearestDestination(places,['ewaste'],{lat:0,lng:0}),null);
  assert.equal(nearestDestination([{...places[1],recommendable:false}],['recycling'],{lat:0,lng:0}),null);
});
test('public response never exposes creator or partition key', () => {
  const p=publicPlace({createdBy:'secret',area:'x',placeId:'1',confirmCount:0,reportCount:0});
  assert.equal(p.createdBy,undefined); assert.equal(p.area,undefined); assert.equal(p.status,'unverified');
});
