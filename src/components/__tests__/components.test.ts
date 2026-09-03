import './setupComponentMocks';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {
  NoiseOverlay,
  InitialAvatar,
  CategoryChip,
  BillingCyclePill,
  FAB,
  AlertBanner,
  StatCard,
} from '../index';
import * as ComponentExports from '../index';
import { COLORS } from '../../constants/colors';
import { getCategoryByKey } from '../../constants/categories';

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

describe('Shared UI Components', () => {
  describe('index exports', () => {
    it('exports all 10 components cleanly', () => {
      assert.equal(typeof ComponentExports.NoiseOverlay, 'function');
      assert.equal(typeof ComponentExports.InitialAvatar, 'function');
      assert.equal(typeof ComponentExports.CategoryChip, 'function');
      assert.equal(typeof ComponentExports.BillingCyclePill, 'function');
      assert.equal(typeof ComponentExports.FAB, 'function');
      assert.equal(typeof ComponentExports.AlertBanner, 'function');
      assert.equal(typeof ComponentExports.StatCard, 'function');
      assert.equal(typeof ComponentExports.SpendingCard, 'function');
      assert.equal(typeof ComponentExports.SubscriptionCard, 'function');
      assert.equal(typeof ComponentExports.SubscriptionRow, 'function');
    });
  });

  describe('NoiseOverlay', () => {
    it('renders LinearGradient with colors and children', () => {
      const child = React.createElement('View', { key: 'child' }, 'Inner');
      const element = NoiseOverlay({
        colors: [COLORS.gradientStart, COLORS.gradientEnd],
        children: child,
      });

      assert.equal(element.type, 'LinearGradient');
      assert.deepEqual(element.props.colors, [COLORS.gradientStart, COLORS.gradientEnd]);

      const children = getChildren(element);
      // First child is noise Image, second is child
      const img = children[0];
      assert.equal(img.type, 'Image');
      assert.equal(img.props.resizeMode, 'repeat');
      const imgStyle = flattenStyle(img.props.style);
      assert.equal(imgStyle.opacity, 0.1);
      assert.equal(imgStyle.position, 'absolute');

      assert.equal(children[1], child);
    });

    it('applies borderRadius to container and noise image', () => {
      const element = NoiseOverlay({
        colors: ['#000', '#fff'],
        borderRadius: 16,
      });

      const containerStyle = flattenStyle(element.props.style);
      assert.equal(containerStyle.borderRadius, 16);
      assert.equal(containerStyle.overflow, 'hidden');

      const children = getChildren(element);
      const img = children[0];
      const imgStyle = flattenStyle(img.props.style);
      assert.equal(imgStyle.borderRadius, 16);
    });

    it('merges custom style props', () => {
      const element = NoiseOverlay({
        colors: ['#000', '#fff'],
        style: { padding: 20 },
      });

      const style = flattenStyle(element.props.style);
      assert.equal(style.padding, 20);
    });
  });

  describe('InitialAvatar', () => {
    it('renders circular view with default size 40 and background color', () => {
      const element = InitialAvatar({ letter: 'Netflix', color: '#E50914' });
      assert.equal(element.type, 'View');

      const style = flattenStyle(element.props.style);
      assert.equal(style.width, 40);
      assert.equal(style.height, 40);
      assert.equal(style.borderRadius, 20);
      assert.equal(style.backgroundColor, '#E50914');

      const textEl = getChildren(element)[0];
      assert.equal(textEl.type, 'Text');
      assert.equal(textEl.props.children, 'N');
      const textStyle = flattenStyle(textEl.props.style);
      assert.equal(textStyle.color, '#FFFFFF');
      assert.equal(textStyle.fontWeight, 'bold');
      assert.equal(textStyle.fontSize, 18);
    });

    it('respects custom size and calculates proportionate font size', () => {
      const element = InitialAvatar({ letter: 'Spotify', color: '#1DB954', size: 60 });
      const style = flattenStyle(element.props.style);
      assert.equal(style.width, 60);
      assert.equal(style.height, 60);
      assert.equal(style.borderRadius, 30);

      const textEl = getChildren(element)[0];
      assert.equal(textEl.props.children, 'S');
      const textStyle = flattenStyle(textEl.props.style);
      assert.equal(textStyle.fontSize, 27); // 60 * 0.45 = 27
    });

    it('uppercases lowercase letters', () => {
      const element = InitialAvatar({ letter: 'github', color: '#24292E' });
      const textEl = getChildren(element)[0];
      assert.equal(textEl.props.children, 'G');
    });

    it('falls back to "S" when letter is empty or whitespace', () => {
      const elementEmpty = InitialAvatar({ letter: '', color: '#333' });
      const textEmpty = getChildren(elementEmpty)[0];
      assert.equal(textEmpty.props.children, 'S');

      const elementSpace = InitialAvatar({ letter: '   ', color: '#333' });
      const textSpace = getChildren(elementSpace)[0];
      assert.equal(textSpace.props.children, 'S');
    });
  });

  describe('CategoryChip', () => {
    it('renders category chip for streaming category when unselected', () => {
      const category = getCategoryByKey('streaming');
      const element = CategoryChip({ categoryKey: 'streaming', selected: false });

      assert.equal(element.type, 'TouchableOpacity');
      const chipStyle = flattenStyle(element.props.style);
      assert.equal(chipStyle.borderColor, category.color);
      assert.equal(chipStyle.backgroundColor, 'transparent');

      const textEl = getChildren(element)[0];
      assert.equal(textEl.type, 'Text');
      assert.equal(textEl.props.children, category.label);
      const textStyle = flattenStyle(textEl.props.style);
      assert.equal(textStyle.color, category.color);
    });

    it('renders category chip with solid color background and white text when selected', () => {
      const category = getCategoryByKey('productivity');
      const element = CategoryChip({ categoryKey: 'productivity', selected: true });

      const chipStyle = flattenStyle(element.props.style);
      assert.equal(chipStyle.borderColor, category.color);
      assert.equal(chipStyle.backgroundColor, category.color);

      const textEl = getChildren(element)[0];
      assert.equal(textEl.props.children, category.label);
      const textStyle = flattenStyle(textEl.props.style);
      assert.equal(textStyle.color, '#FFFFFF');
    });

    it('falls back cleanly for unknown categoryKey', () => {
      const element = CategoryChip({ categoryKey: 'non-existent-key' });
      const textEl = getChildren(element)[0];
      assert.equal(textEl.props.children, 'Other');
    });

    it('handles onPress callback and accessibilityState', () => {
      let pressed = false;
      const onPress = () => {
        pressed = true;
      };

      const element = CategoryChip({ categoryKey: 'gaming', selected: true, onPress });
      assert.deepEqual(element.props.accessibilityState, { selected: true });
      assert.equal(element.props.disabled, false);

      element.props.onPress();
      assert.equal(pressed, true);
    });

    it('disables touchable when onPress is not provided', () => {
      const element = CategoryChip({ categoryKey: 'cloud' });
      assert.equal(element.props.disabled, true);
    });
  });

  describe('BillingCyclePill', () => {
    it('renders 4 options with segmented pill style', () => {
      const element = BillingCyclePill({ value: 'monthly', onChange: () => {} });
      assert.equal(element.type, 'View');

      const containerStyle = flattenStyle(element.props.style);
      assert.equal(containerStyle.backgroundColor, COLORS.bgSurface);
      assert.equal(containerStyle.flexDirection, 'row');

      const segments = getChildren(element);
      assert.equal(segments.length, 4);

      const labels = segments.map((seg: any) => getChildren(seg)[0].props.children);
      assert.deepEqual(labels, ['Weekly', 'Monthly', 'Quarterly', 'Yearly']);
    });

    it('styles the selected option with accentPurple and white text', () => {
      const element = BillingCyclePill({ value: 'yearly', onChange: () => {} });
      const segments = getChildren(element);

      // 'yearly' is 4th segment
      const yearlySegment = segments[3];
      const yearlyStyle = flattenStyle(yearlySegment.props.style);
      assert.equal(yearlyStyle.backgroundColor, COLORS.accentPurple);

      const yearlyText = getChildren(yearlySegment)[0];
      const yearlyTextStyle = flattenStyle(yearlyText.props.style);
      assert.equal(yearlyTextStyle.color, '#FFFFFF');
      assert.equal(yearlyTextStyle.fontWeight, '600');

      // 'monthly' is 2nd segment and should be unselected
      const monthlySegment = segments[1];
      const monthlyStyle = flattenStyle(monthlySegment.props.style);
      assert.equal(monthlyStyle.backgroundColor, 'transparent');

      const monthlyText = getChildren(monthlySegment)[0];
      const monthlyTextStyle = flattenStyle(monthlyText.props.style);
      assert.equal(monthlyTextStyle.color, COLORS.textSecondary);
      assert.equal(monthlyTextStyle.fontWeight, '500');
    });

    it('calls onChange with the corresponding cycle key when an option is pressed', () => {
      let selectedCycle = '';
      const onChange = (cycle: string) => {
        selectedCycle = cycle;
      };

      const element = BillingCyclePill({ value: 'monthly', onChange });
      const segments = getChildren(element);

      // Press quarterly (3rd segment)
      segments[2].props.onPress();
      assert.equal(selectedCycle, 'quarterly');

      // Press weekly (1st segment)
      segments[0].props.onPress();
      assert.equal(selectedCycle, 'weekly');
    });
  });

  describe('FAB', () => {
    it('renders 56x56 circular button positioned bottom-right with purple background', () => {
      const element = FAB({ onPress: () => {} });
      assert.equal(element.type, 'TouchableOpacity');

      const style = flattenStyle(element.props.style);
      assert.equal(style.position, 'absolute');
      assert.equal(style.bottom, 24);
      assert.equal(style.right, 24);
      assert.equal(style.width, 56);
      assert.equal(style.height, 56);
      assert.equal(style.borderRadius, 28);
      assert.equal(style.backgroundColor, COLORS.accentPurple);
      assert.equal(style.elevation, 8);
    });

    it('renders MaterialIcons add icon with size 28 and color #FFFFFF', () => {
      const element = FAB({ onPress: () => {} });
      const icon = getChildren(element)[0];
      assert.equal(icon.type, 'MaterialIcons');
      assert.equal(icon.props.name, 'add');
      assert.equal(icon.props.size, 28);
      assert.equal(icon.props.color, '#FFFFFF');
    });

    it('calls onPress when clicked', () => {
      let clicked = false;
      const element = FAB({
        onPress: () => {
          clicked = true;
        },
      });

      element.props.onPress();
      assert.equal(clicked, true);
    });
  });

  describe('AlertBanner', () => {
    it('renders renewal alert banner with COLORS.danger, semi-transparent bg, and refresh icon', () => {
      const element = AlertBanner({
        type: 'renewal',
        message: 'Subscription renewing tomorrow',
      });

      assert.equal(element.type, 'TouchableOpacity');
      const bannerStyle = flattenStyle(element.props.style);
      assert.equal(bannerStyle.borderLeftColor, COLORS.danger);
      assert.equal(bannerStyle.borderLeftWidth, 3);
      assert.equal(bannerStyle.backgroundColor, '#EF444422');

      const children = getChildren(element);
      assert.equal(children.length, 3);

      const [leftIcon, textEl, rightIcon] = children;
      assert.equal(leftIcon.type, 'MaterialIcons');
      assert.equal(leftIcon.props.name, 'refresh');
      assert.equal(leftIcon.props.color, COLORS.danger);

      assert.equal(textEl.type, 'Text');
      assert.equal(textEl.props.children, 'Subscription renewing tomorrow');

      assert.equal(rightIcon.type, 'MaterialIcons');
      assert.equal(rightIcon.props.name, 'chevron-right');
      assert.equal(rightIcon.props.color, COLORS.danger);
    });

    it('renders trial alert banner with COLORS.warning, semi-transparent bg, and warning icon', () => {
      const element = AlertBanner({
        type: 'trial',
        message: 'Trial expires in 3 days',
      });

      const bannerStyle = flattenStyle(element.props.style);
      assert.equal(bannerStyle.borderLeftColor, COLORS.warning);
      assert.equal(bannerStyle.borderLeftWidth, 3);
      assert.equal(bannerStyle.backgroundColor, '#F59E0B22');

      const children = getChildren(element);
      const [leftIcon, textEl, rightIcon] = children;
      assert.equal(leftIcon.type, 'MaterialIcons');
      assert.equal(leftIcon.props.name, 'warning');
      assert.equal(leftIcon.props.color, COLORS.warning);

      assert.equal(textEl.props.children, 'Trial expires in 3 days');
      assert.equal(rightIcon.props.name, 'chevron-right');
      assert.equal(rightIcon.props.color, COLORS.warning);
    });

    it('handles onPress callback', () => {
      let pressed = false;
      const element = AlertBanner({
        type: 'renewal',
        message: 'Renewing soon',
        onPress: () => {
          pressed = true;
        },
      });

      assert.equal(element.props.disabled, false);
      element.props.onPress();
      assert.equal(pressed, true);
    });

    it('disables touchable if onPress is omitted', () => {
      const element = AlertBanner({
        type: 'renewal',
        message: 'Renewing soon',
      });
      assert.equal(element.props.disabled, true);
    });
  });

  describe('StatCard', () => {
    it('renders financial metric card with label, value, and COLORS.bgCard', () => {
      const element = StatCard({
        label: 'Monthly Spend',
        value: '$49.99',
      });

      assert.equal(element.type, 'View');
      const cardStyle = flattenStyle(element.props.style);
      assert.equal(cardStyle.backgroundColor, COLORS.bgCard);
      assert.equal(cardStyle.borderRadius, 16);

      const children = getChildren(element);
      // label, value, and null for omitted subtitle
      const labelEl = children[0];
      assert.equal(labelEl.type, 'Text');
      assert.equal(labelEl.props.children, 'Monthly Spend');
      const labelStyle = flattenStyle(labelEl.props.style);
      assert.equal(labelStyle.fontSize, 11);
      assert.equal(labelStyle.color, COLORS.textSecondary);

      const valueEl = children[1];
      assert.equal(valueEl.type, 'Text');
      assert.equal(valueEl.props.children, '$49.99');
      const valueStyle = flattenStyle(valueEl.props.style);
      assert.equal(valueStyle.fontSize, 18);
      assert.equal(valueStyle.fontWeight, '700');
      assert.equal(valueStyle.color, COLORS.textPrimary);

      // subtitle should be null
      assert.equal(children[2], null);
    });

    it('renders subtitle when provided', () => {
      const element = StatCard({
        label: 'Active Subscriptions',
        value: '7',
        subtitle: '+2 from last month',
      });

      const children = getChildren(element);
      const subtitleEl = children[2];
      assert.notEqual(subtitleEl, null);
      assert.equal(subtitleEl.type, 'Text');
      assert.equal(subtitleEl.props.children, '+2 from last month');
      const subStyle = flattenStyle(subtitleEl.props.style);
      assert.equal(subStyle.fontSize, 11);
      assert.equal(subStyle.color, COLORS.textSecondary);
    });
  });
});
