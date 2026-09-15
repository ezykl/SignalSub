import './setupComponentMocks';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { AppIcon } from '../AppIcon';
import { getAppIcon, APP_ICONS } from '../../constants/appIcons';

describe('AppIcon Component and Registry', () => {
  describe('getAppIcon registry', () => {
    it('returns icon data for bell, house, and layers', () => {
      const bell = getAppIcon('bell');
      assert.ok(bell);
      assert.equal(bell?.viewBox, '0 0 24 24');
      assert.ok(bell?.paths.length > 0);

      const house = getAppIcon('house');
      assert.ok(house);
      assert.equal(house?.viewBox, '0 0 24 24');
      assert.ok(house?.paths.length > 0);

      const layers = getAppIcon('layers');
      assert.ok(layers);
      assert.equal(layers?.viewBox, '0 0 24 24');
      assert.ok(layers?.paths.length > 0);
    });

    it('resolves aliases correctly (home, subscriptions, notification)', () => {
      assert.deepEqual(getAppIcon('home'), getAppIcon('house'));
      assert.deepEqual(getAppIcon('subscriptions'), getAppIcon('layers'));
      assert.deepEqual(getAppIcon('notification'), getAppIcon('bell'));
    });

    it('handles case insensitivity and whitespace', () => {
      assert.ok(getAppIcon(' BELL '));
      assert.ok(getAppIcon('House'));
      assert.ok(getAppIcon('LAYERS'));
    });

    it('returns undefined for non-existent icons or empty name', () => {
      assert.equal(getAppIcon(''), undefined);
      assert.equal(getAppIcon(undefined), undefined);
      assert.equal(getAppIcon('non_existent_icon_123'), undefined);
    });
  });

  describe('AppIcon rendering', () => {
    it('renders null for unknown icon name', () => {
      const el = AppIcon({ name: 'unknown_icon' as any });
      assert.equal(el, null);
    });

    it('renders Svg with correct props for bell icon', () => {
      const el = AppIcon({
        name: 'bell',
        size: 22,
        color: '#A855F7',
        testID: 'bell-icon',
      });
      assert.ok(el);
      assert.equal(el?.props.testID, 'bell-icon');
      const svgChild = el?.props.children;
      assert.ok(svgChild);
      assert.equal(svgChild.props.width, 22);
      assert.equal(svgChild.props.height, 22);
      assert.equal(svgChild.props.viewBox, '0 0 24 24');
    });

    it('renders Svg with default size and color for house icon', () => {
      const el = AppIcon({ name: 'house' });
      assert.ok(el);
      const svgChild = el?.props.children;
      assert.ok(svgChild);
      assert.equal(svgChild.props.width, 24);
      assert.equal(svgChild.props.height, 24);
    });

    it('renders Svg for layers icon', () => {
      const el = AppIcon({ name: 'layers', size: 28, color: '#FFFFFF' });
      assert.ok(el);
      const svgChild = el?.props.children;
      assert.ok(svgChild);
      assert.equal(svgChild.props.width, 28);
      assert.equal(svgChild.props.height, 28);
    });
  });
});
