<?php

namespace YNotRadio\Models\Concerns;

/**
 * Renders Payload Lexical "paypalButton" blocks (the PayPalButtonFeature
 * block) to the classic PayPal hosted-button <form> for the legacy PHP
 * front end. Mirrors the TypeScript editor side in
 * `payload/src/features/paypal-button/client.tsx`.
 *
 * Scope note: this only covers PayPal's classic hosted-button form (the
 * mechanism the `donate` custom-text page uses), not the JS SDK "Smart
 * Payment Buttons" flow used by dynamic-quantity checkouts — that needs its
 * own payments-integration decision, not a guess baked into this renderer.
 */
trait RendersPayPalButton
{
    /**
     * Render a paypalButton block's fields to HTML. Returns '' when the
     * block has no usable, safe hosted button id.
     *
     * @param array $fields The Lexical block node's `fields` payload.
     */
    protected function renderLexicalPayPalButtonBlock(array $fields): string
    {
        $hostedButtonId = is_string($fields['hostedButtonId'] ?? null) ? trim($fields['hostedButtonId']) : '';
        if ($hostedButtonId === '' || !preg_match('/^[A-Za-z0-9]+$/', $hostedButtonId)) {
            return '';
        }

        $buttonIdAttr = htmlspecialchars($hostedButtonId, ENT_QUOTES, 'UTF-8');
        $rawLabel = is_string($fields['buttonLabel'] ?? null) && $fields['buttonLabel'] !== ''
            ? $fields['buttonLabel']
            : 'Donate';
        $buttonLabelAttr = htmlspecialchars($rawLabel, ENT_QUOTES, 'UTF-8');

        $optionsHtml = $this->renderPayPalButtonOptions($fields, $rawLabel);

        return "\n<form class=\"paypal-button\" action=\"https://www.paypal.com/cgi-bin/webscr\" "
            . "method=\"post\" target=\"_top\">\n"
            . "  <input type=\"hidden\" name=\"cmd\" value=\"_s-xclick\" />\n"
            . "  <input type=\"hidden\" name=\"hosted_button_id\" value=\"{$buttonIdAttr}\" />\n"
            . $optionsHtml
            . "  <input type=\"image\" src=\"https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif\" "
            . "border=\"0\" name=\"submit\" alt=\"{$buttonLabelAttr}\" />\n"
            . "</form>\n";
    }

    private function renderPayPalButtonOptions(array $fields, string $rawLabel): string
    {
        $options = is_array($fields['options'] ?? null) ? $fields['options'] : [];
        if ($options === []) {
            return '';
        }

        $optionTags = '';
        foreach ($options as $option) {
            if (!is_array($option)) {
                continue;
            }
            $label = is_string($option['label'] ?? null) ? trim($option['label']) : '';
            if ($label === '') {
                continue;
            }
            $priceLabel = is_string($option['priceLabel'] ?? null) ? $option['priceLabel'] : '';
            $labelAttr = htmlspecialchars($label, ENT_QUOTES, 'UTF-8');
            $priceLabelText = htmlspecialchars($priceLabel, ENT_QUOTES, 'UTF-8');
            $optionTags .= "    <option value=\"{$labelAttr}\">{$labelAttr} {$priceLabelText}</option>\n";
        }

        if ($optionTags === '') {
            return '';
        }

        $onLabelAttr = htmlspecialchars("{$rawLabel} Options", ENT_QUOTES, 'UTF-8');
        return "  <input type=\"hidden\" name=\"on0\" value=\"{$onLabelAttr}\" />\n"
            . "  <select name=\"os0\">\n{$optionTags}  </select>\n";
    }
}
