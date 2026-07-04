'use client';

import React from 'react';

export interface PayPalButtonOption {
  label: string;
  priceLabel: string;
}

export interface PayPalButtonComponentProps {
  hostedButtonId: string;
  buttonLabel?: string;
  options?: PayPalButtonOption[];
}

export const PayPalButtonComponent: React.FC<PayPalButtonComponentProps> = ({
  hostedButtonId,
  buttonLabel = 'Donate',
  options = [],
}) => {
  if (!hostedButtonId || !/^[A-Za-z0-9]+$/.test(hostedButtonId)) {
    return null;
  }

  return (
    <form
      className="paypal-button"
      action="https://www.paypal.com/cgi-bin/webscr"
      method="post"
      target="_top"
    >
      <input type="hidden" name="cmd" value="_s-xclick" />
      <input type="hidden" name="hosted_button_id" value={hostedButtonId} />
      {options.length > 0 && (
        <>
          <input type="hidden" name="on0" value={`${buttonLabel} Options`} />
          <select name="os0">
            {options.map((option) => (
              <option key={option.label} value={option.label}>
                {option.label} {option.priceLabel}
              </option>
            ))}
          </select>
        </>
      )}
      <input
        type="image"
        src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
        border={0}
        name="submit"
        alt={buttonLabel}
      />
    </form>
  );
};
