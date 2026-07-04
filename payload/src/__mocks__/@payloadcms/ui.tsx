// Mock implementation of Payload CMS UI hooks for Storybook
// This mock allows stories to provide initial values via story parameters

import React from 'react';

let mockFieldValue = '';
let mockFormFieldsValue: Record<string, any> = {};

export const mergeFieldStyles = () => ({});

type FieldLabelProps = { label?: string; required?: boolean; htmlFor?: string };

export const FieldLabel: React.FC<FieldLabelProps> = ({ label, required }) => (
  <label
    style={{
      display: 'block',
      marginBottom: 4,
      fontSize: 13,
      fontWeight: 500,
    }}
  >
    {label}
    {required && <span style={{ color: 'red', marginLeft: 2 }}>*</span>}
  </label>
);

export const useField = () => ({
  value: mockFieldValue,
  setValue: (newValue: string) => {
    mockFieldValue = newValue;
  },
});

export const useFormFields = (selector?: (fields: any) => any) => {
  if (selector) {
    return selector([mockFormFieldsValue]);
  }
  return mockFormFieldsValue;
};

// Mock Gutter component (wraps content with padding)
export const Gutter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding: '0 var(--gutter-h, 25px)' }}>{children}</div>
);

// Mock useStepNav hook (for breadcrumbs)
export const useStepNav = () => ({
  setStepNav: () => {
    // No-op in Storybook
  },
});

// Mock useDocumentInfo hook (for custom edit tabs)
export const useDocumentInfo = () => ({
  id: '1',
  collectionSlug: 'mock-collection',
  globalSlug: undefined,
  data: {},
});

// Pre-populated document cache for useListRelationships
let mockRelationshipDocuments: Record<string, Record<string, unknown>> = {};

// Mock useListRelationships hook (for ThumbnailCell and relationship data)
export const useListRelationships = () => ({
  documents: mockRelationshipDocuments,
  getRelationships: () => {
    // No-op in Storybook
  },
});

// Mock useNav hook (for nav open/close state)
let mockNavOpen = true;

export const useNav = () => ({
  navOpen: mockNavOpen,
  setNavOpen: (open: boolean) => {
    mockNavOpen = open;
  },
  navRef: { current: null },
  hydrated: true,
  shouldAnimate: false,
});

// Mock usePreferences hook (for user preference persistence)
let mockPreferences: Record<string, unknown> = {};

export const usePreferences = () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, max-len, implicit-arrow-linebreak
  getPreference: async <T extends unknown>(key: string): Promise<T | null> => (mockPreferences[key] as T) ?? null, // prettier-ignore
  setPreference: async (key: string, value: unknown) => {
    mockPreferences[key] = value;
  },
});

// Helper to set mock nav preferences for stories
type NavPref = { open?: boolean } | null;
export const setMockNavPreference = (value: NavPref) => {
  if (value === null) {
    delete mockPreferences.nav;
  } else {
    mockPreferences.nav = value;
  }
};

// Mock useConfig hook (for Payload config access)
export const useConfig = () => ({
  config: {
    admin: {
      components: {},
    },
    collections: [],
    globals: [],
    routes: {
      admin: '/admin',
      api: '/api',
    },
    serverURL: 'http://localhost:3000',
  },
  // Returns undefined for any slug — components should handle the missing-config case gracefully
  getEntityConfig: () => undefined,
});

// Helper to set mock values (used by stories)
export const setMockFieldValue = (value: string) => {
  mockFieldValue = value;
};

export const setMockFormFields = (fields: Record<string, any>) => {
  mockFormFieldsValue = fields;
};

export const resetMocks = () => {
  mockFieldValue = '';
  mockFormFieldsValue = {};
  mockRelationshipDocuments = {};
  mockNavOpen = true;
  mockPreferences = {};
};

export const setMockDocuments = (docs: Record<string, Record<string, unknown>>) => {
  mockRelationshipDocuments = docs;
};

export const Form: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <form>{children}</form>
);

export const FormSubmit: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <button type="submit">{children}</button>
);

export const RenderFields: React.FC<{ fields?: unknown }> = () => (
  <div data-testid="render-fields" />
);

// Stable reference — avoids infinite re-render loops when components list
// getFormState as a useEffect dependency (a new function reference on every
// render would otherwise re-trigger the effect on every state update).
const stableGetFormState = async () => ({ state: {} });

export const useServerFunctions = () => ({
  getFormState: stableGetFormState,
});

export const toast = {
  success: () => {},
  error: () => {},
  info: () => {},
};
