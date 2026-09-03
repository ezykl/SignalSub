import type { ServicePreset } from './servicePresets';

export interface AvatarOption {
  id: string;
  emoji: string;
  label: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'space', emoji: '🚀', label: 'Space' },
  { id: 'robot', emoji: '🤖', label: 'Robot' },
  { id: 'bolt', emoji: '⚡', label: 'Bolt' },
  { id: 'coffee', emoji: '☕', label: 'Coffee' },
  { id: 'gamer', emoji: '🎮', label: 'Gamer' },
  { id: 'sparkles', emoji: '✨', label: 'Sparkles' },
];

export interface FavoriteCategoryOption {
  key: string;
  label: string;
  icon: string;
}

export const FAVORITE_CATEGORY_OPTIONS: FavoriteCategoryOption[] = [
  { key: 'streaming', label: 'Streaming', icon: '🍿' },
  { key: 'ai_tools', label: 'AI Tools', icon: '🤖' },
  { key: 'developer', label: 'Developer', icon: '💻' },
  { key: 'gaming', label: 'Gaming', icon: '🎮' },
  { key: 'utilities', label: 'Utilities', icon: '⚡' },
];

export function isPresetInFavoriteCategories(
  preset: ServicePreset,
  favoriteCategories: string[]
): boolean {
  if (!favoriteCategories || favoriteCategories.length === 0) return false;
  return favoriteCategories.some((cat) => {
    const c = cat.toLowerCase();
    const pCat = (preset.category || '').toLowerCase();
    const pKey = (preset.key || '').toLowerCase();

    if (c === 'streaming') return pCat === 'streaming';
    if (c === 'ai_tools' || c === 'ai tools') {
      return (
        ['chatgpt', 'claude', 'gemini', 'midjourney', 'cursor'].includes(pKey) ||
        pCat === 'ai_tools' ||
        pCat === 'ai'
      );
    }
    if (c === 'developer') {
      return pCat === 'developer' || ['github-pro', 'cursor'].includes(pKey);
    }
    if (c === 'gaming') {
      return (
        pCat === 'gaming' ||
        [
          'discord',
          'playstation-plus',
          'xbox-game-pass',
          'nintendo-switch-online',
        ].includes(pKey)
      );
    }
    if (c === 'utilities') {
      return ['cloud', 'productivity', 'other', 'utilities'].includes(pCat);
    }
    return pCat === c;
  });
}
