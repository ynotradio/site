import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimePickerField } from './TimePickerField';

vi.mock('@payloadcms/ui', () => ({
  useField: vi.fn(),
  FieldLabel: ({ label, required }: { label?: string; required?: boolean }) => (
    <label>
      {label}
      {required && <span>*</span>}
    </label>
  ),
}));

const { useField } = await import('@payloadcms/ui');

const mockField = { type: 'text' as const, label: 'Start time', required: true, name: 'startTime' };

describe('TimePickerField', () => {
  const mockSetValue = vi.fn();

  const setup = (value: string) => {
    vi.mocked(useField).mockReturnValue({ value, setValue: mockSetValue } as any);
    render(<TimePickerField path="startTime" field={mockField as any} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Display ────────────────────────────────────────────────────────────────

  it('shows 9:00am for stored 09:00', () => {
    setup('09:00');
    expect(screen.getByRole('textbox')).toHaveValue('9:00am');
  });

  it('shows 2:30pm for stored 14:30', () => {
    setup('14:30');
    expect(screen.getByRole('textbox')).toHaveValue('2:30pm');
  });

  it('shows 12:00am for stored 00:00 (midnight)', () => {
    setup('00:00');
    expect(screen.getByRole('textbox')).toHaveValue('12:00am');
  });

  it('shows 12:00pm for stored 12:00 (noon)', () => {
    setup('12:00');
    expect(screen.getByRole('textbox')).toHaveValue('12:00pm');
  });

  it('shows empty string for no value', () => {
    setup('');
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  // ── Dropdown ───────────────────────────────────────────────────────────────

  it('opens dropdown on focus and shows time options', () => {
    setup('');
    fireEvent.focus(screen.getByRole('textbox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('12:00am')).toBeInTheDocument();
  });

  it('filters options as user types', () => {
    setup('');
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '9:' } });
    expect(screen.getByText('9:00am')).toBeInTheDocument();
    expect(screen.queryByText('10:00am')).not.toBeInTheDocument();
  });

  it('shows all 96 slots when input is empty and open', () => {
    setup('');
    fireEvent.focus(screen.getByRole('textbox'));
    expect(screen.getAllByRole('option')).toHaveLength(96);
  });

  // ── Selection ─────────────────────────────────────────────────────────────

  it('calls setValue with 24h value when an option is clicked', () => {
    setup('');
    fireEvent.focus(screen.getByRole('textbox'));
    fireEvent.mouseDown(screen.getByText('9:00am'));
    expect(mockSetValue).toHaveBeenCalledWith('09:00');
  });

  it('calls setValue with 24h value for a PM slot', () => {
    setup('');
    fireEvent.focus(screen.getByRole('textbox'));
    fireEvent.mouseDown(screen.getByText('2:30pm'));
    expect(mockSetValue).toHaveBeenCalledWith('14:30');
  });

  // ── Keyboard ──────────────────────────────────────────────────────────────

  it('commits typed value on Enter', () => {
    setup('');
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '10:30am' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSetValue).toHaveBeenCalledWith('10:30');
  });

  it('commits typed 24h value without am/pm suffix', () => {
    setup('');
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '14:00' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSetValue).toHaveBeenCalledWith('14:00');
  });

  it('closes dropdown on Escape', async () => {
    setup('');
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });
});
