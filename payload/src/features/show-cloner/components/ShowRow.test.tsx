// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ShowRow } from './ShowRow';
import type { Show } from '../types';
import { describe, it, expect } from 'vitest';

describe('ShowRow', () => {
  const mockShow: Show = {
    id: '1',
    name: 'Test Show',
    hostName: 'Test Host',
    startTime: '14:00:00',
    endTime: '16:00:00',
  };

  describe('Display Name', () => {
    it('should display name with host when both are present', () => {
      render(<ShowRow show={mockShow} />);
      expect(screen.getByText('Test Show w/ Test Host')).toBeInTheDocument();
    });

    it('should display only host name when show name is missing', () => {
      const showWithoutName: Show = {
        ...mockShow,
        name: '',
      };
      render(<ShowRow show={showWithoutName} />);
      expect(screen.getByText('Test Host')).toBeInTheDocument();
    });

    it('should display only show name when host name is missing', () => {
      const showWithoutHost: Show = {
        ...mockShow,
        hostName: '',
      };
      render(<ShowRow show={showWithoutHost} />);
      expect(screen.getByText('Test Show')).toBeInTheDocument();
    });

    it('should display "Untitled Show" when both name and host are missing', () => {
      const showWithoutNameOrHost: Show = {
        ...mockShow,
        name: '',
        hostName: '',
      };
      render(<ShowRow show={showWithoutNameOrHost} />);
      expect(screen.getByText('Untitled Show')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('should format afternoon times correctly', () => {
      render(<ShowRow show={mockShow} />);
      expect(screen.getByText('2:00 PM - 4:00 PM')).toBeInTheDocument();
    });

    it('should format morning times correctly', () => {
      const morningShow: Show = {
        ...mockShow,
        startTime: '09:30:00',
        endTime: '11:00:00',
      };
      render(<ShowRow show={morningShow} />);
      expect(screen.getByText('9:30 AM - 11:00 AM')).toBeInTheDocument();
    });

    it('should format midnight correctly as 12:00 AM', () => {
      const midnightShow: Show = {
        ...mockShow,
        startTime: '00:00:00',
        endTime: '02:00:00',
      };
      render(<ShowRow show={midnightShow} />);
      expect(screen.getByText('12:00 AM - 2:00 AM')).toBeInTheDocument();
    });

    it('should format noon correctly as 12:00 PM', () => {
      const noonShow: Show = {
        ...mockShow,
        startTime: '12:00:00',
        endTime: '13:00:00',
      };
      render(<ShowRow show={noonShow} />);
      expect(screen.getByText('12:00 PM - 1:00 PM')).toBeInTheDocument();
    });

    it('should render empty string for missing start or end time', () => {
      const noTimeShow: Show = {
        ...mockShow,
        startTime: '',
        endTime: '',
      };
      const { container } = render(<ShowRow show={noTimeShow} />);
      const timeElement = container.querySelector('.show-row__time');
      expect(timeElement?.textContent).toBe(' - ');
    });
  });

  describe('Rendering', () => {
    it('should render with correct CSS classes', () => {
      const { container } = render(<ShowRow show={mockShow} />);
      const rowElement = container.querySelector('.show-row');
      expect(rowElement).toBeInTheDocument();
      expect(rowElement?.querySelector('.show-row__name')).toBeInTheDocument();
      expect(rowElement?.querySelector('.show-row__time')).toBeInTheDocument();
    });

    it('should render show name in name element', () => {
      const { container } = render(<ShowRow show={mockShow} />);
      const nameElement = container.querySelector('.show-row__name');
      expect(nameElement?.textContent).toBe('Test Show w/ Test Host');
    });

    it('should render time range in time element', () => {
      const { container } = render(<ShowRow show={mockShow} />);
      const timeElement = container.querySelector('.show-row__time');
      expect(timeElement?.textContent).toBe('2:00 PM - 4:00 PM');
    });
  });
});
