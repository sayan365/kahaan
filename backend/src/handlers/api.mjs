import { readFileSync } from 'node:fs';
import { repository } from '../lib/db.mjs';
import { createService } from '../service.mjs';
import { AppError } from '../lib/domain.mjs';
const area = JSON.parse(readFileSync(new URL('../../area.json', import.meta.url), 'utf8'));
const service = createService(repository, area);
export async function handler(event) {
  try {
    const path = event.rawPath; const method = event.requestContext.http.method;
    const user = event.requestContext.authorizer?.jwt?.claims?.sub;
    let body = {};
    if (event.body) { try { body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body); } catch { throw new AppError(400, 'invalid_input'); } }
    if (method === 'GET' && path === '/places') return respond(200, await service.list());
    if (method === 'POST' && path === '/places') return respond(201, await service.create(user, body));
    const match = path.match(/^\/places\/([^/]+)\/(confirm|report)$/);
    if (method === 'POST' && match) return respond(200, await service.vote(user, match[1], match[2], body));
    throw new AppError(404, 'not_found');
  } catch (error) {
    if (!(error instanceof AppError)) console.error('Request failed', { name: error.name });
    return respond(error.status || 500, { error: error instanceof AppError ? error.code : 'server_error' });
  }
}
function respond(statusCode, body) { return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) }; }
