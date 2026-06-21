import type { ViralVideo } from '../types';

export async function discoverInstagramTrending(): Promise<ViralVideo[]> {
  const videos: ViralVideo[] = [];

  try {
    const res = await fetch('https://later.com/blog/instagram-reels-trends/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const linkRegex = /https:\/\/www\.instagram\.com\/reel\/[a-zA-Z0-9_-]+/g;
    const matches = html.match(linkRegex) || [];
    const uniqueUrls = [...new Set(matches)].slice(0, 10);

    const results = await Promise.allSettled(
      uniqueUrls.map(async (url) => {
        const shortcode = url.split('/reel/')[1]?.split('?')[0] || '';
        if (!shortcode) return null;

        const oembedRes = await fetch(
          `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        if (!oembedRes.ok) return null;
        const info: any = await oembedRes.json();

        return {
          id: `ig_${shortcode}`,
          platform: 'instagram' as const,
          title: info.title || `Instagram Reel by ${info.author_name || '@trending'}`,
          url,
          thumbnailUrl: info.thumbnail_url || `https://www.instagram.com/p/${shortcode}/media/?size=l`,
          views: 0,
          likes: 0,
          duration: 30,
          author: info.author_name || '@trending',
          description: info.title || '',
        };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        videos.push(result.value);
      }
    }
  } catch {
    // No Instagram data available
  }

  return videos.sort((a, b) => b.views - a.views).slice(0, 10);
}
