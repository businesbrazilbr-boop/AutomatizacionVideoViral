import type { TrendingAudio } from '../types';

const JAMENDO_API = 'https://api.jamendo.com/v3.0/tracks';

export async function discoverJamendoAudio(clientId?: string): Promise<TrendingAudio[]> {
  if (!clientId) return [];

  try {
    const tags = ['beat', 'dance', 'energy', 'upbeat', 'background', 'cinematic'];
    const results = await Promise.allSettled(
      tags.map((tag) =>
        fetch(`${JAMENDO_API}/?client_id=${clientId}&format=json&limit=5&order=popularity_week&tags=${tag}&audiodlformat=mp32&include=musicinfo`,
          { headers: { 'User-Agent': 'AutomatizacionVideoViral/1.0' } }
        ).then((r) => r.ok ? r.json() : null)
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
          id: `jm_${s.id}`,
          title: s.name || 'Unknown',
          artist: s.artist_name || 'Unknown Artist',
          url: s.audio || s.audiodownload || '',
          duration: Math.round((s.duration || 30)),
          platform: 'jamendo',
          videoCount: 0,
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
