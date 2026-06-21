import type { TrendingMeme } from '../types';

const SUBREDDITS = ['memes', 'dankmemes', 'AdviceAnimals', 'meirl'];

const REDDIT_URLS = [
  (sub: string) => `https://api.reddit.com/r/${sub}/hot?limit=25`,
  (sub: string) => `https://www.reddit.com/r/${sub}/hot.json?limit=25`,
  (sub: string) => `https://old.reddit.com/r/${sub}/hot.json?limit=25`,
];

export async function discoverRedditMemes(): Promise<TrendingMeme[]> {
  const memes: TrendingMeme[] = [];
  const seen = new Set<string>();
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  for (const sub of SUBREDDITS) {
    for (const urlFn of REDDIT_URLS) {
      try {
        const res = await fetch(urlFn(sub), {
          headers: { 'User-Agent': ua, 'Accept': 'application/json' },
        });
        if (!res.ok) continue;
        const text = await res.text();
        let data: any;
        try { data = JSON.parse(text); } catch { continue; }
        const children: any[] = data?.data?.children || [];
        if (children.length === 0) continue;

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

        if (memes.length > 0) break;
      } catch {
        continue;
      }
    }
  }

  return memes.slice(0, 15);
}
