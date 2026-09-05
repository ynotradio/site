// Capture a screenshot of the current admin page as a PNG data URL.
//
// html-to-image renders the live DOM to a canvas — no browser permission prompt
// and no extension required. It's imported dynamically so the (few hundred KB)
// library only loads when a user actually opens the reporter, keeping it out of
// the main admin bundle.

const MAX_WIDTH = 1600;

export interface CaptureScreenshotOptions {
  /** Element to exclude from the capture (e.g. the open report dialog). */
  ignore?: HTMLElement | null;
}

export const captureScreenshot = async (
  options: CaptureScreenshotOptions = {},
): Promise<string | null> => {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    const { toPng } = await import('html-to-image');
    const node = document.body;
    const scale = Math.min(1, MAX_WIDTH / Math.max(node.scrollWidth, 1));

    return await toPng(node, {
      cacheBust: true,
      pixelRatio: scale,
      filter: (domNode) => {
        if (options.ignore && domNode === options.ignore) {
          return false;
        }
        return true;
      },
    });
  } catch {
    // A failed screenshot must never block the report.
    return null;
  }
};
