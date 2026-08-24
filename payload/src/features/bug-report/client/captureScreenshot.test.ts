import { describe, it, expect, vi, beforeEach } from 'vitest';

const toPng = vi.fn();
vi.mock('html-to-image', () => ({ toPng: (...args: unknown[]) => toPng(...args) }));

const { captureScreenshot } = await import('./captureScreenshot');

describe('captureScreenshot', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the PNG data URL from html-to-image', async () => {
    toPng.mockResolvedValue('data:image/png;base64,ZZZ');
    const result = await captureScreenshot();
    expect(result).toBe('data:image/png;base64,ZZZ');
    expect(toPng).toHaveBeenCalledWith(document.body, expect.objectContaining({ cacheBust: true }));
  });

  it('filters out the ignored element', async () => {
    toPng.mockResolvedValue('data:image/png;base64,ZZZ');
    const ignored = document.createElement('div');
    const other = document.createElement('span');
    await captureScreenshot({ ignore: ignored });

    const { filter } = toPng.mock.calls[0][1] as { filter: (n: HTMLElement) => boolean };
    expect(filter(ignored)).toBe(false);
    expect(filter(other)).toBe(true);
  });

  it('returns null when capture fails', async () => {
    toPng.mockRejectedValue(new Error('tainted canvas'));
    expect(await captureScreenshot()).toBeNull();
  });
});
