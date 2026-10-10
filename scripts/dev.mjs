import './sync-data.mjs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const vitePath=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const processes=[spawn(process.execPath,['backend/local-server.mjs'],{stdio:'inherit'}),spawn(process.execPath,[vitePath,'--host','127.0.0.1'],{cwd:'frontend',stdio:'inherit'})];
function stop(){for(const p of processes)p.kill();}
process.on('SIGINT',()=>{stop();process.exit(0);});process.on('SIGTERM',()=>{stop();process.exit(0);});
for(const p of processes)p.on('exit',code=>{stop();process.exit(code||0);});
