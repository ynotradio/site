'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Netlify logs via console.error
    // eslint-disable-next-line no-console
    const timestamp = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.error(`[Next.js Global Error] ${timestamp} Global error caught:`, error);
    // eslint-disable-next-line no-console
    console.error(`[Next.js Global Error] ${timestamp} Error name:`, error.name);
    // eslint-disable-next-line no-console
    console.error(`[Next.js Global Error] ${timestamp} Error message:`, error.message);
    if (error.stack) {
      // eslint-disable-next-line no-console
      console.error(`[Next.js Global Error] ${timestamp} Stack trace:`, error.stack);
    }
    if (error.digest) {
      // eslint-disable-next-line no-console
      console.error(`[Next.js Global Error] ${timestamp} Error digest:`, error.digest);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
          <h2>Something went wrong!</h2>
          <p>A critical error occurred.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
            <summary>Error details</summary>
            <p><strong>Message:</strong> {error.message}</p>
            {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
          </details>
          <button
            onClick={() => reset()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
