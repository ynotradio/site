import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import type { DiffTarget } from './targets';

export interface DiffResult {
  label: string;
  localUrl: string;
  prodUrl: string;
  localStatus: number | null;
  prodStatus: number | null;
  diffPercent: string | null;
  note: string | null;
}

interface Shot {
  status: number | null;
  buffer: Buffer | null;
}

async function screenshotFullPage(
  browser: import('@playwright/test').Browser,
  url: string,
): Promise<Shot> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const response = await page
    .goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    .catch(() => null);
  const status = response ? response.status() : null;
  const buffer = await page.screenshot({ fullPage: true }).catch(() => null);
  await page.close();
  return { status, buffer };
}

function padToSameSize(a: PNG, b: PNG): [PNG, PNG, number, number] {
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const pad = (img: PNG) => {
    if (img.width === width && img.height === height) return img;
    const out = new PNG({ width, height });
    PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
    return out;
  };
  return [pad(a), pad(b), width, height];
}

/**
 * Screenshot both sides of every target, pixel-diff them, and write
 * `<label>--local.png` / `--prod.png` / `--diff.png` plus `results.json`
 * into `outDir`. Returns the same results array that gets written.
 */
export async function runDiff(targets: DiffTarget[], outDir: string): Promise<DiffResult[]> {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const results: DiffResult[] = [];

  try {
    // eslint-disable-next-line no-restricted-syntax -- sequential by design, one pair at a time
    for (const target of targets) {
      const { label, localUrl, prodUrl } = target;
      // eslint-disable-next-line no-await-in-loop
      const [localShot, prodShot] = await Promise.all([
        screenshotFullPage(browser, localUrl),
        screenshotFullPage(browser, prodUrl),
      ]);

      const result: DiffResult = {
        label,
        localUrl,
        prodUrl,
        localStatus: localShot.status,
        prodStatus: prodShot.status,
        diffPercent: null,
        note: null,
      };

      if (!localShot.buffer || !prodShot.buffer) {
        result.note = 'screenshot failed for one or both sides';
      } else {
        const localPNG = PNG.sync.read(localShot.buffer);
        const prodPNG = PNG.sync.read(prodShot.buffer);
        const [a, b, width, height] = padToSameSize(localPNG, prodPNG);

        const diffPNG = new PNG({ width, height });
        const diffPixels = pixelmatch(a.data, b.data, diffPNG.data, width, height, {
          threshold: 0.1,
        });
        result.diffPercent = ((diffPixels / (width * height)) * 100).toFixed(1);

        fs.writeFileSync(path.join(outDir, `${label}--local.png`), PNG.sync.write(a));
        fs.writeFileSync(path.join(outDir, `${label}--prod.png`), PNG.sync.write(b));
        fs.writeFileSync(path.join(outDir, `${label}--diff.png`), PNG.sync.write(diffPNG));
      }

      results.push(result);
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
  return results;
}
