interface YouTubeFormat {
  itag: number;
  url?: string;
  signatureCipher?: string;
  cipher?: string;
  mimeType: string;
  bitrate?: number;
  contentLength?: string;
  width?: number;
  height?: number;
}

interface PlayerResponse {
  streamingData?: {
    formats?: YouTubeFormat[];
    adaptiveFormats?: YouTubeFormat[];
  };
  videoDetails?: {
    videoId: string;
    title: string;
    lengthSeconds: string;
  };
}

function extractPlayerResponse(html: string): PlayerResponse | null {
  const patterns = [
    /ytInitialPlayerResponse\s*=\s*({.*?});/s,
    /window\.ytInitialPlayerResponse\s*=\s*({.*?});/s,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch { }
    }
  }
  return null;
}

function pickVideoUrl(formats: YouTubeFormat[] | undefined): string | null {
  if (!formats || formats.length === 0) return null;
  formats.sort((a, b) => (a.height || 9999) - (b.height || 9999));
  for (const f of formats) {
    if (!f.mimeType.startsWith('video/mp4')) continue;
    if (f.url) return f.url;
    const cipherData = f.signatureCipher || f.cipher;
    if (cipherData) {
      const params = new URLSearchParams(cipherData);
      if (params.get('url')) return params.get('url')!;
    }
  }
  return null;
}

export async function downloadYouTubeVideo(
  videoId: string,
  userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
): Promise<ArrayBuffer | null> {
  const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const pageRes = await fetch(pageUrl, {
    headers: {
      'User-Agent': userAgent,
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!pageRes.ok) return null;
  const html = await pageRes.text();
  const player = extractPlayerResponse(html);
  if (!player?.streamingData) return null;
  const videoUrl = pickVideoUrl(player.streamingData.formats) ||
    pickVideoUrl(player.streamingData.adaptiveFormats);
  if (!videoUrl) return null;
  const videoRes = await fetch(videoUrl, {
    headers: { 'User-Agent': userAgent, 'Referer': 'https://www.youtube.com/' },
  });
  if (!videoRes.ok) return null;
  return await videoRes.arrayBuffer();
}
