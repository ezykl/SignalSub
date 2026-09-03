import '../../stores/__tests__/setupDbMock';
import './setupComponentMocks';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { POPULAR_CURRENCIES, getCurrencyByCode } from '../../constants/currencies';
import { OnboardingStep } from '../OnboardingStep';
import WelcomeScreen from '../../../app/(onboarding)/welcome';
import Step1Screen from '../../../app/(onboarding)/step-1';
import Step2Screen from '../../../app/(onboarding)/step-2';
import Step3Screen from '../../../app/(onboarding)/step-3';
import CurrencyScreen from '../../../app/(onboarding)/currency';
import { COLORS } from '../../constants/colors';

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
function findAllByType(element: any, typeName: string): any[] {
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

describe('Onboarding Flow', () => {
  describe('Currencies Constant', () => {
    it('contains all required popular ISO currencies', () => {
      const requiredCodes = [
        'PHP', 'USD', 'EUR', 'GBP', 'JPY',
        'AUD', 'CAD', 'SGD', 'MYR', 'IDR',
        'KRW', 'CNY', 'INR', 'BRL', 'MXN',
      ];

      for (const code of requiredCodes) {
        const found = POPULAR_CURRENCIES.find((c) => c.code === code);
        assert.ok(found, `Expected currency ${code} to be in POPULAR_CURRENCIES`);
        assert.ok(found.name.length > 0);
        assert.ok(found.symbol.length > 0);
        assert.ok(found.flag.length > 0);
      }
    });

    it('getCurrencyByCode resolves case-insensitively', () => {
      const usd = getCurrencyByCode('usd');
      assert.ok(usd);
      assert.equal(usd.code, 'USD');
      assert.equal(usd.symbol, '$');

      const php = getCurrencyByCode('PHP');
      assert.ok(php);
      assert.equal(php.code, 'PHP');
      assert.equal(php.symbol, '₱');

      const nonExistent = getCurrencyByCode('XYZ');
      assert.equal(nonExistent, undefined);
    });
  });

  describe('OnboardingStep Component', () => {
    it('renders Step 1 with active first dot, headline, body, hero, and subtext', () => {
      let nextClicked = false;
      let skipClicked = false;

      const element = OnboardingStep({
        stepNumber: 1,
        heroIcon: 'plus-circle-multiple-outline',
        heroColor: COLORS.accentPurple,
        headline: 'Add Your Subscriptions',
        body: 'Search from 50+ popular services or add your own.',
        nextButtonLabel: 'Next →',
        subtext: 'Takes less than 2 minutes to set up',
        onNext: () => { nextClicked = true; },
        onSkip: () => { skipClicked = true; },
        testID: 'step-1-test',
      });

      assert.equal(element.type, 'SafeAreaView');

      // Verify dots
      const dot1 = findByTestId(element, 'step-dot-1-active');
      assert.ok(dot1, 'Step 1 dot should be active');
      const dot1Style = flattenStyle(dot1.props.style);
      assert.equal(dot1Style.width, 24);
      assert.equal(dot1Style.backgroundColor, COLORS.accentPurple);

      const dot2 = findByTestId(element, 'step-dot-2');
      assert.ok(dot2, 'Step 2 dot should be inactive');
      const dot2Style = flattenStyle(dot2.props.style);
      assert.equal(dot2Style.width, 8);

      // Verify headline & body text
      const allTexts = findAllByType(element, 'Text');
      const textValues = allTexts.map((t) => (typeof t.props.children === 'string' ? t.props.children : ''));
      assert.ok(textValues.includes('STEP 1 OF 3'));
      assert.ok(textValues.includes('Add Your Subscriptions'));
      assert.ok(textValues.includes('Search from 50+ popular services or add your own.'));
      assert.ok(textValues.includes('Next →'));
      assert.ok(textValues.includes('Takes less than 2 minutes to set up'));
      assert.ok(textValues.includes('Skip'));

      // Verify button handlers
      const touchables = findAllByType(element, 'TouchableOpacity');
      const skipTouchable = touchables.find((t) => t.props.accessibilityLabel === 'Skip onboarding');
      assert.ok(skipTouchable);
      skipTouchable.props.onPress();
      assert.equal(skipClicked, true);

      const nextTouchable = touchables.find((t) => t.props.accessibilityLabel === 'Next →');
      assert.ok(nextTouchable);
      nextTouchable.props.onPress();
      assert.equal(nextClicked, true);
    });

    it('renders Step 2 with active second dot and warning hero', () => {
      const element = OnboardingStep({
        stepNumber: 2,
        heroIcon: 'bell-ring-outline',
        heroColor: COLORS.warning,
        headline: 'Never Miss a Renewal',
        body: 'Get push notifications before each charge.',
        nextButtonLabel: 'Next →',
        onNext: () => {},
        onSkip: () => {},
      });

      const dot2 = findByTestId(element, 'step-dot-2-active');
      assert.ok(dot2, 'Step 2 dot should be active');

      const allTexts = findAllByType(element, 'Text');
      const textValues = allTexts.map((t) => (typeof t.props.children === 'string' ? t.props.children : ''));
      assert.ok(textValues.includes('STEP 2 OF 3'));
      assert.ok(textValues.includes('Never Miss a Renewal'));
    });

    it('renders Step 3 with active third dot and success hero', () => {
      const element = OnboardingStep({
        stepNumber: 3,
        heroIcon: 'chart-donut',
        heroColor: COLORS.success,
        headline: 'See Where Your Money Goes',
        body: 'Get a clear breakdown of your spending by category.',
        nextButtonLabel: 'Get Started 🎉',
        subtext: 'No account needed · Works offline',
        onNext: () => {},
        onSkip: () => {},
      });

      const dot3 = findByTestId(element, 'step-dot-3-active');
      assert.ok(dot3, 'Step 3 dot should be active');

      const allTexts = findAllByType(element, 'Text');
      const textValues = allTexts.map((t) => (typeof t.props.children === 'string' ? t.props.children : ''));
      assert.ok(textValues.includes('STEP 3 OF 3'));
      assert.ok(textValues.includes('See Where Your Money Goes'));
      assert.ok(textValues.includes('Get Started 🎉'));
      assert.ok(textValues.includes('No account needed · Works offline'));
    });
  });

  describe('WelcomeScreen', () => {
    it('renders title, tagline, logo, Get Started button, and trust signal', () => {
      const element = WelcomeScreen();
      assert.equal(element.type, 'SafeAreaView');

      const allTexts = findAllByType(element, 'Text');
      const textValues = allTexts.map((t) => t.props.children);
      assert.ok(textValues.includes('SignalSub'));
      assert.ok(textValues.includes('Never get surprised by an auto-charge.'));
      assert.ok(textValues.includes('Get Started →'));
      assert.ok(textValues.includes('No account needed · Works offline'));

      // Check logo Image component exists
      const images = findAllByType(element, 'Image');
      assert.equal(images.length, 1);
      assert.equal(images[0].props.resizeMode, 'contain');
      assert.equal(images[0].props.accessibilityLabel, 'SignalSub Logo');

      // Check button styling
      const button = findAllByType(element, 'TouchableOpacity')[0];
      assert.ok(button);
      const buttonStyle = flattenStyle(button.props.style);
      assert.equal(buttonStyle.backgroundColor, COLORS.accentPurple);
    });
  });

  describe('Step Screens', () => {
    it('renders Step1Screen with correct initial configuration', () => {
      const element = Step1Screen();
      assert.equal(element.props.stepNumber, 1);
      assert.equal(element.props.heroIcon, 'plus-circle-multiple-outline');
      assert.equal(element.props.heroColor, COLORS.accentPurple);
      assert.equal(element.props.headline, 'Add Your Subscriptions');
      assert.equal(element.props.subtext, 'Takes less than 2 minutes to set up');
    });

    it('renders Step2Screen with correct initial configuration', () => {
      const element = Step2Screen();
      assert.equal(element.props.stepNumber, 2);
      assert.equal(element.props.heroIcon, 'bell-ring-outline');
      assert.equal(element.props.heroColor, COLORS.warning);
      assert.equal(element.props.headline, 'Never Miss a Renewal');
    });

    it('renders Step3Screen with correct initial configuration', () => {
      const element = Step3Screen();
      assert.equal(element.props.stepNumber, 3);
      assert.equal(element.props.heroIcon, 'chart-donut');
      assert.equal(element.props.heroColor, COLORS.success);
      assert.equal(element.props.headline, 'See Where Your Money Goes');
      assert.equal(element.props.nextButtonLabel, 'Get Started 🎉');
      assert.equal(element.props.subtext, 'No account needed · Works offline');
    });
  });

  describe('CurrencyScreen', () => {
    it('renders title, search input, FlatList, and Continue CTA', () => {
      const element = CurrencyScreen();
      assert.equal(element.type, 'SafeAreaView');

      const allTexts = findAllByType(element, 'Text');
      const textValues = allTexts.map((t) => (typeof t.props.children === 'string' ? t.props.children : ''));
      assert.ok(textValues.includes('What currency do you use?'));

      // Check search input
      const searchInput = findByTestId(element, 'currency-search-input');
      assert.ok(searchInput);
      assert.equal(searchInput.type, 'TextInput');
      assert.equal(searchInput.props.placeholder, 'Search currency (e.g. USD, EUR, PHP)');

      // Check FlatList
      const flatLists = findAllByType(element, 'FlatList');
      assert.equal(flatLists.length, 1);
      assert.equal(flatLists[0].props.data.length, POPULAR_CURRENCIES.length);

      // Check continue button
      const continueBtn = findByTestId(element, 'continue-button');
      assert.ok(continueBtn);
      assert.equal(continueBtn.props.accessibilityLabel, 'Continue with USD');
    });
  });
});
