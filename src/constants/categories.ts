export type Category = {
  key: string;
  label: string;
  color: string;
  icon: string;
};

export type CategoryKey =
  | 'streaming'
  | 'productivity'
  | 'fitness'
  | 'gaming'
  | 'cloud'
  | 'developer'
  | 'other';

export const CATEGORIES: Category[] = [
  {
    key: 'streaming',
    label: 'Streaming',
    color: '#EF4444',
    icon: 'television-play',
  },
  {
    key: 'productivity',
    label: 'Productivity',
    color: '#F59E0B',
    icon: 'briefcase-outline',
  },
  {
    key: 'fitness',
    label: 'Fitness',
    color: '#22C55E',
    icon: 'dumbbell',
  },
  {
    key: 'gaming',
    label: 'Gaming',
    color: '#6366F1',
    icon: 'gamepad-variant-outline',
  },
  {
    key: 'cloud',
    label: 'Cloud',
    color: '#3B82F6',
    icon: 'cloud-outline',
  },
  {
    key: 'developer',
    label: 'Developer',
    color: '#8B5CF6',
    icon: 'code-tags',
  },
  {
    key: 'other',
    label: 'Other',
    color: '#94A3B8',
    icon: 'dots-horizontal-circle-outline',
  },
];

export function getCategoryByKey(key: string): Category {
  const normalizedKey = (key || '').toLowerCase();
  const found = CATEGORIES.find((cat) => cat.key.toLowerCase() === normalizedKey);
  if (found) {
    return found;
  }
  const fallback = CATEGORIES.find((cat) => cat.key === 'other');
  return fallback ?? CATEGORIES[CATEGORIES.length - 1];
}
