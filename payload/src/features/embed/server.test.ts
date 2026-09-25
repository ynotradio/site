import { describe, it, expect, vi } from 'vitest';
import { EmbedBlock } from './server';

vi.mock('@payloadcms/richtext-lexical', () => ({
  BlocksFeature: vi.fn((config) => config),
}));

type TestField = {
  name?: string;
  hooks?: { beforeValidate?: Array<(args: { value: unknown }) => unknown> };
  admin?: { condition?: (data: unknown, siblingData: { url?: unknown }) => boolean };
  defaultValue?: unknown;
};

const field = (name: string) => (EmbedBlock.fields as TestField[]).find((f) => f.name === name);

describe('EmbedBlock', () => {
  it('stores the src when an editor pastes iframe embed code into the URL field', () => {
    const hook = field('url')?.hooks?.beforeValidate?.[0];
    const code = '<iframe width="100%" height="60" src="https://player-widget.mixcloud.com/widget/iframe/?mini=1&amp;feed=%2Fynotradio%2Fshow%2F"></iframe>';

    expect(hook?.({ value: code })).toBe(
      'https://player-widget.mixcloud.com/widget/iframe/?mini=1&feed=%2Fynotradio%2Fshow%2F',
    );
  });

  it('offers a Mini player checkbox, off by default, only for Mixcloud URLs', () => {
    const mini = field('miniPlayer');

    expect(mini?.defaultValue).toBe(false);
    expect(mini?.admin?.condition?.({}, { url: 'https://www.mixcloud.com/ynotradio/show/' })).toBe(true);
    expect(mini?.admin?.condition?.({}, { url: 'https://www.youtube.com/watch?v=abc' })).toBe(false);
  });
});
