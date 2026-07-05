// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PayPalSmartButtonsComponent } from './client';

describe('PayPalSmartButtonsComponent', () => {
  it('renders the order description', () => {
    const { getByText } = render(
      <PayPalSmartButtonsComponent orderDescription="Select how many entries you want." />,
    );
    expect(getByText('Select how many entries you want.')).toBeInTheDocument();
  });

  it('renders a disabled item-options dropdown when items are provided', () => {
    const { container } = render(
      <PayPalSmartButtonsComponent
        orderDescription="Pick an option"
        items={[
          { label: '1 Raffle Entry', price: 1 },
          { label: '5 Raffle Entries', price: 5 },
        ]}
      />,
    );
    const select = container.querySelector('select');
    expect(select).toBeDisabled();
    expect(select?.children).toHaveLength(2);
    expect(select?.children[1].textContent).toContain('5 Raffle Entries');
  });

  it('does not render a dropdown when no items are provided', () => {
    const { container } = render(<PayPalSmartButtonsComponent orderDescription="No items" />);
    expect(container.querySelector('select')).not.toBeInTheDocument();
  });

  it('shows a quantity note when allowQuantity is true', () => {
    const { getByText } = render(
      <PayPalSmartButtonsComponent orderDescription="desc" allowQuantity />,
    );
    expect(getByText(/quantity selectable/)).toBeInTheDocument();
  });
});
