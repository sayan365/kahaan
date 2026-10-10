import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Fuse from 'fuse.js';
import { validatePlace } from '../src/lib/domain.mjs';
const items=JSON.parse(readFileSync('frontend/public/data/items.json','utf8'));
test('English, Bengali, Hindi and typo searches resolve stable item IDs',()=>{
  const fuse=new Fuse(items,{keys:['name','aliases','translations.bn.name','translations.bn.aliases','translations.hi.name','translations.hi.aliases'],threshold:.35,ignoreLocation:true});
  for(const [query,id] of [['charger','phone-charger'],['চার্জার','phone-charger'],['चार्जर','phone-charger'],['batteri','aa-battery'],['plastic bottle','plastic-bottle']])assert.equal(fuse.search(query)[0]?.item.id,id,query);
  for(const item of items)for(const lang of ['bn','hi'])assert.ok(item.translations[lang].name&&item.translations[lang].tip);
});
test('source seed records stay unverified, valid, uniquely identified and attributed',()=>{
  const area=JSON.parse(readFileSync('data/area.json','utf8'));
  const seeds=[...JSON.parse(readFileSync('data/osm_places.json','utf8')),...JSON.parse(readFileSync('data/manual_places.json','utf8'))];
  assert.ok(seeds.length>0);assert.equal(new Set(seeds.map(p=>p.placeId)).size,seeds.length);
  for(const p of seeds){assert.doesNotThrow(()=>validatePlace(p,area.bbox));assert.equal(p.confirmCount,0);assert.equal(p.reportCount,0);assert.match(p.sourceUrl,/^https:\/\//);}
});
