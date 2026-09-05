import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ScreenshotAnnotator } from './ScreenshotAnnotator';

// jsdom has no canvas or real image decoding, so we stub both. The Image stub
// fires `onload` synchronously when a src is assigned, which is what the
// component waits on before it will draw or export.
class FakeImage {
  onload: (() => void) | null = null;

  naturalWidth = 800;

  naturalHeight = 600;

  width = 800;

  height = 600;

  #src = '';

  set src(value: string) {
    this.#src = value;
    this.onload?.();
  }

  get src(): string {
    return this.#src;
  }
}

const fakeCtx = () => ({
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  strokeRect: vi.fn(),
  lineWidth: 0,
  lineJoin: '',
  lineCap: '',
  strokeStyle: '',
  fillStyle: '',
});

const IMAGE = 'data:image/png;base64,BASE';

describe('ScreenshotAnnotator', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', FakeImage);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeCtx() as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,OUT');
  });

  it('renders the tool and colour controls', () => {
    render(<ScreenshotAnnotator image={IMAGE} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Pen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Box' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Arrow' })).toBeInTheDocument();
    // Arrow is the default tool.
    expect(screen.getByRole('button', { name: 'Arrow' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches the active tool and colour', () => {
    render(<ScreenshotAnnotator image={IMAGE} onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pen' }));
    expect(screen.getByRole('button', { name: 'Pen' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Blue' }));
    expect(screen.getByRole('button', { name: 'Blue' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('commits a drawn shape and supports undo/clear', () => {
    render(<ScreenshotAnnotator image={IMAGE} onSave={vi.fn()} onCancel={vi.fn()} />);
    const canvas = screen.getByLabelText('Screenshot annotation canvas');
    const undo = screen.getByRole('button', { name: 'Undo' });
    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(undo).toBeDisabled();

    fireEvent.pointerDown(canvas, { clientX: 5, clientY: 5 });
    fireEvent.pointerMove(canvas, { clientX: 40, clientY: 30 });
    fireEvent.pointerUp(canvas, { clientX: 40, clientY: 30 });
    expect(undo).toBeEnabled();

    fireEvent.click(undo);
    expect(undo).toBeDisabled();

    // Draw again, then clear.
    fireEvent.pointerDown(canvas, { clientX: 1, clientY: 1 });
    fireEvent.pointerUp(canvas, { clientX: 2, clientY: 2 });
    expect(clear).toBeEnabled();
    fireEvent.click(clear);
    expect(clear).toBeDisabled();
  });

  it('draws a freehand pen stroke across pointer moves', () => {
    render(<ScreenshotAnnotator image={IMAGE} onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pen' }));
    const canvas = screen.getByLabelText('Screenshot annotation canvas');
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(canvas, { clientX: 10, clientY: 10 });
    fireEvent.pointerMove(canvas, { clientX: 20, clientY: 5 });
    fireEvent.pointerLeave(canvas, { clientX: 20, clientY: 5 });
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
  });

  it('exports the annotated PNG on save', async () => {
    const onSave = vi.fn();
    render(<ScreenshotAnnotator image={IMAGE} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save annotation' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('data:image/png;base64,OUT'));
  });

  it('falls back to the original image when export throws', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
      throw new Error('tainted canvas');
    });
    const onSave = vi.fn();
    render(<ScreenshotAnnotator image={IMAGE} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save annotation' }));
    expect(onSave).toHaveBeenCalledWith(IMAGE);
  });

  it('calls onCancel without saving', () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    render(<ScreenshotAnnotator image={IMAGE} onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
