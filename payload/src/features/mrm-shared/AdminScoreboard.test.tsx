import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminScoreboard } from './AdminScoreboard';

describe('AdminScoreboard', () => {
  it('renders band labels', () => {
    render(<AdminScoreboard band1Pct={60} band2Pct={40} band1Label="60%" band2Label="40%" />);
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('renders accessible label', () => {
    render(<AdminScoreboard band1Pct={55} band2Pct={45} band1Label="55%" band2Label="45%" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Score: 55% vs 45%');
  });

  it('sets bar widths based on percentages', () => {
    const { container } = render(
      <AdminScoreboard band1Pct={70} band2Pct={30} band1Label="70%" band2Label="30%" />,
    );
    const bar1 = container.querySelector('.admin-scoreboard__bar--band1') as HTMLElement;
    const bar2 = container.querySelector('.admin-scoreboard__bar--band2') as HTMLElement;
    expect(bar1.style.flexBasis).toBe('70%');
    expect(bar2.style.flexBasis).toBe('30%');
  });

  it('shows 50/50 split when both percentages are zero', () => {
    const { container } = render(
      <AdminScoreboard band1Pct={0} band2Pct={0} band1Label="" band2Label="" />,
    );
    const bar1 = container.querySelector('.admin-scoreboard__bar--band1') as HTMLElement;
    const bar2 = container.querySelector('.admin-scoreboard__bar--band2') as HTMLElement;
    expect(bar1.style.flexBasis).toBe('50%');
    expect(bar2.style.flexBasis).toBe('50%');
  });

  it('renders without labels', () => {
    const { container } = render(<AdminScoreboard band1Pct={50} band2Pct={50} />);
    expect(container.querySelector('.admin-scoreboard')).toBeInTheDocument();
  });
});
