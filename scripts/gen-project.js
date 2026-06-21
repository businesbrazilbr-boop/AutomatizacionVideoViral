import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const videos = [
  { id: 'c0', p: 'youtube', t: 'Risa garantizada', v: 8.9, a: '@comedy' },
  { id: 'c1', p: 'tiktok', t: 'El baile viral', v: 5.8, a: '@dancer' },
  { id: 'c2', p: 'youtube', t: 'Truco viral', v: 2.5, a: '@creator1' },
  { id: 'c3', p: 'instagram', t: 'Transformacion', v: 1.2, a: '@fitness' },
  { id: 'c4', p: 'tiktok', t: 'Receta rapida', v: 3.2, a: '@chef' },
];

const memes = [
  { n: 'Drake', u: 'https://i.imgflip.com/30b1gx.jpg' },
  { n: 'Cat', u: 'https://i.imgflip.com/345.jpg' },
];

const captions = [
  { s: 0, e: 3, t: 'Lo mejor del dia' },
  { s: 6, e: 9, t: 'Increible pero cierto' },
  { s: 12, e: 15, t: 'No te lo pierdas' },
  { s: 18, e: 21, t: 'Musica viral' },
  { s: 24, e: 27, t: 'Creado con IA' },
];

const duration = 30;
let clipHtml = '';
let gsap = '';
let ct = 0;
const cd = Math.floor(duration / videos.length);
const colors = [
  ['#1a1a3e', '#0f0f23'], ['#1a3a2e', '#0f2313'],
  ['#3e1a2e', '#230f13'], ['#2e1a3e', '#130f23'],
  ['#1a2e3e', '#0f1323'],
];

videos.forEach((v, i) => {
  const s = ct, e = s + cd;
  clipHtml += `<div id="c${i}" class="clip" data-start="${s}" data-duration="${cd}" data-track-index="${i}" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${colors[i][0]},${colors[i][1]});font-size:38px;font-weight:700;color:#fff;text-align:center;padding:40px;"><div><div style="font-size:16px;color:#00d4ff;margin-bottom:12px;">${v.p.toUpperCase()} ${v.v}M views</div><div>${v.t}</div><div style="font-size:18px;color:#888;margin-top:8px;">${v.a}</div></div></div>`;
  gsap += `tl.from("#c${i}",{opacity:0,scale:${i > 0 ? 1.1 : 1},duration:0.5,ease:"power2.out"},${s});tl.to("#c${i}",{opacity:0,duration:0.4,ease:"power2.in"},${e - 0.4});tl.set("#c${i}",{opacity:0},${e});`;
  ct = e;
});

memes.forEach((m, i) => {
  const ms = 20 + i * 3;
  clipHtml += `<img id="m${i}" class="clip" data-start="${ms}" data-duration="3" data-track-index="${50 + i}" src="${m.u}" style="position:absolute;bottom:100px;right:40px;width:240px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.5);" onerror="this.style.display='none'">`;
  gsap += `tl.from("#m${i}",{opacity:0,scale:0.5,rotation:${i % 2 === 0 ? 5 : -5},duration:0.5,ease:"back.out(2)"},${ms});tl.to("#m${i}",{opacity:0,duration:0.3},${ms + 2.7});tl.set("#m${i}",{opacity:0},${ms + 3});`;
});

captions.forEach((c, i) => {
  clipHtml += `<div id="cap${i}" class="clip" data-start="${c.s}" data-duration="${c.e - c.s}" data-track-index="${60 + i}" style="position:absolute;bottom:80px;left:0;right:0;margin:0 auto;width:fit-content;background:rgba(0,0,0,0.7);color:#fff;padding:12px 28px;border-radius:12px;font-size:36px;font-weight:700;text-align:center;backdrop-filter:blur(4px);white-space:nowrap;">${c.t}</div>`;
  gsap += `tl.fromTo("#cap${i}",{opacity:0,y:30},{opacity:1,y:0,duration:0.3,ease:"power2.out"},${c.s});tl.to("#cap${i}",{opacity:0,y:-20,duration:0.3},${c.e - 0.3});tl.set("#cap${i}",{opacity:0},${c.e});`;
});

clipHtml += `<div id="outro" class="clip" data-start="27" data-duration="3" data-track-index="99" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f0f23,#1a1a3e);"><div style="font-size:48px;font-weight:800;color:#fff;text-shadow:0 0 30px rgba(0,212,255,0.8);">Automatizacion Video Viral</div><div style="font-size:20px;color:#aaa;margin-top:12px;">Test Demo IA</div></div>`;
gsap += `tl.from("#outro",{opacity:0,duration:0.6,ease:"power2.out"},27);tl.set("#outro",{opacity:1},30);`;

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=1080,height=1920"/>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:1080px;height:1920px;overflow:hidden;background:#000}
    .clip{position:absolute}
  </style>
</head>
<body>
  <div id="root" data-composition-id="main" data-start="0" data-duration="${duration}" data-width="1080" data-height="1920">
    ${clipHtml}
  </div>
  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });
    ${gsap}
    window.__timelines["main"] = tl;
  </script>
</body>
</html>`;

const projectDir = join(__dirname, '..', 'test-output', 'project');
mkdirSync(projectDir, { recursive: true });
writeFileSync(join(projectDir, 'index.html'), html);
writeFileSync(join(projectDir, 'hyperframes.json'), JSON.stringify({
  name: 'test-composition',
  scripts: { dev: 'npx hyperframes preview', check: 'npx hyperframes lint', render: 'npx hyperframes render' }
}, null, 2));

console.log('Project: ' + projectDir);
console.log('Size: ' + html.length + ' bytes');
