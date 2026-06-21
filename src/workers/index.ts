import type { Env } from '../types';
import { runDiscovery } from './discovery';
import { ensureAssets } from './ingest';
import { generateComposition } from '../lib/composition-engine';
import { ProjectDO } from '../agents/project-do';
import { uploadToR2, buildAssetR2Key } from '../lib/r2-utils';
import { downloadYouTubeVideo } from '../lib/youtube-downloader';

export { ProjectDO };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const path = url.pathname;

      // GET /api/health
      if (method === 'GET' && path === '/api/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // GET /api/projects — list all projects
      if (method === 'GET' && path === '/api/projects') {
        const { results } = await env.DB.prepare(
          `SELECT id, date, status, narrative, render_r2_key, render_duration_ms, render_error, updated_at
           FROM daily_projects ORDER BY date DESC LIMIT 30`
        ).all();
        return Response.json({ projects: results }, { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // GET /api/projects/:date — get one project
      const projectMatch = path.match(/^\/api\/projects\/(\d{4}-\d{2}-\d{2})$/);
      if (method === 'GET' && projectMatch) {
        const date = projectMatch[1];
        const project = await env.DB.prepare(
          `SELECT * FROM daily_projects WHERE id = ?`
        ).bind(date).first();
        if (!project) return new Response('Not found', { status: 404 });
        return Response.json({ project }, { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // POST /api/discover — run discovery now
      if (method === 'POST' && path === '/api/discover') {
        const result = await runDiscovery(env);
        return Response.json(result, { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // POST /api/compose/:date — generate composition
      const composeMatch = path.match(/^\/api\/compose\/(\d{4}-\d{2}-\d{2})$/);
      if (method === 'POST' && composeMatch) {
        const date = composeMatch[1];
        const result = await handleCompose(env, date);
        return Response.json(result, { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // POST /api/render/:date — trigger GitHub Actions render
      const renderMatch = path.match(/^\/api\/render\/(\d{4}-\d{2}-\d{2})$/);
      if (method === 'POST' && renderMatch) {
        const date = renderMatch[1];
        const githubRes = await fetch(
          `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/actions/workflows/299515665/dispatches`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
              'Content-Type': 'application/json',
              'User-Agent': 'AutomatizacionVideoViral',
            },
            body: JSON.stringify({ ref: 'master', inputs: { date } }),
          }
        );

        if (!githubRes.ok) {
          const errText = await githubRes.text();
          return Response.json({ error: `GitHub dispatch failed: ${githubRes.status} ${errText}` }, { status: 500, headers: corsHeaders });
        }

        await env.DB.prepare(
          `UPDATE daily_projects SET status = 'rendering' WHERE id = ?`
        ).bind(date).run();

        return Response.json({ date, status: 'rendering' }, { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // POST /api/webhook/render-callback — callback from GitHub Actions
      if (method === 'POST' && path === '/api/webhook/render-callback') {
        const body: any = await request.json();
        if (body.secret !== env.RENDER_CALLBACK_SECRET) {
          return new Response('Unauthorized', { status: 401 });
        }
        const date: string = body.date;
        const doId = env.PROJECT_DO.idFromName(date);
        const stub = env.PROJECT_DO.get(doId);
        const response = await stub.fetch(
          new Request('http://do/render/callback', {
            method: 'POST',
            body: JSON.stringify(body),
          })
        );
        return Response.json(await response.json(), { headers: corsHeaders });
      }

      // GET /api/downloads/:date — pending video downloads for GitHub Actions
      // Also matches /api/webhook/downloads/:date (workflow has wrong URL construction)
      const downloadsMatch = path.match(/^\/api\/(?:webhook\/)?downloads\/(\d{4}-\d{2}-\d{2})$/);
      if (method === 'GET' && downloadsMatch) {
        const date = downloadsMatch[1];
        const { results } = await env.DB.prepare(
          `SELECT id, project_id, type, platform, source_url, metadata FROM assets WHERE project_id = ? AND type = 'video' AND json_extract(metadata, '$.status') = 'pending_download'`
        ).bind(date).all();
        return Response.json({ downloads: results }, { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // GET /api/render/:date/output.mp4 — download rendered video
      const outputMatch = path.match(/^\/api\/render\/(\d{4}-\d{2}-\d{2})\/output\.mp4$/);
      if (method === 'GET' && outputMatch) {
        const date = outputMatch[1];
        const obj = await env.R2_RENDERS.get(`${date}/output.mp4`);
        if (!obj) return new Response('Not found', { status: 404 });
        return new Response(obj.body, {
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="viral-${date}.mp4"`,
            ...corsHeaders,
          },
        });
      }

      // GET /api/render/:date/thumbnail.jpg — download thumbnail
      const thumbMatch = path.match(/^\/api\/render\/(\d{4}-\d{2}-\d{2})\/thumbnail\.jpg$/);
      if (method === 'GET' && thumbMatch) {
        const date = thumbMatch[1];
        const obj = await env.R2_RENDERS.get(`${date}/thumbnail.jpg`);
        if (!obj) return new Response('Not found', { status: 404 });
        return new Response(obj.body, {
          headers: { 'Content-Type': 'image/jpeg', ...corsHeaders },
        });
      }

      // GET /api/assets/:date/:path+ — serve composition assets for GitHub Actions download
      const assetMatch = path.match(/^\/api\/assets\/(\d{4}-\d{2}-\d{2})\/(.+)$/);
      if (method === 'GET' && assetMatch) {
        const date = assetMatch[1];
        const assetPath = assetMatch[2];
        const obj = await env.R2_ASSETS.get(`${date}/${assetPath}`);
        if (!obj) return new Response('Not found', { status: 404 });
        const ext = assetPath.split('.').pop()?.toLowerCase() || '';
        const mime: Record<string, string> = {
          jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
          gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4',
          mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
          json: 'application/json', html: 'text/html', txt: 'text/plain',
          svg: 'image/svg+xml', csv: 'text/csv', ttf: 'font/ttf',
          woff: 'font/woff', woff2: 'font/woff2',
        };
        const contentType = mime[ext] || 'application/octet-stream';
        return new Response(obj.body, {
          headers: { 'Content-Type': contentType, ...corsHeaders },
        });
      }

      // POST /api/youtube-download — download YouTube video via Worker
      if (method === 'POST' && path === '/api/youtube-download') {
        const body: any = await request.json();
        const { videoId, date, filename } = body;
        if (!videoId || !date || !filename) {
          return Response.json({ error: 'Missing videoId, date, or filename' }, { status: 400, headers: corsHeaders });
        }
        const result = await downloadYouTubeVideo(videoId, env.YT_COOKIES);
        if (!result.data || result.data.byteLength < 1000) {
          return Response.json({ error: result.error || 'Failed to download video' }, { status: 502, headers: corsHeaders });
        }
        const buf = result.data;
        const key = `${date}/videos/${filename}.mp4`;
        await env.R2_ASSETS.put(key, buf, {
          httpMetadata: { contentType: 'video/mp4' },
        });
        await env.DB.prepare(
          `UPDATE assets SET metadata = json_set(metadata, '$.status', 'downloaded') WHERE project_id = ? AND id = ?`
        ).bind(date, `yt_${videoId}`).run();
        return Response.json({ ok: true, size: buf.byteLength }, { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // PUT /api/upload/:date/:filename — accept rendered output from GitHub Actions
      const uploadMatch = path.match(/^\/api\/upload\/(\d{4}-\d{2}-\d{2})\/(.+)$/);
      if (method === 'PUT' && uploadMatch) {
        const date = uploadMatch[1];
        const filename = uploadMatch[2];
        const buf = await request.arrayBuffer();
        await env.R2_RENDERS.put(`${date}/${filename}`, buf, {
          httpMetadata: { contentType: filename.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg' },
        });
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response('Not found', { status: 404 });
    } catch (e: any) {
      console.error('Error:', e);
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    console.log(`[Cron] Starting daily pipeline for ${date}`);

    try {
      // Step 1: Discovery + AI Selection
      console.log('[Cron] Running discovery...');
      const result = await runDiscovery(env);
      console.log(`[Cron] Discovered ${result.videos.length} videos, ${result.memes.length} memes`);

      // Step 2: Download assets to R2
      console.log('[Cron] Downloading assets...');
      const assetUrls = await ensureAssets(env, date, result);
      console.log(`[Cron] Downloaded ${assetUrls.videos.length} videos, ${assetUrls.memes.length} memes`);

      // Step 3: Generate composition
      console.log('[Cron] Generating composition...');
      const chosenAudio = result.selection?.selectedAudio || null;
      const compositionHtml = generateComposition({
        date,
        videos: result.videos,
        memes: result.memes,
        audio: chosenAudio,
        selection: result.selection!,
        assetUrls,
      });

      const compKey = buildAssetR2Key(date, 'composition', 'index.html');
      await uploadToR2(env.R2_ASSETS, compKey, compositionHtml, 'text/html');

      await env.DB.prepare(
        `UPDATE daily_projects SET status = 'ready', composition_r2_key = ? WHERE id = ?`
      ).bind(compKey, date).run();

      // Step 4: Trigger render via GitHub Actions (workflow_dispatch)
      console.log('[Cron] Triggering GitHub Actions render...');
      const githubRes = await fetch(
        `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/actions/workflows/299515665/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'AutomatizacionVideoViral',
          },
          body: JSON.stringify({
            ref: 'master',
            inputs: { date },
          }),
        }
      );

      if (!githubRes.ok) {
        const errText = await githubRes.text();
        console.error(`[Cron] GitHub dispatch failed: ${githubRes.status} ${errText}`);
        await env.DB.prepare(
          `UPDATE daily_projects SET status = 'failed', render_error = ? WHERE id = ?`
        ).bind(`GitHub dispatch failed: ${githubRes.status}`, date).run();
      } else {
        console.log('[Cron] Pipeline completed successfully');
      }
    } catch (e: any) {
      console.error(`[Cron] Pipeline failed:`, e);
      await env.DB.prepare(
        `UPDATE daily_projects SET status = 'failed', render_error = ? WHERE id = ?`
      ).bind(e.message, date).run();
    }
  },
};

async function handleCompose(env: Env, date: string, useAssets = true) {
  const project: any = await env.DB.prepare(`SELECT * FROM daily_projects WHERE id = ?`).bind(date).first();
  if (!project) throw new Error(`No project for ${date}`);

  const selection = {
    selectedVideos: JSON.parse(project.videos_selected || '[]'),
    selectedMemes: JSON.parse(project.memes_selected || '[]'),
    selectedAudio: JSON.parse(project.audio_selected || 'null'),
    narrative: project.narrative || '',
    captions: JSON.parse(project.captions || '[]'),
  };

  const videos: any[] = JSON.parse(project.videos_discovered || '[]');
  const memes: any[] = JSON.parse(project.memes_discovered || '[]');

  const discoveryResult = { date, videos, memes, audio: [] as any[], selection };
  const assetUrls = useAssets ? await ensureAssets(env, date, discoveryResult as any) : { videos: [], memes: [], audio: null };

  const compKey = buildAssetR2Key(date, 'composition', 'index.html');

  const compositionHtml = generateComposition({
    date,
    videos,
    memes,
    audio: selection.selectedAudio,
    selection,
    assetUrls,
  });

  await uploadToR2(env.R2_ASSETS, compKey, compositionHtml, 'text/html');

  await env.DB.prepare(
    `UPDATE daily_projects SET status = 'ready', composition_html = ?, composition_r2_key = ? WHERE id = ?`
  ).bind(compositionHtml, compKey, date).run();

  return { date, compositionR2Key: compKey, status: 'ready' };
}
