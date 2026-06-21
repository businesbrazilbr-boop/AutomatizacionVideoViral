import type { ViralVideo } from '../types';

const GENVIRAL_API = 'https://www.genviral.io/api/partner/v1/trends/brief';

export async function discoverTikTokTrending(apiKey?: string): Promise<ViralVideo[]> {
  if (!apiKey) {
    return [];
  }

  try {
    const res = await fetch(
      `${GENVIRAL_API}?platform=tiktok&keyword=viral&limit=10&range=24h`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) return [];
    const data: any = await res.json();
    if (!data.ok || !data.data?.evidence?.sample_videos) return [];

    return data.data.evidence.sample_videos.map((v: any, i: number) => ({
      id: `tk_${v.video_id || i}`,
      platform: 'tiktok' as const,
      title: v.caption || '',
      url: v.url || '',
      thumbnailUrl: '',
      views: v.views || 0,
      likes: v.likes || 0,
      duration: 30,
      author: v.author_handle || '',
      description: v.caption || '',
      musicTitle: v.sound_name || '',
      musicUrl: '',
    }));
  } catch {
    return [];
  }
}

export async function searchTikTokTrending(keyword: string): Promise<ViralVideo[]> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/api/recommend/item_list?aid=1988&app_language=en&count=10`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
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
