import type { ViralVideo, TrendingMeme, TrendingAudio, AISelectionResult } from '../types';

export interface CompositionInput {
  date: string;
  videos: ViralVideo[];
  memes: TrendingMeme[];
  audio: TrendingAudio | null;
  selection: AISelectionResult;
  assetUrls: {
    videos: { id: string; r2Url: string }[];
    memes: { id: string; r2Url: string }[];
    audio: { id: string; r2Url: string } | null;
  };
}

export function generateComposition(input: CompositionInput): string {
  const { date, videos, memes, audio, selection, assetUrls } = input;
  const duration = 30;
  let clipHtml = '';
  let gsapAnimations = '';

  const videoAssetMap = new Map(assetUrls.videos.map((v) => [v.id, v.r2Url]));
  const memeAssetMap = new Map(assetUrls.memes.map((m) => [m.id, m.r2Url]));

  let currentTimeLocal = 0;
  const clipDuration = Math.floor(duration / Math.max(selection.selectedVideos.length, 1));

  selection.selectedVideos.forEach((video, i) => {
    const r2Key = videoAssetMap.get(video.id);
    const thumbSrc = r2Key ? `thumbs/${video.id}.jpg` : video.thumbnailUrl;
    const startLocal = currentTimeLocal;
    const endLocal = startLocal + clipDuration;

    clipHtml += `
      <img id="clip-${i}" class="clip" data-start="${startLocal}" data-duration="${clipDuration}" data-track-index="${i}"
        src="${thumbSrc}" style="width:100%;height:100%;object-fit:cover;">`;

    gsapAnimations += `
      tl.from("#clip-${i}", { opacity: 0, scale: ${i > 0 ? 1.1 : 1}, duration: 0.4, ease: "power2.out" }, ${startLocal});
      tl.to("#clip-${i}", { opacity: 0, duration: 0.3, ease: "power2.in" }, ${endLocal - 0.3});`;

    currentTimeLocal = endLocal;
  });

  selection.selectedMemes.forEach((meme, i) => {
    const r2Key = memeAssetMap.get(meme.id);
    const src = r2Key ? `memes/${meme.id}.jpg` : meme.url;
    const memeStart = 20 + i * 3;
    const memeDuration = 3;

    clipHtml += `
      <img id="meme-${i}" class="clip" data-start="${memeStart}" data-duration="${memeDuration}" data-track-index="${50 + i}"
        src="${src}" style="position:absolute;bottom:100px;right:40px;width:240px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.5);opacity:0;">`;

    gsapAnimations += `
      tl.from("#meme-${i}", { opacity: 0, scale: 0.5, rotation: ${i % 2 === 0 ? 5 : -5}, duration: 0.5, ease: "back.out(2)" }, ${memeStart});
      tl.to("#meme-${i}", { opacity: 0, duration: 0.3 }, ${memeStart + memeDuration - 0.3});`;
  });

  selection.captions.forEach((cap, i) => {
    clipHtml += `
      <div id="caption-${i}" class="clip" data-start="${cap.start}" data-duration="${cap.end - cap.start}" data-track-index="${60 + i}"
        style="position:absolute;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.6);color:#fff;padding:12px 28px;border-radius:12px;font-size:36px;font-weight:700;text-align:center;max-width:90%;backdrop-filter:blur(4px);white-space:nowrap;">
        ${cap.text}
      </div>`;

    gsapAnimations += `
      tl.from("#caption-${i}", { opacity: 0, y: 30, duration: 0.3, ease: "power2.out" }, ${cap.start});
      tl.to("#caption-${i}", { opacity: 0, y: -20, duration: 0.3 }, ${cap.end - 0.3});`;
  });

  const audioElement = assetUrls.audio && selection.selectedAudio
    ? `
    <audio class="clip" data-track="bg" src="audio/${assetUrls.audio.id}.mp3" data-volume="0.3" loop></audio>`
    : '';

  clipHtml += `
    <div id="outro" class="clip" data-start="27" data-duration="3" data-track-index="99"
      style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f0f23 0%,#1a1a3e 100%);opacity:0;">
      <div style="font-size:48px;font-weight:800;color:#fff;text-shadow:0 0 30px rgba(0,212,255,0.8);">Automatización Video Viral</div>
      <div style="font-size:20px;color:#aaa;margin-top:12px;">Generado por IA · ${date}</div>
    </div>`;

  gsapAnimations += `
    tl.from("#outro", { opacity: 0, duration: 0.6, ease: "power2.out" }, 27);`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=1080, height=1920"/>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:1080px;height:1920px;overflow:hidden;background:#000}
    .clip{position:absolute;opacity:0}
    img{width:100%;height:100%;object-fit:cover}
  </style>
</head>
<body>
  <div id="root" data-composition-id="main" data-start="0" data-duration="${duration}" data-width="1080" data-height="1920">
    ${clipHtml}
    ${audioElement}
  </div>
  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });
    ${gsapAnimations}
    window.__timelines["main"] = tl;
  </script>
</body>
</html>`;
}
