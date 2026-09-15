import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FONT_FAMILY, TYPOGRAPHY } from '../typography';

describe('Typography Tokens', () => {
  describe('FONT_FAMILY', () => {
    it('defines Montserrat as the primary font family with key weights', () => {
      assert.ok(FONT_FAMILY.primary);
      assert.equal(FONT_FAMILY.primary.regular, 'Montserrat_400Regular');
      assert.equal(FONT_FAMILY.primary.medium, 'Montserrat_500Medium');
      assert.equal(FONT_FAMILY.primary.semiBold, 'Montserrat_600SemiBold');
      assert.equal(FONT_FAMILY.primary.bold, 'Montserrat_700Bold');
      assert.equal(FONT_FAMILY.primary.extraBold, 'Montserrat_800ExtraBold');
    });

    it('defines Roboto as the secondary font family with key weights', () => {
      assert.ok(FONT_FAMILY.secondary);
      assert.equal(FONT_FAMILY.secondary.light, 'Roboto_300Light');
      assert.equal(FONT_FAMILY.secondary.regular, 'Roboto_400Regular');
      assert.equal(FONT_FAMILY.secondary.medium, 'Roboto_500Medium');
      assert.equal(FONT_FAMILY.secondary.bold, 'Roboto_700Bold');
    });

    it('defines semantic font shortcuts', () => {
      assert.equal(FONT_FAMILY.heading, FONT_FAMILY.primary.bold);
      assert.equal(FONT_FAMILY.subheading, FONT_FAMILY.primary.semiBold);
      assert.equal(FONT_FAMILY.body, FONT_FAMILY.secondary.regular);
      assert.equal(FONT_FAMILY.caption, FONT_FAMILY.secondary.regular);
      assert.equal(FONT_FAMILY.button, FONT_FAMILY.primary.semiBold);
      assert.equal(FONT_FAMILY.metric, FONT_FAMILY.primary.bold);
    });
  });

  describe('TYPOGRAPHY scale presets', () => {
    it('provides h1, h2, h3 presets using Montserrat', () => {
      assert.equal(TYPOGRAPHY.h1.fontFamily, FONT_FAMILY.primary.bold);
      assert.equal(TYPOGRAPHY.h1.fontSize, 28);
      assert.equal(TYPOGRAPHY.h2.fontFamily, FONT_FAMILY.primary.bold);
      assert.equal(TYPOGRAPHY.h2.fontSize, 22);
      assert.equal(TYPOGRAPHY.h3.fontFamily, FONT_FAMILY.primary.semiBold);
      assert.equal(TYPOGRAPHY.h3.fontSize, 18);
    });

    it('provides body and caption presets using Roboto', () => {
      assert.equal(TYPOGRAPHY.body.fontFamily, FONT_FAMILY.secondary.regular);
      assert.equal(TYPOGRAPHY.body.fontSize, 15);
      assert.equal(TYPOGRAPHY.bodyMedium.fontFamily, FONT_FAMILY.secondary.medium);
      assert.equal(TYPOGRAPHY.caption.fontFamily, FONT_FAMILY.secondary.regular);
      assert.equal(TYPOGRAPHY.caption.fontSize, 12);
    });

    it('provides button and metric presets using Montserrat', () => {
      assert.equal(TYPOGRAPHY.button.fontFamily, FONT_FAMILY.primary.semiBold);
      assert.equal(TYPOGRAPHY.metric.fontFamily, FONT_FAMILY.primary.bold);
    });
  });
});
