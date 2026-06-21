import type { TrendingAudio } from '../types';
import { discoverJamendoAudio } from './jamendo';
import { discoverFreesoundAudio } from './freesound';

export async function discoverTrendingAudio(jamendoClientId?: string, freesoundKey?: string): Promise<TrendingAudio[]> {
  const jamendo = await discoverJamendoAudio(jamendoClientId);
  if (jamendo.length > 0) return jamendo;
  return discoverFreesoundAudio(freesoundKey);
}
