import type { Env, Project } from '../types';

export class ProjectDO implements DurableObject {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'GET' && url.pathname === '/status') {
      const project = await this.getProject();
      return Response.json(project);
    }

    if (method === 'POST' && url.pathname === '/compose') {
      const body = await request.json();
      return this.handleCompose(body);
    }

    if (method === 'POST' && url.pathname === '/render') {
      return this.handleRenderStart(request);
    }

    if (method === 'POST' && url.pathname === '/render/callback') {
      const body = await request.json();
      return this.handleRenderCallback(body);
    }

    if (method === 'POST' && url.pathname === '/reset') {
      await this.state.storage?.deleteAll();
      return new Response('OK');
    }

    return new Response('Not found', { status: 404 });
  }

  private async getProject(): Promise<Project | null> {
    return (await this.state.storage?.get<Project>('project')) || null;
  }

  private async handleCompose(body: any): Promise<Response> {
    const project: Project = {
      id: body.date || new Date().toISOString().split('T')[0],
      date: body.date,
      status: 'composing',
      compositionHtml: body.compositionHtml,
      compositionR2Key: body.compositionR2Key,
    };
    await this.state.storage?.put('project', project);
    return Response.json(project);
  }

  private async handleRenderStart(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || '';
    let project = await this.getProject();
    if (!project) {
      const row: any = await this.env.DB.prepare(
        `SELECT * FROM daily_projects WHERE id = ?`
      ).bind(date).first();
      if (!row) return Response.json({ error: 'No project' }, { status: 400 });
      project = { id: row.id, date: row.date, status: row.status };
    }

    project.status = 'rendering';
    await this.state.storage?.put('project', project);

    const githubRes = await fetch(
      `https://api.github.com/repos/${this.env.GITHUB_OWNER}/${this.env.GITHUB_REPO}/actions/workflows/299515665/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AutomatizacionVideoViral',
        },
        body: JSON.stringify({
          ref: 'master',
          inputs: { date: project.date },
        }),
      }
    );

    if (!githubRes.ok) {
      const errText = await githubRes.text();
      project.status = 'failed';
      project.error = `GitHub dispatch failed: ${githubRes.status} ${errText}`;
      await this.state.storage?.put('project', project);
      return Response.json({ error: project.error }, { status: 500 });
    }

    await this.env.DB.prepare(
      `UPDATE daily_projects SET status = 'rendering', render_job_id = ? WHERE id = ?`
    ).bind(project.date + '-' + Date.now(), project.date).run();

    return Response.json(project);
  }

  private async handleRenderCallback(body: any): Promise<Response> {
    const project = await this.getProject();
    if (!project) return new Response('No project', { status: 400 });

    project.status = body.status === 'done' ? 'done' : 'failed';
    project.renderR2Key = body.r2Key || undefined;
    project.renderDuration = body.duration || undefined;
    if (body.error) project.error = body.error;

    await this.state.storage?.put('project', project);

    await this.env.DB.prepare(
      `UPDATE daily_projects SET
        status = ?, render_r2_key = ?, render_duration_ms = ?, render_error = ?, updated_at = current_timestamp
       WHERE id = ?`
    )
      .bind(project.status, project.renderR2Key || null, project.renderDuration || null, project.error || null, project.date)
      .run();

    return Response.json(project);
  }
}
