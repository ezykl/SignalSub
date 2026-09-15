import '../../stores/__tests__/setupDbMock';
import './setupComponentMocks';
import { mockRouter } from './setupComponentMocks';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { CustomTabBar } from '../CustomTabBar';
import ProfileScreen from '../../../app/(tabs)/profile';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSubscriptionStore } from '../../stores/subscriptionStore';

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
  useEffect: () => { },
  useLayoutEffect: () => { },
  useRef: (init: any) => ({ current: init }),
  useContext: () => ({}),
  useSyncExternalStore: (_subscribe: any, getSnapshot: any) => getSnapshot(),
  useDebugValue: () => { },
};

(React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current =
  mockDispatcher;

describe('CustomTabBar Component', () => {
  const mockNavigation = {
    emit: (event: any) => ({ defaultPrevented: false }),
    navigate: (name: string) => { },
  };

  const mockState = {
    index: 0,
    routes: [
      { key: 'index-key', name: 'index' },
      { key: 'subs-key', name: 'subscriptions' },
      { key: 'cal-key', name: 'calendar' },
      { key: 'prof-key', name: 'profile' },
      { key: 'analytics-key', name: 'analytics' },
    ],
  };

  const mockDescriptors = {};

  let lastPushed = '';

  beforeEach(() => {
    lastPushed = '';
    mockRouter.push = (url: string) => {
      lastPushed = url;
    };
  });

  it('renders tab bar container, 4 tabs, and center Add button', () => {
    const element = CustomTabBar({
      state: mockState as any,
      descriptors: mockDescriptors as any,
      navigation: mockNavigation as any,
      insets: { top: 0, bottom: 20, left: 0, right: 0 } as any,
    });

    assert.ok(element);
    assert.equal(element.props.testID, 'custom-tab-bar');

    const homeTab = findByTestId(element, 'tab-button-index');
    assert.ok(homeTab, 'Home tab button should be rendered');

    const subsTab = findByTestId(element, 'tab-button-subscriptions');
    assert.ok(subsTab, 'Subscription tab button should be rendered');

    const addBtn = findByTestId(element, 'tab-bar-add-button');
    assert.ok(addBtn, 'Center Add button should be rendered');

    const calTab = findByTestId(element, 'tab-button-calendar');
    assert.ok(calTab, 'Calendar tab button should be rendered');

    const profTab = findByTestId(element, 'tab-button-profile');
    assert.ok(profTab, 'Profile tab button should be rendered');
  });

  it('navigates to /subscription/new when center Add button is pressed', () => {
    const element = CustomTabBar({
      state: mockState as any,
      descriptors: mockDescriptors as any,
      navigation: mockNavigation as any,
      insets: { top: 0, bottom: 20, left: 0, right: 0 } as any,
    });

    const addBtn = findByTestId(element, 'tab-bar-add-button');
    assert.ok(addBtn);
    addBtn.props.onPress();

    assert.equal(lastPushed, '/subscription/new');
  });

  it('calls navigation.navigate when an inactive tab is pressed', () => {
    let navigatedTo = '';
    const customNav = {
      emit: () => ({ defaultPrevented: false }),
      navigate: (name: string) => {
        navigatedTo = name;
      },
    };

    const element = CustomTabBar({
      state: mockState as any,
      descriptors: mockDescriptors as any,
      navigation: customNav as any,
      insets: { top: 0, bottom: 20, left: 0, right: 0 } as any,
    });

    const calTab = findByTestId(element, 'tab-button-calendar');
    assert.ok(calTab);
    calTab.props.onPress();

    assert.equal(navigatedTo, 'calendar');
  });
});

describe('ProfileScreen (app/(tabs)/profile.tsx)', () => {
  let lastPushed = '';

  beforeEach(() => {
    resetComponentState();
    lastPushed = '';
    mockRouter.push = (url: string) => {
      lastPushed = url;
    };
    useSettingsStore.setState({
      cache: {
        default_currency: 'USD',
        user_name: 'Alex Rivera',
        user_avatar: 'space',
      },
    });
    useSubscriptionStore.setState({
      subscriptions: [
        {
          id: 'sub-1',
          name: 'Netflix',
          amount: 15.99,
          currency: 'USD',
          billingCycle: 'monthly',
          category: 'entertainment',
          startDate: '2026-01-01',
          nextRenewalDate: '2026-09-20',
          isActive: 1,
          isTrial: 0,
          color: '#E50914',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        } as any,
      ],
    });
  });

  it('renders profile header, user details, and settings button', () => {
    startRender();
    const element = ProfileScreen();
    assert.ok(element);

    const settingsBtn = findByTestId(element, 'profile-settings-btn');
    assert.ok(settingsBtn, 'Profile settings button should exist');
    settingsBtn.props.onPress();
    assert.equal(lastPushed, '/settings');
  });

  it('renders analytics section with period selector and stats', () => {
    startRender();
    const element = ProfileScreen();
    assert.ok(element);

    const periodSelector = findByTestId(element, 'period-selector');
    assert.ok(periodSelector, 'Period selector should exist');

    const statsRow = findByTestId(element, 'analytics-stats-row');
    assert.ok(statsRow, 'Analytics stats row should exist');
  });
});
