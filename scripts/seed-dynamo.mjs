import { readFile } from 'node:fs/promises';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { validatePlace } from '../backend/src/lib/domain.mjs';
if(!process.env.PLACES_TABLE)throw new Error('Set PLACES_TABLE to the deployed Places table name.');
const area=JSON.parse(await readFile('data/area.json','utf8'));
const all=[...JSON.parse(await readFile('data/osm_places.json','utf8').catch(()=> '[]')),...JSON.parse(await readFile('data/manual_places.json','utf8'))];
const db=DynamoDBDocumentClient.from(new DynamoDBClient({region:process.env.AWS_REGION||'ap-south-1'}));
let inserted=0;
for(const p of all){
  validatePlace(p,area.bbox);
  if(!p.placeId)throw new Error('Seed record needs a stable placeId.');
  try{await db.send(new PutCommand({TableName:process.env.PLACES_TABLE,Item:{...p,area:area.id,createdBy:'seed',confirmCount:0,reportCount:0},ConditionExpression:'attribute_not_exists(placeId)'})); inserted++;}
  catch(e){if(e.name!=='ConditionalCheckFailedException')throw e;}
}
console.log(`Inserted ${inserted}; existing places and votes preserved.`);
