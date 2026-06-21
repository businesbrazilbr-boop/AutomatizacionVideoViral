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

  const downloadVideoTasks = result.selection?.selectedVideos.map(async (video) => {
    const r2Key = buildAssetR2Key(date, 'videos', `${video.id}.mp4`);
    const existing = await env.R2_ASSETS.head(r2Key);
    if (existing) {
      videos.push({ id: video.id, r2Url: r2Key });
      return;
    }
    try {
      const res = await fetch(video.thumbnailUrl);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        await uploadToR2(env.R2_ASSETS, r2Key, buf, 'video/mp4');
      }
      videos.push({ id: video.id, r2Url: r2Key });
    } catch {
      videos.push({ id: video.id, r2Url: r2Key });
    }
  }) || [];

  const downloadMemeTasks = result.selection?.selectedMemes.map(async (meme) => {
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

  const downloadAudioTask = result.selection?.selectedAudio
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

  await Promise.all([...downloadVideoTasks, ...downloadMemeTasks, downloadAudioTask]);

  return { videos, memes, audio };
}

export async function uploadAsset(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer,
  contentType: string
) {
  return await bucket.put(key, data, { httpMetadata: { contentType } });
}

export async function downloadAssetsToProject(
  bucket: R2Bucket,
  date: string,
  destDir: string
): Promise<{ assetsDir: string; files: string[] }> {
  const files: string[] = [];
  const prefixes = [`${date}/videos/`, `${date}/memes/`, `${date}/audio/`, `${date}/composition/`];

  for (const prefix of prefixes) {
    const listed = await bucket.list({ prefix });
    for (const obj of listed.objects) {
      files.push(obj.key);
    }
  }

  return { assetsDir: `${date}`, files };
}
