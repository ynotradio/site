'use client';

import React from 'react';

export interface PayPalSmartButtonsItem {
  label: string;
  price: number;
}

export interface PayPalSmartButtonsComponentProps {
  orderDescription: string;
  items?: PayPalSmartButtonsItem[];
  allowQuantity?: boolean;
}

/**
 * Admin-editor preview only — the live PayPal JS SDK render happens on the
 * PHP front end via `RendersPayPalSmartButtons.php`, which injects the real
 * Client ID server-side. This component never sees or needs a Client ID.
 */
export const PayPalSmartButtonsComponent: React.FC<PayPalSmartButtonsComponentProps> = ({
  orderDescription,
  items = [],
  allowQuantity = false,
}) => (
  <div className="paypal-smart-buttons-preview">
    <p>{orderDescription}</p>
    {items.length > 0 && (
      <select disabled>
        {items.map((item) => (
          <option key={item.label}>
            {item.label} - {item.price.toFixed(2)} USD
          </option>
        ))}
      </select>
    )}
    {allowQuantity && (
      <span className="paypal-smart-buttons-preview__qty"> (quantity selectable)</span>
    )}
    <div className="paypal-smart-buttons-preview__button" aria-hidden="true">
      PayPal Smart Buttons (rendered live on the site)
    </div>
  </div>
);
