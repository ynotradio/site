import type { MutableRefObject } from 'react';

export { mergeFieldStyles } from './ui';

export const abortAndIgnore = () => {};

export const handleAbortRef = (ref: MutableRefObject<AbortController | null>): AbortController => {
  const controller = new AbortController();
  // eslint-disable-next-line no-param-reassign
  ref.current = controller;
  return controller;
};
