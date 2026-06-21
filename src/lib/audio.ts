import type { TrendingAudio } from '../types';
import { discoverFreesoundAudio } from './freesound';

export async function discoverTrendingAudio(freesoundKey?: string): Promise<TrendingAudio[]> {
  return discoverFreesoundAudio(freesoundKey);
}
