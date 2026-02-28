/**
 * CSRF Protection Integration Test
 *
 * This file contains manual test cases to verify CSRF protection is working correctly.
 * Run these tests in the browser console after the app starts.
 */

import { api, initCsrfToken } from './api-client';

/**
 * Test 1: Verify CSRF token is initialized on app startup
 */
export async function testCsrfTokenInitialization() {
  console.log('Test 1: CSRF Token Initialization');

  // Check if csrf-token cookie exists
  const csrfCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='));

  if (csrfCookie) {
    console.log('✅ CSRF token cookie found:', csrfCookie);
    return true;
  } else {
    console.log('❌ CSRF token cookie not found');
    console.log('Attempting to initialize...');
    await initCsrfToken();

    const retryCheck = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf-token='));

    if (retryCheck) {
      console.log('✅ CSRF token initialized successfully:', retryCheck);
      return true;
    } else {
      console.log('❌ Failed to initialize CSRF token');
      return false;
    }
  }
}

/**
 * Test 2: Verify CSRF token is added to POST requests
 */
export async function testCsrfTokenInPostRequest() {
  console.log('Test 2: CSRF Token in POST Request');

  // Mock POST request (will fail if endpoint doesn't exist, but we can check headers)
  try {
    await api.post('/api/test-csrf', { test: true });
  } catch (error: any) {
    // Check if CSRF token was added to the request
    const csrfHeader = error.config?.headers?.['X-CSRF-Token'];

    if (csrfHeader) {
      console.log('✅ CSRF token added to POST request:', csrfHeader);
      return true;
    } else {
      console.log('❌ CSRF token not added to POST request');
      return false;
    }
  }

  return false;
}

/**
 * Test 3: Verify CSRF token is NOT added to GET requests
 */
export async function testCsrfTokenNotInGetRequest() {
  console.log('Test 3: CSRF Token NOT in GET Request');

  try {
    await api.get('/api/test-csrf');
  } catch (error: any) {
    // Check if CSRF token was NOT added to the request
    const csrfHeader = error.config?.headers?.['X-CSRF-Token'];

    if (!csrfHeader) {
      console.log('✅ CSRF token correctly NOT added to GET request');
      return true;
    } else {
      console.log('❌ CSRF token incorrectly added to GET request');
      return false;
    }
  }

  return false;
}

/**
 * Run all tests
 */
export async function runAllCsrfTests() {
  console.log('=== CSRF Protection Integration Tests ===\n');

  const test1 = await testCsrfTokenInitialization();
  console.log('');

  const test2 = await testCsrfTokenInPostRequest();
  console.log('');

  const test3 = await testCsrfTokenNotInGetRequest();
  console.log('');

  const allPassed = test1 && test2 && test3;

  console.log('=== Test Results ===');
  console.log(`Test 1 (Initialization): ${test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (POST Request): ${test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 (GET Request): ${test3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  return allPassed;
}

// Export for manual testing in console
if (typeof window !== 'undefined') {
  (window as any).csrfTests = {
    runAll: runAllCsrfTests,
    test1: testCsrfTokenInitialization,
    test2: testCsrfTokenInPostRequest,
    test3: testCsrfTokenNotInGetRequest,
  };

  console.log('CSRF tests available in console: window.csrfTests.runAll()');
}
