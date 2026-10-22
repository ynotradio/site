import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { AutoHeightCodeField } from './AutoHeightCodeField';

type CodeFieldProps = {
  field: { admin?: { editorProps?: { height?: number } } };
  onMount: (editor: unknown) => void;
};

const codeFieldProps: CodeFieldProps[] = [];

vi.mock('@payloadcms/ui', () => ({
  CodeField: (props: CodeFieldProps) => {
    codeFieldProps.push(props);
    return <div data-testid="code-field" />;
  },
}));

const baseField = { type: 'code' as const, name: 'contentHtml', admin: { language: 'html' } };

const lastProps = () => codeFieldProps[codeFieldProps.length - 1];

describe('AutoHeightCodeField', () => {
  it('starts at the minimum height', () => {
    render(<AutoHeightCodeField path="contentHtml" field={baseField as never} />);
    expect(lastProps().field.admin?.editorProps?.height).toBe(240);
  });

  it('grows to the editor content height on mount and on content changes', () => {
    render(<AutoHeightCodeField path="contentHtml" field={baseField as never} />);

    let onSizeChange: () => void = () => {};
    let contentHeight = 900;
    const editor = {
      getContentHeight: () => contentHeight,
      onDidContentSizeChange: (listener: () => void) => {
        onSizeChange = listener;
      },
    };

    act(() => lastProps().onMount(editor));
    expect(lastProps().field.admin?.editorProps?.height).toBe(900);

    contentHeight = 1500;
    act(() => onSizeChange());
    expect(lastProps().field.admin?.editorProps?.height).toBe(1500);
  });

  it('never shrinks below the minimum height', () => {
    render(<AutoHeightCodeField path="contentHtml" field={baseField as never} />);
    const editor = { getContentHeight: () => 40, onDidContentSizeChange: () => {} };

    act(() => lastProps().onMount(editor));
    expect(lastProps().field.admin?.editorProps?.height).toBe(240);
  });
});
