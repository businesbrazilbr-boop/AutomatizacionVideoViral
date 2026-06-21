import type { TrendingAudio } from '../types';

const FREESOUND_API = 'https://freesound.org/apiv2/search/text';

interface FreesoundResult {
  results?: Array<{
    id: number;
    name: string;
    username: string;
    duration: number;
    downloads: number;
    previews?: { 'preview-hq-mp3'?: string; 'preview-lq-mp3'?: string };
  }>;
}

export async function discoverFreesoundAudio(freesoundKey?: string): Promise<TrendingAudio[]> {
  if (!freesoundKey) return [];

  try {
    const queries = ['trending', 'viral', 'popular', 'dance', 'energy', 'beat'];
    const results = await Promise.allSettled(
      queries.map((q) =>
        fetch(`${FREESOUND_API}?query=${q}&token=${freesoundKey}&page_size=5&fields=id,name,username,duration,previews,downloads`,
          { headers: { 'User-Agent': 'AutomatizacionVideoViral/1.0' } }
        ).then((r) => r.ok ? r.json<FreesoundResult>() : null)
      )
    );

    const audio: TrendingAudio[] = [];
    const seen = new Set<number>();

    for (const result of results) {
      if (result.status !== 'fulfilled' || !result.value?.results) continue;
      for (const s of result.value.results) {
        if (seen.has(s.id)) continue;
        seen.add(s.id);
        audio.push({
          id: `fs_${s.id}`,
          title: s.name?.replace(/\.\w+$/, '') || 'Unknown',
          artist: s.username || 'Unknown Artist',
          url: s.previews?.['preview-hq-mp3'] || s.previews?.['preview-lq-mp3'] || '',
          duration: Math.round(s.duration || 30),
          platform: 'freesound',
          videoCount: s.downloads || 0,
          isTrending: true,
        });
      }
    }

    if (audio.length > 0) return audio.slice(0, 10);
  } catch {
    // noop
  }

  return [];
}
