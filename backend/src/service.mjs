import { randomUUID } from 'node:crypto';
import { AppError, publicPlace, validatePlace, validateVote } from './lib/domain.mjs';
export function createService(repo, area) {
  return {
    async list() { return (await repo.list(area.id)).map(publicPlace); },
    async create(userId, body) {
      if (!userId) throw new AppError(401, 'sign_in_required');
      const input = validatePlace(body, area.bbox);
      const place = { ...input, area: area.id, placeId: randomUUID(), source: 'user', createdBy: userId, createdAt: new Date().toISOString(), confirmCount: 0, reportCount: 0 };
      await repo.create(place);
      return publicPlace(place);
    },
    async vote(userId, id, type, body) {
      if (!userId) throw new AppError(401, 'sign_in_required');
      const reason = validateVote(type, body);
      const place = await repo.get(area.id, id);
      if (!place) throw new AppError(404, 'not_found');
      if (place.createdBy === userId) throw new AppError(403, 'own_place');
      await repo.vote({ area: area.id, placeId: id, userId, voteType: type, reason, createdAt: new Date().toISOString() });
      return publicPlace(await repo.get(area.id, id));
    }
  };
}
