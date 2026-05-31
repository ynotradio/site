'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Form,
  FormSubmit,
  RenderFields,
  useConfig,
  useServerFunctions,
  Gutter,
  toast,
} from '@payloadcms/ui';
import { abortAndIgnore, handleAbortRef } from '@payloadcms/ui/shared';
import type { ClientField, FormState, Data } from 'payload';

type Props = {
  collectionSlug: string;
  onSuccess?: (doc: Data) => void;
  submitLabel?: string;
  title?: string;
  description?: string;
};

export const InlineCollectionFormClient: React.FC<Props> = ({
  collectionSlug,
  onSuccess,
  submitLabel = 'Create',
  title,
  description,
}) => {
  const { getEntityConfig } = useConfig();
  const { getFormState } = useServerFunctions();

  const config = getEntityConfig({ collectionSlug });
  const fields = (config?.fields as ClientField[]) || [];
  const abortOnChangeRef = React.useRef<AbortController | null>(null);

  const [initialState, setInitialState] = useState<FormState>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onChange = useCallback(
    async ({ formState: prevFormState, submitted }) => {
      const controller = handleAbortRef(abortOnChangeRef);
      const response = await getFormState({
        collectionSlug,
        docPermissions: { fields: true },
        docPreferences: { fields: {} },
        formState: prevFormState,
        operation: 'create',
        schemaPath: collectionSlug,
        signal: controller.signal,
        skipValidation: !submitted,
      });
      abortOnChangeRef.current = null;
      if (response && response.state) {
        return response.state;
      }
      return undefined;
    },
    [collectionSlug, getFormState],
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      try {
        const result = await getFormState({
          collectionSlug,
          data: {},
          docPermissions: { fields: true },
          docPreferences: { fields: {} },
          operation: 'create',
          renderAllFields: true,
          schemaPath: collectionSlug,
          skipValidation: true,
        });
        if (!cancelled) {
          if ('state' in result) {
            setInitialState(result.state);
          } else if (result.message) {
            setError(result.message);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to initialize form');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [collectionSlug, getFormState]);

  useEffect(() => {
    const ctrl = abortOnChangeRef.current;
    return () => {
      abortAndIgnore(ctrl);
    };
  }, []);

  const handleSuccess = useCallback(
    async (json: any) => {
      const doc = json?.doc || json?.result;
      if (onSuccess && doc) {
        onSuccess(doc);
      } else {
        toast.success(`${config?.labels?.singular || 'Document'} created`);
      }
    },
    [onSuccess, config],
  );

  if (!config) {
    return (
      <Gutter>
        <div className="payload-error" style={{ color: 'var(--theme-error-500)' }}>
          {error || `Collection "${collectionSlug}" not found`}
        </div>
      </Gutter>
    );
  }

  if (loading) {
    return (
      <Gutter>
        <div style={{ padding: '2rem 0' }}>Loading form…</div>
      </Gutter>
    );
  }

  if (!fields.length) {
    return (
      <Gutter>
        <div>
          The {config.labels?.singular || collectionSlug} collection has no fields to display.
        </div>
      </Gutter>
    );
  }

  return (
    <Gutter>
      {(title || description) && (
        <div className="inline-form__header" style={{ marginBottom: 'var(--spacing-large, 2rem)' }}>
          {title && <h1 style={{ margin: '0 0 0.5rem' }}>{title}</h1>}
          {description && (
            <p style={{ color: 'var(--theme-elevation-400)', margin: 0 }}>{description}</p>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            color: 'var(--theme-error-500)',
            marginBottom: '1rem',
            padding: '0.75rem',
            background: 'var(--theme-error-100)',
            borderRadius: 'var(--style-radius-m)',
          }}
        >
          {error}
        </div>
      )}

      <Form
        action={`/api/${collectionSlug}`}
        initialState={initialState}
        method="POST"
        onChange={[onChange]}
        onSuccess={handleSuccess}
        disableSuccessStatus={!!onSuccess}
        validationOperation="create"
      >
        <RenderFields
          fields={fields}
          forceRender
          parentIndexPath=""
          parentPath=""
          parentSchemaPath={collectionSlug}
          permissions
          readOnly={false}
        />
        <div style={{ marginTop: '2rem' }}>
          <FormSubmit>{submitLabel}</FormSubmit>
        </div>
      </Form>
    </Gutter>
  );
};
