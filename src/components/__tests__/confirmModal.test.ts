import './setupComponentMocks';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { ConfirmModal } from '../ConfirmModal';

describe('ConfirmModal Component', () => {
  it('renders modal when visible is true', () => {
    const el = ConfirmModal({
      visible: true,
      title: 'Unsaved Changes',
      message: 'You have unsaved changes in your profile.',
      confirmText: 'Discard & Leave',
      cancelText: 'Keep Editing',
      type: 'warning',
      onConfirm: () => {},
      onCancel: () => {},
      testID: 'unsaved-changes-modal',
    });
    assert.ok(el);
    assert.equal(el?.props.testID, 'unsaved-changes-modal');
  });

  it('renders danger type properly', () => {
    const el = ConfirmModal({
      visible: true,
      title: 'Delete Item',
      message: 'Are you sure?',
      type: 'danger',
      onConfirm: () => {},
      onCancel: () => {},
      testID: 'delete-modal',
    });
    assert.ok(el);
    assert.equal(el?.props.testID, 'delete-modal');
  });
});
