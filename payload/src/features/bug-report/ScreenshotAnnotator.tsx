'use client';

import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';

import { COLORS, drawShapes, toCanvasPoint } from './client/annotation';
import type { Point, Shape, Tool } from './client/annotation';
import './ScreenshotAnnotator.css';

export interface ScreenshotAnnotatorProps {
  /** Base image to annotate, as a data URL. */
  image: string;
  /** Called with the flattened (base + annotations) PNG data URL. */
  onSave: (dataUrl: string) => void;
  /** Called when the user backs out without saving. */
  onCancel: () => void;
}

const TOOLS: ReadonlyArray<{ value: Tool; label: string; icon: string }> = [
  { value: 'pen', label: 'Pen', icon: '✏️' },
  { value: 'rect', label: 'Box', icon: '▭' },
  { value: 'arrow', label: 'Arrow', icon: '↗' },
];

export const ScreenshotAnnotator: React.FC<ScreenshotAnnotatorProps> = ({
  image,
  onSave,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<Tool>('arrow');
  const [color, setColor] = useState<string>(COLORS[0].value);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [draft, setDraft] = useState<Shape | null>(null);

  // Load the base image once so we know the canvas dimensions and have a bitmap
  // to redraw beneath the annotations on every change.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth || img.width || 1;
        canvas.height = img.naturalHeight || img.height || 1;
      }
      setReady(true);
    };
    img.src = image;
  }, [image]);

  // Redraw the whole scene (base image + committed shapes + in-progress draft)
  // whenever anything changes. Cheap enough for interactive drawing.
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    drawShapes(ctx, draft ? [...shapes, draft] : shapes);
  }, [ready, shapes, draft]);

  const pointAt = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return toCanvasPoint(rect, clientX, clientY, canvas.width, canvas.height);
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const point = pointAt(event.clientX, event.clientY);
      if (tool === 'pen') {
        setDraft({ type: 'pen', color, points: [point] });
      } else {
        setDraft({
          type: tool,
          color,
          start: point,
          end: point,
        });
      }
    },
    [tool, color, pointAt],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      setDraft((current) => {
        if (!current) {
          return current;
        }
        const point = pointAt(event.clientX, event.clientY);
        if (current.type === 'pen') {
          return { ...current, points: [...current.points, point] };
        }
        return { ...current, end: point };
      });
    },
    [pointAt],
  );

  const commitDraft = useCallback(() => {
    setDraft((current) => {
      if (current) {
        setShapes((prev) => [...prev, current]);
      }
      return null;
    });
  }, []);

  const undo = useCallback(() => setShapes((prev) => prev.slice(0, -1)), []);
  const clear = useCallback(() => {
    setShapes([]);
    setDraft(null);
  }, []);

  const save = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.toDataURL !== 'function') {
      // Fall back to the un-annotated image rather than losing the screenshot.
      onSave(image);
      return;
    }
    try {
      onSave(canvas.toDataURL('image/png'));
    } catch {
      onSave(image);
    }
  }, [image, onSave]);

  return (
    <div className="bug-report-annotator">
      <div className="bug-report-annotator-toolbar" role="toolbar" aria-label="Annotation tools">
        <div className="bug-report-annotator-group" role="group" aria-label="Tool">
          {TOOLS.map((entry) => (
            <button
              key={entry.value}
              type="button"
              className={`bug-report-annotator-tool${tool === entry.value ? ' is-active' : ''}`}
              aria-pressed={tool === entry.value}
              aria-label={entry.label}
              title={entry.label}
              onClick={() => setTool(entry.value)}
            >
              <span aria-hidden="true">{entry.icon}</span>
            </button>
          ))}
        </div>

        <div className="bug-report-annotator-group" role="group" aria-label="Colour">
          {COLORS.map((entry) => (
            <button
              key={entry.value}
              type="button"
              className={`bug-report-annotator-swatch${color === entry.value ? ' is-active' : ''}`}
              style={{ backgroundColor: entry.value }}
              aria-pressed={color === entry.value}
              aria-label={entry.label}
              title={entry.label}
              onClick={() => setColor(entry.value)}
            />
          ))}
        </div>

        <div className="bug-report-annotator-group">
          <button
            type="button"
            className="bug-report-secondary"
            onClick={undo}
            disabled={shapes.length === 0}
          >
            Undo
          </button>
          <button
            type="button"
            className="bug-report-secondary"
            onClick={clear}
            disabled={shapes.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bug-report-annotator-stage">
        <canvas
          ref={canvasRef}
          className="bug-report-annotator-canvas"
          aria-label="Screenshot annotation canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={commitDraft}
          onPointerLeave={commitDraft}
        />
      </div>

      <div className="bug-report-actions">
        <button type="button" className="bug-report-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="bug-report-primary" onClick={save}>
          Save annotation
        </button>
      </div>
    </div>
  );
};

export default ScreenshotAnnotator;
