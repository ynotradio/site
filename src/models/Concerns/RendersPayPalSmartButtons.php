<?php

namespace YNotRadio\Models\Concerns;

/**
 * Renders Payload Lexical "paypalSmartButtons" blocks to PayPal's JS SDK
 * "Smart Payment Buttons" markup — the mechanism
 * `dollar-stroll-raffle-contest-1` uses for dynamic quantity/price checkout.
 * Mirrors the TypeScript editor side in
 * `payload/src/features/paypal-smart-buttons/client.tsx`.
 *
 * The Client ID is read from `PAYPAL_SMART_BUTTON_CLIENT_ID` (env), never
 * from the block's own fields — editors configure items/pricing/description
 * only, so no editor role can redirect checkout funds to a different
 * PayPal account.
 */
trait RendersPayPalSmartButtons
{
    /**
     * Render a paypalSmartButtons block's fields to HTML + inline script.
     * Returns '' when there's no configured Client ID or no usable items.
     *
     * @param array $fields The Lexical block node's `fields` payload.
     */
    protected function renderLexicalPayPalSmartButtonsBlock(array $fields): string
    {
        $clientId = getenv('PAYPAL_SMART_BUTTON_CLIENT_ID') ?: '';
        if ($clientId === '') {
            return '';
        }

        $items = $this->normalizePayPalSmartButtonsItems($fields);
        if ($items === []) {
            return '';
        }

        $orderDescription = is_string($fields['orderDescription'] ?? null)
            ? trim($fields['orderDescription'])
            : '';
        if ($orderDescription === '') {
            return '';
        }

        $allowQuantity = (bool) ($fields['allowQuantity'] ?? false);
        $containerId = 'paypal-smart-buttons-' . substr(md5(json_encode($fields)), 0, 8);

        $clientIdAttr = htmlspecialchars($clientId, ENT_QUOTES, 'UTF-8');
        $orderDescriptionJs = json_encode($orderDescription);
        $itemOptionsHtml = $this->renderPayPalSmartButtonsItemOptions($items);

        return "\n<div id=\"{$containerId}\" class=\"paypal-smart-buttons\">\n"
            . "  <p>" . htmlspecialchars($orderDescription, ENT_QUOTES, 'UTF-8') . "</p>\n"
            . "  <select class=\"paypal-smart-buttons__item-options\">{$itemOptionsHtml}</select>\n"
            . $this->renderPayPalSmartButtonsQuantitySelect($allowQuantity)
            . "  <div class=\"paypal-smart-buttons__button-container\"></div>\n"
            . "</div>\n"
            . "<script src=\"https://www.paypal.com/sdk/js?client-id={$clientIdAttr}&enable-funding=venmo&currency=USD\" "
            . "data-sdk-integration-source=\"button-factory\"></script>\n"
            . "<script>\n"
            . "(function() {\n"
            . "  var container = document.getElementById('{$containerId}');\n"
            . "  var itemOptions = container.querySelector('.paypal-smart-buttons__item-options');\n"
            . "  var quantitySelect = container.querySelector('.paypal-smart-buttons__quantity-select');\n"
            . "  var orderDescription = {$orderDescriptionJs};\n"
            . "  paypal.Buttons({\n"
            . "    style: { shape: 'pill', color: 'gold', layout: 'vertical', label: 'paypal' },\n"
            . "    createOrder: function(data, actions) {\n"
            . "      var selected = itemOptions.options[itemOptions.selectedIndex];\n"
            . "      var unitPrice = parseFloat(selected.getAttribute('data-price'));\n"
            . "      var quantity = quantitySelect\n"
            . "        ? parseInt(quantitySelect.options[quantitySelect.selectedIndex].value, 10)\n"
            . "        : 1;\n"
            . "      var itemTotal = Math.round(unitPrice * quantity * 100) / 100;\n"
            . "      return actions.order.create({\n"
            . "        purchase_units: [{\n"
            . "          description: orderDescription,\n"
            . "          amount: {\n"
            . "            currency_code: 'USD',\n"
            . "            value: itemTotal,\n"
            . "            breakdown: {\n"
            . "              item_total: { currency_code: 'USD', value: itemTotal },\n"
            . "            },\n"
            . "          },\n"
            . "          items: [{\n"
            . "            name: selected.value,\n"
            . "            unit_amount: { currency_code: 'USD', value: unitPrice },\n"
            . "            quantity: quantity,\n"
            . "          }],\n"
            . "        }],\n"
            . "      });\n"
            . "    },\n"
            . "    onApprove: function(data, actions) {\n"
            . "      return actions.order.capture().then(function() {\n"
            . "        container.querySelector('.paypal-smart-buttons__button-container').innerHTML = "
            . "'<h3>Thank you for your payment!</h3>';\n"
            . "      });\n"
            . "    },\n"
            . "    onError: function(err) { console.log(err); },\n"
            . "  }).render(container.querySelector('.paypal-smart-buttons__button-container'));\n"
            . "})();\n"
            . "</script>\n";
    }

    /**
     * @return array<int, array{label: string, price: float}>
     */
    private function normalizePayPalSmartButtonsItems(array $fields): array
    {
        $rawItems = is_array($fields['items'] ?? null) ? $fields['items'] : [];
        $items = [];
        foreach ($rawItems as $item) {
            if (!is_array($item)) {
                continue;
            }
            $label = is_string($item['label'] ?? null) ? trim($item['label']) : '';
            $price = is_numeric($item['price'] ?? null) ? (float) $item['price'] : null;
            if ($label === '' || $price === null || $price < 0) {
                continue;
            }
            $items[] = ['label' => $label, 'price' => $price];
        }
        return $items;
    }

    /**
     * @param array<int, array{label: string, price: float}> $items
     */
    private function renderPayPalSmartButtonsItemOptions(array $items): string
    {
        $optionTags = '';
        foreach ($items as $item) {
            $labelAttr = htmlspecialchars($item['label'], ENT_QUOTES, 'UTF-8');
            $priceAttr = htmlspecialchars(number_format($item['price'], 2, '.', ''), ENT_QUOTES, 'UTF-8');
            $optionTags .= "<option value=\"{$labelAttr}\" data-price=\"{$priceAttr}\">"
                . "{$labelAttr} - {$priceAttr} USD</option>";
        }
        return $optionTags;
    }

    private function renderPayPalSmartButtonsQuantitySelect(bool $allowQuantity): string
    {
        if (!$allowQuantity) {
            return '';
        }

        $optionTags = '';
        for ($i = 1; $i <= 10; $i++) {
            $optionTags .= "<option value=\"{$i}\">{$i}</option>";
        }
        return "  <select class=\"paypal-smart-buttons__quantity-select\">{$optionTags}</select>\n";
    }
}
