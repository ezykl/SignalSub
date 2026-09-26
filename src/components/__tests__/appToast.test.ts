import './setupComponentMocks';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { AppToast } from '../AppToast';

describe('AppToast Component', () => {
  it('renders null when visible is false', () => {
    const el = AppToast({
      visible: false,
      title: 'Success',
      message: 'Changes saved',
      onDismiss: () => {},
    });
    assert.equal(el, null);
  });

  it('renders correctly when visible is true', () => {
    const el = AppToast({
      visible: true,
      title: 'Profile Saved',
      message: 'Your profile preferences have been updated.',
      type: 'success',
      onDismiss: () => {},
      testID: 'profile-save-toast',
    });
    assert.ok(el);
    assert.equal(el?.props.testID, 'profile-save-toast');
  });

  it('renders error type with appropriate styling and icon', () => {
    const el = AppToast({
      visible: true,
      title: 'Save Failed',
      message: 'Could not save profile changes.',
      type: 'error',
      onDismiss: () => {},
      testID: 'error-toast',
    });
    assert.ok(el);
    assert.equal(el?.props.testID, 'error-toast');
  });

  it('renders info type when specified', () => {
    const el = AppToast({
      visible: true,
      title: 'Note',
      message: 'Default payment method set.',
      type: 'info',
      onDismiss: () => {},
      testID: 'info-toast',
    });
    assert.ok(el);
    assert.equal(el?.props.testID, 'info-toast');
  });
});
