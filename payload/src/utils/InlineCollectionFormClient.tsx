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
import { fieldIsSidebar } from 'payload/shared';
import type { ClientField, FormState, Data } from 'payload';

type Props = {
  collectionSlug: string;
  excludeFields?: string[];
  onSuccess?: (doc: Data) => void | Promise<void>;
  submitLabel?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  disableSubmit?: boolean;
  disableGutter?: boolean;
  layout?: 'document' | 'stacked';
};

const RenderFieldLayout: React.FC<{
  layout: 'document' | 'stacked';
  fields: ClientField[];
  mainFields: (ClientField | null)[];
  sidebarFields: (ClientField | null)[];
  hasSidebar: boolean;
  collectionSlug: string;
}> = ({
  layout, fields, mainFields, sidebarFields, hasSidebar, collectionSlug,
}) => {
  if (layout === 'stacked') {
    return (
      <div className="inline-form__stacked-fields">
        <RenderFields
          className="document-fields__fields"
          fields={fields}
          forceRender
          parentIndexPath=""
          parentPath=""
          parentSchemaPath={collectionSlug}
          permissions
          readOnly={false}
        />
      </div>
    );
  }

  return (
    <div
      className={
        hasSidebar
          ? 'document-fields document-fields--has-sidebar'
          : 'document-fields document-fields--no-sidebar'
      }
    >
      <div className="document-fields__main">
        <Gutter className="document-fields__edit">
          <RenderFields
            className="document-fields__fields"
            fields={mainFields}
            forceRender
            parentIndexPath=""
            parentPath=""
            parentSchemaPath={collectionSlug}
            permissions
            readOnly={false}
          />
        </Gutter>
      </div>
      {hasSidebar && (
        <div className="document-fields__sidebar-wrap">
          <div className="document-fields__sidebar">
            <div className="document-fields__sidebar-fields">
              <RenderFields
                fields={sidebarFields}
                forceRender
                parentIndexPath=""
                parentPath=""
                parentSchemaPath={collectionSlug}
                permissions
                readOnly={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const InlineCollectionFormClient: React.FC<Props> = ({
  collectionSlug,
  excludeFields = [],
  onSuccess,
  submitLabel = 'Create',
  title,
  description,
  children,
  disableSubmit = false,
  disableGutter = false,
  layout = 'document',
}) => {
  const { config: payloadConfig, getEntityConfig } = useConfig();
  const { getFormState } = useServerFunctions();

  const config = getEntityConfig({ collectionSlug });
  const configLoaded = (payloadConfig?.collections?.length ?? 0) > 0;
  const allFields = (config?.fields as ClientField[]) || [];
  const fields = allFields.filter(
    (f) => !excludeFields.includes((f as { name?: string }).name ?? ''),
  );

  const { mainFields, sidebarFields, hasSidebar } = React.useMemo(() => {
    const main: (ClientField | null)[] = [];
    const sidebar: (ClientField | null)[] = [];
    fields.forEach((field) => {
      if (fieldIsSidebar(field)) {
        sidebar.push(field);
        main.push(null);
      } else {
        main.push(field);
        sidebar.push(null);
      }
    });
    return {
      mainFields: main,
      sidebarFields: sidebar,
      hasSidebar: sidebar.some((f) => f !== null),
    };
  }, [fields]);

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

  function renderInGutter(content: React.ReactNode) {
    return disableGutter ? content : <Gutter>{content}</Gutter>;
  }

  if (!configLoaded) {
    return renderInGutter(<div style={{ padding: '2rem 0' }}>Loading form…</div>);
  }

  if (!config) {
    return renderInGutter(
      <div className="payload-error" style={{ color: 'var(--theme-error-500)' }}>
        {error || `Collection "${collectionSlug}" not found`}
      </div>,
    );
  }

  if (loading) {
    return renderInGutter(<div style={{ padding: '2rem 0' }}>Loading form…</div>);
  }

  if (!fields.length) {
    return renderInGutter(
      <div>
        The {config.labels?.singular || collectionSlug} collection has no fields to display.
      </div>,
    );
  }

  return renderInGutter(
    <>
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
        <RenderFieldLayout
          collectionSlug={collectionSlug}
          fields={fields}
          hasSidebar={hasSidebar}
          layout={layout}
          mainFields={mainFields}
          sidebarFields={sidebarFields}
        />
        {children}
        {!disableSubmit && (
          <div style={{ marginTop: '2rem' }}>
            <FormSubmit>{submitLabel}</FormSubmit>
          </div>
        )}
      </Form>
    </>,
  );
};
