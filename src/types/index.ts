export interface ViralVideo {
  id: string;
  platform: 'youtube' | 'tiktok' | 'instagram';
  title: string;
  url: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  duration: number;
  author: string;
  description: string;
  musicTitle?: string;
  musicUrl?: string;
}

export interface TrendingMeme {
  id: string;
  name: string;
  slug: string;
  url: string;
  categories: string[];
  source: 'justmeme' | 'imgflip' | 'reddit';
}

export interface TrendingAudio {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  platform: 'tiktok' | 'instagram' | 'freesound';
  videoCount: number;
  isTrending: boolean;
}

export interface AISelectionResult {
  selectedVideos: ViralVideo[];
  selectedMemes: TrendingMeme[];
  selectedAudio: TrendingAudio | null;
  narrative: string;
  captions: { start: number; end: number; text: string }[];
}

export interface DailyPlan {
  date: string;
  videos: ViralVideo[];
  memes: TrendingMeme[];
  audio: TrendingAudio[];
  selection: {
    selectedVideos: ViralVideo[];
    selectedMemes: TrendingMeme[];
    selectedAudio: TrendingAudio | null;
    narrative: string;
    captions: { start: number; end: number; text: string }[];
  };
}

export interface Project {
  id: string;
  date: string;
  status: 'discovered' | 'selected' | 'composing' | 'ready' | 'rendering' | 'done' | 'failed';
  compositionHtml?: string;
  compositionR2Key?: string;
  renderR2Key?: string;
  renderDuration?: number;
  thumbnailUrl?: string;
  error?: string;
}

export interface Env {
  DB: D1Database;
  R2_ASSETS: R2Bucket;
  R2_RENDERS: R2Bucket;
  AI: any;
  PROJECT_DO: DurableObjectNamespace;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_TOKEN: string;
  RENDER_CALLBACK_SECRET: string;
  GENVIRAL_API_KEY: string;
  APIFY_API_KEY: string;
  OMKAR_API_KEY: string;
  FREESOUND_API_KEY: string;
}
