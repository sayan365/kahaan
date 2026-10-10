import { readFile, writeFile } from 'node:fs/promises';
import { insideArea } from '../backend/src/lib/domain.mjs';
const area=JSON.parse(await readFile('data/area.json','utf8'));
const {south,west,north,east}=area.bbox;
const bbox=[south,west,north,east].join(',');
const query=`[out:json][timeout:30];(nwr["amenity"="toilets"](${bbox});nwr["amenity"="waste_basket"](${bbox});nwr["amenity"="waste_disposal"](${bbox});nwr["amenity"="recycling"](${bbox}););out center meta;`;
let data;
for(const endpoint of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){
  try { const r=await fetch(`${endpoint}?${new URLSearchParams({data:query})}`,{headers:{'User-Agent':'Kahaan-Hackathon/0.1 (online civic map research)'},signal:AbortSignal.timeout(45000)}); if(!r.ok)throw new Error(`HTTP ${r.status}`); data=await r.json(); break; } catch(e){ console.error(`Overpass request failed: ${e.message}`); }
}
if(!data)throw new Error('No OSM data fetched. Existing data was not changed.');
const names={toilet:'Public toilet',dustbin:'Public bin',recycling:'Recycling point',ewaste:'E-waste collection point'};
const places=data.elements.flatMap(el=>{
  const lat=el.lat??el.center?.lat,lng=el.lon??el.center?.lon,t=el.tags||{};
  if(!insideArea(lat,lng,area.bbox)||['private','no','customers'].includes(t.access))return [];
  let type={toilets:'toilet',waste_basket:'dustbin',waste_disposal:'dustbin',recycling:'recycling'}[t.amenity];
  if(t['recycling:electrical_items']==='yes'||t['recycling:small_appliances']==='yes')type='ewaste';
  const acceptedItems=Object.entries(t).filter(([key,val])=>key.startsWith('recycling:')&&val==='yes').map(([key])=>key.slice(10));
  const disposal=t.amenity==='waste_disposal';
  return [{placeId:`osm-${el.type}-${el.id}`,area:area.id,type,name:t.name||(disposal?'Mapped waste-disposal point':names[type]),lat,lng,note:[disposal?'Public access and accepted waste unconfirmed; not an automatic destination.':t.amenity==='waste_basket'?'Small litter only; no household, electronic or hazardous waste.':null,t.description,t.opening_hours?`Listed hours: ${t.opening_hours}`:null].filter(Boolean).join(' · ').slice(0,200),source:'osm',sourceUrl:`https://www.openstreetmap.org/${el.type}/${el.id}`,sourceUpdatedAt:el.timestamp,researchDate:new Date().toISOString().slice(0,10),acceptedItems,...(disposal?{acceptedItemIds:[]}:t.amenity==='waste_basket'?{acceptedItemIds:['plastic-bottle','plastic-wrapper','paper']}:{}),createdBy:'seed',createdAt:el.timestamp||new Date().toISOString(),confirmCount:0,reportCount:0,recommendable:!disposal}];
});
await writeFile('data/osm_places.json',JSON.stringify(places,null,2));
console.log(`Saved ${places.length} source-backed OSM candidates. No community votes or field checks implied.`);
await import('./sync-data.mjs');
