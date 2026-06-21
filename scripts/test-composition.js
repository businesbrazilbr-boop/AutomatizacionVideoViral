import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateTestComposition() {
  const date = 'test-demo';

  const selectedVideos = [
    { id: 'clip-0', platform: 'youtube', title: 'Risa garantizada', views: 8900000, duration: 30, author: '@comedy' },
    { id: 'clip-1', platform: 'tiktok', title: 'El baile viral', views: 5800000, duration: 20, author: '@dancer', musicTitle: 'Viral Song' },
    { id: 'clip-2', platform: 'youtube', title: 'Truco viral', views: 2500000, duration: 15, author: '@creator1' },
    { id: 'clip-3', platform: 'instagram', title: 'Transformación', views: 1200000, duration: 25, author: '@fitness' },
    { id: 'clip-4', platform: 'tiktok', title: 'Receta rápida', views: 3200000, duration: 18, author: '@chef' },
  ];

  const selectedMemes = [
    { id: 'meme_0', name: 'Drake Hotline Bling', url: 'https://i.imgflip.com/30b1gx.jpg' },
    { id: 'meme_1', name: 'Woman Yelling at Cat', url: 'https://i.imgflip.com/345.jpg' },
  ];

  const captions = [
    { start: 0, end: 3, text: '🔥 Lo mejor del día' },
    { start: 6, end: 9, text: '😱 Increíble pero cierto' },
    { start: 12, end: 15, text: '✨ No te lo pierdas' },
    { start: 18, end: 21, text: '🎵 Música viral' },
    { start: 24, end: 27, text: '🎬 Creado con IA' },
  ];

  const duration = 30;
  let clipHtml = '';
  let gsapAnimations = '';

  let currentTime = 0;
  const clipDur = Math.floor(duration / selectedVideos.length);

  selectedVideos.forEach((video, i) => {
    const start = currentTime;
    const end = start + clipDur;
    clipHtml += `
      <div id="clip-${i}" class="clip" data-start="${start}" data-duration="${clipDur}" data-track-index="${i}"
        style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
               background: linear-gradient(135deg, ${['#1a1a3e,#0f0f23', '#1a3a2e,#0f2313', '#3e1a2e,#230f13', '#2e1a3e,#130f23', '#1a2e3e,#0f1323'][i]});
               font-size: 42px; font-weight: 700; color: #fff; text-align: center; padding: 40px; opacity:0;">
        <div>
          <div style="font-size: 16px; color: #00d4ff; margin-bottom: 12px;">
            ${video.platform.toUpperCase()} · ${(video.views / 1000000).toFixed(1)}M views
          </div>
          <div>${video.title}</div>
          <div style="font-size: 18px; color: #888; margin-top: 8px;">${video.author}</div>
          ${video.musicTitle ? `<div style="font-size: 14px; color: #ffaa00; margin-top: 4px;">♪ ${video.musicTitle}</div>` : ''}
        </div>
      </div>`;

    gsapAnimations += `
      tl.from("#clip-${i}", { opacity: 0, scale: ${i > 0 ? 1.1 : 1}, duration: 0.5, ease: "power2.out" }, ${start});
      tl.to("#clip-${i}", { opacity: 0, duration: 0.4, ease: "power2.in" }, ${end - 0.4});`;

    currentTime = end;
  });

  selectedMemes.forEach((meme, i) => {
    const memeStart = 20 + i * 3;
    clipHtml += `
      <img id="meme-${i}" class="clip" data-start="${memeStart}" data-duration="3" data-track-index="${50 + i}"
        src="${meme.url}" style="position:absolute;bottom:100px;right:40px;width:240px;border-radius:12px;
        box-shadow:0 4px 20px rgba(0,0,0,0.5);opacity:0;" onerror="this.style.display='none'">`;

    gsapAnimations += `
      tl.from("#meme-${i}", { opacity: 0, scale: 0.5, rotation: ${i % 2 === 0 ? 5 : -5}, duration: 0.5, ease: "back.out(2)" }, ${memeStart});
      tl.to("#meme-${i}", { opacity: 0, duration: 0.3 }, ${memeStart + 2.7});`;
  });

  captions.forEach((cap, i) => {
    clipHtml += `
      <div id="cap-${i}" class="clip" data-start="${cap.start}" data-duration="${cap.end - cap.start}" data-track-index="${60 + i}"
        style="position:absolute;bottom:80px;left:50%;xPercent:-50;background:rgba(0,0,0,0.7);color:#fff;
        padding:12px 28px;border-radius:12px;font-size:36px;font-weight:700;text-align:center;max-width:80%;
        backdrop-filter:blur(4px);white-space:nowrap;opacity:0;text-align:center;">
        ${cap.text}
      </div>`;

    gsapAnimations += `
      tl.from("#cap-${i}", { opacity: 0, y: 30, duration: 0.3, ease: "power2.out" }, ${cap.start});
      tl.to("#cap-${i}", { opacity: 0, y: -20, duration: 0.3 }, ${cap.end - 0.3});`;
  });

  clipHtml += `
    <div id="outro" class="clip" data-start="27" data-duration="3" data-track-index="99"
      style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:linear-gradient(135deg,#0f0f23,#1a1a3e);opacity:0;">
      <div style="font-size:48px;font-weight:800;color:#fff;text-shadow:0 0 30px rgba(0,212,255,0.8);">
        Automatización Video Viral
      </div>
      <div style="font-size:20px;color:#aaa;margin-top:12px;">Generado por IA · ${date}</div>
    </div>`;

  gsapAnimations += `tl.from("#outro", { opacity: 0, duration: 0.6, ease: "power2.out" }, 27);`;

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
    video,img{width:100%}
  </style>
</head>
<body>
  <div id="root" data-composition-id="main" data-start="0" data-duration="${duration}" data-width="1080" data-height="1920">
    ${clipHtml}
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

const html = generateTestComposition();
const outputPath = join(__dirname, '..', 'test-output', 'composition.html');
writeFileSync(outputPath, html);
console.log('✅ Composition generated:', outputPath);
console.log('   Size:', html.length, 'bytes');
console.log('   Duration: 30s');
console.log('   Resolution: 1080x1920');
console.log('   Ready for: npx hyperframes render --input ' + outputPath);
