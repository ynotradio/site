'use client';

import React, { useCallback, useState } from 'react';
import { CodeField } from '@payloadcms/ui';
import type { CodeFieldClientProps } from 'payload';

const MIN_HEIGHT = 240;

interface MonacoEditor {
  getContentHeight: () => number;
  onDidContentSizeChange: (listener: () => void) => unknown;
}

// Payload's code field only recomputes its height from the number of newlines,
// so existing content opens at a few lines tall and a pasted single-line blob
// never grows. Monaco knows its real content height (including wrapped lines).
export const AutoHeightCodeField: React.FC<CodeFieldClientProps> = (props) => {
  const [height, setHeight] = useState(MIN_HEIGHT);
  const { field } = props;
  const editorProps: Record<string, unknown> = field.admin?.editorProps ?? {};

  const handleMount = useCallback((editor: MonacoEditor) => {
    const fit = () => setHeight(Math.max(MIN_HEIGHT, editor.getContentHeight()));
    editor.onDidContentSizeChange(fit);
    fit();
  }, []);

  return (
    <CodeField
      {...props}
      field={{
        ...field,
        admin: { ...field.admin, editorProps: { ...editorProps, height } },
      }}
      onMount={handleMount as never}
    />
  );
};
