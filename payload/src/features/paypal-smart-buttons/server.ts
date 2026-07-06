import type { FeatureProviderServer } from '@payloadcms/richtext-lexical';
import type { Block } from 'payload';
import { BlocksFeature } from '@payloadcms/richtext-lexical';

/**
 * A typed block for PayPal's JS SDK "Smart Payment Buttons" — the mechanism
 * `dollar-stroll-raffle-contest-1` uses for its dynamic quantity/price
 * checkout. Distinct from `PayPalButtonBlock` (classic hosted-button form):
 * this flow needs a live Client ID and client-side createOrder/capture
 * logic rather than a static form POST.
 *
 * The Client ID is intentionally NOT an editable field here — it comes from
 * `PAYPAL_SMART_BUTTON_CLIENT_ID` server-side (see `RendersPayPalSmartButtons.php`
 * and the frontend renderer), because whoever controls the Client ID
 * controls which PayPal account receives checkout funds. Editors configure
 * items/pricing/description only.
 */
export const PayPalSmartButtonsBlock: Block = {
  slug: 'paypalSmartButtons',
  labels: { singular: 'PayPal Smart Buttons', plural: 'PayPal Smart Buttons' },
  admin: { disableBlockName: true },
  fields: [
    {
      name: 'orderDescription',
      type: 'text',
      required: true,
      label: 'Order description',
      admin: {
        description:
          'Shown to the buyer and attached to the PayPal order, e.g. '
          + '"Select how many Raffle Entries you would like to purchase."',
      },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Item options',
      minRows: 1,
      admin: {
        description: 'Each row is one dropdown choice: a label and a fixed unit price.',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          admin: { description: 'Unit price in USD, e.g. 1.00' },
        },
      ],
    },
    {
      name: 'allowQuantity',
      type: 'checkbox',
      label: 'Allow buyer to choose a quantity',
      defaultValue: false,
    },
  ],
};

export const PayPalSmartButtonsFeature = (): FeatureProviderServer<any> => BlocksFeature({
  blocks: [PayPalSmartButtonsBlock],
});
