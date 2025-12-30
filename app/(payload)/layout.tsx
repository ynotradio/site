import config from '@payload-config';
import '@payloadcms/next/css';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import type { ServerFunctionClient } from 'payload';
import React from 'react';
import { importMap } from './admin/importMap';
import './custom.scss';

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function serverFunc(args) {
  'use server';

  try {
    return await handleServerFunctions({
      ...args,
      config,
      importMap,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Server Function] Error:', {
      message: error instanceof Error ? error.message : String(error),
      functionName: args.name,
    });
    throw error;
  }
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
