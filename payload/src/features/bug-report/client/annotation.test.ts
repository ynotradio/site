import { describe, it, expect } from 'vitest';

import {
  ARROW_HEAD,
  COLORS,
  drawArrow,
  drawShape,
  drawShapes,
  LINE_WIDTH,
  toCanvasPoint,
} from './annotation';
import type { Shape } from './annotation';

/** A recording stand-in for CanvasRenderingContext2D. */
const makeCtx = () => {
  const calls: string[] = [];
  const record = (name: string) => (...args: unknown[]) => {
    calls.push(`${name}(${args.join(',')})`);
  };
  const ctx = {
    calls,
    lineWidth: 0,
    lineJoin: '',
    lineCap: '',
    strokeStyle: '',
    fillStyle: '',
    beginPath: record('beginPath'),
    closePath: record('closePath'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    stroke: record('stroke'),
    fill: record('fill'),
    strokeRect: record('strokeRect'),
  };
  return ctx as unknown as CanvasRenderingContext2D & { calls: string[] };
};

describe('toCanvasPoint', () => {
  it('scales client coordinates into the canvas bitmap space', () => {
    const rect = {
      left: 10,
      top: 20,
      width: 200,
      height: 100,
    };
    // Canvas bitmap is twice its displayed size on each axis.
    const point = toCanvasPoint(rect, 110, 70, 400, 200);
    expect(point).toEqual({ x: (110 - 10) * 2, y: (70 - 20) * 2 });
  });

  it('falls back to a 1:1 scale when the element has no size', () => {
    const rect = {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    };
    expect(toCanvasPoint(rect, 5, 6, 100, 100)).toEqual({ x: 5, y: 6 });
  });
});

describe('drawArrow', () => {
  it('draws a shaft and a filled arrowhead', () => {
    const ctx = makeCtx();
    drawArrow(ctx, { x: 0, y: 0 }, { x: 10, y: 0 });
    expect(ctx.calls).toContain('moveTo(0,0)');
    expect(ctx.calls).toContain('lineTo(10,0)');
    expect(ctx.calls.filter((c) => c === 'stroke()').length).toBe(1);
    expect(ctx.calls.filter((c) => c === 'fill()').length).toBe(1);
    expect(ctx.calls).toContain('closePath()');
  });
});

describe('drawShape', () => {
  it('applies the shared stroke width and the shape colour', () => {
    const ctx = makeCtx();
    drawShape(ctx, { type: 'rect', color: '#abc', start: { x: 1, y: 2 }, end: { x: 5, y: 8 } });
    expect(ctx.lineWidth).toBe(LINE_WIDTH);
    expect(ctx.strokeStyle).toBe('#abc');
    expect(ctx.calls).toContain('strokeRect(1,2,4,6)');
  });

  it('strokes a multi-point pen path', () => {
    const ctx = makeCtx();
    drawShape(ctx, {
      type: 'pen',
      color: '#000',
      points: [
        { x: 0, y: 0 },
        { x: 3, y: 4 },
      ],
    });
    expect(ctx.calls).toContain('moveTo(0,0)');
    expect(ctx.calls).toContain('lineTo(3,4)');
  });

  it('draws a visible dot for a single-point pen tap', () => {
    const ctx = makeCtx();
    drawShape(ctx, { type: 'pen', color: '#000', points: [{ x: 2, y: 2 }] });
    expect(ctx.calls).toContain('moveTo(2,2)');
    expect(ctx.calls.some((c) => c.startsWith('lineTo(2.1'))).toBe(true);
  });

  it('does nothing for an empty pen path', () => {
    const ctx = makeCtx();
    drawShape(ctx, { type: 'pen', color: '#000', points: [] });
    expect(ctx.calls).not.toContain('stroke()');
  });

  it('routes arrow shapes through drawArrow', () => {
    const ctx = makeCtx();
    drawShape(ctx, { type: 'arrow', color: '#f00', start: { x: 0, y: 0 }, end: { x: 1, y: 1 } });
    expect(ctx.calls).toContain('fill()');
  });
});

describe('drawShapes', () => {
  it('draws every shape in order', () => {
    const ctx = makeCtx();
    const shapes: Shape[] = [
      { type: 'rect', color: '#111', start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      { type: 'rect', color: '#222', start: { x: 2, y: 2 }, end: { x: 3, y: 3 } },
    ];
    drawShapes(ctx, shapes);
    expect(ctx.calls).toContain('strokeRect(0,0,1,1)');
    expect(ctx.calls).toContain('strokeRect(2,2,1,1)');
  });
});

describe('constants', () => {
  it('exposes a non-empty colour palette and sane sizes', () => {
    expect(COLORS.length).toBeGreaterThan(0);
    expect(ARROW_HEAD).toBeGreaterThan(0);
    expect(LINE_WIDTH).toBeGreaterThan(0);
  });
});
