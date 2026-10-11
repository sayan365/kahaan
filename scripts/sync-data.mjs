import { readFile, writeFile } from 'node:fs/promises';
const area = await readFile('data/area.json','utf8');
await writeFile('backend/area.json',area);
const osm = await readFile('data/osm_places.json','utf8').catch(()=> '[]');
const manual = await readFile('data/manual_places.json','utf8');
await writeFile('backend/seed_places.json',JSON.stringify([...JSON.parse(osm),...JSON.parse(manual)],null,2));
