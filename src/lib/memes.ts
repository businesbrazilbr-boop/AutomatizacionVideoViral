import type { TrendingMeme } from '../types';
import { discoverRedditMemes } from './reddit';

export async function discoverTrendingMemes(): Promise<TrendingMeme[]> {
  const [justmeme, reddit] = await Promise.allSettled([
    discoverJustmemeMemes(),
    discoverRedditMemes(),
  ]);

  const memes: TrendingMeme[] = [];
  if (justmeme.status === 'fulfilled') memes.push(...justmeme.value);
  if (reddit.status === 'fulfilled') memes.push(...reddit.value);

  return memes.slice(0, 20);
}

async function discoverJustmemeMemes(): Promise<TrendingMeme[]> {
  try {
    const res = await fetch('https://justmeme.wtf/api/v1/trending');
    if (!res.ok) return [];
    const data: any = await res.json();
    if (!data.trending || !Array.isArray(data.trending)) return [];

    return data.trending.map((m: any) => ({
      id: m.id || m.slug,
      name: m.name,
      slug: m.slug,
      url: m.url,
      categories: m.categories || [],
      source: 'justmeme' as const,
    }));
  } catch {
    return [];
  }
}
