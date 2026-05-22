import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimePickerField } from './TimePickerField';

vi.mock('@payloadcms/ui', () => ({
  useField: vi.fn(),
}));

const { useField } = await import('@payloadcms/ui');

describe('TimePickerField', () => {
  const mockSetValue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (value: string) => {
    vi.mocked(useField).mockReturnValue({ value, setValue: mockSetValue } as any);
    render(<TimePickerField path="startTime" />);
  };

  it('renders hour, minute, and AM/PM selects', () => {
    setup('09:00');
    expect(screen.getByLabelText('Hour')).toBeInTheDocument();
    expect(screen.getByLabelText('Minute')).toBeInTheDocument();
    expect(screen.getByLabelText('AM or PM')).toBeInTheDocument();
  });

  it('shows 9 AM for 09:00', () => {
    setup('09:00');
    expect(screen.getByLabelText<HTMLSelectElement>('Hour').value).toBe('9');
    expect(screen.getByLabelText<HTMLSelectElement>('Minute').value).toBe('0');
    expect(screen.getByLabelText<HTMLSelectElement>('AM or PM').value).toBe('AM');
  });

  it('shows 2 PM for 14:30', () => {
    setup('14:30');
    expect(screen.getByLabelText<HTMLSelectElement>('Hour').value).toBe('2');
    expect(screen.getByLabelText<HTMLSelectElement>('Minute').value).toBe('30');
    expect(screen.getByLabelText<HTMLSelectElement>('AM or PM').value).toBe('PM');
  });

  it('shows 12 AM for 00:00 (midnight)', () => {
    setup('00:00');
    expect(screen.getByLabelText<HTMLSelectElement>('Hour').value).toBe('12');
    expect(screen.getByLabelText<HTMLSelectElement>('AM or PM').value).toBe('AM');
  });

  it('shows 12 PM for 12:00 (noon)', () => {
    setup('12:00');
    expect(screen.getByLabelText<HTMLSelectElement>('Hour').value).toBe('12');
    expect(screen.getByLabelText<HTMLSelectElement>('AM or PM').value).toBe('PM');
  });

  it('calls setValue with correct 24h value when hour changes', () => {
    setup('09:00');
    fireEvent.change(screen.getByLabelText('Hour'), { target: { value: '10' } });
    expect(mockSetValue).toHaveBeenCalledWith('10:00');
  });

  it('calls setValue with correct 24h value when switching to PM', () => {
    setup('09:00');
    fireEvent.change(screen.getByLabelText('AM or PM'), { target: { value: 'PM' } });
    expect(mockSetValue).toHaveBeenCalledWith('21:00');
  });

  it('calls setValue with correct 24h value when minute changes', () => {
    setup('14:00');
    fireEvent.change(screen.getByLabelText('Minute'), { target: { value: '30' } });
    expect(mockSetValue).toHaveBeenCalledWith('14:30');
  });

  it('handles empty/undefined value gracefully', () => {
    setup('');
    expect(screen.getByLabelText<HTMLSelectElement>('Hour').value).toBe('12');
    expect(screen.getByLabelText<HTMLSelectElement>('AM or PM').value).toBe('AM');
  });
});
