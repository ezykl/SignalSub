import '../../stores/__tests__/setupDbMock';
import './setupComponentMocks';
import {
  mockRouter,
  mockAlert,
  mockExpoNotifications,
} from './setupComponentMocks';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { COLORS } from '../../constants/colors';
import { POPULAR_CURRENCIES } from '../../constants/currencies';
import type { Subscription } from '../../db/schema';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import SettingsScreen from '../../../app/settings';

// Helper to extract children from React element
function getChildren(element: any): any[] {
  if (!element) return [];
  if (Array.isArray(element)) return element.flat(Infinity).filter(Boolean);
  if (!element.props) return [];
  const ch = element.props.children;
  if (!ch) return [];
  return (Array.isArray(ch) ? ch.flat(Infinity) : [ch]).filter(Boolean);
}

// Recursive finder by testID
function findByTestId(element: any, testID: string): any | null {
  if (!element) return null;
  if (Array.isArray(element)) {
    for (const child of element) {
      const found = findByTestId(child, testID);
      if (found) return found;
    }
    return null;
  }
  if (typeof element !== 'object') return null;
  if (element.props && element.props.testID === testID) return element;
  const children = getChildren(element);
  for (const child of children) {
    const found = findByTestId(child, testID);
    if (found) return found;
  }
  return null;
}

// Recursive finder by type
function findAllByType(element: any, typeName: any): any[] {
  const matches: any[] = [];
  function recurse(el: any) {
    if (!el) return;
    if (Array.isArray(el)) {
      for (const item of el) recurse(item);
      return;
    }
    if (typeof el !== 'object') return;
    if (el.type === typeName) matches.push(el);
    const children = getChildren(el);
    for (const child of children) {
      recurse(child);
    }
  }
  recurse(element);
  return matches;
}

// Helper to flatten React Native style array
function flattenStyle(style: any): Record<string, any> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.filter(Boolean).reduce((acc, curr) => {
      return Object.assign(acc, flattenStyle(curr));
    }, {});
  }
  return typeof style === 'object' ? style : {};
}

// State tracker for React dispatcher
let stateMap = new Map<number, any>();
let stateIndex = 0;

function resetComponentState() {
  stateMap = new Map();
  stateIndex = 0;
}

function startRender() {
  stateIndex = 0;
}

const mockDispatcher = {
  useState: (init: any) => {
    const idx = stateIndex++;
    if (!stateMap.has(idx)) {
      stateMap.set(idx, typeof init === 'function' ? init() : init);
    }
    const val = stateMap.get(idx);
    const setVal = (newVal: any) => {
      const current = stateMap.get(idx);
      const resolved = typeof newVal === 'function' ? newVal(current) : newVal;
      stateMap.set(idx, resolved);
    };
    return [val, setVal];
  },
  useMemo: (fn: any) => fn(),
  useCallback: (fn: any) => fn,
  useEffect: () => {},
  useLayoutEffect: () => {},
  useRef: (init: any) => ({ current: init }),
  useContext: () => ({}),
  useSyncExternalStore: (_subscribe: any, getSnapshot: any) => getSnapshot(),
  useDebugValue: () => {},
};

