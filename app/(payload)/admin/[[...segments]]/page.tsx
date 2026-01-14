import config from '@payload-config';
import { RootPage } from '@payloadcms/next/views';
import type { Metadata } from 'next';
import { importMap } from '../importMap';

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

// Static metadata to avoid auth issues during build/SSR
export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Y-Not Radio Admin',
};

const Page = ({ params, searchParams }: Args) =>
  RootPage({
    config,
    params,
    searchParams,
    importMap,
  });

export default Page;
