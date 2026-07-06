import { TextStateFeature } from '@payloadcms/richtext-lexical';
import type { FeatureProviderProviderServer } from '@payloadcms/richtext-lexical';

/**
 * 17 of the 35 legacy custom-text pages use `<font size="1|2">` purely for
 * cosmetic small print (donate's terms text, session-download captions).
 * There's no font-size feature in Payload's defaults, and arbitrary numeric
 * font sizing isn't semantic/accessible — so this uses Payload's
 * TextStateFeature (the same mechanism used for text/background color) to
 * expose one named "Small" state instead, styled via a CSS class
 * (`lexical-text--fontSize-small` — see src/style/typography.css) rather
 * than a stored pixel/em value. Read on the PHP side via the serialized
 * text node's `$.fontSize` state key (`$models/Concerns/ConvertsLexicalToHtml.php`).
 */
export const SMALL_TEXT_STATE_KEY = 'fontSize';
export const SMALL_TEXT_STATE_VALUE = 'small';

type TextSizeFeature = FeatureProviderProviderServer<any, any, any>;

export const SmallTextFeature = (): TextSizeFeature => TextStateFeature({
  state: {
    [SMALL_TEXT_STATE_KEY]: {
      [SMALL_TEXT_STATE_VALUE]: { label: 'Small', css: { 'font-size': '0.85em' } },
    },
  },
});
