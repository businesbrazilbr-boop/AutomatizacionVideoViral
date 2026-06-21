import type { ViralVideo } from '../types';

const OMKAR_API = 'https://tiktok-scraper.omkar.cloud/tiktok/videos/trending';

export async function discoverTikTokTrending(omkarKey?: string): Promise<ViralVideo[]> {
  if (omkarKey) {
    try {
      const res = await fetch(`${OMKAR_API}?market=us&max_results=15`, {
        headers: { 'x-api-key': omkarKey },
      });
      if (res.ok) {
        const data: any = await res.json();
        const items: any[] = data?.data || data?.results || data || [];
        if (Array.isArray(items) && items.length > 0) {
          return items.map((v: any, i: number) => ({
            id: v.id ? `tk_${v.id}` : `tk_${i}`,
            platform: 'tiktok' as const,
            title: v.title || v.desc || '',
            url: v.url || v.videoUrl || `https://www.tiktok.com/@${v.author?.uniqueId || 'tiktok'}/video/${v.id}`,
            thumbnailUrl: v.coverUrl || v.thumbnailUrl || v.video?.cover || '',
            views: v.playCount || v.views || v.stats?.playCount || 0,
            likes: v.diggCount || v.likes || v.stats?.diggCount || 0,
            duration: v.duration || v.video?.duration || 30,
            author: v.author?.nickname || v.author?.uniqueId || v.author || '',
            description: v.desc || v.title || v.caption || '',
            musicTitle: v.music?.title || v.sound?.name || '',
            musicUrl: v.music?.playUrl || '',
          })).slice(0, 15);
        }
      }
    } catch {
      // Fall through to next method
    }
  }

  try {
    const res = await fetch(
      `https://www.tiktok.com/api/recommend/item_list?aid=1988&app_language=en&count=10`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    );
    if (res.ok) {
      const data: any = await res.json();
      const items: any[] = data?.itemList || [];
      if (items.length > 0) {
        return items.map((item: any, i: number) => ({
          id: `tk_${item.id || i}`,
          platform: 'tiktok' as const,
          title: item.desc || '',
          url: `https://www.tiktok.com/@${item.author?.uniqueId || 'unknown'}/video/${item.id}`,
          thumbnailUrl: item.video?.cover || '',
          views: item.stats?.playCount || 0,
          likes: item.stats?.diggCount || 0,
          duration: item.video?.duration || 30,
          author: item.author?.nickname || '',
          description: item.desc || '',
          musicTitle: item.music?.title || '',
          musicUrl: item.music?.playUrl || '',
        }));
      }
    }
  } catch {
    // No data
  }

  return [];
}

export async function searchTikTokTrending(keyword: string): Promise<ViralVideo[]> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/api/recommend/item_list?aid=1988&app_language=en&count=10`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    );
    if (!res.ok) return [];
    const data: any = await res.json();
    const items: any[] = data?.itemList || [];
    return items.map((item: any, i: number) => ({
      id: `tk_${item.id || i}`,
      platform: 'tiktok' as const,
      title: item.desc || '',
      url: `https://www.tiktok.com/@${item.author?.uniqueId || 'unknown'}/video/${item.id}`,
      thumbnailUrl: item.video?.cover || '',
      views: item.stats?.playCount || 0,
      likes: item.stats?.diggCount || 0,
      duration: item.video?.duration || 30,
      author: item.author?.nickname || '',
      description: item.desc || '',
      musicTitle: item.music?.title || '',
      musicUrl: item.music?.playUrl || '',
    }));
  } catch {
    return [];
  }
}
