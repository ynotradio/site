'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Form, RenderFields, useConfig, useServerFunctions,
} from '@payloadcms/ui';
import { abortAndIgnore, handleAbortRef } from '@payloadcms/ui/shared';
import type { ClientField, FormState } from 'payload';

interface Props {
  valueRef: React.MutableRefObject<unknown>;
}

/**
 * Provides a minimal CDOTW Form context so the `review` rich text field
 * renders natively with all its features (lexical editor, toolbar, etc.).
 * The form has no submit button — the parent reads values via `valueRef`.
 */
export const CdotwReviewField: React.FC<Props> = ({ valueRef }) => {
  const { config: payloadConfig, getEntityConfig } = useConfig();
  const { getFormState } = useServerFunctions();

  const config = getEntityConfig({ collectionSlug: 'cdoftheweek' });
  const configLoaded = (payloadConfig?.collections?.length ?? 0) > 0;
  const reviewField = (config?.fields as ClientField[] | undefined)?.find(
    (f) => (f as { name?: string }).name === 'review',
  );

  const [initialState, setInitialState] = useState<FormState>();
  const [error, setError] = useState<string | null>(null);
  const abortOnChangeRef = React.useRef<AbortController | null>(null);

  const onChange = useCallback(
    async (params: { formState: FormState; submitted: boolean }) => {
      const { formState: prevFormState, submitted } = params;
      const controller = handleAbortRef(abortOnChangeRef);
      const response = await getFormState({
        collectionSlug: 'cdoftheweek',
        docPermissions: { fields: true },
        docPreferences: { fields: {} },
        formState: prevFormState,
        operation: 'create',
        schemaPath: 'cdoftheweek',
        signal: controller.signal,
        skipValidation: !submitted,
      });
      abortOnChangeRef.current = null;
      if (response && response.state) {
        // eslint-disable-next-line no-param-reassign
        valueRef.current = response.state?.review?.value;
        return response.state;
      }
      return undefined;
    },
    [getFormState, valueRef],
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const result = await getFormState({
          collectionSlug: 'cdoftheweek',
          data: {},
          docPermissions: { fields: true },
          docPreferences: { fields: {} },
          operation: 'create',
          renderAllFields: true,
          schemaPath: 'cdoftheweek',
          skipValidation: true,
        });
        if (!cancelled && 'state' in result) {
          setInitialState(result.state);
          // eslint-disable-next-line no-param-reassign
          valueRef.current = result.state?.review?.value;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to initialize review editor');
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [getFormState, valueRef]);

  useEffect(() => {
    const ctrl = abortOnChangeRef.current;
    return () => {
      abortAndIgnore(ctrl);
    };
  }, []);

  if (!configLoaded) {
    return <div style={{ minHeight: '200px' }}>Loading editor…</div>;
  }

  if (!reviewField) {
    return (
      <div className="cdotw-wizard__hint" role="alert">
        Review field not found in collection config.
      </div>
    );
  }

  if (!initialState) {
    return (
      <div style={{ minHeight: '200px' }}>
        {error ? (
          <div className="cdotw-wizard__hint" role="alert">
            {error}
          </div>
        ) : (
          'Loading editor…'
        )}
      </div>
    );
  }

  return (
    <Form action="/api/cdoftheweek" initialState={initialState} method="POST" onChange={[onChange]}>
      <RenderFields
        className="document-fields__fields"
        fields={[reviewField]}
        forceRender
        parentIndexPath=""
        parentPath=""
        parentSchemaPath="cdoftheweek"
        permissions
        readOnly={false}
      />
    </Form>
  );
};
