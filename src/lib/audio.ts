import type { TrendingAudio } from '../types';

export async function discoverTrendingAudio(): Promise<TrendingAudio[]> {
  const audio: TrendingAudio[] = [];

  try {
    const res = await fetch(
      'https://api.apify.com/v2/acts/burbn~tiktok-trending-sounds/run-sync-get-dataset-items',
      {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({
          country_code: 'US',
          period: '7',
          rank_type: 'popular',
          maxItems: 10,
        }),
      }
    );
    if (res.ok) {
      const items: any[] = await res.json();
      for (const item of items) {
        audio.push({
          id: `audio_${item.id || audio.length}`,
          title: item.title || 'Unknown Track',
          artist: item.artist || 'Unknown Artist',
          url: item.downloadUrl || item.playUrl || '',
          duration: item.duration || 30,
          platform: 'tiktok',
          videoCount: item.usageCount || 0,
          isTrending: true,
        });
      }
    }
  } catch {
    // Fallback: sample data
  }

  if (audio.length === 0) {
    audio.push({
      id: 'audio_placeholder',
      title: 'Viral Energy',
      artist: 'Trending Beats',
      url: '',
      duration: 30,
      platform: 'tiktok',
      videoCount: 1000000,
      isTrending: true,
    });
  }

  return audio;
}
