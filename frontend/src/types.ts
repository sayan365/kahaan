export type Locale = 'en' | 'bn' | 'hi';
export type PlaceType = 'ewaste' | 'recycling' | 'dustbin' | 'toilet';
export type Point = { lat: number; lng: number };
export type Place = Point & { placeId: string; name: string; type: PlaceType; note: string; source: string; sourceUrl?: string; locationSourceUrl?: string; sourceUpdatedAt?: string; researchDate?: string; status: 'verified' | 'unverified' | 'reported'; confirmCount: number; reportCount: number; acceptedItems?: string[]; acceptedItemIds?: string[]; recommendable?: boolean; approximate?: boolean };
export type Item = { id: string; name: string; aliases: string[]; category: string; placeTypes: PlaceType[]; tip: string; translations: Record<'bn' | 'hi', { name: string; aliases: string[]; tip: string }> };
