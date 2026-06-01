'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Form, RenderFields, useConfig, useServerFunctions,
} from '@payloadcms/ui';
import { abortAndIgnore, handleAbortRef } from '@payloadcms/ui/shared';
import type { Field, FormState } from 'payload';

interface Props {
  valueRef: React.MutableRefObject<unknown>;
}

export const CdotwReviewField: React.FC<Props> = ({ valueRef }) => {
  const { getEntityConfig } = useConfig();
  const { getFormState } = useServerFunctions();
  const [initialState, setInitialState] = useState<FormState>();
  const [error, setError] = useState<string | null>(null);
  const [stateReviewField, setStateReviewField] = useState<Field | null>(null);
  const abortOnChangeRef = React.useRef<AbortController | null>(null);

  const collectionConfig = getEntityConfig({ collectionSlug: 'cdoftheweek' }) as
    | { fields?: Field[]; labels?: { singular?: string } }
    | undefined;
  const reviewField = collectionConfig?.fields?.find(
    (field): field is Field => 'name' in field && field.name === 'review',
  );

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
        renderAllFields: true,
        schemaPath: 'cdoftheweek',
        signal: controller.signal,
        skipValidation: !submitted,
      });
      abortOnChangeRef.current = null;
      if (response && response.state) {
        const nextReviewField = (response.state?.review as { field?: Field } | undefined)?.field;
        if (nextReviewField) {
          setStateReviewField(nextReviewField);
        }
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
      if (!reviewField) {
        setError('Review field is unavailable');
        return;
      }

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
          const nextReviewField = (result.state?.review as { field?: Field } | undefined)?.field;
          if (nextReviewField) {
            setStateReviewField(nextReviewField);
          }
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
  }, [getFormState, reviewField, valueRef]);

  useEffect(() => {
    const ctrl = abortOnChangeRef.current;
    return () => {
      abortAndIgnore(ctrl);
    };
  }, []);

  if (!reviewField) {
    return (
      <div className="cdotw-wizard__hint" role="alert">
        Review field is unavailable
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
          'Loading editor...'
        )}
      </div>
    );
  }

  const fieldToRender = stateReviewField ?? reviewField;

  return (
    <Form action="/api/cdoftheweek" initialState={initialState} method="POST" onChange={[onChange]}>
      <RenderFields
        className="document-fields__fields"
        fields={[fieldToRender]}
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
