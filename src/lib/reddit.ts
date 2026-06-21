import type { TrendingMeme } from '../types';

const SUBREDDITS = ['memes', 'dankmemes', 'AdviceAnimals', 'meirl'];

export async function discoverRedditMemes(): Promise<TrendingMeme[]> {
  const memes: TrendingMeme[] = [];
  const seen = new Set<string>();

  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25`, {
        headers: { 'User-Agent': 'AutomatizacionVideoViral/1.0' },
      });
      if (!res.ok) continue;
      const data: any = await res.json();
      const children: any[] = data?.data?.children || [];

      for (const child of children) {
        const d = child.data;
        if (!d || d.over_18 || seen.has(d.url)) continue;
        if (d.post_hint !== 'image' && !d.url.match(/\.(jpg|jpeg|png|gif)$/i)) continue;

        seen.add(d.url);
        memes.push({
          id: `reddit_${d.id}`,
          name: d.title,
          slug: d.permalink.split('/').filter(Boolean).pop() || d.id,
          url: d.url,
          categories: [sub, 'reddit'],
          source: 'reddit',
        });
      }
    } catch {
      continue;
    }
  }

  return memes.slice(0, 15);
}
