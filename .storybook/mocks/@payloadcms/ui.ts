// Mock implementation of Payload CMS UI hooks for Storybook
// This mock allows stories to provide initial values via story parameters

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
