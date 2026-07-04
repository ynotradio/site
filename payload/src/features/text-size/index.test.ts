import { describe, it, expect, vi } from 'vitest';
import { SmallTextFeature, SMALL_TEXT_STATE_KEY, SMALL_TEXT_STATE_VALUE } from './index';

vi.mock('@payloadcms/richtext-lexical', () => ({
  TextStateFeature: vi.fn((config) => ({ _type: 'textState', ...config })),
}));

describe('SmallTextFeature', () => {
  it('registers a single "small" fontSize state', () => {
    const feature = SmallTextFeature() as any;

    expect(SMALL_TEXT_STATE_KEY).toBe('fontSize');
    expect(SMALL_TEXT_STATE_VALUE).toBe('small');
    expect(feature.state.fontSize.small).toEqual({
      label: 'Small',
      css: { 'font-size': '0.85em' },
    });
  });
});
