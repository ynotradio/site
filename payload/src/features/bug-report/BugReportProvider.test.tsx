import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { BugReportProvider } from './BugReportProvider';
import { clearLogs, getLogs } from './client/logBuffer';

describe('BugReportProvider', () => {
  it('renders its children and mounts the widget launcher', () => {
    render(
      <BugReportProvider>
        <p>child content</p>
      </BugReportProvider>,
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Report a bug' })).toBeInTheDocument();
  });

  it('installs log capture so console errors are buffered', () => {
    clearLogs();
    render(<BugReportProvider />);
    // eslint-disable-next-line no-console
    console.error('provider-captured error');
    expect(getLogs().some((l) => l.message.includes('provider-captured error'))).toBe(true);
  });
});
