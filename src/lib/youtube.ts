import type { ViralVideo } from '../types';

const YT_API = 'https://www.googleapis.com/youtube/v3';

function parseISO8601(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const h = parseInt(match[1]?.replace('H', '') || '0');
  const m = parseInt(match[2]?.replace('M', '') || '0');
  const s = parseInt(match[3]?.replace('S', '') || '0');
  return h * 3600 + m * 60 + s;
}

export async function discoverYouTubeTrending(apiKey?: string): Promise<ViralVideo[]> {
  if (apiKey) {
    try {
      const res = await fetch(
        `${YT_API}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=US&maxResults=20&key=${apiKey}`
      );
      if (res.ok) {
        const data: any = await res.json();
        const items: any[] = data?.items || [];
        return items.map((v: any) => ({
          id: `yt_${v.id}`,
          platform: 'youtube' as const,
          title: v.snippet?.title || '',
          url: `https://youtube.com/watch?v=${v.id}`,
          thumbnailUrl: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.default?.url || '',
          views: parseInt(v.statistics?.viewCount || '0'),
          likes: parseInt(v.statistics?.likeCount || '0'),
          duration: parseISO8601(v.contentDetails?.duration || 'PT0S'),
          author: v.snippet?.channelTitle || '',
          description: v.snippet?.description || '',
        }));
      }
    } catch {
      // fall through
    }
  }

  // Fallback: scrape YouTube directly
  try {
    const res = await fetch(
      'https://www.youtube.com/feed/trending?hl=en&gl=US',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    );
    const html = await res.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!match) return [];

    const data = JSON.parse(match[1]);
    const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    const videos: ViralVideo[] = [];

    for (const tab of tabs) {
      const content = tab?.tabRenderer?.content;
      let items: any[] = content?.richGridRenderer?.contents?.filter((c: any) => c.richItemRenderer) || [];

      if (items.length === 0) {
        const sections = content?.sectionListRenderer?.contents || [];
        for (const section of sections) {
          items = items.concat(
            section?.itemSectionRenderer?.contents ||
            section?.shelfRenderer?.content?.verticalListRenderer?.items ||
            []
          );
        }
      }

      for (const item of items) {
        const video = item?.richItemRenderer?.content?.videoRenderer || item?.videoRenderer;
        if (!video) continue;
        const vid = video.videoId;
        const viewText = video.viewCount?.simpleText || '';
        const lengthText = video.lengthText?.simpleText || '0:00';
        const [m, s] = lengthText.split(':').map(Number);

        videos.push({
          id: `yt_${vid}`,
          platform: 'youtube',
          title: video.title?.runs?.[0]?.text || '',
          url: `https://youtube.com/watch?v=${vid}`,
          thumbnailUrl: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
          views: parseInt(viewText.replace(/[^0-9]/g, '')) || 0,
          likes: 0,
          duration: (m || 0) * 60 + (s || 0),
          author: video.ownerText?.runs?.[0]?.text || '',
          description: video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.[0]?.text || '',
        });
      }
    }
    return videos.slice(0, 20);
  } catch {
    return [];
  }
}

export async function getYouTubeVideoInfo(url: string): Promise<{
  title: string;
  duration: number;
  formats: { url: string; mimeType: string; quality: string }[];
} | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );
      const info: any = await res.json();
      return {
        title: info.title,
        duration: info.duration || 0,
        formats: [],
      };
  } catch {
    return null;
  }
}
