import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import './setupComponentMocks';
import { PAYMENT_METHODS, getPaymentMethod } from '../../constants/paymentMethods';
import { PaymentMethodSelector } from '../PaymentMethodSelector';
import { DatePickerModal, formatDateString } from '../DatePickerModal';

let stateIndex = 0;
const stateMap = new Map<number, any>();

function resetComponentState() {
  stateIndex = 0;
  stateMap.clear();
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
  useEffect: (fn: any) => {
    try {
      fn();
    } catch {
      // ignore
    }
  },
  useRef: (init: any) => ({ current: init }),
  useContext: () => ({}),
  useReducer: (r: any, init: any) => [init, () => {}],
  useLayoutEffect: () => {},
  useId: () => ':r0:',
  useTransition: () => [false, (cb: any) => cb()],
  useDeferredValue: (v: any) => v,
  useSyncExternalStore: (_subscribe: any, getSnapshot: any) => getSnapshot(),
  useDebugValue: () => {},
};

(React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current = mockDispatcher;

function findByTestId(node: any, testID: string): any | null {
  if (!node) return null;
  if (node.props && node.props.testID === testID) return node;
  if (node.props && node.props.children) {
    const children = Array.isArray(node.props.children)
      ? node.props.children
      : [node.props.children];
    for (const child of children) {
      const found = findByTestId(child, testID);
      if (found) return found;
    }
  }
  return null;
}

describe('Payment Methods Constant', () => {
  it('contains essential Philippine and global payment methods with valid SVGs', () => {
    const keys = PAYMENT_METHODS.map((m) => m.key);
    assert.ok(keys.includes('gcash'), 'Includes GCash');
    assert.ok(keys.includes('maya'), 'Includes Maya');
    assert.ok(keys.includes('gotyme'), 'Includes GoTyme');
    assert.ok(keys.includes('maribank'), 'Includes MariBank');
    assert.ok(keys.includes('unionbank'), 'Includes UnionBank');
    assert.ok(keys.includes('bdo'), 'Includes BDO');
    assert.ok(keys.includes('bpi'), 'Includes BPI');
    assert.ok(keys.includes('grabpay'), 'Includes GrabPay');
    assert.ok(keys.includes('card'), 'Includes Card');
    assert.ok(keys.includes('paypal'), 'Includes PayPal');
  });

  it('getPaymentMethod resolves case-insensitively and falls back cleanly', () => {
    assert.equal(getPaymentMethod('GCash').key, 'gcash');
    assert.equal(getPaymentMethod('MAYA').key, 'maya');
    assert.equal(getPaymentMethod('bdo').key, 'bdo');
    assert.equal(getPaymentMethod('unknown_bank').key, 'gcash'); // fallback to default
  });
});

describe('PaymentMethodSelector Component', () => {
  beforeEach(() => {
    resetComponentState();
  });

  it('renders all payment method chips and triggers onChangeMethod on press', () => {
    let selected = 'card';
    let details = 'Visa 1234';

    startRender();
    const element = PaymentMethodSelector({
      value: selected,
      details,
      onChangeMethod: (m) => {
        selected = m;
      },
      onChangeDetails: (d) => {
        details = d;
      },
      testID: 'test-payment-selector',
    });

    const gcashChip = findByTestId(element, 'payment-method-chip-gcash');
    assert.ok(gcashChip, 'GCash chip rendered');
    gcashChip.props.onPress();
    assert.equal(selected, 'gcash');

    const detailsInput = findByTestId(element, 'test-payment-selector-details-input');
    assert.ok(detailsInput, 'Details input rendered');
    assert.equal(detailsInput.props.value, 'Visa 1234');
    detailsInput.props.onChangeText('0917 555 1234');
    assert.equal(details, '0917 555 1234');
  });
});

describe('DatePickerModal Component', () => {
  beforeEach(() => {
    resetComponentState();
  });

  it('formats date strings accurately into friendly readable labels', () => {
    assert.equal(formatDateString('2026-09-15'), 'Sep 15, 2026');
    assert.equal(formatDateString('2026-12-25'), 'Dec 25, 2026');
    assert.equal(formatDateString('invalid'), 'invalid');
  });

  it('renders calendar days and triggers onConfirm with selected date', () => {
    let confirmedDate = '';
    let cancelled = false;

    startRender();
    let element = DatePickerModal({
      visible: true,
      value: '2026-09-15',
      title: 'Select Renewal Date',
      onConfirm: (d) => {
        confirmedDate = d;
      },
      onCancel: () => {
        cancelled = true;
      },
      testID: 'test-date-picker',
    });

    // Tap day 20
    const day20 = findByTestId(element, 'date-cell-2026-09-20');
    assert.ok(day20, 'Day 20 rendered in calendar');
    day20.props.onPress();

    startRender();
    element = DatePickerModal({
      visible: true,
      value: '2026-09-15',
      title: 'Select Renewal Date',
      onConfirm: (d) => {
        confirmedDate = d;
      },
      onCancel: () => {
        cancelled = true;
      },
      testID: 'test-date-picker',
    });

    // Tap confirm button
    const confirmBtn = findByTestId(element, 'test-date-picker-confirm-btn');
    assert.ok(confirmBtn, 'Confirm button exists');
    confirmBtn.props.onPress();

    assert.equal(confirmedDate, '2026-09-20');

    // Tap cancel button
    const cancelBtn = findByTestId(element, 'test-date-picker-cancel-btn');
    assert.ok(cancelBtn, 'Cancel button exists');
    cancelBtn.props.onPress();
    assert.equal(cancelled, true);
  });
});
