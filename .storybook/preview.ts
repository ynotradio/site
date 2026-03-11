import React, { useEffect } from 'react';
import type { Preview } from '@storybook/nextjs-vite';

/* Global styles from the PHP site so stories render with accurate typography/layout */
import '../src/style/base.css';
import './storybook-overrides.css';

/**
 * Mock entry describing a URL pattern and its canned response.
 * Stories declare these via `parameters.mockData`.
 */
interface MockDataEntry {
  url: string | RegExp;
  method?: string;
  status?: number;
  response: unknown;
}

/**
 * React wrapper that intercepts `window.fetch` for the lifetime of the story,
 * returning canned responses for URLs that match `mockData` entries.
 * Unmatched requests fall through to the real `fetch`.
 */
const FetchMockProvider: React.FC<{
  mockData: MockDataEntry[];
  children: React.ReactNode;
}> = ({ mockData, children }) => {
  useEffect(() => {
    if (mockData.length === 0) return undefined;

    const originalFetch = window.fetch;

    window.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const method = (init?.method ?? 'GET').toUpperCase();

      const match = mockData.find((m) => {
        const methodMatch = !m.method || m.method.toUpperCase() === method;
        const urlMatch =
          m.url instanceof RegExp ? m.url.test(url) : url.includes(m.url);
        return methodMatch && urlMatch;
      });

      if (match) {
        return new Response(JSON.stringify(match.response), {
          status: match.status ?? 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Fall through to real fetch for unmatched requests
      return originalFetch(input, init);
    }) as typeof window.fetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, [mockData]);

  return children as React.ReactElement;
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const mockData: MockDataEntry[] = context.parameters?.mockData ?? [];
      return React.createElement(
        FetchMockProvider,
        { mockData },
        React.createElement(Story),
      );
    },
  ],
};

export default preview;