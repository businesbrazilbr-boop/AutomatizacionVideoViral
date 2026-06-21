import type { ViralVideo } from '../types';

export async function discoverYouTubeTrending(): Promise<ViralVideo[]> {
  const videos: ViralVideo[] = [];

  try {
    const res = await fetch(
      'https://www.youtube.com/feed/trending?hl=en&gl=US',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const html = await res.text();

    const ytInitialData = html.match(
      /var ytInitialData = ({.*?});<\/script>/
    );

    if (ytInitialData) {
      const data = JSON.parse(ytInitialData[1]);
      const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
      for (const tab of tabs) {
        const content = tab?.tabRenderer?.content;
        const sections = content?.sectionListRenderer?.contents || [];
        for (const section of sections) {
          const items =
            section?.itemSectionRenderer?.contents ||
            section?.shelfRenderer?.content?.verticalListRenderer?.items ||
            [];
          for (const item of items) {
            const video = item?.videoRenderer;
            if (!video) continue;
            const videoId = video.videoId;
            const title = video.title?.runs?.[0]?.text || '';
            const viewText = video.viewCount?.simpleText || '';
            const views = parseInt(viewText.replace(/[^0-9]/g, '')) || 0;
            const lengthText = video.lengthText?.simpleText || '0:00';
            const [m, s] = lengthText.split(':').map(Number);
            const duration = (m || 0) * 60 + (s || 0);

            videos.push({
              id: `yt_${videoId}`,
              platform: 'youtube',
              title,
              url: `https://youtube.com/watch?v=${videoId}`,
              thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              views,
              likes: 0,
              duration,
              author: video.ownerText?.runs?.[0]?.text || '',
              description: video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.[0]?.text || '',
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('YouTube discovery failed:', e);
  }

  return videos.sort((a, b) => b.views - a.views).slice(0, 20);
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
