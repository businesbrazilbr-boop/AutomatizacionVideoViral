import type { ViralVideo, TrendingMeme, TrendingAudio } from '../types';

export interface AISelectionResult {
  selectedVideos: ViralVideo[];
  selectedMemes: TrendingMeme[];
  selectedAudio: TrendingAudio | null;
  narrative: string;
  captions: { start: number; end: number; text: string }[];
}

export async function aiSelectContent(
  ai: any,
  videos: ViralVideo[],
  memes: TrendingMeme[],
  audio: TrendingAudio[]
): Promise<AISelectionResult> {
  const prompt = `Eres un editor profesional de videos virales para redes sociales.

Tienes estos contenidos trending hoy:

VIDEOS (${videos.length} encontrados):
${JSON.stringify(
  videos.slice(0, 15).map((v) => ({
    platform: v.platform,
    title: v.title.slice(0, 80),
    views: v.views,
    author: v.author,
    duration: `${v.duration}s`,
  })),
  null,
  2
)}

MEMES TRENDING (${memes.length}):
${JSON.stringify(memes.map((m) => ({ name: m.name })), null, 2)}

AUDIO TRENDING (${audio.length}):
${JSON.stringify(
  audio.map((a) => ({ title: a.title, artist: a.artist })),
  null,
  2
)}

INSTRUCCIONES:
1. Selecciona EXACTAMENTE 5 videos para un reel de 30 segundos
   - Mezcla plataformas (YouTube, TikTok, Instagram)
   - Prioriza los de más views
   - Que tengan variedad de contenido
2. Selecciona 1-2 memes para overlay gráfico
3. Selecciona 1 audio de fondo (o null si ninguno sirve)
4. Escribe una narrativa en español que conecte los videos (máximo 100 palabras)
5. Genera 3 captions sincronizados con timestamps aproximados (start, end en segundos, texto en español)

Responde SOLO en este formato JSON, sin explicaciones:
{
  "selectedVideoIndices": [0, 3, 5, 7, 10],
  "selectedMemeIndices": [0, 1],
  "selectedAudioIndex": 0,
  "narrative": "texto narrativo aquí...",
  "captions": [
    {"start": 0, "end": 3, "text": "caption 1"},
    {"start": 5, "end": 8, "text": "caption 2"},
    {"start": 10, "end": 13, "text": "caption 3"}
  ]
}`;

  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
      max_tokens: 1024,
      temperature: 0.3,
    });

    const text = typeof response === 'string' ? response : response.response;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const result = JSON.parse(jsonMatch[0]);

    return {
      selectedVideos: (result.selectedVideoIndices || [])
        .filter((i: number) => i < videos.length)
        .map((i: number) => videos[i]),
      selectedMemes: (result.selectedMemeIndices || [])
        .filter((i: number) => i < memes.length)
        .map((i: number) => memes[i]),
      selectedAudio: result.selectedAudioIndex != null && audio[result.selectedAudioIndex]
        ? audio[result.selectedAudioIndex]
        : null,
      narrative: result.narrative || 'Video viral del día',
      captions: (result.captions || []).slice(0, 5),
    };
  } catch (e) {
    console.error('AI selection failed, using fallback:', e);
    return fallbackSelection(videos, memes, audio);
  }
}

function fallbackSelection(
  videos: ViralVideo[],
  memes: TrendingMeme[],
  audio: TrendingAudio[]
): AISelectionResult {
  return {
    selectedVideos: videos.sort((a, b) => b.views - a.views).slice(0, 5),
    selectedMemes: memes.slice(0, 2),
    selectedAudio: audio[0] || null,
    narrative: 'Los mejores momentos virales de hoy.',
    captions: [
      { start: 0, end: 3, text: '🔥 Lo viral del día' },
      { start: 5, end: 8, text: '✨ Increíble' },
      { start: 10, end: 13, text: '😱 No te lo pierdas' },
    ],
  };
}
