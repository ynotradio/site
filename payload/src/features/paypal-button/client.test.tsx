// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PayPalButtonComponent } from './client';

describe('PayPalButtonComponent', () => {
  it('renders the classic hosted-button form', () => {
    const { container } = render(<PayPalButtonComponent hostedButtonId="5EHFMBVNYRVA8" />);

    const form = container.querySelector('form.paypal-button') as HTMLFormElement;
    expect(form).toBeInTheDocument();
    expect(form.action).toBe('https://www.paypal.com/cgi-bin/webscr');

    const hiddenButtonId = container.querySelector(
      'input[name="hosted_button_id"]',
    ) as HTMLInputElement;
    expect(hiddenButtonId.value).toBe('5EHFMBVNYRVA8');
  });

  it('renders a price-options dropdown when options are provided', () => {
    const { container } = render(
      <PayPalButtonComponent
        hostedButtonId="5EHFMBVNYRVA8"
        buttonLabel="Donation Options"
        options={[
          { label: 'Album Download', priceLabel: '$15.00 USD' },
          { label: 'T-Shirt', priceLabel: '$35.00 USD' },
        ]}
      />,
    );

    const select = container.querySelector('select[name="os0"]');
    expect(select?.children).toHaveLength(2);
    expect(select?.children[0].textContent).toContain('Album Download');
    expect(select?.children[1].textContent).toContain('$35.00 USD');
  });

  it('does not render a dropdown when no options are provided', () => {
    const { container } = render(<PayPalButtonComponent hostedButtonId="5EHFMBVNYRVA8" />);
    expect(container.querySelector('select')).not.toBeInTheDocument();
  });

  it('renders nothing for a missing hostedButtonId', () => {
    const { container } = render(<PayPalButtonComponent hostedButtonId="" />);
    expect(container.querySelector('form')).not.toBeInTheDocument();
  });

  it('renders nothing for a hostedButtonId containing unsafe characters', () => {
    const { container } = render(
      <PayPalButtonComponent hostedButtonId="<script>alert(1)</script>" />,
    );
    expect(container.querySelector('form')).not.toBeInTheDocument();
  });
});
