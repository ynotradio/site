'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Form, RenderFields, useConfig, useServerFunctions, useFormFields,
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
  const { getEntityConfig } = useConfig();
  const { getFormState } = useServerFunctions();
  const [fields] = useFormFields(([, dispatch]) => dispatch);

  const config = getEntityConfig({ collectionSlug: 'cdoftheweek' });
  const reviewField = (config?.fields as ClientField[] | undefined)?.find(
    (f) => (f as { name?: string }).name === 'review',
  );

  const [initialState, setInitialState] = useState<FormState>();
  const abortOnChangeRef = React.useRef<AbortController | null>(null);

  const onChange = useCallback(
    async (params: { formState: FormState; submitted: boolean }) => {
      const { formState: prevFormState, submitted } = params;
      const controller = handleAbortRef(abortOnChangeRef);
      const response = await getFormState({
        collectionSlug: 'cdotheweek',
        docPermissions: { fields: true },
        docPreferences: { fields: {} },
        formState: prevFormState,
        operation: 'create',
        schemaPath: 'cdotheweek',
        signal: controller.signal,
        skipValidation: !submitted,
      });
      abortOnChangeRef.current = null;
      if (response && response.state) {
        return response.state;
      }
      return undefined;
    },
    [getFormState],
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const result = await getFormState({
          collectionSlug: 'cdotheweek',
          data: {},
          docPermissions: { fields: true },
          docPreferences: { fields: {} },
          operation: 'create',
          renderAllFields: true,
          schemaPath: 'cdotheweek',
          skipValidation: true,
        });
        if (!cancelled && 'state' in result) {
          setInitialState(result.state);
        }
      } catch {
        // silently fail — review field won't render
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [getFormState]);

  useEffect(() => {
    const ctrl = abortOnChangeRef.current;
    return () => {
      abortAndIgnore(ctrl);
    };
  }, []);

  // Sync review value to parent ref whenever form fields change
  useEffect(() => {
    if (fields && 'review' in fields) {
      const formFields = fields as Record<string, { value?: unknown }>;
      // eslint-disable-next-line no-param-reassign
      valueRef.current = formFields.review?.value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  if (!reviewField) {
    return (
      <div className="cdotw-wizard__hint" role="alert">
        Review field not found in collection config.
      </div>
    );
  }

  if (!initialState) {
    return <div style={{ minHeight: '200px' }}>Loading editor…</div>;
  }

  return (
    <Form action="/api/cdotheweek" initialState={initialState} method="POST" onChange={[onChange]}>
      <RenderFields
        fields={[reviewField]}
        forceRender
        parentIndexPath=""
        parentPath=""
        schemaPath="cdotheweek"
      />
    </Form>
  );
};
