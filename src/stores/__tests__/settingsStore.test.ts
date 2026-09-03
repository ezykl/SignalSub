import './setupDbMock';
import { resetDbMock, seedSettings, getInMemorySettings, dbCallLog } from './setupDbMock';

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useSettingsStore, settingsStore } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    resetDbMock();
    useSettingsStore.setState({ cache: {} });
  });

  describe('initial state and aliases', () => {
    it('starts with empty cache', () => {
      const state = useSettingsStore.getState();
      assert.deepEqual(state.cache, {});
    });

    it('settingsStore alias references the same Zustand store', () => {
      assert.strictEqual(settingsStore, useSettingsStore);
    });
  });

  describe('getSetting', () => {
    it('returns empty string when key is not in cache and no fallback is given', () => {
      const value = useSettingsStore.getState().getSetting('missing_key');
      assert.strictEqual(value, '');
    });

    it('returns fallback value when key is not in cache', () => {
      const value = useSettingsStore.getState().getSetting('currency', 'USD');
      assert.strictEqual(value, 'USD');
    });

    it('returns cached value when key exists, ignoring fallback', () => {
      useSettingsStore.setState({ cache: { currency: 'EUR' } });
      const value = useSettingsStore.getState().getSetting('currency', 'USD');
      assert.strictEqual(value, 'EUR');
    });

    it('returns cached empty string if explicitly set in cache', () => {
      useSettingsStore.setState({ cache: { custom_note: '' } });
      const value = useSettingsStore.getState().getSetting('custom_note', 'default');
      assert.strictEqual(value, '');
    });
  });

  describe('loadSettings', () => {
    it('loads settings from SQLite into state cache', async () => {
      seedSettings({
        currency: 'GBP',
        theme: 'dark',
        notifications_enabled: 'true',
      });

      await useSettingsStore.getState().loadSettings();

      const cache = useSettingsStore.getState().cache;
      assert.strictEqual(cache.currency, 'GBP');
      assert.strictEqual(cache.theme, 'dark');
      assert.strictEqual(cache.notifications_enabled, 'true');
      assert.strictEqual(useSettingsStore.getState().getSetting('currency'), 'GBP');
    });

    it('handles empty settings table gracefully', async () => {
      seedSettings({});

      await useSettingsStore.getState().loadSettings();

      assert.deepEqual(useSettingsStore.getState().cache, {});
    });

    it('overwrites stale cached keys when loaded from database', async () => {
      useSettingsStore.setState({ cache: { stale_key: 'old_value' } });
      seedSettings({ new_key: 'new_value' });

      await useSettingsStore.getState().loadSettings();

      assert.deepEqual(useSettingsStore.getState().cache, { new_key: 'new_value' });
      assert.strictEqual(useSettingsStore.getState().getSetting('stale_key'), '');
    });
  });

  describe('setSetting', () => {
    it('upserts a new setting into SQLite and updates state cache', async () => {
      await useSettingsStore.getState().setSetting('theme', 'dark');

      // Verify SQLite state
      const dbSettings = getInMemorySettings();
      assert.strictEqual(dbSettings.theme, 'dark');

      // Verify Zustand state
      assert.strictEqual(useSettingsStore.getState().cache.theme, 'dark');
      assert.strictEqual(useSettingsStore.getState().getSetting('theme'), 'dark');

      // Verify DB insert call was logged
      assert.strictEqual(dbCallLog.inserts.length, 1);
      assert.strictEqual(dbCallLog.inserts[0].table, 'settings');
      assert.deepEqual(dbCallLog.inserts[0].values, { key: 'theme', value: 'dark' });
    });

    it('updates an existing setting in SQLite and updates state cache', async () => {
      seedSettings({ currency: 'USD' });
      useSettingsStore.setState({ cache: { currency: 'USD' } });

      await useSettingsStore.getState().setSetting('currency', 'JPY');

      const dbSettings = getInMemorySettings();
      assert.strictEqual(dbSettings.currency, 'JPY');
      assert.strictEqual(useSettingsStore.getState().cache.currency, 'JPY');
      assert.strictEqual(useSettingsStore.getState().getSetting('currency'), 'JPY');
    });

    it('preserves existing cached settings when adding a new setting', async () => {
      useSettingsStore.setState({ cache: { setting_a: 'alpha' } });

      await useSettingsStore.getState().setSetting('setting_b', 'beta');

      const state = useSettingsStore.getState();
      assert.strictEqual(state.cache.setting_a, 'alpha');
      assert.strictEqual(state.cache.setting_b, 'beta');
    });
  });
});