(React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current =
  mockDispatcher;

function createMockSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: `sub-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Netflix',
    description: null,
    amount: 15.49,
    currency: 'USD',
    billingCycle: 'monthly',
    nextRenewalDate: '2026-10-01',
    startDate: '2026-09-01',
    color: '#E50914',
    iconType: 'preset',
    iconValue: 'netflix',
    category: 'streaming',
    isTrial: 0,
    trialEndDate: null,
    isActive: 1,
    status: 'active',
    notifyBeforeDays: 3,
    notificationId: 'mock-notif-1',
    paymentMethod: 'card',
    paymentDetails: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Settings Screen (app/settings.tsx)', () => {
  let alertCalls: { title: string; message?: string; buttons?: any[] }[] = [];
  let backCalls = 0;
  let scheduledNotifications: any[] = [];
  let canceledNotificationIds: string[] = [];
  let deletedSubscriptionIds: string[] = [];

  beforeEach(() => {
    resetComponentState();
    alertCalls = [];
    backCalls = 0;
    scheduledNotifications = [];
    canceledNotificationIds = [];
    deletedSubscriptionIds = [];

    mockRouter.back = () => {
      backCalls++;
    };

    mockAlert.alert = (title: string, message?: string, buttons?: any[]) => {
      alertCalls.push({ title, message, buttons });
    };

    mockExpoNotifications.scheduleNotificationAsync = async (request: any) => {
      scheduledNotifications.push(request);
      return `scheduled-digest-${Date.now()}`;
    };

    mockExpoNotifications.cancelScheduledNotificationAsync = async (id: string) => {
      canceledNotificationIds.push(id);
    };

    useSettingsStore.setState({
      cache: {
        default_currency: 'USD',
        notify_weekly_digest: 'true',
        weekly_digest_notification_id: 'existing-digest-id-123',
      },
      loadSettings: async () => {},
      setSetting: async (key: string, value: string) => {
        useSettingsStore.setState((prev) => ({
          cache: {
            ...prev.cache,
            [key]: value,
          },
        }));
      },
    });

    useSubscriptionStore.setState({
      subscriptions: [],
      loadSubscriptions: async () => {},
      deleteSubscription: async (id: string) => {
        deletedSubscriptionIds.push(id);
        useSubscriptionStore.setState((prev) => ({
          subscriptions: prev.subscriptions.filter((s) => s.id !== id),
        }));
      },
    });
  });

  // =========================================================================
  // 1. Header & General Screen Structure
  // =========================================================================
  describe('Header & Layout Structure', () => {
    it('renders SafeAreaView with background COLORS.bgPrimary', () => {
      startRender();
      const element = SettingsScreen();
      assert.equal(element.type, 'SafeAreaView');
      const style = flattenStyle(element.props.style);
      const isClassPrimary = typeof element.props.className === 'string' && element.props.className.includes('bg-background');
      assert.ok(style.backgroundColor === COLORS.bgPrimary || isClassPrimary);
    });

    it('renders header with back arrow button and title "Settings" in 22sp bold white', () => {
      startRender();
      const element = SettingsScreen();

      // Back button
      const backBtn = findByTestId(element, 'settings-back-btn');
      assert.ok(backBtn);
      backBtn.props.onPress();
      assert.equal(backCalls, 1);

      // Title
      const texts = findAllByType(element, 'Text');
      const titleElement = texts.find((t) => t.props.children === 'Settings');
      assert.ok(titleElement);
      const titleStyle = flattenStyle(titleElement.props.style);
      const isClassTitle = typeof titleElement.props.className === 'string' && titleElement.props.className.includes('text-[22px]');
      assert.ok((titleStyle.fontSize === 22 && titleStyle.fontWeight === 'bold') || isClassTitle);
    });

    it('renders all four section headers: CURRENCY, NOTIFICATIONS, DATA, and ABOUT', () => {
      startRender();
      const element = SettingsScreen();

      assert.ok(findByTestId(element, 'section-currency'));
      assert.ok(findByTestId(element, 'section-notifications'));
      assert.ok(findByTestId(element, 'section-data'));
      assert.ok(findByTestId(element, 'section-about'));

      const texts = findAllByType(element, 'Text').map((t) => t.props.children);
      assert.ok(texts.includes('CURRENCY'));
      assert.ok(texts.includes('NOTIFICATIONS'));
      assert.ok(texts.includes('DATA'));
      assert.ok(texts.includes('ABOUT'));
    });

    it('renders Section 4 ABOUT card with app name, version, and tagline', () => {
      startRender();
      const element = SettingsScreen();

      const aboutCard = findByTestId(element, 'settings-about-card');
      assert.ok(aboutCard);

      const texts = findAllByType(aboutCard, 'Text').map((t) => t.props.children);
      assert.ok(texts.includes('SignalSub'));
      assert.ok(texts.includes('Version 1.0.0'));
      assert.ok(texts.includes('Never get surprised by an auto-charge.'));

      // Check card background color
      const cardStyle = flattenStyle(aboutCard.props.style);
      const isClassCard = typeof aboutCard.props.className === 'string' && aboutCard.props.className.includes('bg-card');
      assert.ok(cardStyle.backgroundColor === COLORS.bgCard || isClassCard);
    });
  });

  // =========================================================================
  // 2. Section 1: CURRENCY
  // =========================================================================
  describe('Section 1: CURRENCY & Modal Picker', () => {
    it('displays the current default currency code from useSettingsStore', () => {
      useSettingsStore.setState({
        cache: { default_currency: 'PHP' },
      });

      startRender();
      const element = SettingsScreen();

      const currencyValue = findByTestId(element, 'settings-currency-value');
      assert.ok(currencyValue);
      assert.equal(currencyValue.props.children, 'PHP');
    });

    it('opens currency selection modal when currency row is tapped', () => {
      startRender();
      let element = SettingsScreen();

      // Initially modal is not visible
      let modal = findByTestId(element, 'currency-picker-modal');
      assert.ok(modal);
      assert.equal(modal.props.visible, false);

      // Tap currency row
      const currencyRow = findByTestId(element, 'settings-currency-row');
      assert.ok(currencyRow);
      currencyRow.props.onPress();

      // Re-render and modal should now be visible
      startRender();
      element = SettingsScreen();
      modal = findByTestId(element, 'currency-picker-modal');
      assert.equal(modal.props.visible, true);
    });

    it('closes currency modal when close button is tapped', () => {
      startRender();
      let element = SettingsScreen();

      // Open modal
      const currencyRow = findByTestId(element, 'settings-currency-row');
      currencyRow.props.onPress();

      startRender();
      element = SettingsScreen();
      let modal = findByTestId(element, 'currency-picker-modal');
      assert.equal(modal.props.visible, true);

      // Tap close button
      const closeBtn = findByTestId(element, 'currency-modal-close-btn');
      assert.ok(closeBtn);
      closeBtn.props.onPress();

      startRender();
      element = SettingsScreen();
      modal = findByTestId(element, 'currency-picker-modal');
      assert.equal(modal.props.visible, false);
    });

    it('filters currencies via search input inside modal', () => {
      startRender();
      let element = SettingsScreen();

      // Open modal
      const currencyRow = findByTestId(element, 'settings-currency-row');
      currencyRow.props.onPress();

      startRender();
      element = SettingsScreen();

      const searchInput = findByTestId(element, 'currency-search-input');
      assert.ok(searchInput);

      // Search for "PHP"
      searchInput.props.onChangeText('PHP');

      startRender();
      element = SettingsScreen();

      // FlatList data should only contain PHP
      const list = findByTestId(element, 'currency-list');
      assert.ok(list);
      assert.equal(list.props.data.length, 1);
      assert.equal(list.props.data[0].code, 'PHP');

      // Clear search button should appear and reset filter
      const clearSearchBtn = findByTestId(element, 'currency-search-clear-btn');
      assert.ok(clearSearchBtn);
      clearSearchBtn.props.onPress();

      startRender();
      element = SettingsScreen();
      const resetList = findByTestId(element, 'currency-list');
      assert.equal(resetList.props.data.length, POPULAR_CURRENCIES.length);
    });

    it('updates default_currency in useSettingsStore and closes modal on selection', async () => {
      startRender();
      let element = SettingsScreen();

      // Open modal
      const currencyRow = findByTestId(element, 'settings-currency-row');
      currencyRow.props.onPress();

      startRender();
      element = SettingsScreen();

      // Render FlatList item for EUR
      const list = findByTestId(element, 'currency-list');
      const eurItem = POPULAR_CURRENCIES.find((c) => c.code === 'EUR');
      assert.ok(eurItem);

      const renderedEurItem = list.props.renderItem({ item: eurItem });
      assert.ok(renderedEurItem);

      // Select EUR
      await renderedEurItem.props.onPress();

      // Verify store updated
      assert.equal(useSettingsStore.getState().getSetting('default_currency'), 'EUR');

      // Re-render: modal closed and currency value updated
      startRender();
      element = SettingsScreen();
      const modal = findByTestId(element, 'currency-picker-modal');
      assert.equal(modal.props.visible, false);

      const currencyValue = findByTestId(element, 'settings-currency-value');
      assert.equal(currencyValue.props.children, 'EUR');
    });
  });

  // =========================================================================
  // 3. Section 2: NOTIFICATIONS
  // =========================================================================
  describe('Section 2: NOTIFICATIONS & Weekly Spending Digest Toggle', () => {
    it('renders Weekly Spending Digest label and subtitle', () => {
      startRender();
      const element = SettingsScreen();

      const texts = findAllByType(element, 'Text').map((t) => t.props.children);
      assert.ok(texts.includes('Weekly Spending Digest'));
      assert.ok(texts.includes('Summary sent every Sunday at 9:00 AM'));
    });

    it('initializes switch to ON (true) when setting is "true"', () => {
      useSettingsStore.setState({
        cache: { notify_weekly_digest: 'true' },
      });

      startRender();
      const element = SettingsScreen();

      const switchComponent = findByTestId(element, 'settings-weekly-digest-switch');
      assert.ok(switchComponent);
      assert.equal(switchComponent.props.value, true);
    });

    it('initializes switch to ON (true) by default if setting has not been set yet', () => {
      useSettingsStore.setState({
        cache: {},
      });

      startRender();
      const element = SettingsScreen();

      const switchComponent = findByTestId(element, 'settings-weekly-digest-switch');
      assert.ok(switchComponent);
      assert.equal(switchComponent.props.value, true);
    });

    it('toggling OFF: cancels existing digest notification and updates store to "false"', async () => {
      useSettingsStore.setState({
        cache: {
          notify_weekly_digest: 'true',
          weekly_digest_notification_id: 'digest-active-id-777',
        },
      });

      startRender();
      const element = SettingsScreen();

      const switchComponent = findByTestId(element, 'settings-weekly-digest-switch');
      assert.ok(switchComponent);

      // Toggle switch to false
      await switchComponent.props.onValueChange(false);

      // Verify cancelScheduledNotificationAsync was called with the existing id
      assert.ok(canceledNotificationIds.includes('digest-active-id-777'));

      // Verify store updated
      const state = useSettingsStore.getState();
      assert.equal(state.getSetting('notify_weekly_digest'), 'false');
      assert.equal(state.getSetting('weekly_digest_notification_id'), '');
    });

    it('toggling ON: schedules weekly digest (Sunday 9am), stores new notification ID, and updates setting to "true"', async () => {
      useSettingsStore.setState({
        cache: {
          notify_weekly_digest: 'false',
          weekly_digest_notification_id: '',
        },
      });

      startRender();
      const element = SettingsScreen();

      const switchComponent = findByTestId(element, 'settings-weekly-digest-switch');
      assert.ok(switchComponent);
      assert.equal(switchComponent.props.value, false);

      // Toggle switch to true
      await switchComponent.props.onValueChange(true);

      // Verify scheduled notification request
      assert.equal(scheduledNotifications.length, 1);
      const request = scheduledNotifications[0];
      assert.equal(request.content.title, 'Your weekly subscription summary');
      assert.equal(request.trigger.type, 'weekly');
      assert.equal(request.trigger.weekday, 1); // Sunday (0 + 1)
      assert.equal(request.trigger.hour, 9);
      assert.equal(request.trigger.minute, 0);

      // Verify store updated
      const state = useSettingsStore.getState();
      assert.equal(state.getSetting('notify_weekly_digest'), 'true');
      assert.ok(state.getSetting('weekly_digest_notification_id').startsWith('scheduled-digest-'));
    });
  });

  // =========================================================================
  // 4. Section 3: DATA
  // =========================================================================
  describe('Section 3: DATA & Clear All Data Confirmation', () => {
    it('renders "Clear All Data" row with danger color', () => {
      startRender();
      const element = SettingsScreen();

      const clearBtn = findByTestId(element, 'settings-clear-data-btn');
      assert.ok(clearBtn);

      const texts = findAllByType(clearBtn, 'Text');
      const label = texts.find((t) => t.props.children === 'Clear All Data');
      assert.ok(label);
      const labelStyle = flattenStyle(label.props.style);
      const isClassDanger = typeof label.props.className === 'string' && label.props.className.includes('text-red-500');
      assert.ok(labelStyle.color === COLORS.danger || isClassDanger);
    });

    it('shows confirmation Alert with Cancel and Delete Everything buttons when pressed', () => {
      startRender();
      const element = SettingsScreen();

      const clearBtn = findByTestId(element, 'settings-clear-data-btn');
      clearBtn.props.onPress();

      assert.equal(alertCalls.length, 1);
      const call = alertCalls[0];
      assert.equal(call.title, 'Clear All Data');
      assert.equal(
        call.message,
        'This will permanently delete all subscriptions. This cannot be undone.'
      );
      assert.ok(Array.isArray(call.buttons));
      assert.equal(call.buttons.length, 2);

      const cancelBtn = call.buttons.find((b: any) => b.text === 'Cancel');
      assert.ok(cancelBtn);
      assert.equal(cancelBtn.style, 'cancel');

      const deleteBtn = call.buttons.find((b: any) => b.text === 'Delete Everything');
      assert.ok(deleteBtn);
      assert.equal(deleteBtn.style, 'destructive');
    });

    it('cancels scheduled notifications and deletes all subscriptions from SQLite via store on confirmation', async () => {
      const sub1 = createMockSub({
        id: 'sub-clear-1',
        name: 'Netflix',
        notificationId: 'notif-sub-1',
      });
      const sub2 = createMockSub({
        id: 'sub-clear-2',
        name: 'Spotify',
        notificationId: 'notif-sub-2',
      });
      const sub3 = createMockSub({
        id: 'sub-clear-3',
        name: 'Gym',
        notificationId: null,
      });

      useSubscriptionStore.setState({
        subscriptions: [sub1, sub2, sub3],
      });

      startRender();
      const element = SettingsScreen();

      const clearBtn = findByTestId(element, 'settings-clear-data-btn');
      clearBtn.props.onPress();

      assert.equal(alertCalls.length, 1);
      const deleteOption = alertCalls[0].buttons?.find(
        (b: any) => b.text === 'Delete Everything'
      );
      assert.ok(deleteOption);

      // Execute confirmation
      await deleteOption.onPress();

      // Verify notifications were canceled for subs that had notificationId
      assert.ok(canceledNotificationIds.includes('notif-sub-1'));
      assert.ok(canceledNotificationIds.includes('notif-sub-2'));

      // Verify all subscriptions were deleted from store
      assert.equal(deletedSubscriptionIds.length, 3);
      assert.ok(deletedSubscriptionIds.includes('sub-clear-1'));
      assert.ok(deletedSubscriptionIds.includes('sub-clear-2'));
      assert.ok(deletedSubscriptionIds.includes('sub-clear-3'));
      assert.equal(useSubscriptionStore.getState().subscriptions.length, 0);

      // Verify success alert was displayed
      assert.equal(alertCalls.length, 2);
      assert.equal(alertCalls[1].title, 'Data Cleared');
      assert.equal(alertCalls[1].message, 'All subscriptions have been deleted.');
    });

    it('handles empty subscription list gracefully when Delete Everything is confirmed', async () => {
      useSubscriptionStore.setState({ subscriptions: [] });

      startRender();
      const element = SettingsScreen();

      const clearBtn = findByTestId(element, 'settings-clear-data-btn');
      clearBtn.props.onPress();

      const deleteOption = alertCalls[0].buttons?.find(
        (b: any) => b.text === 'Delete Everything'
      );
      await deleteOption.onPress();

      assert.equal(deletedSubscriptionIds.length, 0);
      assert.equal(alertCalls.length, 2);
      assert.equal(alertCalls[1].title, 'Data Cleared');
    });
  });

  // =========================================================================
  // 5. Section: PROFILE & DEFAULTS
  // =========================================================================
  describe('Section: PROFILE & DEFAULTS', () => {
    it('renders profile section and updates user_alias on text input', async () => {
      useSettingsStore.setState({
        cache: {
          user_alias: 'Janre',
        },
      });

      startRender();
      const element = SettingsScreen();

      const profileSection = findByTestId(element, 'section-profile');
      assert.ok(profileSection);

      const aliasInput = findByTestId(element, 'settings-alias-input');
      assert.ok(aliasInput);
      assert.equal(aliasInput.props.value, 'Janre');

      // Update alias
      await aliasInput.props.onChangeText('Janre Developer');
      assert.equal(useSettingsStore.getState().getSetting('user_alias'), 'Janre Developer');
    });

    it('renders 6 avatar options and updates user_avatar when tapped', async () => {
      startRender();
      const element = SettingsScreen();

      const avatarSelector = findByTestId(element, 'settings-avatar-selector');
      assert.ok(avatarSelector);

      const robotOption = findByTestId(element, 'settings-avatar-robot');
      assert.ok(robotOption);

      await robotOption.props.onPress();
      assert.equal(useSettingsStore.getState().getSetting('user_avatar'), '🤖');
    });

    it('renders default payment selector and updates default payment method and details', async () => {
      startRender();
      const element = SettingsScreen();

      const paymentSelector = findByTestId(element, 'settings-payment-selector');
      assert.ok(paymentSelector);

      await paymentSelector.props.onChangeMethod('gcash');
      assert.equal(useSettingsStore.getState().getSetting('default_payment_method'), 'gcash');

      await paymentSelector.props.onChangeDetails('0917 ••• 5678');
      assert.equal(useSettingsStore.getState().getSetting('default_payment_details'), '0917 ••• 5678');
    });
  });

  // =========================================================================
  // 6. Section: THEME
  // =========================================================================
  describe('Section: THEME', () => {
    it('renders SignalSub Dark and Midnight OLED options, switches theme when selected', async () => {
      startRender();
      const element = SettingsScreen();

      const themeSection = findByTestId(element, 'section-theme');
      assert.ok(themeSection);

      const oledOption = findByTestId(element, 'settings-theme-oled');
      assert.ok(oledOption);

      await oledOption.props.onPress();
      assert.equal(useSettingsStore.getState().getSetting('app_theme'), 'oled');

      const darkOption = findByTestId(element, 'settings-theme-dark');
      assert.ok(darkOption);

      await darkOption.props.onPress();
      assert.equal(useSettingsStore.getState().getSetting('app_theme'), 'dark');
    });
  });

  // =========================================================================
  // 7. Section: VISUAL EFFECTS
  // =========================================================================
  describe('Section: VISUAL EFFECTS', () => {
    it('renders grain overlay toggle and updates grain_enabled setting', async () => {
      startRender();
      const element = SettingsScreen();

      const visualSection = findByTestId(element, 'section-visual-effects');
      assert.ok(visualSection);

      const grainSwitch = findByTestId(element, 'settings-grain-switch');
      assert.ok(grainSwitch);
      assert.equal(grainSwitch.props.value, false);

      await grainSwitch.props.onValueChange(true);
      assert.equal(useSettingsStore.getState().getSetting('grain_enabled'), 'true');

      await grainSwitch.props.onValueChange(false);
      assert.equal(useSettingsStore.getState().getSetting('grain_enabled'), 'false');
    });
  });

  // =========================================================================
  // 8. Section: HELP & GUIDE
  // =========================================================================
  describe('Section: HELP & GUIDE', () => {
    it('renders HELP & GUIDE section header and Getting Started button', () => {
      startRender();
      const element = SettingsScreen();

      const guideSection = findByTestId(element, 'section-guide');
      assert.ok(guideSection);

      const guideBtn = findByTestId(element, 'settings-getting-started-btn');
      assert.ok(guideBtn);

      const texts = findAllByType(guideBtn, 'Text').map((t) => t.props.children);
      assert.ok(texts.includes('Getting Started'));
      assert.ok(texts.includes('Replay feature tour & onboarding'));
    });

    it('opens existing welcome/onboarding screen and does not reset user settings', async () => {
      const pushedRoutes: string[] = [];
      mockRouter.push = (route: string) => {
        pushedRoutes.push(route);
      };

      // Set user settings and onboarded flag
      useSettingsStore.setState({
        cache: {
          default_currency: 'PHP',
          user_alias: 'Janre',
          user_avatar: '🚀',
          has_onboarded: 'true',
        },
      });

      startRender();
      const element = SettingsScreen();

      const guideBtn = findByTestId(element, 'settings-getting-started-btn');
      assert.ok(guideBtn);

      guideBtn.props.onPress();

      // Verified it pushes to existing onboarding welcome screen
      assert.ok(pushedRoutes.includes('/(onboarding)/welcome'));

      // Verified settings and onboarding state are preserved
      const store = useSettingsStore.getState();
      assert.equal(store.getSetting('has_onboarded'), 'true');
      assert.equal(store.getSetting('default_currency'), 'PHP');
      assert.equal(store.getSetting('user_alias'), 'Janre');
    });
  });
});
