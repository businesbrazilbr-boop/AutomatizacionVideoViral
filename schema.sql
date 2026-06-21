CREATE TABLE IF NOT EXISTS daily_projects (
  id TEXT PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'discovered',
  videos_discovered JSON,
  memes_discovered JSON,
  audio_discovered JSON,
  videos_selected JSON,
  memes_selected JSON,
  audio_selected JSON,
  narrative TEXT,
  captions JSON,
  composition_r2_key TEXT,
  composition_html TEXT,
  render_job_id TEXT,
  render_status TEXT,
  render_r2_key TEXT,
  render_thumbnail_key TEXT,
  render_github_run_id INTEGER,
  render_duration_ms INTEGER,
  render_error TEXT,
  created_at TEXT DEFAULT (current_timestamp),
  updated_at TEXT DEFAULT (current_timestamp)
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES daily_projects(id),
  type TEXT,
  platform TEXT,
  source_url TEXT,
  r2_key TEXT,
  size_bytes INTEGER,
  metadata JSON,
  created_at TEXT DEFAULT (current_timestamp)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT REFERENCES daily_projects(id),
  step TEXT,
  status TEXT,
  duration_ms INTEGER,
  details JSON,
  created_at TEXT DEFAULT (current_timestamp)
);

CREATE TABLE IF NOT EXISTS api_cache (
  endpoint TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  response_json TEXT,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (endpoint, cache_key)
);
