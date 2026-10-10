import test from 'node:test';
import assert from 'node:assert/strict';
import { createService } from '../src/service.mjs';
import { AppError } from '../src/lib/domain.mjs';
const area = {id:'pilot',bbox:{south:22,north:23,west:88,east:89}};
function fixture(){
  const places=new Map(), votes=new Set();
  const repo={list:async()=>[...places.values()],get:async(a,id)=>places.get(id),create:async p=>places.set(p.placeId,p),vote:async v=>{ const key=v.placeId+v.userId; if(votes.has(key))throw new AppError(409,'already_voted'); votes.add(key); places.get(v.placeId)[v.voteType==='confirm'?'confirmCount':'reportCount']++; }};
  return createService(repo,area);
}
test('contribution lifecycle: own vote rejected, two independent confirmations, duplicate blocked',async()=>{
  const s=fixture(); const p=await s.create('owner',{name:'Point',type:'ewaste',lat:22.5,lng:88.5});
  assert.equal(p.status,'unverified');
  await assert.rejects(s.vote('owner',p.placeId,'confirm',{}),{status:403});
  assert.equal((await s.vote('one',p.placeId,'confirm',{})).status,'unverified');
  await assert.rejects(s.vote('one',p.placeId,'report',{}),{status:409});
  assert.equal((await s.vote('two',p.placeId,'confirm',{})).status,'verified');
  await s.vote('three',p.placeId,'report',{});
  assert.equal((await s.vote('four',p.placeId,'report',{})).status,'reported');
});
test('authentication, missing place and validation enforced on the service boundary',async()=>{
  const s=fixture();
  await assert.rejects(s.create(null,{}),{status:401});
  await assert.rejects(s.vote(null,'none','confirm',{}),{status:401});
  await assert.rejects(s.vote('user','none','confirm',{}),{status:404});
  await assert.rejects(s.create('user',{name:'Bad',type:'toilet',lat:0,lng:0}),{status:400});
});
