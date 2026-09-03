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
import SubscriptionsScreen, {
  filterSubscriptions,
  FILTER_OPTIONS,
  FILTER_TABS,
} from '../../../app/(tabs)/subscriptions';
import CalendarScreen, {
  formatCalendarDateHeader,
  groupRenewalsByDate,
  MONTH_NAMES,
} from '../../../app/(tabs)/calendar';
import AnalyticsScreen, {
  computeAnalyticsStats,
} from '../../../app/(tabs)/analytics';
import { SubscriptionRow } from '../SubscriptionRow';
import { StatCard } from '../StatCard';
import { FAB } from '../FAB';

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
    category: 'streaming',
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

describe('Tabs Screens Logic and Components', () => {
  let pushedRoutes: string[] = [];

  beforeEach(() => {
    pushedRoutes = [];
    resetComponentState();
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

  // =========================================================================
  // 1. Subscriptions Tab Tests
  // =========================================================================
  describe('Subscriptions Screen (subscriptions.tsx)', () => {
    const subs: Subscription[] = [
      createSub({
        id: 'sub-netflix',
        name: 'Netflix',
        isActive: 1,
        isTrial: 0,
        category: 'streaming',
      }),
      createSub({
        id: 'sub-gym',
        name: 'Gym Pass',
        isActive: 0,
        isTrial: 0,
        category: 'fitness',
      }),
      createSub({
        id: 'sub-audible',
        name: 'Audible Trial',
        isActive: 1,
        isTrial: 1,
        category: 'other',
      }),
      createSub({
        id: 'sub-spotify',
        name: 'Spotify Music',
        isActive: 1,
        isTrial: 0,
        category: 'streaming',
      }),
    ];

    describe('filterSubscriptions logic', () => {
      it('returns all subscriptions when filter is "All" and query is empty', () => {
        const result = filterSubscriptions(subs, '', 'All');
        assert.equal(result.length, 4);
      });

      it('filters only active subscriptions when filter is "Active"', () => {
        const result = filterSubscriptions(subs, '', 'Active');
        assert.equal(result.length, 3);
        assert.ok(result.every((s) => s.isActive === 1));
        assert.ok(!result.some((s) => s.id === 'sub-gym'));
      });

      it('filters only trial subscriptions when filter is "Trials"', () => {
        const result = filterSubscriptions(subs, '', 'Trials');
        assert.equal(result.length, 1);
        assert.equal(result[0].id, 'sub-audible');
      });

      it('filters only paused subscriptions when filter is "Paused"', () => {
        const result = filterSubscriptions(subs, '', 'Paused');
        assert.equal(result.length, 1);
        assert.equal(result[0].id, 'sub-gym');
      });

      it('filters subscriptions by category name', () => {
        const result = filterSubscriptions(subs, '', 'Streaming');
        assert.equal(result.length, 2);
        assert.ok(result.some((s) => s.id === 'sub-netflix'));
        assert.ok(result.some((s) => s.id === 'sub-spotify'));
      });

      it('filters subscriptions by search query substring case-insensitively', () => {
        const result = filterSubscriptions(subs, 'net', 'All');
        assert.equal(result.length, 1);
        assert.equal(result[0].id, 'sub-netflix');

        const resultCase = filterSubscriptions(subs, 'SPOTIFY', 'All');
        assert.equal(resultCase.length, 1);
        assert.equal(resultCase[0].id, 'sub-spotify');
      });

      it('combines search query and filter chips', () => {
        const result = filterSubscriptions(subs, 'pass', 'Paused');
        assert.equal(result.length, 1);
        assert.equal(result[0].id, 'sub-gym');

        // Gym pass is paused, so searching 'pass' with 'Active' should yield 0
        const resultActive = filterSubscriptions(subs, 'pass', 'Active');
        assert.equal(resultActive.length, 0);
      });

      it('includes Cancelled in FILTER_TABS and FILTER_OPTIONS', () => {
        assert.ok(FILTER_TABS.includes('Cancelled'));
        assert.ok(FILTER_OPTIONS.includes('Cancelled'));
      });

      it('filters only cancelled subscriptions when filter is "Cancelled"', () => {
        const testSubs: Subscription[] = [
          ...subs,
          createSub({
            id: 'sub-canc-1',
            name: 'Hulu Cancelled',
            amount: 14.99,
            currency: 'USD',
            status: 'cancelled',
            isActive: 0,
          }),
        ];
        const result = filterSubscriptions(testSubs, '', 'Cancelled');
        assert.equal(result.length, 1);
        assert.equal(result[0].id, 'sub-canc-1');
      });
    });

    describe('SubscriptionsScreen component rendering & interaction', () => {
      it('renders screen title, search input, chips, and empty state when no subscriptions exist', () => {
        useSubscriptionStore.setState({ subscriptions: [] });

        startRender();
        const element = SubscriptionsScreen();

        assert.equal(element.type, 'SafeAreaView');

        // Check title
        const texts = findAllByType(element, 'Text').map((t) => t.props.children);
        assert.ok(texts.includes('Subscriptions'));

        // Search bar
        const searchInput = findByTestId(element, 'subscriptions-search-input');
        assert.ok(searchInput);
        assert.equal(searchInput.props.value, '');

        // Filter chips row
        const chipsRow = findByTestId(element, 'subscriptions-filter-chips');
        assert.ok(chipsRow);
        assert.ok(FILTER_OPTIONS.includes('All'));
        assert.ok(FILTER_OPTIONS.includes('Active'));
        assert.ok(FILTER_OPTIONS.includes('Trials'));
        assert.ok(FILTER_OPTIONS.includes('Paused'));

        // Empty state
        const emptyState = findByTestId(element, 'subscriptions-empty-state');
        assert.ok(emptyState);

        // Empty state add button navigates
        const addBtn = findByTestId(emptyState, 'empty-state-add-btn');
        assert.ok(addBtn);
        addBtn.props.onPress();
        assert.ok(pushedRoutes.includes('/subscription/new'));

        // FAB navigates
        const fab = findByTestId(element, 'subscriptions-fab');
        assert.ok(fab);
        fab.props.onPress();
        assert.ok(pushedRoutes.includes('/subscription/new'));
      });

      it('renders subscription rows and handles press, delete, and pause', () => {
        let deletedId = '';
        let pausedId = '';
        let pausedStatus: boolean | null = null;

        useSubscriptionStore.setState({
          subscriptions: subs,
          deleteSubscription: async (id: string) => {
            deletedId = id;
          },
          pauseSubscription: async (id: string, pause: boolean) => {
            pausedId = id;
            pausedStatus = pause;
          },
        });

        startRender();
        const element = SubscriptionsScreen();

        const listContainer = findByTestId(element, 'subscriptions-list');
        assert.ok(listContainer);

        const rows = findAllByType(listContainer, SubscriptionRow);
        assert.equal(rows.length, 4);

        // Row press navigation
        rows[0].props.onPress();
        assert.ok(pushedRoutes.includes('/subscription/sub-netflix'));

        // Delete action
        rows[1].props.onDelete();
        assert.equal(deletedId, 'sub-gym');

        // Pause action (sub-netflix is active -> should call with pause = true)
        rows[0].props.onPause();
        assert.equal(pausedId, 'sub-netflix');
        assert.equal(pausedStatus, true);
      });

      it('updates list when search query and chips are changed', () => {
        useSubscriptionStore.setState({ subscriptions: subs });

        startRender();
        let element = SubscriptionsScreen();

        // Simulate typing into search input
        const searchInput = findByTestId(element, 'subscriptions-search-input');
        searchInput.props.onChangeText('audible');

        startRender();
        element = SubscriptionsScreen();

        let rows = findAllByType(element, SubscriptionRow);
        assert.equal(rows.length, 1);
        assert.equal(rows[0].props.subscription.id, 'sub-audible');

        // Clear search using clear button
        const clearBtn = findByTestId(element, 'subscriptions-search-clear');
        assert.ok(clearBtn);
        clearBtn.props.onPress();

        startRender();
        element = SubscriptionsScreen();
        rows = findAllByType(element, SubscriptionRow);
        assert.equal(rows.length, 4);

        // Select 'Paused' chip
        const pausedChip = findByTestId(element, 'filter-chip-paused');
        assert.ok(pausedChip);
        pausedChip.props.onPress();

        startRender();
        element = SubscriptionsScreen();
        rows = findAllByType(element, SubscriptionRow);
        assert.equal(rows.length, 1);
        assert.equal(rows[0].props.subscription.id, 'sub-gym');
      });

      it('renders savings banner when Cancelled filter is selected and calculates monthly money saved', () => {
        const cancelledSubs: Subscription[] = [
          createSub({
            id: 'sub-c1',
            name: 'Gym',
            amount: 30,
            billingCycle: 'monthly',
            currency: '$',
            status: 'cancelled',
            isActive: 0,
          }),
          createSub({
            id: 'sub-c2',
            name: 'Magazine',
            amount: 15,
            billingCycle: 'monthly',
            currency: '$',
            status: 'cancelled',
            isActive: 0,
          }),
        ];
        useSubscriptionStore.setState({ subscriptions: cancelledSubs });

        startRender();
        const element = SubscriptionsScreen();

        // Click Cancelled chip
        const chip = findByTestId(element, 'filter-chip-cancelled');
        assert.ok(chip);
        chip.props.onPress();

        startRender();
        const cancelledElement = SubscriptionsScreen();
        const banner = findByTestId(cancelledElement, 'cancelled-savings-banner');
        assert.ok(banner);

        const bannerText = findByTestId(banner, 'cancelled-savings-text');
        assert.ok(bannerText);
        assert.equal(
          bannerText.props.children,
          "🎉 You're saving $45.00/mo by cancelling unneeded subs"
        );
      });

      it('calls reactivateSubscription when reactivate button is pressed on cancelled subscription row', () => {
        let reactivatedId = '';
        useSubscriptionStore.setState({
          subscriptions: [
            createSub({
              id: 'sub-c-react',
              name: 'Netflix Cancelled',
              amount: 15.99,
              currency: '$',
              status: 'cancelled',
              isActive: 0,
            }),
          ],
          reactivateSubscription: async (id: string) => {
            reactivatedId = id;
          },
        });

        startRender();
        const element = SubscriptionsScreen();
        const listContainer = findByTestId(element, 'subscriptions-list');
        assert.ok(listContainer);

        const rows = findAllByType(listContainer, SubscriptionRow);
        assert.equal(rows.length, 1);

        rows[0].props.onReactivate();
        assert.equal(reactivatedId, 'sub-c-react');
      });
    });
  });

  // =========================================================================
  // 2. Calendar Tab Tests
  // =========================================================================
  describe('Calendar Screen (calendar.tsx)', () => {
    describe('formatCalendarDateHeader', () => {
      it('formats date to "Weekday, Month Day" e.g. "Mon, Sep 15"', () => {
        // Sep 15, 2026 is a Tuesday
        const header1 = formatCalendarDateHeader('2026-09-15');
        assert.equal(header1, 'Tue, Sep 15');

        // Sep 14, 2026 is a Monday
        const header2 = formatCalendarDateHeader('2026-09-14');
        assert.equal(header2, 'Mon, Sep 14');

        // Jan 1, 2026 is a Thursday
        const header3 = formatCalendarDateHeader('2026-01-01');
        assert.equal(header3, 'Thu, Jan 1');
      });
    });

    describe('groupRenewalsByDate logic', () => {
      it('groups active subscriptions in the target month by calendar date and calculates totals', () => {
        const testSubs: Subscription[] = [
          createSub({
            id: 'sub-1',
            name: 'Netflix',
            amount: 15.0,
            nextRenewalDate: '2026-09-10',
            isActive: 1,
          }),
          createSub({
            id: 'sub-2',
            name: 'Hulu',
            amount: 8.0,
            nextRenewalDate: '2026-09-10',
            isActive: 1,
          }),
          createSub({
            id: 'sub-3',
            name: 'Gym',
            amount: 40.0,
            nextRenewalDate: '2026-09-25',
            isActive: 1,
          }),
          createSub({
            id: 'sub-oct',
            name: 'Apple Care',
            amount: 29.0,
            nextRenewalDate: '2026-10-01', // Different month
            isActive: 1,
          }),
          createSub({
            id: 'sub-paused',
            name: 'Paused Service',
            amount: 10.0,
            nextRenewalDate: '2026-09-10', // Inactive
            isActive: 0,
          }),
        ];

        const { groups, totalCount, totalSpend } = groupRenewalsByDate(
          testSubs,
          2026,
          8 // September (0-indexed)
        );

        assert.equal(totalCount, 3);
        assert.equal(totalSpend, 63.0); // 15 + 8 + 40
        assert.equal(groups.length, 2); // 2026-09-10 and 2026-09-25

        // Check group 1: 2026-09-10
        assert.equal(groups[0].date, '2026-09-10');
        assert.equal(groups[0].formattedDate, 'Thu, Sep 10');
        assert.equal(groups[0].subscriptions.length, 2);
        assert.equal(groups[0].subscriptions[0].name, 'Hulu');
        assert.equal(groups[0].subscriptions[1].name, 'Netflix');

        // Check group 2: 2026-09-25
        assert.equal(groups[1].date, '2026-09-25');
        assert.equal(groups[1].formattedDate, 'Fri, Sep 25');
        assert.equal(groups[1].subscriptions.length, 1);
        assert.equal(groups[1].subscriptions[0].name, 'Gym');
      });

      it('returns empty groups and zero totals when no active renewals match month', () => {
        const { groups, totalCount, totalSpend } = groupRenewalsByDate([], 2026, 8);
        assert.equal(groups.length, 0);
        assert.equal(totalCount, 0);
        assert.equal(totalSpend, 0);
      });
    });

    describe('CalendarScreen component rendering & month navigation', () => {
      it('renders month selector, summary subtitle, timeline cards, and routes to subscription', () => {
        const refDate = new Date(2026, 8, 1); // September 2026
        const subA = createSub({
          id: 'sub-cal-1',
          name: 'Spotify',
          amount: 9.99,
          color: '#1DB954',
          nextRenewalDate: '2026-09-15',
          isActive: 1,
        });

        useSubscriptionStore.setState({ subscriptions: [subA] });
        useSettingsStore.setState({ cache: { default_currency: '$' } });

        startRender();
        const element = CalendarScreen({ initialDate: refDate });

        // Screen title
        const texts = findAllByType(element, 'Text').map((t) => t.props.children);
        assert.ok(texts.includes('Calendar'));

        // Month and Year displayed
        const monthYearText = findByTestId(element, 'calendar-month-year');
        assert.ok(monthYearText);
        assert.equal(monthYearText.props.children.join(''), 'September 2026');

        // Summary subtitle
        const summaryText = findByTestId(element, 'calendar-summary');
        assert.ok(summaryText);
        const fullSummary = summaryText.props.children.join('');
        assert.ok(fullSummary.includes('1 renewal · $ 9.99 this month'));

        // Renewal Card
        const card = findByTestId(element, 'calendar-card-sub-cal-1');
        assert.ok(card);
        card.props.onPress();
        assert.ok(pushedRoutes.includes('/subscription/sub-cal-1'));
      });

      it('navigates previous and next months correctly, including year boundary rollover', () => {
        const decDate = new Date(2026, 11, 1); // December 2026
        useSubscriptionStore.setState({ subscriptions: [] });

        startRender();
        let element = CalendarScreen({ initialDate: decDate });

        let monthYearText = findByTestId(element, 'calendar-month-year');
        assert.equal(monthYearText.props.children.join(''), 'December 2026');

        // Tap Next Month -> should roll over to January 2027
        const nextBtn = findByTestId(element, 'calendar-next-month');
        nextBtn.props.onPress();

        startRender();
        element = CalendarScreen({ initialDate: decDate });
        monthYearText = findByTestId(element, 'calendar-month-year');
        assert.equal(monthYearText.props.children.join(''), 'January 2027');

        // Tap Prev Month -> should roll back to December 2026
        const prevBtn = findByTestId(element, 'calendar-prev-month');
        prevBtn.props.onPress();

        startRender();
        element = CalendarScreen({ initialDate: decDate });
        monthYearText = findByTestId(element, 'calendar-month-year');
        assert.equal(monthYearText.props.children.join(''), 'December 2026');

        // Empty state is rendered since no subscriptions exist in this month
        const emptyState = findByTestId(element, 'calendar-empty-state');
        assert.ok(emptyState);
      });
    });
  });

  // =========================================================================
  // 3. Analytics Tab Tests
  // =========================================================================
  describe('Analytics Screen (analytics.tsx)', () => {
    const activeSubs: Subscription[] = [
      createSub({
        id: 'sub-cloud',
        name: 'AWS Cloud',
        amount: 60.0,
        billingCycle: 'monthly',
        category: 'cloud',
        isActive: 1,
      }),
      createSub({
        id: 'sub-stream',
        name: 'Netflix',
        amount: 15.0,
        billingCycle: 'monthly',
        category: 'streaming',
        isActive: 1,
      }),
      createSub({
        id: 'sub-gym',
        name: 'Annual Gym',
        amount: 120.0,
        billingCycle: 'yearly', // 10.0 / month
        category: 'fitness',
        isActive: 1,
      }),
    ];

    describe('computeAnalyticsStats logic', () => {
      it('calculates monthly, yearly, average per sub, and extremes accurately', () => {
        const stats = computeAnalyticsStats(activeSubs);

        // Monthly: 60 (AWS) + 15 (Netflix) + 10 (Gym: 120/12) = 85.0
        assert.equal(stats.monthly, 85.0);
        // Yearly: 85 * 12 = 1020.0
        assert.equal(stats.yearly, 1020.0);
        // Avg per sub: 85 / 3 = 28.333...
        assert.equal(Math.round(stats.avgPerSub * 100) / 100, 28.33);

        // Most expensive: AWS ($60/mo)
        assert.ok(stats.mostExpensive);
        assert.equal(stats.mostExpensive.name, 'AWS Cloud');

        // Cheapest: Annual Gym ($10/mo)
        assert.ok(stats.cheapest);
        assert.equal(stats.cheapest.name, 'Annual Gym');
      });

      it('returns zeroes and null extremes when no active subscriptions exist', () => {
        const stats = computeAnalyticsStats([]);
        assert.equal(stats.monthly, 0);
        assert.equal(stats.yearly, 0);
        assert.equal(stats.avgPerSub, 0);
        assert.equal(stats.mostExpensive, null);
        assert.equal(stats.cheapest, null);
      });

      it('handles a single active subscription correctly for both extremes', () => {
        const stats = computeAnalyticsStats([activeSubs[0]]);
        assert.equal(stats.monthly, 60.0);
        assert.equal(stats.yearly, 720.0);
        assert.equal(stats.avgPerSub, 60.0);
        assert.equal(stats.mostExpensive?.id, 'sub-cloud');
        assert.equal(stats.cheapest?.id, 'sub-cloud');
      });
    });

    describe('AnalyticsScreen component rendering & period switching', () => {
      it('renders empty state when there are no active subscriptions', () => {
        useSubscriptionStore.setState({ subscriptions: [] });

        startRender();
        const element = AnalyticsScreen();

        assert.equal(element.type, 'SafeAreaView');

        // Screen title
        const texts = findAllByType(element, 'Text').map((t) => t.props.children);
        assert.ok(texts.includes('Analytics'));

        // Empty state
        const emptyState = findByTestId(element, 'analytics-empty-state');
        assert.ok(emptyState);

        const emptyAddBtn = findByTestId(element, 'analytics-empty-add-btn');
        assert.ok(emptyAddBtn);
        emptyAddBtn.props.onPress();
        assert.ok(pushedRoutes.includes('/subscription/new'));
      });

      it('renders StatCards, donut chart, category list, and extremes cards for active subscriptions', () => {
        useSubscriptionStore.setState({ subscriptions: activeSubs });
        useSettingsStore.setState({ cache: { default_currency: '$' } });

        startRender();
        const element = AnalyticsScreen();

        // StatCards row
        const statsRow = findByTestId(element, 'analytics-stats-row');
        assert.ok(statsRow);

        const monthlyCard = findByTestId(element, 'stat-monthly-total');
        assert.ok(monthlyCard);
        assert.equal(monthlyCard.props.value, '$ 85.00');

        const yearlyCard = findByTestId(element, 'stat-yearly-projection');
        assert.ok(yearlyCard);
        assert.equal(yearlyCard.props.value, '$ 1020.00');

        const avgCard = findByTestId(element, 'stat-avg-per-sub');
        assert.ok(avgCard);
        assert.equal(avgCard.props.value, '$ 28.33');

        // Chart container
        const chartContainer = findByTestId(element, 'analytics-chart-container');
        assert.ok(chartContainer);

        // Category breakdown list
        const categoryList = findByTestId(element, 'category-list');
        assert.ok(categoryList);
        assert.ok(findByTestId(categoryList, 'category-row-cloud'));
        assert.ok(findByTestId(categoryList, 'category-row-streaming'));
        assert.ok(findByTestId(categoryList, 'category-row-fitness'));

        // Extremes cards
        const mostExpCard = findByTestId(element, 'stat-most-expensive');
        assert.ok(mostExpCard);
        assert.equal(mostExpCard.props.value, 'AWS Cloud');

        const cheapestCard = findByTestId(element, 'stat-cheapest');
        assert.ok(cheapestCard);
        assert.equal(cheapestCard.props.value, 'Annual Gym');
      });

      it('toggles period between Monthly, Quarterly, and Yearly', () => {
        useSubscriptionStore.setState({ subscriptions: activeSubs });
        useSettingsStore.setState({ cache: { default_currency: '$' } });

        startRender();
        let element = AnalyticsScreen();

        // Default: Monthly ($ 85.00)
        let monthlyCard = findByTestId(element, 'stat-monthly-total');
        assert.equal(monthlyCard.props.label, 'Monthly Total');
        assert.equal(monthlyCard.props.value, '$ 85.00');

        // Switch to Quarterly
        const quarterlyTab = findByTestId(element, 'period-quarterly');
        quarterlyTab.props.onPress();

        startRender();
        element = AnalyticsScreen();
        monthlyCard = findByTestId(element, 'stat-monthly-total');
        assert.equal(monthlyCard.props.label, 'Quarterly Total');
        assert.equal(monthlyCard.props.value, '$ 255.00'); // 85 * 3

        // Switch to Yearly
        const yearlyTab = findByTestId(element, 'period-yearly');
        yearlyTab.props.onPress();

        startRender();
        element = AnalyticsScreen();
        monthlyCard = findByTestId(element, 'stat-monthly-total');
        assert.equal(monthlyCard.props.label, 'Yearly Total');
        assert.equal(monthlyCard.props.value, '$ 1020.00'); // 85 * 12
      });
    });
  });
});
