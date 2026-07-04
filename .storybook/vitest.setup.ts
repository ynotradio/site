import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/nextjs-vite';
import * as projectAnnotations from './preview';

/**
 * Apply global Storybook annotations (decorators, parameters, etc.) defined in
 * preview.ts to all Vitest story tests, including the a11y configuration.
 */
const project = setProjectAnnotations([projectAnnotations]);

beforeAll(project.beforeAll);
