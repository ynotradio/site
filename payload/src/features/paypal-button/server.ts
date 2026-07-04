import type { FeatureProviderServer } from '@payloadcms/richtext-lexical';
import type { Block } from 'payload';
import { BlocksFeature } from '@payloadcms/richtext-lexical';

/**
 * A typed block for the classic PayPal "hosted button" embed (Button
 * Factory / `cgi-bin/webscr` form) — the mechanism the legacy `donate`
 * custom-text page uses. Editors configure a Button ID and optional priced
 * options instead of hand-pasting the PayPal-generated <form>/<script>
 * markup, which can't be allowed as freeform Lexical HTML (XSS/CSP risk).
 *
 * Scope note: this does not cover PayPal's newer JS SDK "Smart Payment
 * Buttons" (used by dollar-stroll-raffle-contest-1's dynamic quantity/price
 * checkout) — that flow's createOrder/capture logic is a payments-integration
 * decision that needs product review, not something to guess at here.
 */
export const PayPalButtonBlock: Block = {
  slug: 'paypalButton',
  labels: { singular: 'PayPal Button', plural: 'PayPal Buttons' },
  admin: { disableBlockName: true },
  fields: [
    {
      name: 'hostedButtonId',
      type: 'text',
      required: true,
      label: 'Hosted Button ID',
      admin: {
        description:
          'The Button ID from PayPal Button Factory / your PayPal business account '
          + '(letters and numbers only — not a URL).',
      },
    },
    {
      name: 'buttonLabel',
      type: 'text',
      label: 'Button label',
      defaultValue: 'Donate',
    },
    {
      name: 'options',
      type: 'array',
      label: 'Price options (optional)',
      admin: {
        description:
          'Leave empty for a single fixed-amount button. Add rows for a dropdown of priced '
          + 'options, matching PayPal Button Factory\'s "on0/os0" option-select pattern.',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'priceLabel',
          type: 'text',
          required: true,
          admin: { description: 'Shown next to the label, e.g. "$15.00 USD"' },
        },
      ],
    },
  ],
};

export const PayPalButtonFeature = (): FeatureProviderServer<any> => BlocksFeature({
  blocks: [PayPalButtonBlock],
});
