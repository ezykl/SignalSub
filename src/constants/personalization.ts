import type { ServicePreset } from './servicePresets';

if (typeof require !== 'undefined' && require.extensions) {
  if (!require.extensions['.jpg']) {
    require.extensions['.jpg'] = (module: any) => {
      module.exports = 1;
    };
  }
  if (!require.extensions['.jpeg']) {
    require.extensions['.jpeg'] = (module: any) => {
      module.exports = 1;
    };
  }
}

export interface AvatarOption {
  id: string;
  emoji: string;
  label: string;
  image?: any;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'space',
    emoji: '🚀',
    label: 'Leo',
    image: require('../../assets/images/avatars/astronaut.jpg'),
  },
  {
    id: 'robot',
    emoji: '🤖',
    label: 'Maya',
    image: require('../../assets/images/avatars/robot.jpg'),
  },
  {
    id: 'cat',
    emoji: '🐱',
    label: 'Kai',
    image: require('../../assets/images/avatars/cat.jpg'),
  },
  {
    id: 'fox',
    emoji: '🦊',
    label: 'Zoe',
    image: require('../../assets/images/avatars/fox.jpg'),
  },
  {
    id: 'ninja',
    emoji: '🥷',
    label: 'Rex',
    image: require('../../assets/images/avatars/ninja.jpg'),
  },

];

export function getAvatarById(idOrEmoji?: string | null): AvatarOption | undefined {
  if (!idOrEmoji) return undefined;
  return AVATAR_OPTIONS.find(
    (a) =>
      a.id === idOrEmoji ||
      a.emoji === idOrEmoji ||
      (idOrEmoji === 'astronaut' && a.id === 'space')
  );
}

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
