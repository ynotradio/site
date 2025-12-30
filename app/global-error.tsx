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
    /* eslint-disable no-console */
    // Log error to Netlify logs via console.error
    const timestamp = new Date().toISOString();
    console.error(`[Next.js Global Error] ${timestamp} Global error caught:`, error);
    console.error(`[Next.js Global Error] ${timestamp} Error name:`, error.name);
    console.error(`[Next.js Global Error] ${timestamp} Error message:`, error.message);
    if (error.stack) {
      console.error(`[Next.js Global Error] ${timestamp} Stack trace:`, error.stack);
    }
    if (error.digest) {
      console.error(`[Next.js Global Error] ${timestamp} Error digest:`, error.digest);
    }
    /* eslint-enable no-console */
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
