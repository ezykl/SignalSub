export type ServicePreset = {
  key: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  defaultAmount?: number;
};

export const SERVICE_PRESETS: ServicePreset[] = [
  {
    key: 'netflix',
    name: 'Netflix',
    icon: 'netflix',
    color: '#E50914',
    category: 'streaming',
    defaultAmount: 15.49,
  },
  {
    key: 'spotify',
    name: 'Spotify',
    icon: 'spotify',
    color: '#1DB954',
    category: 'streaming',
    defaultAmount: 11.99,
  },
  {
    key: 'youtube-premium',
    name: 'YouTube Premium',
    icon: 'youtube',
    color: '#FF0000',
    category: 'streaming',
    defaultAmount: 13.99,
  },
  {
    key: 'apple-tv-plus',
    name: 'Apple TV+',
    icon: 'apple',
    color: '#1C1C1E',
    category: 'streaming',
    defaultAmount: 9.99,
  },
  {
    key: 'disney-plus',
    name: 'Disney+',
    icon: 'movie-open',
    color: '#113CCF',
    category: 'streaming',
    defaultAmount: 13.99,
  },
  {
    key: 'max',
    name: 'Max',
    icon: 'television-classic',
    color: '#002BE7',
    category: 'streaming',
    defaultAmount: 15.99,
  },
  {
    key: 'hulu',
    name: 'Hulu',
    icon: 'television',
    color: '#1CE783',
    category: 'streaming',
    defaultAmount: 7.99,
  },
  {
    key: 'amazon-prime',
    name: 'Amazon Prime',
    icon: 'amazon',
    color: '#00A8E1',
    category: 'streaming',
    defaultAmount: 14.99,
  },
  {
    key: 'adobe-cc',
    name: 'Adobe CC',
    icon: 'adobe',
    color: '#FF0000',
    category: 'productivity',
    defaultAmount: 54.99,
  },
  {
    key: 'microsoft-365',
    name: 'Microsoft 365',
    icon: 'microsoft',
    color: '#D83B01',
    category: 'productivity',
    defaultAmount: 6.99,
  },
  {
    key: 'google-one',
    name: 'Google One',
    icon: 'google',
    color: '#4285F4',
    category: 'cloud',
    defaultAmount: 2.99,
  },
  {
    key: 'icloud',
    name: 'iCloud',
    icon: 'apple-icloud',
    color: '#3399FF',
    category: 'cloud',
    defaultAmount: 2.99,
  },
  {
    key: 'github-pro',
    name: 'GitHub Pro',
    icon: 'github',
    color: '#24292E',
    category: 'developer',
    defaultAmount: 4.0,
  },
  {
    key: 'figma',
    name: 'Figma',
    icon: 'vector-square',
    color: '#F24E1E',
    category: 'productivity',
    defaultAmount: 15.0,
  },
  {
    key: 'notion',
    name: 'Notion',
    icon: 'notebook-outline',
    color: '#191919',
    category: 'productivity',
    defaultAmount: 10.0,
  },
  {
    key: 'slack',
    name: 'Slack',
    icon: 'slack',
    color: '#4A154B',
    category: 'productivity',
    defaultAmount: 8.75,
  },
  {
    key: 'discord',
    name: 'Discord',
    icon: 'discord',
    color: '#5865F2',
    category: 'gaming',
    defaultAmount: 9.99,
  },
  {
    key: 'dropbox',
    name: 'Dropbox',
    icon: 'dropbox',
    color: '#0061FF',
    category: 'cloud',
    defaultAmount: 11.99,
  },
  {
    key: 'canva',
    name: 'Canva',
    icon: 'palette-outline',
    color: '#00C4CC',
    category: 'productivity',
    defaultAmount: 12.99,
  },
  {
    key: 'duolingo',
    name: 'Duolingo',
    icon: 'owl',
    color: '#58CC02',
    category: 'productivity',
    defaultAmount: 6.99,
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: 'linkedin',
    color: '#0A66C2',
    category: 'productivity',
    defaultAmount: 29.99,
  },
  {
    key: 'twitch',
    name: 'Twitch',
    icon: 'twitch',
    color: '#9146FF',
    category: 'streaming',
    defaultAmount: 4.99,
  },
  {
    key: 'chatgpt',
    name: 'ChatGPT',
    icon: 'robot',
    color: '#10A37F',
    category: 'productivity',
    defaultAmount: 20.0,
  },
  {
    key: 'grammarly',
    name: 'Grammarly',
    icon: 'spellcheck',
    color: '#15C39A',
    category: 'productivity',
    defaultAmount: 12.0,
  },
  {
    key: 'lastpass',
    name: 'LastPass',
    icon: 'form-textbox-password',
    color: '#D32D27',
    category: 'productivity',
    defaultAmount: 3.0,
  },
  {
    key: 'nordvpn',
    name: 'NordVPN',
    icon: 'shield-lock-outline',
    color: '#4687FF',
    category: 'other',
    defaultAmount: 12.99,
  },
  {
    key: 'dashlane',
    name: 'Dashlane',
    icon: 'shield-key-outline',
    color: '#0E353D',
    category: 'productivity',
    defaultAmount: 4.99,
  },
  {
    key: 'expensify',
    name: 'Expensify',
    icon: 'receipt',
    color: '#00D09C',
    category: 'productivity',
    defaultAmount: 5.0,
  },
  {
    key: 'zoom',
    name: 'Zoom',
    icon: 'video',
    color: '#2D8CFF',
    category: 'productivity',
    defaultAmount: 13.33,
  },
  {
    key: 'todoist',
    name: 'Todoist',
    icon: 'check-circle-outline',
    color: '#E44332',
    category: 'productivity',
    defaultAmount: 4.0,
  },
  {
    key: 'apple-music',
    name: 'Apple Music',
    icon: 'music-note',
    color: '#FA243C',
    category: 'streaming',
    defaultAmount: 10.99,
  },
  {
    key: 'playstation-plus',
    name: 'PlayStation Plus',
    icon: 'sony-playstation',
    color: '#003791',
    category: 'gaming',
    defaultAmount: 9.99,
  },
  {
    key: 'xbox-game-pass',
    name: 'Xbox Game Pass',
    icon: 'microsoft-xbox',
    color: '#107C10',
    category: 'gaming',
    defaultAmount: 16.99,
  },
  {
    key: 'nintendo-switch-online',
    name: 'Nintendo Switch Online',
    icon: 'nintendo-switch',
    color: '#E60012',
    category: 'gaming',
    defaultAmount: 3.99,
  },
  {
    key: 'strava',
    name: 'Strava',
    icon: 'bike',
    color: '#FC4C02',
    category: 'fitness',
    defaultAmount: 11.99,
  },
  {
    key: 'gym-membership',
    name: 'Gym Membership',
    icon: 'dumbbell',
    color: '#22C55E',
    category: 'fitness',
    defaultAmount: 49.99,
  },
  {
    key: 'audible',
    name: 'Audible',
    icon: 'headphones',
    color: '#F8991D',
    category: 'streaming',
    defaultAmount: 14.95,
  },
  {
    key: '1password',
    name: '1Password',
    icon: 'form-textbox-password',
    color: '#0A85EA',
    category: 'productivity',
    defaultAmount: 2.99,
  },
  {
    key: 'medium',
    name: 'Medium',
    icon: 'newspaper-variant-outline',
    color: '#1A1A1A',
    category: 'productivity',
    defaultAmount: 5.0,
  },
  {
    key: 'substack',
    name: 'Substack',
    icon: 'email-newsletter',
    color: '#FF6719',
    category: 'productivity',
    defaultAmount: 10.0,
  },
];

export function getPresetByKey(key: string): ServicePreset | undefined {
  if (!key) return undefined;
  const normalized = key.toLowerCase();
  return SERVICE_PRESETS.find((preset) => preset.key.toLowerCase() === normalized);
}

export function searchPresets(query: string): ServicePreset[] {
  if (!query || !query.trim()) {
    return SERVICE_PRESETS;
  }
  const normalized = query.toLowerCase().trim();
  return SERVICE_PRESETS.filter(
    (preset) =>
      preset.name.toLowerCase().includes(normalized) ||
      preset.key.toLowerCase().includes(normalized)
  );
}
