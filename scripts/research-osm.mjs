// One-off, rate-limited online research fallback. Nominatim is not queried by app users.
import { readFile, writeFile } from 'node:fs/promises';
import { insideArea } from '../backend/src/lib/domain.mjs';
const area=JSON.parse(await readFile('data/area.json','utf8'));
const b=area.bbox, places=[];
for(const [amenity,type] of [['toilets','toilet'],['waste_basket','dustbin'],['recycling','recycling']]){
  const params=new URLSearchParams({q:`[${amenity}]`,viewbox:`${b.west},${b.north},${b.east},${b.south}`,bounded:'1',format:'jsonv2',extratags:'1',limit:'30'});
  const r=await fetch(`https://nominatim.openstreetmap.org/search?${params}`,{headers:{'User-Agent':'Kahaan-Hackathon/0.1 civic discovery research'},signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw new Error(`Nominatim ${r.status}: previous data preserved`);
  const records=await r.json();
  for(const p of records){
    const tags=p.extratags||{},lat=Number(p.lat),lng=Number(p.lon);
    if(!insideArea(lat,lng,b)||['private','no','customers'].includes(tags.access)||p.display_name.includes('Howrah Maidan'))continue;
    const landmark=p.display_name.split(',')[p.name?1:0]?.trim();
    const name=p.name||`${type==='toilet'?'Public toilet':type==='dustbin'?'Public bin':'Recycling point'} · ${landmark}`;
    if(name.length>80)continue;
    const note=[landmark,tags.fee==='yes'?'Fee listed; current amount unknown':null,tags['toilets:position']==='urinal'?'Urinal listed':null,tags.male==='yes'&&tags.female!=='yes'?'Listed for men; other access unknown':null].filter(Boolean).join(' · ').slice(0,200);
    places.push({placeId:`osm-${p.osm_type}-${p.osm_id}`,area:area.id,type,name,lat,lng,note,source:'osm',sourceUrl:`https://www.openstreetmap.org/${p.osm_type}/${p.osm_id}`,sourceUpdatedAt:tags.check_date||null,researchDate:'2026-10-10',createdBy:'seed',createdAt:'2026-10-10T00:00:00Z',confirmCount:0,reportCount:0,acceptedItems:Object.entries(tags).filter(([k,v])=>k.startsWith('recycling:')&&v==='yes').map(([k])=>k.slice(10))});
  }
  console.log(`${type}: ${places.filter(p=>p.type===type).length} mapped candidates`);
  await new Promise(resolve=>setTimeout(resolve,1200));
}
await writeFile('data/osm_places.json',JSON.stringify(places,null,2));
await import('./sync-data.mjs');
