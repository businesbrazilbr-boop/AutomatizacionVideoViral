import type { TrendingMeme } from '../types';

export async function discoverTrendingMemes(): Promise<TrendingMeme[]> {
  try {
    const res = await fetch('https://justmeme.wtf/api/v1/trending');
    if (!res.ok) throw new Error('justmeme API failed');
    const data: any = await res.json();
    if (!data.trending || !Array.isArray(data.trending)) return [];

    return data.trending.map((m: any) => ({
      id: m.id || m.slug,
      name: m.name,
      slug: m.slug,
      url: m.url,
      categories: m.categories || [],
      source: 'justmeme' as const,
    })).slice(0, 10);
  } catch {
    return [];
  }
}

export async function getMemeImageUrl(meme: TrendingMeme): Promise<string> {
  return meme.url;
}
