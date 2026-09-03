import '../../stores/__tests__/setupDbMock';
import './setupComponentMocks';
import { mockRouter } from './setupComponentMocks';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { COLORS } from '../../constants/colors';
import type { Subscription } from '../../db/schema';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import TabLayout from '../../../app/(tabs)/_layout';
import { Tabs } from 'expo-router';
import DashboardScreen, {

  getGreeting,
  formatDashboardDate,
  computeDashboardAlerts,
} from '../../../app/(tabs)/index';
import { SpendingCard } from '../SpendingCard';
import { SubscriptionCard } from '../SubscriptionCard';
import { SubscriptionRow } from '../SubscriptionRow';
import { AlertBanner } from '../AlertBanner';
import { FAB } from '../FAB';

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

// Helper to extract children from React element
function getChildren(element: any): any[] {
  if (!element || !element.props) return [];
  const ch = element.props.children;
  if (!ch) return [];
  return Array.isArray(ch) ? ch : [ch];
}

// Recursive finder by testID
function findByTestId(element: any, testID: string): any | null {
  if (!element || typeof element !== 'object') return null;
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
    if (!el || typeof el !== 'object') return;
    if (el.type === typeName) matches.push(el);
    const children = getChildren(el);
    for (const child of children) {
      recurse(child);
    }
  }
  recurse(element);
  return matches;
}

// Setup mock React hook dispatcher for direct function component invocation in tests
const mockDispatcher = {
  useState: (init: any) => [typeof init === 'function' ? init() : init, () => {}],
  useMemo: (fn: any) => fn(),
  useCallback: (fn: any) => fn,
  useEffect: () => {},
  useLayoutEffect: () => {},
  useRef: (init: any) => ({ current: init }),
  useContext: () => ({}),
  useSyncExternalStore: (_subscribe: any, getSnapshot: any) => getSnapshot(),
  useDebugValue: () => {},
};

