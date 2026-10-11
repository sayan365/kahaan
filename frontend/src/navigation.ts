import type { PlaceType } from './types';

export type Screen = 'start' | 'nearby' | 'guide';
export type Filter = PlaceType | 'all' | 'bins';
export type Route = { screen: Screen; filter: Filter; query: string };
const filters: Filter[] = ['all', 'bins', 'toilet', 'dustbin', 'recycling', 'ewaste'];

export function readRoute(hash: string): Route {
  const [path, search = ''] = hash.replace(/^#\/?/, '').split('?');
  const params = new URLSearchParams(search);
  const filter = params.get('filter') as Filter;
  return {
    screen: path === 'nearby' || path === 'guide' ? path : 'start',
    filter: filters.includes(filter) ? filter : 'all',
    query: (params.get('q') || '').slice(0, 200),
  };
}

export function routeHash(route: Route): string {
  const params = new URLSearchParams();
  if (route.filter !== 'all') params.set('filter', route.filter);
  if (route.query.trim()) params.set('q', route.query);
  return `#/${route.screen}${params.size ? `?${params}` : ''}`;
}
