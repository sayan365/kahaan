import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createService } from './src/service.mjs';
import { AppError } from './src/lib/domain.mjs';
import { loadLocalState, saveLocalState } from './src/lib/local-state.mjs';
const area=JSON.parse(readFileSync('data/area.json','utf8'));
const statePath='.local-data/state.json';
const seeds=[...JSON.parse(readFileSync('data/osm_places.json','utf8')),...JSON.parse(readFileSync('data/manual_places.json','utf8'))];
const state=loadLocalState(statePath,seeds);
const sessions=new Map();
function persist(){saveLocalState(statePath,state);}
const repo={
  list:async()=>state.places,
  get:async(a,id)=>state.places.find(p=>p.placeId===id),
  create:async p=>{state.places.push(p);persist();},
  vote:async v=>{
    if(state.votes.some(x=>x.placeId===v.placeId&&x.userId===v.userId))throw new AppError(409,'already_voted');
    const p=state.places.find(x=>x.placeId===v.placeId);
    if(!p)throw new AppError(404,'not_found');
    if(p.createdBy===v.userId)throw new AppError(403,'own_place');
    state.votes.push(v);p[v.voteType==='confirm'?'confirmCount':'reportCount']++;persist();
  }
};
const service=createService(repo,area);
const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  // Loopback-only local server; do not expose demo identity endpoints publicly.
  if(req.headers.origin&&!['http://127.0.0.1:5173','http://localhost:5173'].includes(req.headers.origin)){res.writeHead(403);res.end(JSON.stringify({error:'forbidden'}));return;}
  try{
    let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>10000)throw new AppError(413,'invalid_input');}
    let body={};try{if(raw)body=JSON.parse(raw);}catch{throw new AppError(400,'invalid_input');}
    const path=new URL(req.url,'http://localhost').pathname;
    const auth=req.headers.authorization?.replace(/^Bearer /,'');const user=sessions.get(auth);
    let result,code=200;
    if(req.method==='GET'&&path==='/places')result=await service.list();
    else if(req.method==='POST'&&path==='/dev/session'){
      if(!['demo-asha','demo-rahul','demo-mira'].includes(body.userId))throw new AppError(400,'invalid_input');
      const token=randomUUID();sessions.set(token,body.userId);result={token,userId:body.userId};
    }
    else if(req.method==='POST'&&path==='/places'){code=201;result=await service.create(user,body);}
    else {const match=path.match(/^\/places\/([^/]+)\/(confirm|report)$/);if(req.method==='POST'&&match)result=await service.vote(user,match[1],match[2],body);else throw new AppError(404,'not_found');}
    res.writeHead(code);res.end(JSON.stringify(result));
  }catch(e){res.writeHead(e.status||500);res.end(JSON.stringify({error:e.code||'server_error'}));}
});
server.listen(3001,'127.0.0.1',()=>console.log('Local demo API: http://127.0.0.1:3001 (simulated identities, loopback only)'));