(React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current = mockDispatcher;

function createSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: `sub-${Math.random().toString(36).slice(2, 7)}`,
    name: 'Netflix',
    description: 'Streaming service',
    amount: 15.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextRenewalDate: '2026-09-10',
    startDate: '2026-01-01',
    color: '#E50914',
    iconType: 'preset',
    iconValue: 'netflix',
    category: 'entertainment',
    isTrial: 0,
    trialEndDate: null,
    isActive: 1,
    status: 'active',
    notifyBeforeDays: 3,
    notificationId: null,
    paymentMethod: 'card',
    paymentDetails: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Dashboard and Tabs Layout', () => {
  let pushedRoutes: string[] = [];

  beforeEach(() => {
    pushedRoutes = [];
    mockRouter.push = (url: string) => {
      pushedRoutes.push(url);
    };
    useSettingsStore.setState({
      cache: {
        default_currency: '$',
      },
    });
    useSubscriptionStore.setState({
      subscriptions: [],
    });
  });

  describe('TabLayout (_layout.tsx)', () => {
    it('configures 4 bottom tabs with correct titles, icons, and theme colors', () => {
      const element = TabLayout();
      assert.equal(element.type, Tabs);

      const screenOptions = element.props.screenOptions;
      assert.equal(screenOptions.headerShown, false);
      assert.equal(screenOptions.tabBarActiveTintColor, COLORS.accentPurple);
      assert.equal(screenOptions.tabBarInactiveTintColor, COLORS.textSecondary);
      assert.equal(screenOptions.tabBarStyle.backgroundColor, COLORS.bgCard);
      assert.equal(screenOptions.tabBarStyle.borderTopColor, COLORS.bgSurface);
      assert.equal(screenOptions.tabBarStyle.height, 60);
      assert.equal(screenOptions.tabBarStyle.paddingBottom, 8);

      const screens = getChildren(element);
      assert.equal(screens.length, 4);

      const expectedTabs = [
        { name: 'index', title: 'Home', icon: 'home' },
        { name: 'subscriptions', title: 'Subscriptions', icon: 'list' },
        { name: 'calendar', title: 'Calendar', icon: 'calendar-today' },
        { name: 'analytics', title: 'Analytics', icon: 'bar-chart' },
      ];

      for (let i = 0; i < expectedTabs.length; i++) {
        const screen = screens[i];
        const expected = expectedTabs[i];
        assert.equal(screen.type, Tabs.Screen);
        assert.equal(screen.props.name, expected.name);
        assert.equal(screen.props.options.title, expected.title);


        const iconEl = screen.props.options.tabBarIcon({ color: '#FFF' });
        assert.equal(iconEl.type, 'MaterialIcons');
        assert.equal(iconEl.props.name, expected.icon);
        assert.equal(iconEl.props.size, 24);
        assert.equal(iconEl.props.color, '#FFF');
      }
    });
  });

  describe('Greeting and Header Calculations', () => {
    it('returns "Good Morning 👋" for hours before 12:00', () => {
      const midnight = new Date(2026, 8, 3, 0, 0, 0);
      const morning = new Date(2026, 8, 3, 9, 30, 0);
      const lateMorning = new Date(2026, 8, 3, 11, 59, 59);

      assert.equal(getGreeting(midnight), 'Good Morning 👋');
      assert.equal(getGreeting(morning), 'Good Morning 👋');
      assert.equal(getGreeting(lateMorning), 'Good Morning 👋');
    });

    it('returns "Good Afternoon 👋" for hours between 12:00 and 16:59', () => {
      const noon = new Date(2026, 8, 3, 12, 0, 0);
      const afternoon = new Date(2026, 8, 3, 14, 15, 0);
      const lateAfternoon = new Date(2026, 8, 3, 16, 59, 59);

      assert.equal(getGreeting(noon), 'Good Afternoon 👋');
      assert.equal(getGreeting(afternoon), 'Good Afternoon 👋');
      assert.equal(getGreeting(lateAfternoon), 'Good Afternoon 👋');
    });

    it('returns "Good Evening 👋" for hours 17:00 and later', () => {
      const fivePm = new Date(2026, 8, 3, 17, 0, 0);
      const evening = new Date(2026, 8, 3, 20, 45, 0);
      const night = new Date(2026, 8, 3, 23, 59, 59);

      assert.equal(getGreeting(fivePm), 'Good Evening 👋');
      assert.equal(getGreeting(evening), 'Good Evening 👋');
      assert.equal(getGreeting(night), 'Good Evening 👋');
    });

    it('formats month and year subtitle correctly', () => {
      const sep = new Date(2026, 8, 3, 10, 0, 0); // September 2026
      const jan = new Date(2027, 0, 15, 10, 0, 0); // January 2027

      assert.equal(formatDashboardDate(sep), 'September 2026');
      assert.equal(formatDashboardDate(jan), 'January 2027');
    });
  });

  describe('Banner Condition Logic', () => {
    const refDate = '2026-09-03';

    it('generates renewal alert banner when active subscription renews in <= 3 days', () => {
      const sub0 = createSub({
        id: 'sub-0',
        name: 'Spotify',
        amount: 9.99,
        nextRenewalDate: '2026-09-03', // 0 days
        isActive: 1,
      });
      const sub2 = createSub({
        id: 'sub-2',
        name: 'iCloud',
        amount: 2.99,
        nextRenewalDate: '2026-09-05', // 2 days
        isActive: 1,
      });
      const sub3 = createSub({
        id: 'sub-3',
        name: 'GitHub Copilot',
        amount: 10.0,
        nextRenewalDate: '2026-09-06', // 3 days
        isActive: 1,
      });

      const alerts = computeDashboardAlerts([sub0, sub2, sub3], '$', refDate);
      assert.equal(alerts.length, 3);

      assert.equal(alerts[0].type, 'renewal');
      assert.equal(alerts[0].message, 'Spotify renews in 0 days · $ 9.99');
      assert.equal(alerts[0].subscriptionId, 'sub-0');

      assert.equal(alerts[1].type, 'renewal');
      assert.equal(alerts[1].message, 'iCloud renews in 2 days · $ 2.99');
      assert.equal(alerts[1].subscriptionId, 'sub-2');

      assert.equal(alerts[2].type, 'renewal');
      assert.equal(alerts[2].message, 'GitHub Copilot renews in 3 days · $ 10.00');
      assert.equal(alerts[2].subscriptionId, 'sub-3');
    });

    it('does not generate renewal alert when renewal is > 3 days or in the past', () => {
      const futureSub = createSub({
        name: 'Slack',
        nextRenewalDate: '2026-09-07', // 4 days away
        isActive: 1,
      });
      const pastSub = createSub({
        name: 'Gym',
        nextRenewalDate: '2026-09-01', // -2 days
        isActive: 1,
      });

      const alerts = computeDashboardAlerts([futureSub, pastSub], '$', refDate);
      assert.equal(alerts.length, 0);
    });

    it('generates trial alert banner when active trial ends in <= 7 days', () => {
      const trial1 = createSub({
        id: 'trial-1',
        name: 'Audible',
        isTrial: 1,
        trialEndDate: '2026-09-06', // 3 days
        nextRenewalDate: '2026-09-20',
        isActive: 1,
      });
      const trial7 = createSub({
        id: 'trial-7',
        name: 'YouTube Premium',
        isTrial: 1,
        trialEndDate: '2026-09-10', // 7 days
        nextRenewalDate: '2026-09-25',
        isActive: 1,
      });

      const alerts = computeDashboardAlerts([trial1, trial7], '$', refDate);
      assert.equal(alerts.length, 2);

      assert.equal(alerts[0].type, 'trial');
      assert.equal(alerts[0].message, 'Audible trial ends in 3 days');
      assert.equal(alerts[0].subscriptionId, 'trial-1');

      assert.equal(alerts[1].type, 'trial');
      assert.equal(alerts[1].message, 'YouTube Premium trial ends in 7 days');
      assert.equal(alerts[1].subscriptionId, 'trial-7');
    });

    it('does not generate trial alert when trial ends in > 7 days or is in the past', () => {
      const futureTrial = createSub({
        name: 'Disney+',
        isTrial: 1,
        trialEndDate: '2026-09-15', // 12 days
        isActive: 1,
      });
      const pastTrial = createSub({
        name: 'Hulu',
        isTrial: 1,
        trialEndDate: '2026-09-01', // -2 days
        isActive: 1,
      });

      const alerts = computeDashboardAlerts([futureTrial, pastTrial], '$', refDate);
      assert.equal(alerts.length, 0);
    });

    it('ignores inactive subscriptions for both renewal and trial banners', () => {
      const inactiveRenewal = createSub({
        name: 'Paused Sub',
        nextRenewalDate: '2026-09-04', // 1 day
        isActive: 0,
      });
      const inactiveTrial = createSub({
        name: 'Paused Trial',
        isTrial: 1,
        trialEndDate: '2026-09-05', // 2 days
        isActive: 0,
      });

      const alerts = computeDashboardAlerts([inactiveRenewal, inactiveTrial], '$', refDate);
      assert.equal(alerts.length, 0);
    });
  });

  describe('Dashboard Screen: Empty State', () => {
    it('renders friendly empty state card with prompt and Add button when no subscriptions exist', () => {
      useSubscriptionStore.setState({ subscriptions: [] });
      useSettingsStore.setState({ cache: { default_currency: '$' } });

      const fixedDate = new Date(2026, 8, 3, 10, 0, 0); // 10:00 AM, Sep 3 2026
      const element = DashboardScreen({ referenceDate: fixedDate });

      assert.equal(element.type, 'SafeAreaView');

      // Top Header text check
      const texts = findAllByType(element, 'Text').map((t) => t.props.children);
      assert.ok(texts.includes('Good Morning 👋'));
      assert.ok(texts.includes('September 2026'));

      // Header bell button opens alerts modal
      const bellBtn = findByTestId(element, 'dashboard-settings-button');
      assert.ok(bellBtn);
      bellBtn.props.onPress();

      const alertsModal = findByTestId(element, 'dashboard-alerts-modal');
      assert.ok(alertsModal);

      const settingsLink = findByTestId(element, 'alerts-modal-settings-link');
      assert.ok(settingsLink);
      settingsLink.props.onPress();
      assert.ok(pushedRoutes.includes('/settings'));


      // Empty State Card check
      const emptyCard = findByTestId(element, 'dashboard-empty-state');
      assert.ok(emptyCard, 'Empty state card should be rendered');

      const emptyTexts = findAllByType(emptyCard, 'Text').map((t) => t.props.children);
      assert.ok(emptyTexts.includes('No active subscriptions'));
      assert.ok(emptyTexts.some((txt) => typeof txt === 'string' && txt.includes('Track your subscriptions')));

      // Empty state Add button
      const emptyAddBtn = findByTestId(emptyCard, 'empty-state-add-button');
      assert.ok(emptyAddBtn);
      emptyAddBtn.props.onPress();
      assert.ok(pushedRoutes.includes('/subscription/new'));

      // No active rows list
      const activeList = findByTestId(element, 'dashboard-active-list');
      assert.equal(activeList, null);

      // No upcoming renewals section
      const upcomingSection = findByTestId(element, 'dashboard-upcoming-section');
      assert.equal(upcomingSection, null);

      // No alert banners
      const alertBanners = findByTestId(element, 'dashboard-alerts');
      assert.equal(alertBanners, null);

      // SpendingCard present with 0.00
      const spendingCards = findAllByType(element, SpendingCard);
      assert.equal(spendingCards.length, 1);
      assert.equal(spendingCards[0].props.monthlyTotal, 0);
      assert.equal(spendingCards[0].props.yearlyTotal, 0);

      // FAB present and routes to /subscription/new
      const fab = findByTestId(element, 'dashboard-fab');
      assert.ok(fab);
      fab.props.onPress();
      assert.ok(pushedRoutes.includes('/subscription/new'));
    });

    it('renders empty state card when subscriptions exist but all are inactive (isActive === 0)', () => {
      const inactiveSub = createSub({
        id: 'sub-paused-1',
        name: 'Paused Gym',
        amount: 40,
        isActive: 0,
      });
      useSubscriptionStore.setState({ subscriptions: [inactiveSub] });

      const element = DashboardScreen({ referenceDate: new Date(2026, 8, 3, 10, 0, 0) });
      const emptyCard = findByTestId(element, 'dashboard-empty-state');
      assert.ok(emptyCard, 'Should show empty state when only paused subscriptions exist');

      const activeList = findByTestId(element, 'dashboard-active-list');
      assert.equal(activeList, null);
    });
  });

  describe('Dashboard Screen: Populated State', () => {
    it('renders alert banner, spending totals, upcoming renewals horizontal scroll, and active rows', () => {
      const fixedDate = new Date(2026, 8, 3, 15, 0, 0); // 3:00 PM, Sep 3 2026

      const subUrgent = createSub({
        id: 'sub-urgent-1',
        name: 'Netflix',
        amount: 15.0,
        billingCycle: 'monthly',
        nextRenewalDate: '2026-09-04', // 1 day away -> triggers alert banner & upcoming
        isActive: 1,
      });

      const subUpcoming = createSub({
        id: 'sub-upcoming-2',
        name: 'Spotify',
        amount: 10.0,
        billingCycle: 'monthly',
        nextRenewalDate: '2026-09-15', // 12 days away -> upcoming
        isActive: 1,
      });

      const subLater = createSub({
        id: 'sub-later-3',
        name: 'Amazon Prime',
        amount: 120.0,
        billingCycle: 'yearly',
        nextRenewalDate: '2026-11-01', // >30 days -> not in upcoming
        isActive: 1,
      });

      const subInactive = createSub({
        id: 'sub-inactive-4',
        name: 'Old Fitness App',
        amount: 20.0,
        nextRenewalDate: '2026-09-04',
        isActive: 0,
      });

      useSubscriptionStore.setState({
        subscriptions: [subUrgent, subUpcoming, subLater, subInactive],
      });
      useSettingsStore.setState({
        cache: { default_currency: '$' },
      });

      const element = DashboardScreen({ referenceDate: fixedDate });

      // Afternoon greeting
      const texts = findAllByType(element, 'Text').map((t) => t.props.children);
      assert.ok(texts.includes('Good Afternoon 👋'));

      // Empty state card must NOT be rendered
      assert.equal(findByTestId(element, 'dashboard-empty-state'), null);

      // Alert banner is rendered for subUrgent
      const alertsContainer = findByTestId(element, 'dashboard-alerts');
      assert.ok(alertsContainer);
      const bannerComponents = findAllByType(alertsContainer, AlertBanner);
      assert.equal(bannerComponents.length, 1);
      assert.equal(bannerComponents[0].props.type, 'renewal');
      assert.equal(bannerComponents[0].props.message, 'Netflix renews in 1 days · $ 15.00');

      // Tapping banner navigates to /subscription/sub-urgent-1
      bannerComponents[0].props.onPress();
      assert.ok(pushedRoutes.includes('/subscription/sub-urgent-1'));

      // SpendingCard renders calculated monthly and yearly totals
      // monthly: 15 (Netflix) + 10 (Spotify) + 10 (Amazon Prime yearly 120/12) = 35
      // yearly: 35 * 12 = 420
      const spendingCard = findAllByType(element, SpendingCard)[0];
      assert.equal(spendingCard.props.monthlyTotal, 35);
      assert.equal(spendingCard.props.yearlyTotal, 420);

      // Upcoming Renewals Section is rendered with 2 items (Netflix, Spotify)
      const upcomingSection = findByTestId(element, 'dashboard-upcoming-section');
      assert.ok(upcomingSection);

      const upcomingCards = findAllByType(upcomingSection, SubscriptionCard);
      assert.equal(upcomingCards.length, 2);
      assert.equal(upcomingCards[0].props.subscription.id, 'sub-urgent-1');
      assert.equal(upcomingCards[1].props.subscription.id, 'sub-upcoming-2');

      // Tapping upcoming card routes to /subscription/:id
      upcomingCards[0].props.onPress();
      assert.ok(pushedRoutes.includes('/subscription/sub-urgent-1'));

      // Active Subscriptions Section renders 3 active rows (Netflix, Spotify, Amazon Prime)
      const activeSection = findByTestId(element, 'dashboard-active-section');
      assert.ok(activeSection);

      const rows = findAllByType(activeSection, SubscriptionRow);
      assert.equal(rows.length, 3);
      assert.equal(rows[0].props.subscription.name, 'Netflix');
      assert.equal(rows[1].props.subscription.name, 'Spotify');
      assert.equal(rows[2].props.subscription.name, 'Amazon Prime');

      // Inactive subscription is NOT in active list
      assert.ok(!rows.some((r) => r.props.subscription.id === 'sub-inactive-4'));

      // Tapping row routes to /subscription/:id
      rows[1].props.onPress();
      assert.ok(pushedRoutes.includes('/subscription/sub-upcoming-2'));

      // Row onDelete and onPause callbacks trigger store functions
      let deletedId = '';
      let pausedId = '';
      let pausedVal: boolean | null = null;
      useSubscriptionStore.setState({
        deleteSubscription: async (id: string) => {
          deletedId = id;
        },
        pauseSubscription: async (id: string, val: boolean) => {
          pausedId = id;
          pausedVal = val;
        },
      });

      // Re-render to grab updated callbacks
      const updatedElement = DashboardScreen({ referenceDate: fixedDate });
      const updatedRows = findAllByType(updatedElement, SubscriptionRow);

      updatedRows[0].props.onDelete();
      assert.equal(deletedId, 'sub-urgent-1');

      updatedRows[0].props.onPause();
      assert.equal(pausedId, 'sub-urgent-1');
      assert.equal(pausedVal, true);
    });
  });

  describe('Trial Expiry Prompt Card', () => {
    const fixedDate = new Date(2026, 8, 3, 10, 0, 0); // 2026-09-03

    it('renders prominent trial expiry prompt when active trial ends today (0 days) or tomorrow (1 day)', () => {
      const expiringSub = createSub({
        id: 'sub-trial-exp',
        name: 'Canva Pro',
        amount: 12.99,
        currency: 'USD',
        isTrial: 1,
        isActive: 1,
        status: 'active',
        trialEndDate: '2026-09-04', // 1 day away (tomorrow)
      });

      useSubscriptionStore.setState({ subscriptions: [expiringSub] });

      const element = DashboardScreen({ referenceDate: fixedDate });

      const card = findByTestId(element, 'trial-expiry-card-sub-trial-exp');
      assert.ok(card, 'Trial expiry prompt card should be displayed');

      const titleEl = findByTestId(card, 'trial-expiry-title');
      assert.ok(titleEl);
      assert.equal(titleEl.props.children, '⚠️ Free Trial Ending');

      const subtitleEl = findByTestId(card, 'trial-expiry-subtitle');
      assert.ok(subtitleEl);
      assert.equal(
        subtitleEl.props.children,
        'Canva Pro trial ends tomorrow. Auto-charge of USD 12.99 will occur.'
      );

      const cancelBtn = findByTestId(card, 'trial-expiry-cancelled-btn-sub-trial-exp');
      assert.ok(cancelBtn);

      const keepBtn = findByTestId(card, 'trial-expiry-keep-btn-sub-trial-exp');
      assert.ok(keepBtn);
    });

    it('calls cancelSubscription when [I Cancelled It] is pressed', () => {
      let cancelledId = '';
      useSubscriptionStore.setState({
        cancelSubscription: async (id: string) => {
          cancelledId = id;
        },
      });

      const expiringSub = createSub({
        id: 'sub-trial-cancel',
        name: 'GymPass',
        amount: 29.99,
        currency: 'USD',
        isTrial: 1,
        isActive: 1,
        status: 'active',
        trialEndDate: '2026-09-03', // 0 days away (today)
      });

      useSubscriptionStore.setState({ subscriptions: [expiringSub] });

      const element = DashboardScreen({ referenceDate: fixedDate });
      const cancelBtn = findByTestId(element, 'trial-expiry-cancelled-btn-sub-trial-cancel');
      assert.ok(cancelBtn);

      cancelBtn.props.onPress();
      assert.equal(cancelledId, 'sub-trial-cancel');
    });

    it('does not render card if trial ends in > 1 day, trial is inactive, or not a trial', () => {
      const farSub = createSub({
        id: 'sub-far',
        name: 'Notion',
        isTrial: 1,
        isActive: 1,
        status: 'active',
        trialEndDate: '2026-09-10', // 7 days away
      });
      const inactiveSub = createSub({
        id: 'sub-inact',
        name: 'Figma',
        isTrial: 1,
        isActive: 0,
        status: 'active',
        trialEndDate: '2026-09-03',
      });
      const cancelledSub = createSub({
        id: 'sub-canc',
        name: 'Adobe',
        isTrial: 1,
        isActive: 1,
        status: 'cancelled',
        trialEndDate: '2026-09-03',
      });
      const nonTrialSub = createSub({
        id: 'sub-nontrial',
        name: 'Spotify',
        isTrial: 0,
        isActive: 1,
        status: 'active',
        trialEndDate: '2026-09-03',
      });

      useSubscriptionStore.setState({
        subscriptions: [farSub, inactiveSub, cancelledSub, nonTrialSub],
      });

      const element = DashboardScreen({ referenceDate: fixedDate });
      assert.equal(findByTestId(element, 'dashboard-trial-expiry-container'), null);
    });
  });
});