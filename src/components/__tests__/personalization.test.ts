import '../../stores/__tests__/setupDbMock';
import './setupComponentMocks';
import { mockRouter } from './setupComponentMocks';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import PersonalizeScreen from '../../../app/(onboarding)/personalize';
import CurrencyScreen from '../../../app/(onboarding)/currency';
import DashboardScreen, { getGreeting } from '../../../app/(tabs)/index';
import { useSettingsStore } from '../../stores/settingsStore';

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

describe('Personalization & Onboarding Flow', () => {
  let replacedRoutes: string[] = [];
  let pushedRoutes: string[] = [];

  beforeEach(() => {
    resetComponentState();
    replacedRoutes = [];
    pushedRoutes = [];

    mockRouter.replace = (route: string) => {
      replacedRoutes.push(route);
    };
    mockRouter.push = (route: string) => {
      pushedRoutes.push(route);
    };

    useSettingsStore.setState({
      cache: {
        default_currency: 'USD',
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
  });

  describe('CurrencyScreen Onboarding Transition', () => {
    it('routes to /(onboarding)/personalize when Continue is pressed', async () => {
      startRender();
      const element = CurrencyScreen();

      const continueBtn = findByTestId(element, 'continue-button');
      assert.ok(continueBtn);

      await continueBtn.props.onPress();
      assert.ok(pushedRoutes.includes('/(onboarding)/personalize'));
    });
  });

  describe('PersonalizeScreen (app/(onboarding)/personalize.tsx)', () => {
    it('renders all personalization inputs and selectors', () => {
      startRender();
      const element = PersonalizeScreen();
      assert.ok(element);

      // Nickname input
      const aliasInput = findByTestId(element, 'personalize-alias-input');
      assert.ok(aliasInput);

      // Avatar selector
      const avatarSelector = findByTestId(element, 'personalize-avatar-selector');
      assert.ok(avatarSelector);

      // Check all 6 avatar chips
      const avatarIds = ['space', 'robot', 'bolt', 'coffee', 'gamer', 'sparkles'];
      for (const id of avatarIds) {
        assert.ok(findByTestId(element, `avatar-option-${id}`));
      }

      // Payment selector
      const paymentSelector = findByTestId(element, 'personalize-payment-selector');
      assert.ok(paymentSelector);

      // Favorite categories pills
      const catContainer = findByTestId(element, 'personalize-categories');
      assert.ok(catContainer);
      const catKeys = ['streaming', 'ai_tools', 'developer', 'gaming', 'utilities'];
      for (const key of catKeys) {
        assert.ok(findByTestId(element, `category-pill-${key}`));
      }

      // Buttons
      assert.ok(findByTestId(element, 'personalize-continue-btn'));
      assert.ok(findByTestId(element, 'personalize-skip-btn'));
    });

    it('saves user settings and routes to /(tabs) when Continue is pressed', async () => {
      startRender();
      let element = PersonalizeScreen();

      // Enter nickname
      const aliasInput = findByTestId(element, 'personalize-alias-input');
      aliasInput.props.onChangeText('Janre');

      // Select Robot avatar
      const robotBtn = findByTestId(element, 'avatar-option-robot');
      robotBtn.props.onPress();

      // Change payment method
      const paymentSelector = findByTestId(element, 'personalize-payment-selector');
      paymentSelector.props.onChangeMethod('gcash');
      paymentSelector.props.onChangeDetails('0917 ••• 1234');

      // Select favorite categories
      const streamingPill = findByTestId(element, 'category-pill-streaming');
      streamingPill.props.onPress();

      const aiPill = findByTestId(element, 'category-pill-ai_tools');
      aiPill.props.onPress();

      startRender();
      element = PersonalizeScreen();

      const continueBtn = findByTestId(element, 'personalize-continue-btn');
      await continueBtn.props.onPress();

      const store = useSettingsStore.getState();
      assert.equal(store.getSetting('user_alias'), 'Janre');
      assert.equal(store.getSetting('user_avatar'), '🤖');
      assert.equal(store.getSetting('default_payment_method'), 'gcash');
      assert.equal(store.getSetting('default_payment_details'), '0917 ••• 1234');
      assert.equal(store.getSetting('has_onboarded'), 'true');

      const favCats = JSON.parse(store.getSetting('favorite_categories'));
      assert.ok(favCats.includes('streaming'));
      assert.ok(favCats.includes('ai_tools'));

      assert.ok(replacedRoutes.includes('/(tabs)'));
    });

    it('sets has_onboarded and routes to /(tabs) when Skip for Now is pressed', async () => {
      startRender();
      const element = PersonalizeScreen();

      const skipBtn = findByTestId(element, 'personalize-skip-btn');
      await skipBtn.props.onPress();

      const store = useSettingsStore.getState();
      assert.equal(store.getSetting('has_onboarded'), 'true');
      assert.ok(replacedRoutes.includes('/(tabs)'));
    });
  });

  describe('Dashboard Personalization Integration', () => {
    it('greets user with their alias when user_alias is set', () => {
      useSettingsStore.setState({
        cache: {
          default_currency: 'USD',
          user_alias: 'Janre',
        },
      });

      const fixedMorning = new Date(2026, 8, 3, 9, 0, 0);
      assert.equal(getGreeting(fixedMorning, 'Janre'), 'Good Morning, Janre 👋');

      startRender();
      const element = DashboardScreen({ referenceDate: fixedMorning });
      const texts = findAllByType(element, 'Text').map((t) => t.props.children);
      assert.ok(texts.includes('Good Morning, Janre 👋'));
    });

    it('displays top right avatar badge when user_avatar is configured', () => {
      useSettingsStore.setState({
        cache: {
          default_currency: 'USD',
          user_avatar: '🚀',
        },
      });

      startRender();
      const element = DashboardScreen();
      const avatarBadge = findByTestId(element, 'dashboard-avatar-badge');
      assert.ok(avatarBadge);

      avatarBadge.props.onPress();
      assert.ok(pushedRoutes.includes('/settings'));
    });

    it('displays unobtrusive setup card when alias or default payment method is missing', () => {
      useSettingsStore.setState({
        cache: {
          default_currency: 'USD',
          user_alias: '',
          default_payment_method: '',
        },
      });

      startRender();
      const element = DashboardScreen();

      const setupCard = findByTestId(element, 'dashboard-setup-card');
      assert.ok(setupCard);

      const setupBtn = findByTestId(element, 'setup-card-button');
      assert.ok(setupBtn);
      setupBtn.props.onPress();
      assert.ok(pushedRoutes.includes('/settings'));
    });

    it('hides setup card when both user_alias and default_payment_method are set', () => {
      useSettingsStore.setState({
        cache: {
          default_currency: 'USD',
          user_alias: 'Janre',
          default_payment_method: 'gcash',
        },
      });

      startRender();
      const element = DashboardScreen();

      const setupCard = findByTestId(element, 'dashboard-setup-card');
      assert.equal(setupCard, null);
    });
  });
});
