export async function downloadYouTubeVideo(
  videoId: string,
  cookies?: string,
): Promise<{ data: ArrayBuffer | null; error?: string }> {
  const strategies = [
    () => downloadViaHtml(videoId, cookies),
    () => downloadViaInnertube(videoId, 'IOS', cookies),
    () => downloadViaInnertube(videoId, 'ANDROID', cookies),
  ];

  for (const strat of strategies) {
    const result = await strat();
    if (result.data) return result;
  }

  return { data: null, error: 'All download strategies failed' };
}

async function downloadViaHtml(videoId: string, cookies?: string): Promise<{ data: ArrayBuffer | null; error?: string }> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  if (cookies) headers['Cookie'] = cookies;

  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers });
  if (!res.ok) return { data: null, error: `HTML page ${res.status}` };

  const html = await res.text();
  if (!html.includes('ytInitialPlayerResponse')) {
    return { data: null, error: 'No player response in HTML' };
  }

  const match = html.match(/ytInitialPlayerResponse\s*=\s*({.*?})\s*;/s);
  if (!match) return { data: null, error: 'Cannot extract player response' };

  let player: any;
  try { player = JSON.parse(match[1]); } catch { return { data: null, error: 'JSON parse failed' }; }
  if (!player?.streamingData) return { data: null, error: 'No streaming data' };

  return await tryFormats(player.streamingData.formats || [], player.streamingData.adaptiveFormats || []);
}

async function downloadViaInnertube(videoId: string, client: string, cookies?: string): Promise<{ data: ArrayBuffer | null; error?: string }> {
  const keys: Record<string, string> = {
    IOS: 'AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc',
    ANDROID: 'AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w',
  };
  const versions: Record<string, string> = { IOS: '19.09.37', ANDROID: '19.09.37' };
  const key = keys[client];
  if (!key) return { data: null, error: `No key for ${client}` };

  const body = JSON.stringify({
    videoId,
    context: { client: { clientName: client, clientVersion: versions[client] } },
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0',
  };
  if (cookies) headers['Cookie'] = cookies;

  const res = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${key}`, {
    method: 'POST', headers, body,
  });
  if (!res.ok) return { data: null, error: `Innertube ${res.status}` };

  const data: any = await res.json();
  if (data.playabilityStatus?.status !== 'OK') {
    return { data: null, error: `${data.playabilityStatus?.status}: ${data.playabilityStatus?.reason || ''}` };
  }

  return await tryFormats(data.streamingData?.formats || [], data.streamingData?.adaptiveFormats || []);
}

async function tryFormats(formats: any[], adaptiveFormats: any[]): Promise<{ data: ArrayBuffer | null; error?: string }> {
  const all = [...formats, ...adaptiveFormats];
  all.sort((a, b) => (a.height || 9999) - (b.height || 9999));

  for (const f of all) {
    if (!f.mimeType?.startsWith('video/mp4')) continue;
    const url = getFormatUrl(f);
    if (!url) continue;

    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.youtube.com/',
          },
        });
        if (r.ok) {
          const buf = await r.arrayBuffer();
          if (buf.byteLength > 5000) return { data: buf };
        }
      } catch { }
    }
  }

  return { data: null, error: 'No format downloadable' };
}

function getFormatUrl(f: any): string | null {
  if (f.url) return f.url;
  const cipher = f.signatureCipher || f.cipher;
  if (!cipher) return null;
  const params = new URLSearchParams(cipher);
  return params.get('url');
}
