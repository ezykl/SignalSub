import '../../stores/__tests__/setupDbMock';
import './setupComponentMocks';
import {
  mockRouter,
  mockAlert,
  setMockSearchParams,
} from './setupComponentMocks';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { COLORS } from '../../constants/colors';
import { SERVICE_PRESETS, getPresetByKey } from '../../constants/servicePresets';
import type { Subscription, NewSubscription } from '../../db/schema';
import {
  useSubscriptionStore,
  SubscriptionInput,
} from '../../stores/subscriptionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import NewSubscriptionScreen from '../../../app/subscription/new';
import EditSubscriptionScreen from '../../../app/subscription/[id]';

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

function createSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: `sub-${Math.random().toString(36).slice(2, 7)}`,
    name: 'Netflix',
    description: 'Streaming service',
    amount: 15.49,
    currency: 'USD',
    billingCycle: 'monthly',
    nextRenewalDate: '2026-10-03',
    startDate: '2026-09-03',
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
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
    ...overrides,
  };
}

describe('Subscription Modals (New and Edit)', () => {
  let alertCalls: { title: string; message?: string; buttons?: any[] }[] = [];
  let backCalls = 0;
  let addedSubs: SubscriptionInput[] = [];
  let updatedSubs: { id: string; data: Partial<NewSubscription> }[] = [];
  let deletedIds: string[] = [];

  beforeEach(() => {
    resetComponentState();
    alertCalls = [];
    backCalls = 0;
    addedSubs = [];
    updatedSubs = [];
    deletedIds = [];

    mockRouter.back = () => {
      backCalls++;
    };

    mockAlert.alert = (title: string, message?: string, buttons?: any[]) => {
      alertCalls.push({ title, message, buttons });
    };

    useSettingsStore.setState({
      cache: {
        default_currency: 'USD',
      },
    });

    useSubscriptionStore.setState({
      subscriptions: [],
      addSubscription: async (data: SubscriptionInput) => {
        addedSubs.push(data);
        const sub: Subscription = {
          id: `sub_${Date.now()}`,
          name: data.name,
          description: data.description ?? null,
          amount: data.amount,
          currency: data.currency ?? 'USD',
          billingCycle: data.billingCycle ?? 'monthly',
          nextRenewalDate: data.nextRenewalDate,
          startDate: data.startDate,
          color: data.color ?? '#7B5EA7',
          iconType: data.iconType ?? 'initial',
          iconValue: data.iconValue ?? 'S',
          category: data.category ?? 'other',
          isTrial: data.isTrial ?? 0,
          trialEndDate: data.trialEndDate ?? null,
          isActive: data.isActive ?? 1,
          status: data.status ?? 'active',
          notifyBeforeDays: data.notifyBeforeDays ?? 3,
          notificationId: null,
          paymentMethod: data.paymentMethod ?? 'card',
          paymentDetails: data.paymentDetails ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return sub;
      },
      updateSubscription: async (id: string, data: Partial<NewSubscription>) => {
        updatedSubs.push({ id, data });
      },
      deleteSubscription: async (id: string) => {
        deletedIds.push(id);
      },
    });
  });

  // =========================================================================
  // 1. Add Subscription Modal (new.tsx)
  // =========================================================================
  describe('NewSubscriptionScreen (app/subscription/new.tsx)', () => {
    it('renders header, preset search, grid, and default form fields', () => {
      startRender();
      const element = NewSubscriptionScreen();
      assert.equal(element.type, 'SafeAreaView');

      // Header title and buttons
      const closeBtn = findByTestId(element, 'header-close-btn');
      assert.ok(closeBtn);
      const saveBtn = findByTestId(element, 'header-save-btn');
      assert.ok(saveBtn);

      // Close button navigates back
      closeBtn.props.onPress();
      assert.equal(backCalls, 1);

      // Preset search input and grid
      const searchInput = findByTestId(element, 'preset-search-input');
      assert.ok(searchInput);
      assert.equal(searchInput.props.value, '');

      const presetGrid = findByTestId(element, 'preset-grid');
      assert.ok(presetGrid);

      // Form inputs
      const nameInput = findByTestId(element, 'input-name');
      assert.ok(nameInput);
      assert.equal(nameInput.props.value, '');

      const amountInput = findByTestId(element, 'input-amount');
      assert.ok(amountInput);
      assert.equal(amountInput.props.value, '');

      // Stepper default value
      const stepperVal = findByTestId(element, 'stepper-value');
      assert.ok(stepperVal);
      assert.equal(stepperVal.props.children, 3);
    });

    it('auto-populates form values when a preset card is selected', () => {
      startRender();
      let element = NewSubscriptionScreen();

      // Tap Netflix preset card
      const netflixCard = findByTestId(element, 'preset-card-netflix');
      assert.ok(netflixCard);
      netflixCard.props.onPress();

      // Re-render to observe state changes
      startRender();
      element = NewSubscriptionScreen();

      // Name should be populated
      const nameInput = findByTestId(element, 'input-name');
      assert.equal(nameInput.props.value, 'Netflix');

      // Amount should be populated with defaultAmount (15.49)
      const amountInput = findByTestId(element, 'input-amount');
      assert.equal(amountInput.props.value, '15.49');

      // Card should have white border highlight
      const updatedCard = findByTestId(element, 'preset-card-netflix');
      const cardStyle = flattenStyle(updatedCard.props.style);
      assert.equal(cardStyle.borderColor, '#FFFFFF');

      // "Use Custom" button should appear and reset preset selection when tapped
      const customBtn = findByTestId(element, 'preset-custom-btn');
      assert.ok(customBtn);
      customBtn.props.onPress();

      // Re-render
      startRender();
      element = NewSubscriptionScreen();

      const clearedCard = findByTestId(element, 'preset-card-netflix');
      const clearedCardStyle = flattenStyle(clearedCard.props.style);
      assert.equal(clearedCardStyle.borderColor, 'transparent');
    });

    it('filters presets with the search bar', () => {
      startRender();
      let element = NewSubscriptionScreen();

      const searchInput = findByTestId(element, 'preset-search-input');
      searchInput.props.onChangeText('Spotify');

      startRender();
      element = NewSubscriptionScreen();

      const spotifyCard = findByTestId(element, 'preset-card-spotify');
      assert.ok(spotifyCard);

      const netflixCard = findByTestId(element, 'preset-card-netflix');
      assert.equal(netflixCard, null);
    });

    it('adjusts notification days with stepper within 1-14 bounds', () => {
      startRender();
      let element = NewSubscriptionScreen();

      const incrementBtn = findByTestId(element, 'stepper-increment');
      const decrementBtn = findByTestId(element, 'stepper-decrement');

      // Increment: 3 -> 4
      incrementBtn.props.onPress();
      startRender();
      element = NewSubscriptionScreen();
      let stepperVal = findByTestId(element, 'stepper-value');
      assert.equal(stepperVal.props.children, 4);

      // Decrement twice: 4 -> 3 -> 2
      decrementBtn.props.onPress();
      decrementBtn.props.onPress();
      startRender();
      element = NewSubscriptionScreen();
      stepperVal = findByTestId(element, 'stepper-value');
      assert.equal(stepperVal.props.children, 2);
    });

    it('toggles free trial state and reveals/hides trial end date', () => {
      startRender();
      let element = NewSubscriptionScreen();

      // Initially no trial end date input
      let trialDateInput = findByTestId(element, 'input-trial-end-date');
      assert.equal(trialDateInput, null);

      // Toggle trial ON
      const toggle = findByTestId(element, 'trial-toggle');
      toggle.props.onPress();

      startRender();
      element = NewSubscriptionScreen();
      trialDateInput = findByTestId(element, 'input-trial-end-date');
      assert.ok(trialDateInput);

      // Toggle trial OFF
      const toggleOff = findByTestId(element, 'trial-toggle');
      toggleOff.props.onPress();

      startRender();
      element = NewSubscriptionScreen();
      trialDateInput = findByTestId(element, 'input-trial-end-date');
      assert.equal(trialDateInput, null);
    });

    it('validates required subscription name and prevents save if empty', async () => {
      startRender();
      const element = NewSubscriptionScreen();

      // Amount filled, name empty
      const amountInput = findByTestId(element, 'input-amount');
      amountInput.props.onChangeText('10.00');

      const saveBtn = findByTestId(element, 'header-save-btn');
      await saveBtn.props.onPress();

      assert.equal(alertCalls.length, 1);
      assert.equal(alertCalls[0].title, 'Validation Error');
      assert.ok(alertCalls[0].message?.includes('name is required'));
      assert.equal(addedSubs.length, 0);
      assert.equal(backCalls, 0);
    });

    it('validates positive numeric amount and prevents save if invalid or <= 0', async () => {
      startRender();
      let element = NewSubscriptionScreen();

      const nameInput = findByTestId(element, 'input-name');
      nameInput.props.onChangeText('Figma');

      const amountInput = findByTestId(element, 'input-amount');
      amountInput.props.onChangeText('-5.00');

      startRender();
      element = NewSubscriptionScreen();

      const saveBtn = findByTestId(element, 'header-save-btn');
      await saveBtn.props.onPress();

      assert.equal(alertCalls.length, 1);
      assert.equal(alertCalls[0].title, 'Validation Error');
      assert.ok(alertCalls[0].message?.includes('valid positive amount'));
      assert.equal(addedSubs.length, 0);
      assert.equal(backCalls, 0);
    });

    it('generates correct payload for addSubscription and navigates back on success', async () => {
      startRender();
      let element = NewSubscriptionScreen();

      // Select preset
      const presetCard = findByTestId(element, 'preset-card-spotify');
      presetCard.props.onPress();

      startRender();
      element = NewSubscriptionScreen();

      // Switch billing cycle to yearly
      const billingPill = findByTestId(element, 'billing-cycle-pill');
      billingPill.props.onChange('yearly');

      startRender();
      element = NewSubscriptionScreen();

      // Tap Save
      const saveBtn = findByTestId(element, 'header-save-btn');
      await saveBtn.props.onPress();

      assert.equal(addedSubs.length, 1);
      const payload = addedSubs[0];
      assert.equal(payload.name, 'Spotify');
      assert.equal(payload.amount, 11.99);
      assert.equal(payload.category, 'streaming');
      assert.equal(payload.billingCycle, 'yearly');
      assert.equal(payload.color, '#1DB954');
      assert.equal(payload.iconType, 'preset');
      assert.equal(payload.iconValue, 'spotify');
      assert.equal(payload.isTrial, 0);
      assert.equal(payload.notifyBeforeDays, 3);
      assert.equal(backCalls, 1);
    });

    it('pre-populates payment method and note from settingsStore', () => {
      useSettingsStore.setState({
        cache: {
          default_currency: 'USD',
          default_payment_method: 'maya',
          default_payment_details: '0918 ••• 9999',
        },
      });

      startRender();
      const element = NewSubscriptionScreen();

      const paymentSelector = findByTestId(element, 'payment-method-selector');
      assert.ok(paymentSelector);
      assert.equal(paymentSelector.props.value, 'maya');
      assert.equal(paymentSelector.props.details, '0918 ••• 9999');
    });

    it('reorders presets placing favorite categories at the top in recommended section', () => {
      useSettingsStore.setState({
        cache: {
          default_currency: 'USD',
          favorite_categories: JSON.stringify(['gaming']),
        },
      });

      startRender();
      const element = NewSubscriptionScreen();

      const recommendedHeader = findByTestId(element, 'recommended-presets-section');
      assert.ok(recommendedHeader);

      const presetGrid = findByTestId(element, 'preset-grid');
      assert.ok(presetGrid);

      const firstCard = getChildren(presetGrid)[0];
      assert.ok(firstCard);
      assert.equal(firstCard.props.testID, 'preset-card-discord');
    });
  });

  // =========================================================================
  // 2. Edit Subscription Modal ([id].tsx)
  // =========================================================================
  describe('EditSubscriptionScreen (app/subscription/[id].tsx)', () => {
    const existingSub: Subscription = createSub({
      id: 'sub-existing-123',
      name: 'Adobe CC',
      amount: 54.99,
      billingCycle: 'yearly',
      nextRenewalDate: '2027-05-20',
      category: 'productivity',
      color: '#FF0000',
      iconType: 'preset',
      iconValue: 'adobe',
      isTrial: 1,
      trialEndDate: '2026-06-01',
      notifyBeforeDays: 7,
    });

    it('renders friendly error state when subscription ID is not found', () => {
      setMockSearchParams({ id: 'non-existent-sub' });
      useSubscriptionStore.setState({ subscriptions: [] });

      startRender();
      const element = EditSubscriptionScreen();

      const notFound = findByTestId(element, 'subscription-not-found');
      assert.ok(notFound);

      const backBtn = findByTestId(element, 'not-found-back-btn');
      assert.ok(backBtn);
      backBtn.props.onPress();
      assert.equal(backCalls, 1);
    });

    it('pre-populates all form fields with existing subscription values', () => {
      setMockSearchParams({ id: 'sub-existing-123' });
      useSubscriptionStore.setState({ subscriptions: [existingSub] });

      startRender();
      const element = EditSubscriptionScreen();

      // Name pre-populated
      const nameInput = findByTestId(element, 'input-name');
      assert.equal(nameInput.props.value, 'Adobe CC');

      // Amount pre-populated
      const amountInput = findByTestId(element, 'input-amount');
      assert.equal(amountInput.props.value, '54.99');

      // Next renewal date pre-populated
      const renewalInput = findByTestId(element, 'input-renewal-date');
      assert.equal(renewalInput.props.value, '2027-05-20');

      // Billing cycle pre-populated
      const billingPill = findByTestId(element, 'billing-cycle-pill');
      assert.equal(billingPill.props.value, 'yearly');

      // Trial end date pre-populated
      const trialInput = findByTestId(element, 'input-trial-end-date');
      assert.ok(trialInput);
      assert.equal(trialInput.props.value, '2026-06-01');

      // Stepper pre-populated
      const stepperVal = findByTestId(element, 'stepper-value');
      assert.equal(stepperVal.props.children, 7);
    });

    it('validates fields and prevents update on empty name or invalid amount', async () => {
      setMockSearchParams({ id: 'sub-existing-123' });
      useSubscriptionStore.setState({ subscriptions: [existingSub] });

      startRender();
      let element = EditSubscriptionScreen();

      // Clear name
      const nameInput = findByTestId(element, 'input-name');
      nameInput.props.onChangeText('   ');

      startRender();
      element = EditSubscriptionScreen();

      const saveBtn = findByTestId(element, 'header-save-btn');
      await saveBtn.props.onPress();

      assert.equal(alertCalls.length, 1);
      assert.equal(alertCalls[0].title, 'Validation Error');
      assert.equal(updatedSubs.length, 0);

      // Restore name, provide invalid amount
      nameInput.props.onChangeText('Adobe Photography');
      const amountInput = findByTestId(element, 'input-amount');
      amountInput.props.onChangeText('0');

      startRender();
      element = EditSubscriptionScreen();
      await saveBtn.props.onPress();

      assert.equal(alertCalls.length, 2);
      assert.equal(alertCalls[1].title, 'Validation Error');
      assert.equal(updatedSubs.length, 0);
    });

    it('generates correct payload for updateSubscription and navigates back on success', async () => {
      setMockSearchParams({ id: 'sub-existing-123' });
      useSubscriptionStore.setState({ subscriptions: [existingSub] });

      startRender();
      let element = EditSubscriptionScreen();

      // Update name and amount
      const nameInput = findByTestId(element, 'input-name');
      nameInput.props.onChangeText('Adobe Creative Cloud Pro');

      const amountInput = findByTestId(element, 'input-amount');
      amountInput.props.onChangeText('59.99');

      startRender();
      element = EditSubscriptionScreen();

      const saveBtn = findByTestId(element, 'header-save-btn');
      await saveBtn.props.onPress();

      assert.equal(updatedSubs.length, 1);
      assert.equal(updatedSubs[0].id, 'sub-existing-123');
      const data = updatedSubs[0].data;
      assert.equal(data.name, 'Adobe Creative Cloud Pro');
      assert.equal(data.amount, 59.99);
      assert.equal(data.billingCycle, 'yearly');
      assert.equal(data.category, 'productivity');
      assert.equal(backCalls, 1);
    });

    it('shows delete confirmation alert and calls deleteSubscription when confirmed', async () => {
      setMockSearchParams({ id: 'sub-existing-123' });
      useSubscriptionStore.setState({ subscriptions: [existingSub] });

      startRender();
      const element = EditSubscriptionScreen();

      const deleteBtn = findByTestId(element, 'delete-subscription-btn');
      assert.ok(deleteBtn);
      deleteBtn.props.onPress();

      // Alert confirmation shown
      assert.equal(alertCalls.length, 1);
      const alert = alertCalls[0];
      assert.equal(alert.title, 'Delete Subscription');
      assert.ok(alert.message?.includes('Adobe CC'));
      assert.ok(Array.isArray(alert.buttons));

      const deleteOption = alert.buttons?.find((b: any) => b.text === 'Delete');
      assert.ok(deleteOption);
      assert.equal(deleteOption.style, 'destructive');

      // Execute deletion
      await deleteOption.onPress();

      assert.equal(deletedIds.length, 1);
      assert.equal(deletedIds[0], 'sub-existing-123');
      assert.equal(backCalls, 1);
    });
  });
});
