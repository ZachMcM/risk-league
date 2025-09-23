import { readFileSync } from 'fs';
import { join } from 'path';
import { adjectives, nouns } from 'unique-username-generator';

interface UsernameDictionaries {
  regularAdjectives: string[];
  regularNouns: string[];
  sportsAdjectives: string[];
  gamblingNouns: string[];
  gamingSlang: string[];
}

let cachedDictionaries: UsernameDictionaries | null = null;

/**
 * Lazy-loads username dictionaries from JSON file
 * Caches the result for subsequent calls
 */
export function getUsernameDictionaries(): UsernameDictionaries {
  if (cachedDictionaries) {
    return cachedDictionaries;
  }

  try {
    const filePath = join(__dirname, '../../data/username-dictionaries.json');
    const fileContent = readFileSync(filePath, 'utf8');
    cachedDictionaries = JSON.parse(fileContent) as UsernameDictionaries;
    return cachedDictionaries;
  } catch (error) {
    // Fallback to minimal dictionaries if file load fails
    console.warn('Failed to load username dictionaries, using fallback:', error);
    cachedDictionaries = {
      regularAdjectives: ['cool', 'epic', 'pro', 'elite', 'swift'],
      regularNouns: ['player', 'gamer', 'ace', 'champion', 'legend'],
      sportsAdjectives: ['clutch', 'mvp', 'elite'],
      gamblingNouns: ['player', 'bettor', 'ace'],
      gamingSlang: ['pro', 'noob', 'goat']
    };
    return cachedDictionaries;
  }
}

/**
 * Gets combined dictionaries for username generation
 * Merges custom dictionaries with library defaults
 */
export function getCombinedDictionaries(): [string[], string[]] {
  const dicts = getUsernameDictionaries();

  const combinedAdjectives = [
    ...dicts.regularAdjectives,
    ...dicts.sportsAdjectives,
    ...adjectives // From unique-username-generator library
  ];

  const combinedNouns = [
    ...dicts.regularNouns,
    ...dicts.gamblingNouns,
    ...dicts.gamingSlang,
    ...nouns // From unique-username-generator library
  ];

  return [combinedAdjectives, combinedNouns];
}