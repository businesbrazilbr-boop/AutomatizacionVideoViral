import type { Env, ViralVideo, TrendingMeme, TrendingAudio } from '../types';
import type { DiscoveryResult } from './discovery';
import { uploadToR2, buildAssetR2Key } from '../lib/r2-utils';

export interface AssetResult {
  videos: { id: string; r2Url: string }[];
  memes: { id: string; r2Url: string }[];
  audio: { id: string; r2Url: string } | null;
}

export async function ensureAssets(
  env: Env,
  date: string,
  result: DiscoveryResult
): Promise<AssetResult> {
  const videos: AssetResult['videos'] = [];
  const memes: AssetResult['memes'] = [];
  let audio: AssetResult['audio'] = null;

  const downloadThumbs = result.selection?.selectedVideos.map(async (video) => {
    const r2Key = buildAssetR2Key(date, 'thumbs', `${video.id}.jpg`);
    const existing = await env.R2_ASSETS.head(r2Key);
    if (existing) {
      videos.push({ id: video.id, r2Url: r2Key });
      return;
    }
    try {
      if (video.thumbnailUrl) {
        const res = await fetch(video.thumbnailUrl);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          await uploadToR2(env.R2_ASSETS, r2Key, buf, 'image/jpeg');
        }
      }
      videos.push({ id: video.id, r2Url: r2Key });
    } catch {
      videos.push({ id: video.id, r2Url: r2Key });
    }
  }) || [];

  const downloadMemes = result.selection?.selectedMemes.map(async (meme) => {
    const r2Key = buildAssetR2Key(date, 'memes', `${meme.id}.jpg`);
    const existing = await env.R2_ASSETS.head(r2Key);
    if (existing) {
      memes.push({ id: meme.id, r2Url: r2Key });
      return;
    }
    try {
      const res = await fetch(meme.url);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        await uploadToR2(env.R2_ASSETS, r2Key, buf, 'image/jpeg');
      }
      memes.push({ id: meme.id, r2Url: r2Key });
    } catch {
      memes.push({ id: meme.id, r2Url: r2Key });
    }
  }) || [];

  const downloadAudio = result.selection?.selectedAudio
    ? (async () => {
        const track = result.selection!.selectedAudio!;
        const r2Key = buildAssetR2Key(date, 'audio', `${track.id}.mp3`);
        const existing = await env.R2_ASSETS.head(r2Key);
        if (existing) {
          audio = { id: track.id, r2Url: r2Key };
          return;
        }
        try {
          if (track.url) {
            const res = await fetch(track.url);
            if (res.ok) {
              const buf = await res.arrayBuffer();
              await uploadToR2(env.R2_ASSETS, r2Key, buf, 'audio/mpeg');
            }
          }
          audio = { id: track.id, r2Url: r2Key };
        } catch {
          audio = { id: track.id, r2Url: r2Key };
        }
      })()
    : Promise.resolve();

  await Promise.all([...downloadThumbs, ...downloadMemes, downloadAudio]);

  await markPendingDownloads(env, date, result);

  return { videos, memes, audio };
}

async function markPendingDownloads(env: Env, date: string, result: DiscoveryResult) {
  const videos = result.selection?.selectedVideos || [];
  for (const v of videos) {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO assets (id, project_id, type, platform, source_url, metadata, created_at)
       VALUES (?, ?, 'video', ?, ?, ?, current_timestamp)`
    ).bind(`${date}_${v.id}`, date, v.platform, v.url, JSON.stringify({
      title: v.title,
      author: v.author,
      duration: v.duration,
      status: 'pending_download',
    })).run();
  }
}
