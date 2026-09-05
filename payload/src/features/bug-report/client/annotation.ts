// Pure geometry + canvas-drawing helpers for the screenshot annotator.
//
// Kept free of React and DOM lifecycle so they can be unit-tested directly and
// reused by the ScreenshotAnnotator component. Every draw helper takes a
// CanvasRenderingContext2D-like target and mutates it; none allocate a canvas.

export type Tool = 'pen' | 'rect' | 'arrow';

export interface Point {
  x: number;
  y: number;
}

export type Shape =
  | { type: 'pen'; color: string; points: Point[] }
  | { type: 'rect'; color: string; start: Point; end: Point }
  | { type: 'arrow'; color: string; start: Point; end: Point };

/** Stroke width used for every annotation, in canvas pixels. */
export const LINE_WIDTH = 4;

/** Length of each arrowhead wing, in canvas pixels. */
export const ARROW_HEAD = 16;

/** Fixed palette offered in the toolbar — high-contrast against most UIs. */
export const COLORS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '#e5484d', label: 'Red' },
  { value: '#f5a623', label: 'Amber' },
  { value: '#30a46c', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#111111', label: 'Black' },
  { value: '#ffffff', label: 'White' },
];

/**
 * Translate a pointer's client coordinates into the canvas's own pixel space,
 * accounting for the difference between the canvas's displayed (CSS) size and
 * its intrinsic bitmap size.
 */
export const toCanvasPoint = (
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
  width: number,
  height: number,
): Point => {
  const scaleX = rect.width ? width / rect.width : 1;
  const scaleY = rect.height ? height / rect.height : 1;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
};

/** Draw a straight line ending in a filled arrowhead pointing at `end`. */
export const drawArrow = (ctx: CanvasRenderingContext2D, start: Point, end: Point): void => {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - ARROW_HEAD * Math.cos(angle - Math.PI / 6),
    end.y - ARROW_HEAD * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    end.x - ARROW_HEAD * Math.cos(angle + Math.PI / 6),
    end.y - ARROW_HEAD * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
};

/** Draw a single shape with its own colour and the shared stroke width. */
export const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape): void => {
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = shape.color;
  ctx.fillStyle = shape.color;

  if (shape.type === 'pen') {
    if (shape.points.length === 0) {
      return;
    }
    ctx.beginPath();
    const [first, ...rest] = shape.points;
    ctx.moveTo(first.x, first.y);
    rest.forEach((point) => ctx.lineTo(point.x, point.y));
    // A single tap should still leave a visible dot.
    if (rest.length === 0) {
      ctx.lineTo(first.x + 0.1, first.y + 0.1);
    }
    ctx.stroke();
    return;
  }

  if (shape.type === 'rect') {
    ctx.strokeRect(
      shape.start.x,
      shape.start.y,
      shape.end.x - shape.start.x,
      shape.end.y - shape.start.y,
    );
    return;
  }

  drawArrow(ctx, shape.start, shape.end);
};

/** Draw an ordered list of shapes onto the context. */
export const drawShapes = (ctx: CanvasRenderingContext2D, shapes: Shape[]): void => {
  shapes.forEach((shape) => drawShape(ctx, shape));
};
