import { describe, it, expect, vi } from 'vitest';
import { PayPalButtonBlock, PayPalButtonFeature } from './server';

vi.mock('@payloadcms/richtext-lexical', () => ({
  BlocksFeature: vi.fn((config) => ({ _type: 'blocks', ...config })),
}));

describe('PayPalButtonBlock', () => {
  it('has slug paypalButton', () => {
    expect(PayPalButtonBlock.slug).toBe('paypalButton');
  });

  it('requires a hostedButtonId field', () => {
    const field = PayPalButtonBlock.fields.find((f: any) => f.name === 'hostedButtonId') as any;
    expect(field.required).toBe(true);
    expect(field.type).toBe('text');
  });

  it('has an options array field for priced dropdowns', () => {
    const field = PayPalButtonBlock.fields.find((f: any) => f.name === 'options') as any;
    expect(field.type).toBe('array');
    const subfieldNames = field.fields.map((f: any) => f.name);
    expect(subfieldNames).toEqual(['label', 'priceLabel']);
  });
});

describe('PayPalButtonFeature', () => {
  it('registers PayPalButtonBlock via BlocksFeature', () => {
    const feature = PayPalButtonFeature() as any;
    expect(feature._type).toBe('blocks');
    expect(feature.blocks).toEqual([PayPalButtonBlock]);
  });
});
