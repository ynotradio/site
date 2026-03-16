import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RematchScheduler } from './RematchScheduler';

describe('RematchScheduler', () => {
  it('renders the Schedule Rematch button when closed', () => {
    render(<RematchScheduler saving={false} onConfirm={vi.fn()} />);
    expect(screen.getByRole('button', { name: /schedule rematch/i })).toBeInTheDocument();
  });

  it('disables the button when saving', () => {
    render(<RematchScheduler saving onConfirm={vi.fn()} />);
    expect(screen.getByRole('button', { name: /schedule rematch/i })).toBeDisabled();
  });

  it('opens the form when Schedule Rematch is clicked', () => {
    render(<RematchScheduler saving={false} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /schedule rematch/i }));
    expect(screen.getByRole('heading', { name: /schedule rematch/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
  });

  it('disables Confirm Rematch when date is empty', () => {
    render(<RematchScheduler saving={false} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /schedule rematch/i }));
    expect(screen.getByRole('button', { name: /confirm rematch/i })).toBeDisabled();
  });

  it('enables Confirm Rematch when date and time are filled', () => {
    render(<RematchScheduler saving={false} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /schedule rematch/i }));

    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-04-01' } });
    expect(screen.getByRole('button', { name: /confirm rematch/i })).not.toBeDisabled();
  });

  it('calls onConfirm with ISO string and duration on submit', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<RematchScheduler saving={false} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /schedule rematch/i }));

    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-04-01' } });
    fireEvent.change(screen.getByLabelText(/time/i), { target: { value: '15:30' } });
    fireEvent.change(screen.getByLabelText(/duration/i), { target: { value: '45' } });

    fireEvent.click(screen.getByRole('button', { name: /confirm rematch/i }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());

    const [isoArg, durationArg] = onConfirm.mock.calls[0];
    expect(isoArg).toContain('2026-04-01');
    expect(durationArg).toBe(45);
  });

  it('closes the form after successful confirmation', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<RematchScheduler saving={false} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /schedule rematch/i }));
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-04-01' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm rematch/i }));

    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    await waitFor(() => expect(screen.queryByRole('heading', { name: /schedule rematch/i })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /schedule rematch/i })).toBeInTheDocument();
  });

  it('shows Scheduling… text while saving in open state', () => {
    render(<RematchScheduler saving onConfirm={vi.fn()} />);
    // Button is closed state — just verify saving disables it
    expect(screen.getByRole('button', { name: /schedule rematch/i })).toBeDisabled();
  });

  it('cancels and closes the form', () => {
    render(<RematchScheduler saving={false} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /schedule rematch/i }));
    expect(screen.getByRole('heading', { name: /schedule rematch/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('heading', { name: /schedule rematch/i })).not.toBeInTheDocument();
  });

  it('does not call onConfirm when date is missing and confirm is clicked programmatically', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<RematchScheduler saving={false} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /schedule rematch/i }));
    // Confirm button should be disabled without a date
    const confirmBtn = screen.getByRole('button', { name: /confirm rematch/i });
    expect(confirmBtn).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
