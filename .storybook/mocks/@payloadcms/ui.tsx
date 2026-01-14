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
};
