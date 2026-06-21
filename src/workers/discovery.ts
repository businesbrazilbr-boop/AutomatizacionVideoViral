import type { ViralVideo, TrendingMeme, TrendingAudio, AISelectionResult, Env } from '../types';
import { discoverYouTubeTrending } from '../lib/youtube';
import { discoverTikTokTrending } from '../lib/tiktok';
import { discoverInstagramTrending } from '../lib/instagram';
import { discoverTrendingMemes } from '../lib/memes';
import { discoverTrendingAudio } from '../lib/audio';
import { aiSelectContent } from '../lib/ai-selector';

export interface DiscoveryResult {
  date: string;
  videos: ViralVideo[];
  memes: TrendingMeme[];
  audio: TrendingAudio[];
  selection?: AISelectionResult;
}

export async function runDiscovery(env: Env): Promise<DiscoveryResult> {
  const date = new Date().toISOString().split('T')[0];

  const [youtubeVideos, tiktokVideos, instagramVideos, memes, audio] = await Promise.all([
    discoverYouTubeTrending(),
    discoverTikTokTrending(env.OMKAR_API_KEY),
    discoverInstagramTrending(),
    discoverTrendingMemes(),
    discoverTrendingAudio(env.FREESOUND_API_KEY),
  ]);

  const videos = [
    ...youtubeVideos,
    ...tiktokVideos,
    ...instagramVideos,
  ].sort((a, b) => b.views - a.views);

  const selection = await aiSelectContent(env.AI, videos, memes, audio);

  const result: DiscoveryResult = { date, videos, memes, audio, selection };

  await env.DB.prepare(
    `INSERT OR REPLACE INTO daily_projects
     (id, date, status, videos_discovered, memes_discovered, audio_discovered,
      videos_selected, memes_selected, audio_selected, narrative, captions)
     VALUES (?, ?, 'selected', ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      date,
      date,
      JSON.stringify(videos),
      JSON.stringify(memes),
      JSON.stringify(audio),
      JSON.stringify(selection.selectedVideos),
      JSON.stringify(selection.selectedMemes),
      JSON.stringify(selection.selectedAudio),
      selection.narrative,
      JSON.stringify(selection.captions)
    )
    .run();

  return result;
}
