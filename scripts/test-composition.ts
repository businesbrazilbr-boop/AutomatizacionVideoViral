import { generateComposition } from '../src/lib/composition-engine.js';

const sampleData = {
  date: 'test-demo',
  videos: [
    {
      id: 'yt_sample1', platform: 'youtube',
      title: 'Increíble truco viral que tienes que ver',
      url: 'https://www.youtube.com/watch?v=sample1',
      thumbnailUrl: '', views: 2500000, likes: 120000,
      duration: 15, author: '@creator1',
      description: 'Truco viral increíble',
    },
    {
      id: 'tk_sample2', platform: 'tiktok',
      title: 'El baile que rompió TikTok esta semana',
      url: 'https://www.tiktok.com/@user/video/123',
      thumbnailUrl: '', views: 5800000, likes: 890000,
      duration: 20, author: '@dancer',
      description: 'Baile viral',
      musicTitle: 'Viral Song', musicUrl: '',
    },
    {
      id: 'ig_sample3', platform: 'instagram',
      title: 'Transformación 90 días #beforeAfter',
      url: 'https://www.instagram.com/reel/test',
      thumbnailUrl: '', views: 1200000, likes: 340000,
      duration: 25, author: '@fitness',
      description: 'Transformación increíble',
    },
    {
      id: 'yt_sample4', platform: 'youtube',
      title: 'Risa garantizada: compilación graciosa',
      url: 'https://www.youtube.com/watch?v=sample4',
      thumbnailUrl: '', views: 8900000, likes: 450000,
      duration: 30, author: '@comedy',
      description: 'Compilación de risa',
    },
    {
      id: 'tk_sample5', platform: 'tiktok',
      title: 'Receta rápida que necesitas probar',
      url: 'https://www.tiktok.com/@user/video/456',
      thumbnailUrl: '', views: 3200000, likes: 210000,
      duration: 18, author: '@chef',
      description: 'Receta viral',
    },
  ],
  memes: [
    { id: 'meme_drake', name: 'Drake Hotline Bling', slug: 'drake', url: 'https://i.imgflip.com/30b1gx.jpg', categories: ['reaction'], source: 'justmeme' },
    { id: 'meme_cat', name: 'Woman Yelling at Cat', slug: 'cat', url: 'https://i.imgflip.com/345.jpg', categories: ['reaction'], source: 'justmeme' },
  ],
  audio: null,
  selection: {
    selectedVideos: [
      { id: 'yt_sample4', platform: 'youtube' as const, title: 'Risa garantizada', url: '', thumbnailUrl: '', views: 8900000, likes: 450000, duration: 30, author: '@comedy', description: '' },
      { id: 'tk_sample2', platform: 'tiktok' as const, title: 'El baile que rompió TikTok', url: '', thumbnailUrl: '', views: 5800000, likes: 890000, duration: 20, author: '@dancer', description: '', musicTitle: 'Viral Song' },
      { id: 'yt_sample1', platform: 'youtube' as const, title: 'Truco viral', url: '', thumbnailUrl: '', views: 2500000, likes: 120000, duration: 15, author: '@creator1', description: '' },
      { id: 'ig_sample3', platform: 'instagram' as const, title: 'Transformación', url: '', thumbnailUrl: '', views: 1200000, likes: 340000, duration: 25, author: '@fitness', description: '' },
      { id: 'tk_sample5', platform: 'tiktok' as const, title: 'Receta rápida', url: '', thumbnailUrl: '', views: 3200000, likes: 210000, duration: 18, author: '@chef', description: '' },
    ],
    selectedMemes: [
      { id: 'meme_drake', name: 'Drake Hotline Bling', slug: 'drake', url: 'https://i.imgflip.com/30b1gx.jpg', categories: ['reaction'], source: 'justmeme' as const },
      { id: 'meme_cat', name: 'Woman Yelling at Cat', slug: 'cat', url: 'https://i.imgflip.com/345.jpg', categories: ['reaction'], source: 'justmeme' as const },
    ],
    selectedAudio: null,
    narrative: 'Los momentos más virales del día combinados en un reel explosivo.',
    captions: [
      { start: 0, end: 3, text: '🔥 Lo mejor del día' },
      { start: 6, end: 9, text: '😱 Increíble pero cierto' },
      { start: 12, end: 15, text: '✨ No te lo pierdas' },
    ],
  },
  assetUrls: {
    videos: [
      { id: 'yt_sample4', r2Url: 'test/videos/yt_sample4.mp4' },
      { id: 'tk_sample2', r2Url: 'test/videos/tk_sample2.mp4' },
      { id: 'yt_sample1', r2Url: 'test/videos/yt_sample1.mp4' },
      { id: 'ig_sample3', r2Url: 'test/videos/ig_sample3.mp4' },
      { id: 'tk_sample5', r2Url: 'test/videos/tk_sample5.mp4' },
    ],
    memes: [
      { id: 'meme_drake', r2Url: 'test/memes/meme_drake.jpg' },
      { id: 'meme_cat', r2Url: 'test/memes/meme_cat.jpg' },
    ],
    audio: null,
  },
};

const html = generateComposition(sampleData);
Bun.write('test-output/composition.html', html).then(() => {
  console.log('✅ Composition generated: test-output/composition.html');
  console.log(`   Size: ${html.length} bytes`);
  console.log(`   Duration: 30s`);
  console.log(`   Resolution: 1080x1920`);
});
