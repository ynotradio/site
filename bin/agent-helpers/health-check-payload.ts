#!/usr/bin/env tsx

/**
 * Health check script for Payload CMS
 * Runs comprehensive checks against the Payload API
 * Usage: npx tsx bin/agent-helpers/health-check-payload.ts
 */

import axios from 'axios';

const PAYLOAD_URL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000';
const API_URL = `${PAYLOAD_URL}/api`;

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: HealthCheckResult[] = [];

/**
 * Add a health check result
 */
function addResult(name: string, status: 'pass' | 'fail' | 'warn', message: string): void {
  results.push({ name, status, message });
}

/**
 * Check if API endpoint is accessible
 */
async function checkApiEndpoint(): Promise<void> {
  try {
    const response = await axios.get(`${API_URL}/users`, {
      timeout: 5000,
      validateStatus: (status) => status === 200 || status === 401 || status === 403,
    });

    if (response.status === 200 || response.status === 401 || response.status === 403) {
      addResult('API Endpoint', 'pass', `API responding (HTTP ${response.status})`);
    } else {
      addResult('API Endpoint', 'warn', `Unexpected HTTP ${response.status}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      addResult('API Endpoint', 'fail', `Connection failed: ${error.message}`);
    } else {
      addResult('API Endpoint', 'fail', 'Unknown error');
    }
  }
}

/**
 * Check GraphQL endpoint
 */
async function checkGraphQLEndpoint(): Promise<void> {
  try {
    const response = await axios.post(
      `${API_URL}/graphql`,
      {
        query: '{ Access { collections { Users { create { permission } } } } }',
      },
      {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      },
    );

    if (response.status === 200) {
      addResult('GraphQL Endpoint', 'pass', 'GraphQL API responding');
    } else {
      addResult('GraphQL Endpoint', 'warn', `HTTP ${response.status}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      addResult('GraphQL Endpoint', 'fail', `Connection failed: ${error.message}`);
    } else {
      addResult('GraphQL Endpoint', 'fail', 'Unknown error');
    }
  }
}

/**
 * Check if key collections are accessible
 */
async function checkCollections(): Promise<void> {
  const collections = [
    'users',
    'media',
    'people',
    'djs',
    'artists',
    'venues',
    'concerts',
    'shows',
    'posts',
  ];

  for (const collection of collections) {
    try {
      const response = await axios.get(`${API_URL}/${collection}`, {
        timeout: 5000,
        validateStatus: (status) => status === 200 || status === 401 || status === 403,
      });

      if (response.status === 200 || response.status === 401 || response.status === 403) {
        addResult(
          `Collection: ${collection}`,
          'pass',
          `Accessible (HTTP ${response.status})`,
        );
      } else {
        addResult(
          `Collection: ${collection}`,
          'warn',
          `Unexpected HTTP ${response.status}`,
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          addResult(
            `Collection: ${collection}`,
            'warn',
            'Collection not found (may not be created yet)',
          );
        } else {
          addResult(
            `Collection: ${collection}`,
            'fail',
            `Failed: ${error.message}`,
          );
        }
      } else {
        addResult(`Collection: ${collection}`, 'fail', 'Unknown error');
      }
    }
  }
}

/**
 * Check Admin UI accessibility
 */
async function checkAdminUI(): Promise<void> {
  try {
    const response = await axios.get(`${PAYLOAD_URL}/admin`, {
      timeout: 5000,
      validateStatus: () => true,
    });

    if (response.status === 200 || response.status === 302) {
      addResult('Admin UI', 'pass', `Accessible (HTTP ${response.status})`);
    } else {
      addResult('Admin UI', 'warn', `HTTP ${response.status}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      addResult('Admin UI', 'fail', `Connection failed: ${error.message}`);
    } else {
      addResult('Admin UI', 'fail', 'Unknown error');
    }
  }
}

/**
 * Print results in a formatted way
 */
function printResults(): void {
  console.log('');
  console.log('Health Check Results:');
  console.log('=====================');
  console.log('');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warned = results.filter((r) => r.status === 'warn').length;

  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
  });

  console.log('');
  console.log('Summary:');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ⚠️  Warnings: ${warned}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log('❌ Health check failed');
    process.exit(1);
  } else if (warned > 0) {
    console.log('⚠️  Health check passed with warnings');
  } else {
    console.log('✅ All health checks passed!');
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('🏥 Running Payload CMS Health Checks...');
  console.log(`   Target: ${PAYLOAD_URL}`);
  console.log('');

  await checkApiEndpoint();
  await checkGraphQLEndpoint();
  await checkAdminUI();
  await checkCollections();

  printResults();
}

// Run main function
main().catch((error) => {
  console.error('❌ Health check error:', error);
  process.exit(1);
});
