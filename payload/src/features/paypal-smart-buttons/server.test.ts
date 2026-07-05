import { describe, it, expect, vi } from 'vitest';
import { PayPalSmartButtonsBlock, PayPalSmartButtonsFeature } from './server';

vi.mock('@payloadcms/richtext-lexical', () => ({
  BlocksFeature: vi.fn((config) => ({ _type: 'blocks', ...config })),
}));

describe('PayPalSmartButtonsBlock', () => {
  it('has slug paypalSmartButtons', () => {
    expect(PayPalSmartButtonsBlock.slug).toBe('paypalSmartButtons');
  });

  it('requires an orderDescription field', () => {
    const field = PayPalSmartButtonsBlock.fields.find(
      (f: any) => f.name === 'orderDescription',
    ) as any;
    expect(field.required).toBe(true);
    expect(field.type).toBe('text');
  });

  it('has an items array field with label and price subfields', () => {
    const field = PayPalSmartButtonsBlock.fields.find((f: any) => f.name === 'items') as any;
    expect(field.type).toBe('array');
    expect(field.minRows).toBe(1);
    const subfieldNames = field.fields.map((f: any) => f.name);
    expect(subfieldNames).toEqual(['label', 'price']);
    const priceField = field.fields.find((f: any) => f.name === 'price');
    expect(priceField.type).toBe('number');
    expect(priceField.min).toBe(0);
  });

  it('has an allowQuantity checkbox defaulting to false', () => {
    const field = PayPalSmartButtonsBlock.fields.find(
      (f: any) => f.name === 'allowQuantity',
    ) as any;
    expect(field.type).toBe('checkbox');
    expect(field.defaultValue).toBe(false);
  });

  it('does not expose a client ID field', () => {
    const field = PayPalSmartButtonsBlock.fields.find((f: any) => f.name.toLowerCase().includes('client'));
    expect(field).toBeUndefined();
  });
});

describe('PayPalSmartButtonsFeature', () => {
  it('registers PayPalSmartButtonsBlock via BlocksFeature', () => {
    const feature = PayPalSmartButtonsFeature() as any;
    expect(feature._type).toBe('blocks');
    expect(feature.blocks).toEqual([PayPalSmartButtonsBlock]);
  });
});
