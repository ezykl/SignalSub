import { create } from 'zustand';
import { db } from '../db/client';
import { settings } from '../db/schema';

export interface SettingsState {
  cache: Record<string, string>;
  loadSettings: () => Promise<void>;
  getSetting: (key: string, fallback?: string) => string;
  setSetting: (key: string, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  cache: {},

  loadSettings: async () => {
    const rows = await db.select().from(settings);
    const newCache: Record<string, string> = {};
    for (const row of rows) {
      newCache[row.key] = row.value;
    }
    set({ cache: newCache });
  },

  getSetting: (key: string, fallback?: string) => {
    return get().cache[key] ?? fallback ?? '';
  },

  setSetting: async (key: string, value: string) => {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value },
      });

    set((state) => ({
      cache: {
        ...state.cache,
        [key]: value,
      },
    }));
  },
}));

export const settingsStore = useSettingsStore;
