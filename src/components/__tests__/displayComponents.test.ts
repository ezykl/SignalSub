import './setupComponentMocks';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {
  SpendingCard,
  SubscriptionCard,
  SubscriptionRow,
  NoiseOverlay,
  InitialAvatar,
} from '../index';
import { COLORS } from '../../constants/colors';
import type { Subscription } from '../../db/schema';
import { daysUntil, formatRenewalLabel } from '../../services/renewalService';

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

// Helper to create mock Subscription
function createMockSubscription(overrides: Partial<Subscription> = {}): Subscription {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);
  const nextRenewalDate = futureDate.toISOString().slice(0, 10);

  return {
    id: 'sub-test-1',
    name: 'Netflix',
    description: 'Standard plan',
    amount: 15.49,
    currency: 'USD',
    billingCycle: 'monthly',
    nextRenewalDate,
    startDate: '2026-01-01',
    color: '#E50914',
    iconType: 'preset',
    iconValue: 'netflix',
    category: 'streaming',
    isTrial: 0,
    trialEndDate: null,
    isActive: 1,
    notifyBeforeDays: 3,
    notificationId: 'notif-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Subscription Display Components', () => {
  describe('SpendingCard', () => {
    it('renders NoiseOverlay with gradient colors, borderRadius 24, and card styles', () => {
      const element = SpendingCard({
        monthlyTotal: 49.99,
        yearlyTotal: 599.88,
        currency: '$',
      });

      assert.equal(element.type, NoiseOverlay);
      assert.deepEqual(element.props.colors, [COLORS.gradientStart, COLORS.gradientEnd]);
      assert.equal(element.props.borderRadius, 24);

      const style = flattenStyle(element.props.style);
      assert.equal(style.padding, 20);
      assert.equal(style.marginHorizontal, 16);
      assert.equal(style.marginBottom, 24);
      assert.equal(style.borderRadius, 24);
    });

    it('renders monthly label in COLORS.accentPurpleLight with 12sp uppercase', () => {
      const element = SpendingCard({
        monthlyTotal: 25.0,
        yearlyTotal: 300.0,
        currency: 'EUR',
      });

      const children = getChildren(element);
      const label = children[0];

      assert.equal(label.type, 'Text');
      assert.equal(label.props.children, 'MONTHLY TOTAL');

      const style = flattenStyle(label.props.style);
      assert.equal(style.color, COLORS.accentPurpleLight);
      assert.equal(style.fontSize, 12);
      assert.equal(style.fontWeight, '600');
      assert.equal(style.letterSpacing, 1);
    });

    it('renders hero monthly figure in #FFFFFF 36sp with 800 weight', () => {
      const element = SpendingCard({
        monthlyTotal: 34.567,
        yearlyTotal: 414.8,
        currency: 'USD',
      });

      const children = getChildren(element);
      const hero = children[1];

      assert.equal(hero.type, 'Text');
      assert.equal(hero.props.children, 'USD 34.57');

      const style = flattenStyle(hero.props.style);
      assert.equal(style.color, '#FFFFFF');
      assert.equal(style.fontSize, 36);
      assert.equal(style.fontWeight, '800');
      assert.equal(style.marginVertical, 4);
    });

    it('renders yearly subtitle in COLORS.textSecondary 13sp', () => {
      const element = SpendingCard({
        monthlyTotal: 10,
        yearlyTotal: 120,
        currency: '$',
      });

      const children = getChildren(element);
      const yearly = children[2];

      assert.equal(yearly.type, 'Text');
      assert.equal(yearly.props.children, 'Yearly estimate: $ 120.00');

      const style = flattenStyle(yearly.props.style);
      assert.equal(style.color, COLORS.textSecondary);
      assert.equal(style.fontSize, 13);
    });

    it('gracefully handles missing/NaN amounts and currency fallback', () => {
      const element = SpendingCard({
        monthlyTotal: NaN,
        yearlyTotal: undefined as any,
        currency: '',
      });

      const children = getChildren(element);
      const hero = children[1];
      const yearly = children[2];

      assert.equal(hero.props.children, '$ 0.00');
      assert.equal(yearly.props.children, 'Yearly estimate: $ 0.00');
    });

    it('passes custom style and testID', () => {
      const element = SpendingCard({
        monthlyTotal: 15,
        yearlyTotal: 180,
        currency: '$',
        style: { marginTop: 10 },
        testID: 'spending-card-test',
      });

      const style = flattenStyle(element.props.style);
      assert.equal(style.marginTop, 10);
      assert.equal(element.props.testID, 'spending-card-test');
    });
  });

  describe('SubscriptionCard', () => {
    it('renders 160x130 card with NoiseOverlay using subscription colors and borderRadius 16', () => {
      const sub = createMockSubscription({ color: '#1DB954' });
      const element = SubscriptionCard({ subscription: sub });

      assert.equal(element.type, 'TouchableOpacity');
      const containerStyle = flattenStyle(element.props.style);
      assert.equal(containerStyle.width, 160);
      assert.equal(containerStyle.height, 130);
      assert.equal(containerStyle.marginRight, 12);

      const overlay = getChildren(element)[0];
      assert.equal(overlay.type, NoiseOverlay);
      assert.deepEqual(overlay.props.colors, ['#1DB954EE', '#1DB95499']);
      assert.equal(overlay.props.borderRadius, 16);

      const overlayStyle = flattenStyle(overlay.props.style);
      assert.equal(overlayStyle.width, 160);
      assert.equal(overlayStyle.height, 130);
      assert.equal(overlayStyle.borderRadius, 16);
      assert.equal(overlayStyle.padding, 12);
      assert.equal(overlayStyle.justifyContent, 'space-between');
    });

    it('renders MaterialCommunityIcons for preset iconType', () => {
      const sub = createMockSubscription({
        iconType: 'preset',
        iconValue: 'spotify',
      });
      const element = SubscriptionCard({ subscription: sub });

      const overlay = getChildren(element)[0];
      const [topRow] = getChildren(overlay);
      const [iconEl] = getChildren(topRow);

      assert.equal(iconEl.type, 'MaterialCommunityIcons');
      assert.equal(iconEl.props.name, 'spotify');
      assert.equal(iconEl.props.size, 28);
      assert.equal(iconEl.props.color, '#fff');
    });

    it('renders InitialAvatar with letter and semi-transparent white for custom/initial iconType', () => {
      const sub = createMockSubscription({
        iconType: 'initial',
        iconValue: 'H',
        name: 'HBO Max',
      });
      const element = SubscriptionCard({ subscription: sub });

      const overlay = getChildren(element)[0];
      const [topRow] = getChildren(overlay);
      const [iconEl] = getChildren(topRow);

      assert.equal(iconEl.type, InitialAvatar);
      assert.equal(iconEl.props.letter, 'H');
      assert.equal(iconEl.props.color, 'rgba(255,255,255,0.3)');
      assert.equal(iconEl.props.size, 28);
    });

    it('sets renewal badge color to #EF4444 when renewal is <= 3 days', () => {
      const d = new Date();
      d.setDate(d.getDate() + 2); // 2 days away
      const sub = createMockSubscription({ nextRenewalDate: d.toISOString().slice(0, 10) });
      const element = SubscriptionCard({ subscription: sub });

      const overlay = getChildren(element)[0];
      const [topRow] = getChildren(overlay);
      const [, badge] = getChildren(topRow);

      const badgeStyle = flattenStyle(badge.props.style);
      assert.equal(badgeStyle.backgroundColor, '#EF4444');

      const badgeText = getChildren(badge)[0];
      assert.equal(badgeText.type, 'Text');
      assert.equal(badgeText.props.children, formatRenewalLabel(sub.nextRenewalDate));
      const textStyle = flattenStyle(badgeText.props.style);
      assert.equal(textStyle.color, '#FFFFFF');
      assert.equal(textStyle.fontWeight, 'bold');
      assert.equal(textStyle.fontSize, 10);
    });

    it('sets renewal badge color to #F59E0B when renewal is <= 7 days but > 3 days', () => {
      const d = new Date();
      d.setDate(d.getDate() + 5); // 5 days away
      const sub = createMockSubscription({ nextRenewalDate: d.toISOString().slice(0, 10) });
      const element = SubscriptionCard({ subscription: sub });

      const overlay = getChildren(element)[0];
      const [topRow] = getChildren(overlay);
      const [, badge] = getChildren(topRow);

      const badgeStyle = flattenStyle(badge.props.style);
      assert.equal(badgeStyle.backgroundColor, '#F59E0B');
    });

    it('sets renewal badge color to rgba(255,255,255,0.2) when renewal is > 7 days', () => {
      const d = new Date();
      d.setDate(d.getDate() + 14); // 14 days away
      const sub = createMockSubscription({ nextRenewalDate: d.toISOString().slice(0, 10) });
      const element = SubscriptionCard({ subscription: sub });

      const overlay = getChildren(element)[0];
      const [topRow] = getChildren(overlay);
      const [, badge] = getChildren(topRow);

      const badgeStyle = flattenStyle(badge.props.style);
      assert.equal(badgeStyle.backgroundColor, 'rgba(255,255,255,0.2)');
    });

    it('renders bottom area with bold white name (numberOfLines=1) and formatted price', () => {
      const sub = createMockSubscription({
        name: 'YouTube Premium Family',
        amount: 22.99,
        currency: 'USD',
      });
      const element = SubscriptionCard({ subscription: sub });

      const overlay = getChildren(element)[0];
      const [, bottomArea] = getChildren(overlay);
      const [nameEl, priceEl] = getChildren(bottomArea);

      assert.equal(nameEl.type, 'Text');
      assert.equal(nameEl.props.children, 'YouTube Premium Family');
      assert.equal(nameEl.props.numberOfLines, 1);
      const nameStyle = flattenStyle(nameEl.props.style);
      assert.equal(nameStyle.color, '#FFFFFF');
      assert.equal(nameStyle.fontWeight, 'bold');
      assert.equal(nameStyle.fontSize, 14);

      assert.equal(priceEl.type, 'Text');
      assert.equal(priceEl.props.children, 'USD 22.99');
      const priceStyle = flattenStyle(priceEl.props.style);
      assert.equal(priceStyle.color, 'rgba(255,255,255,0.85)');
      assert.equal(priceStyle.fontSize, 13);
    });

    it('handles onPress callback and disabled state when onPress is omitted', () => {
      let pressed = false;
      const sub = createMockSubscription();
      const elementWithPress = SubscriptionCard({
        subscription: sub,
        onPress: () => {
          pressed = true;
        },
      });

      assert.equal(elementWithPress.props.disabled, false);
      elementWithPress.props.onPress();
      assert.equal(pressed, true);

      const elementWithoutPress = SubscriptionCard({ subscription: sub });
      assert.equal(elementWithoutPress.props.disabled, true);
    });
  });

  describe('SubscriptionRow', () => {
    it('is wrapped in Swipeable and renders main card with COLORS.bgCard and 3px left accent border', () => {
      const sub = createMockSubscription({ color: '#FF5722' });
      const element = SubscriptionRow({ subscription: sub });

      assert.equal(element.type, 'Swipeable');
      assert.equal(typeof element.props.renderRightActions, 'function');

      const card = getChildren(element)[0];
      assert.equal(card.type, 'TouchableOpacity');

      const cardStyle = flattenStyle(card.props.style);
      assert.equal(cardStyle.backgroundColor, COLORS.bgCard);
      assert.equal(cardStyle.borderRadius, 12);
      assert.equal(cardStyle.padding, 16);
      assert.equal(cardStyle.marginBottom, 8);
      assert.equal(cardStyle.borderLeftWidth, 3);
      assert.equal(cardStyle.borderLeftColor, '#FF5722');
    });

    it('renders right swipe actions with Pause button (COLORS.warning) when active', () => {
      let paused = false;
      let closed = false;
      const sub = createMockSubscription({ isActive: 1 });
      const element = SubscriptionRow({
        subscription: sub,
        onPause: () => {
          paused = true;
        },
      });

      const mockSwipeable = {
        close: () => {
          closed = true;
        },
      };

      const actions = element.props.renderRightActions(null, null, mockSwipeable);
      assert.equal(actions.type, 'View');

      const [pauseBtn, deleteBtn] = getChildren(actions);

      // Pause button
      assert.equal(pauseBtn.type, 'TouchableOpacity');
      const pauseStyle = flattenStyle(pauseBtn.props.style);
      assert.equal(pauseStyle.backgroundColor, COLORS.warning);

      const pauseText = getChildren(pauseBtn)[0];
      assert.equal(pauseText.type, 'Text');
      assert.equal(pauseText.props.children, 'Pause');

      // Trigger pause
      pauseBtn.props.onPress();
      assert.equal(paused, true);
      assert.equal(closed, true);
    });

    it('renders right swipe actions with Resume button when inactive', () => {
      const sub = createMockSubscription({ isActive: 0 });
      const element = SubscriptionRow({ subscription: sub });

      const actions = element.props.renderRightActions(null, null, null);
      const [pauseBtn] = getChildren(actions);
      const resumeText = getChildren(pauseBtn)[0];
      assert.equal(resumeText.props.children, 'Resume');
    });

    it('renders right swipe actions with Delete button (COLORS.danger) and triggers onDelete', () => {
      let deleted = false;
      let closed = false;
      const sub = createMockSubscription();
      const element = SubscriptionRow({
        subscription: sub,
        onDelete: () => {
          deleted = true;
        },
      });

      const mockSwipeable = {
        close: () => {
          closed = true;
        },
      };

      const actions = element.props.renderRightActions(null, null, mockSwipeable);
      const [, deleteBtn] = getChildren(actions);

      assert.equal(deleteBtn.type, 'TouchableOpacity');
      const deleteStyle = flattenStyle(deleteBtn.props.style);
      assert.equal(deleteStyle.backgroundColor, COLORS.danger);

      const deleteText = getChildren(deleteBtn)[0];
      assert.equal(deleteText.props.children, 'Delete');

      // Trigger delete
      deleteBtn.props.onPress();
      assert.equal(deleted, true);
      assert.equal(closed, true);
    });

    it('renders 40x40 circular icon background with brand icon for preset iconType', () => {
      const sub = createMockSubscription({
        iconType: 'preset',
        iconValue: 'netflix',
        color: '#E50914',
      });
      const element = SubscriptionRow({ subscription: sub });
      const card = getChildren(element)[0];
      const [leftIcon] = getChildren(card);

      assert.equal(leftIcon.type, 'View');
      const iconStyle = flattenStyle(leftIcon.props.style);
      assert.equal(iconStyle.width, 40);
      assert.equal(iconStyle.height, 40);
      assert.equal(iconStyle.borderRadius, 20);
      assert.equal(iconStyle.backgroundColor, '#E50914');

      const icon = getChildren(leftIcon)[0];
      assert.equal(icon.type, 'MaterialCommunityIcons');
      assert.equal(icon.props.name, 'netflix');
      assert.equal(icon.props.size, 22);
      assert.equal(icon.props.color, '#FFFFFF');
    });

    it('renders 40x40 InitialAvatar for custom/initial iconType', () => {
      const sub = createMockSubscription({
        iconType: 'initial',
        iconValue: 'D',
        name: 'Dropbox',
        color: '#0061FF',
      });
      const element = SubscriptionRow({ subscription: sub });
      const card = getChildren(element)[0];
      const [avatar] = getChildren(card);

      assert.equal(avatar.type, InitialAvatar);
      assert.equal(avatar.props.letter, 'D');
      assert.equal(avatar.props.color, '#0061FF');
      assert.equal(avatar.props.size, 40);
    });

    it('renders center column with name and category · renewal label subtitle', () => {
      const sub = createMockSubscription({
        name: 'GitHub Pro',
        category: 'developer',
      });
      const element = SubscriptionRow({ subscription: sub });
      const card = getChildren(element)[0];
      const [, centerCol] = getChildren(card);
      const [nameRow, subtitle] = getChildren(centerCol);

      // Name
      const nameText = getChildren(nameRow)[0];
      assert.equal(nameText.type, 'Text');
      assert.equal(nameText.props.children, 'GitHub Pro');
      const nameStyle = flattenStyle(nameText.props.style);
      assert.equal(nameStyle.fontSize, 15);
      assert.equal(nameStyle.fontWeight, '600');
      assert.equal(nameStyle.color, COLORS.textPrimary);

      // Subtitle
      assert.equal(subtitle.type, 'Text');
      const expectedSub = `developer · ${formatRenewalLabel(sub.nextRenewalDate)}`;
      assert.equal(subtitle.props.children, expectedSub);
      const subStyle = flattenStyle(subtitle.props.style);
      assert.equal(subStyle.fontSize, 12);
      assert.equal(subStyle.color, COLORS.textSecondary);
    });

    it('shows trial badge when trial is active and hides it when trial is not active', () => {
      // Active trial
      const trialSub = createMockSubscription({
        isTrial: 1,
        trialEndDate: '2099-12-31',
      });
      const elementWithTrial = SubscriptionRow({ subscription: trialSub });
      const cardWithTrial = getChildren(elementWithTrial)[0];
      const [, centerColTrial] = getChildren(cardWithTrial);
      const [nameRowTrial] = getChildren(centerColTrial);
      const nameChildren = getChildren(nameRowTrial);

      assert.equal(nameChildren.length, 2);
      const badge = nameChildren[1];
      assert.equal(badge.props.testID, 'trial-badge');
      const badgeText = getChildren(badge)[0];
      assert.equal(badgeText.props.children, 'Trial');

      // No trial
      const nonTrialSub = createMockSubscription({ isTrial: 0 });
      const elementNoTrial = SubscriptionRow({ subscription: nonTrialSub });
      const cardNoTrial = getChildren(elementNoTrial)[0];
      const [, centerColNoTrial] = getChildren(cardNoTrial);
      const [nameRowNoTrial] = getChildren(centerColNoTrial);
      const noTrialChildren = getChildren(nameRowNoTrial);
      const noTrialElements = noTrialChildren.filter(Boolean);
      assert.equal(noTrialElements.length, 1);
      assert.equal(noTrialChildren[1], false);
    });

    it('renders right column with amount and billing cycle subtitle', () => {
      const sub = createMockSubscription({
        amount: 19.99,
        currency: '$',
        billingCycle: 'monthly',
      });
      const element = SubscriptionRow({ subscription: sub });
      const card = getChildren(element)[0];
      const [, , rightCol] = getChildren(card);
      const [amountEl, cycleEl] = getChildren(rightCol);

      assert.equal(amountEl.type, 'Text');
      assert.equal(amountEl.props.children, '$ 19.99');
      const amountStyle = flattenStyle(amountEl.props.style);
      assert.equal(amountStyle.fontSize, 14);
      assert.equal(amountStyle.fontWeight, '700');
      assert.equal(amountStyle.color, COLORS.textPrimary);

      assert.equal(cycleEl.type, 'Text');
      assert.equal(cycleEl.props.children, '/monthly');
      const cycleStyle = flattenStyle(cycleEl.props.style);
      assert.equal(cycleStyle.fontSize, 12);
      assert.equal(cycleStyle.color, COLORS.textSecondary);
    });

    it('applies inactive opacity (0.6) when subscription is inactive', () => {
      const sub = createMockSubscription({ isActive: 0 });
      const element = SubscriptionRow({ subscription: sub });
      const card = getChildren(element)[0];
      const cardStyle = flattenStyle(card.props.style);
      assert.equal(cardStyle.opacity, 0.6);
    });

    it('handles card onPress callback and disabled state', () => {
      let cardPressed = false;
      const sub = createMockSubscription();
      const elementWithPress = SubscriptionRow({
        subscription: sub,
        onPress: () => {
          cardPressed = true;
        },
      });

      const card = getChildren(elementWithPress)[0];
      assert.equal(card.props.disabled, false);
      card.props.onPress();
      assert.equal(cardPressed, true);

      const elementWithoutPress = SubscriptionRow({ subscription: sub });
      const cardNoPress = getChildren(elementWithoutPress)[0];
      assert.equal(cardNoPress.props.disabled, true);
    });
  });
});
