import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

/**
 * Observability log for the editor experience.
 *
 * Rows are written by server hooks (see hooks/observability.ts) via the local
 * API with `overrideAccess`, never by the admin UI — so create/update are
 * closed to everyone and the collection is a read-only, admin-only diagnostic
 * surface. It answers "how often, and where, are editors hitting errors or
 * empty searches?" without any external service.
 */
export const EditorEvents: CollectionConfig = {
  slug: 'editor-events',
  labels: {
    singular: 'Editor Event',
    plural: 'Editor Events',
  },
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['type', 'collectionSlug', 'message', 'userEmail', 'createdAt'],
    group: 'System',
    description:
      'Automatic log of editor-facing errors and empty searches. Read-only; use it to spot recurring pain points.',
    // Diagnostic surface for admins only — hidden from editors/DJs so it never
    // alarms or distracts them.
    hidden: ({ user }) => !hasRole(user, ['admin']),
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => hasRole(req.user, ['admin']),
    // Written only by server hooks (overrideAccess); never created/edited by hand.
    create: () => false,
    update: () => false,
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Error', value: 'error' },
        { label: 'Empty search', value: 'empty-search' },
      ],
      admin: { description: 'What kind of event this is.' },
    },
    {
      name: 'collectionSlug',
      type: 'text',
      index: true,
      admin: { description: 'Which collection the editor was working in.' },
    },
    {
      name: 'operation',
      type: 'text',
      admin: { description: 'The request method / operation (e.g. PATCH, POST, find).' },
    },
    {
      name: 'message',
      type: 'text',
      admin: { description: 'The error message or a summary of the event.' },
    },
    {
      name: 'fieldPath',
      type: 'text',
      admin: { description: 'For validation errors: the field(s) that failed.' },
    },
    {
      name: 'searchQuery',
      type: 'text',
      admin: { description: 'For empty searches: the query/filter that returned nothing.' },
    },
    {
      name: 'userEmail',
      type: 'text',
      index: true,
      admin: { description: 'The editor who experienced the event.' },
    },
    {
      name: 'userId',
      type: 'text',
    },
    {
      name: 'url',
      type: 'text',
      admin: { description: 'The admin page the editor was on.' },
    },
    {
      name: 'userAgent',
      type: 'text',
    },
    {
      name: 'details',
      type: 'json',
      admin: { description: 'Structured context (validation errors, the raw query).' },
    },
  ],
  timestamps: true,
};
