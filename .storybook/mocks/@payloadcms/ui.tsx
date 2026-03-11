// Mock implementation of Payload CMS UI hooks for Storybook
// This mock allows stories to provide initial values via story parameters

import React from 'react';

let mockFieldValue = '';
let mockFormFieldsValue: Record<string, any> = {};

export const useField = (props: { path: string }) => {
  return {
    value: mockFieldValue,
    setValue: (newValue: string) => {
      mockFieldValue = newValue;
    },
  };
};

export const useFormFields = (selector?: (fields: any) => any) => {
  if (selector) {
    return selector([mockFormFieldsValue]);
  }
  return mockFormFieldsValue;
};

// Mock Gutter component (wraps content with padding)
export const Gutter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div style={{ padding: '0 var(--gutter-h, 25px)' }}>{children}</div>;
};

// Mock useStepNav hook (for breadcrumbs)
export const useStepNav = () => {
  return {
    setStepNav: () => {
      // No-op in Storybook
    },
  };
};

// Mock useDocumentInfo hook (for custom edit tabs)
export const useDocumentInfo = () => {
  return {
    id: '1',
    collectionSlug: 'mock-collection',
    globalSlug: undefined,
    data: {},
  };
};

// Pre-populated document cache for useListRelationships
let mockRelationshipDocuments: Record<string, Record<string, unknown>> = {};

// Mock useListRelationships hook (for ThumbnailCell and relationship data)
export const useListRelationships = () => {
  return {
    documents: mockRelationshipDocuments,
    getRelationships: () => {
      // No-op in Storybook
    },
  };
};

// Mock useConfig hook (for Payload config access)
export const useConfig = () => {
  return {
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
  };
};

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
};

export const setMockDocuments = (docs: Record<string, Record<string, unknown>>) => {
  mockRelationshipDocuments = docs;
};
