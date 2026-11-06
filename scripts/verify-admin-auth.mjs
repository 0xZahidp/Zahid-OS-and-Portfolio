// verify-admin-auth.mjs
// Automated Security Verification Test Suite

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const API_DIR = path.join(ROOT_DIR, 'src', 'app', 'api');

// Fallback port for test server
const TEST_PORT = process.env.TEST_PORT || '3005';
const BASE_URL = process.env.TEST_HOST || `http://localhost:${TEST_PORT}`;

// 1. Parse Public Routes from src/lib/auth/public-routes.ts
function loadPublicRoutes() {
  const fileContent = fs.readFileSync(
    path.join(ROOT_DIR, 'src', 'lib', 'auth', 'public-routes.ts'),
    'utf-8'
  );

  const publicRoutes = [];
  const regex = /method:\s*'(GET|POST|DELETE|PATCH|PUT)',\s*path:\s*'([^']+)'/g;
  let match;
  while ((match = regex.exec(fileContent)) !== null) {
    publicRoutes.push({
      method: match[1].toUpperCase(),
      path: match[2].replace(/\/$/, '') || '/',
    });
  }
  return publicRoutes;
}

// 2. Discover all route.ts files and exported methods
function discoverRoutes(dir, currentPath = '/api') {
  const routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...discoverRoutes(fullPath, `${currentPath}/${entry.name}`));
    } else if (entry.isFile() && entry.name === 'route.ts') {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const methodRegex = /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;
      const methods = [];
      let m;
      while ((m = methodRegex.exec(content)) !== null) {
        methods.push(m[2]);
      }

      routes.push({
        filePath: path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/'),
        apiPath: currentPath.replace(/\/$/, '') || '/',
        methods,
      });
    }
  }

  return routes;
}

// Helper to make HTTP request
function sendRequest(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      headers: {
        ...headers,
      },
    };

    if (body && !options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

// Check if a port is already listening
function isPortInUse(port) {
  return new Promise((resolve) => {
    const testReq = http.request(
      { hostname: '127.0.0.1', port, path: '/', method: 'GET', timeout: 1000 },
      () => resolve(true)
    );
    testReq.on('error', () => resolve(false));
    testReq.on('timeout', () => {
      testReq.destroy();
      resolve(false);
    });
    testReq.end();
  });
}

// Wait for server to become healthy
async function waitForServer(retries = 30, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await sendRequest('GET', '/api/content');
      if (res.status === 200) {
        return true;
      }
    } catch {
      // server still starting
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function main() {
  console.log('='.repeat(78));
  console.log('FolioFrame Security Verification Suite: Admin Auth & Route Hardening');
  console.log('='.repeat(78));

  const publicRoutes = loadPublicRoutes();
  console.log(`\n[+] Loaded ${publicRoutes.length} explicitly approved public routes:`);
  for (const pr of publicRoutes) {
    console.log(`    - ${pr.method.padEnd(6)} ${pr.path}`);
  }

  const discoveredRoutes = discoverRoutes(API_DIR);
  const totalEndpoints = discoveredRoutes.reduce((acc, r) => acc + r.methods.length, 0);
  console.log(`\n[+] Discovered ${discoveredRoutes.length} route files with ${totalEndpoints} HTTP handler methods in src/app/api/**`);

  let serverProcess = null;
  const isRunning = await isPortInUse(TEST_PORT);

  if (!isRunning) {
    console.log(`\n[+] Starting production test server on port ${TEST_PORT}...`);
    serverProcess = spawn('npx', ['next', 'start', '-p', TEST_PORT], {
      cwd: ROOT_DIR,
      shell: true,
      stdio: 'pipe',
      env: {
        ...process.env,
        RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET || 'whsec_verification_test_secret_32bytes',
      },
    });

    const ready = await waitForServer(30, 1000);
    if (!ready) {
      console.error('\n[-] Failed to start test server within 30 seconds.');
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
    console.log(`[+] Test server ready at ${BASE_URL}\n`);
  } else {
    console.log(`\n[+] Using active server at ${BASE_URL}\n`);
  }

  let passedTests = 0;
  let failedTests = 0;
  const failureDetails = [];

  for (const route of discoveredRoutes) {
    for (const method of route.methods) {
      if (['OPTIONS', 'HEAD'].includes(method)) continue;

      const isPublic = publicRoutes.some(
        (p) => p.method === method && p.path === route.apiPath
      );

      const endpointLabel = `${method.padEnd(6)} ${route.apiPath}`;
      process.stdout.write(`Testing: ${endpointLabel.padEnd(45)} [${isPublic ? 'PUBLIC' : 'PROTECTED'}] ... `);

      const testBody = ['POST', 'PUT', 'PATCH'].includes(method) ? '{}' : null;

      try {
        if (isPublic) {
          // Public Route Test:
          // Treat ANY 5xx response on a public route as FAIL
          const res = await sendRequest(method, route.apiPath, {}, testBody);
          if (res.status >= 500) {
            failedTests++;
            console.log(`FAIL (Unexpected ${res.status} server error on public route)`);
            failureDetails.push(`${endpointLabel}: Returned server error status ${res.status}`);
          } else if (route.apiPath === '/api/auth/reset-password') {
            // Password reset requires valid recovery Bearer token; 401 without token is expected
            if (res.status === 401) {
              passedTests++;
              console.log(`PASS (Status 401 - Enforces recovery token verification)`);
            } else {
              failedTests++;
              console.log(`FAIL (Unexpected ${res.status})`);
              failureDetails.push(`${endpointLabel}: Expected 401 without recovery token, got ${res.status}`);
            }
          } else if (route.apiPath === '/api/webhooks/resend') {
            // Unsigned webhook request must return 401 (not 500)
            const badlySignedRes = await sendRequest(
              'POST',
              route.apiPath,
              {
                'svix-id': 'msg_fake123',
                'svix-timestamp': '12345678',
                'svix-signature': 'v1,fake_signature_hash',
              },
              testBody
            );

            const unsignedPassed = res.status === 401;
            const badSignaturePassed = badlySignedRes.status === 401;

            if (unsignedPassed && badSignaturePassed) {
              passedTests++;
              console.log(`PASS (Unsigned: ${res.status}, BadSignature: ${badlySignedRes.status})`);
            } else {
              failedTests++;
              console.log(`FAIL (Unsigned: ${res.status}, BadSignature: ${badlySignedRes.status})`);
              failureDetails.push(`${endpointLabel}: Expected 401 on unsigned/badly signed webhook, got unsigned=${res.status}, badSig=${badlySignedRes.status}`);
            }
          } else if (res.status === 401 || res.status === 403) {
            failedTests++;
            console.log(`FAIL (Unexpected ${res.status} on public route)`);
            failureDetails.push(`${endpointLabel}: Expected public access, got ${res.status}`);
          } else {
            passedTests++;
            console.log(`PASS (Status ${res.status})`);
          }
        } else {
          // Protected Route:
          // 1. Unauthenticated Request -> Must be 401 or 403
          const unauthRes = await sendRequest(method, route.apiPath, {}, testBody);
          const unauthPassed = unauthRes.status === 401 || unauthRes.status === 403;

          // 2. Deprecated x-admin-key Request -> Must STILL be 401 or 403
          const staticKeyRes = await sendRequest(
            method,
            route.apiPath,
            { 'x-admin-key': 'folioframe_admin' },
            testBody
          );
          const staticKeyPassed = staticKeyRes.status === 401 || staticKeyRes.status === 403;

          // 3. Forged Bearer Token -> Must be 401 or 403
          const fakeTokenRes = await sendRequest(
            method,
            route.apiPath,
            { Authorization: 'Bearer fake-invalid-jwt-token-12345' },
            testBody
          );
          const fakeTokenPassed = fakeTokenRes.status === 401 || fakeTokenRes.status === 403;

          if (unauthPassed && staticKeyPassed && fakeTokenPassed) {
            passedTests++;
            console.log(`PASS (Unauth: ${unauthRes.status}, StaticKey: ${staticKeyRes.status}, FakeToken: ${fakeTokenRes.status})`);
          } else {
            failedTests++;
            console.log(`FAIL (Unauth: ${unauthRes.status}, StaticKey: ${staticKeyRes.status}, FakeToken: ${fakeTokenRes.status})`);
            failureDetails.push(
              `${endpointLabel}: Failed lockdown check -> unauth=${unauthRes.status}, staticKey=${staticKeyRes.status}, fakeToken=${fakeTokenRes.status}`
            );
          }
        }
      } catch (err) {
        failedTests++;
        console.log(`ERROR (${err.message})`);
        failureDetails.push(`${endpointLabel}: Error making request: ${err.message}`);
      }
    }
  }

  // --- Specialized Verification: Temp Mail Token Access Controls ---
  console.log('\n' + '-'.repeat(78));
  console.log('SPECIALIZED TEST: TEMP MAIL INBOX TOKEN PROTECTION');
  console.log('-'.repeat(78));

  // Test 1: GET /api/os/temp-mail with inbox query but WITHOUT token
  process.stdout.write('Testing: GET /api/os/temp-mail?inbox=test@zahidp.com (no token) ... ');
  try {
    const noTokenRes = await sendRequest('GET', '/api/os/temp-mail?inbox=test%40zahidp.com');
    let parsedData = {};
    try { parsedData = JSON.parse(noTokenRes.data); } catch {}
    const hasNoInboxData = !parsedData.inbox && !parsedData.messages;
    const isRejected = (noTokenRes.status === 400 || noTokenRes.status === 401) && hasNoInboxData;

    if (isRejected) {
      passedTests++;
      console.log(`PASS (Status ${noTokenRes.status}, no inbox data exposed)`);
    } else {
      failedTests++;
      console.log(`FAIL (Status ${noTokenRes.status}, data exposed: ${Boolean(parsedData.inbox)})`);
      failureDetails.push(`GET /api/os/temp-mail without token must return 400/401 with no inbox data; got ${noTokenRes.status}`);
    }
  } catch (err) {
    failedTests++;
    console.log(`ERROR (${err.message})`);
    failureDetails.push(`GET /api/os/temp-mail without token error: ${err.message}`);
  }

  // Test 2: GET /api/os/temp-mail with inbox query and WRONG token
  process.stdout.write('Testing: GET /api/os/temp-mail?inbox=test@zahidp.com&token=wrong-token ... ');
  try {
    const wrongTokenRes = await sendRequest('GET', '/api/os/temp-mail?inbox=test%40zahidp.com&token=invalid-wrong-token-999');
    let parsedData = {};
    try { parsedData = JSON.parse(wrongTokenRes.data); } catch {}
    const hasNoInboxData = !parsedData.inbox && !parsedData.messages;
    const isRejected = (wrongTokenRes.status === 400 || wrongTokenRes.status === 401) && hasNoInboxData;

    if (isRejected) {
      passedTests++;
      console.log(`PASS (Status ${wrongTokenRes.status}, no inbox data exposed)`);
    } else {
      failedTests++;
      console.log(`FAIL (Status ${wrongTokenRes.status}, data exposed: ${Boolean(parsedData.inbox)})`);
      failureDetails.push(`GET /api/os/temp-mail with wrong token must return 400/401 with no inbox data; got ${wrongTokenRes.status}`);
    }
  } catch (err) {
    failedTests++;
    console.log(`ERROR (${err.message})`);
    failureDetails.push(`GET /api/os/temp-mail with wrong token error: ${err.message}`);
  }

  // --- Optional Authenticated Section ---
  console.log('\n' + '-'.repeat(78));
  console.log('AUTHENTICATED ADMIN ENDPOINT VERIFICATION');
  console.log('-'.repeat(78));

  const adminTestToken = process.env.ADMIN_TEST_TOKEN;
  if (adminTestToken) {
    console.log('[+] ADMIN_TEST_TOKEN detected in environment. Running positive authorization assertions...');
    const authedEndpoints = [
      '/api/admin/career',
      '/api/admin/health',
      '/api/mail/messages',
    ];

    for (const ep of authedEndpoints) {
      process.stdout.write(`Testing: GET ${ep.padEnd(35)} (Authenticated Bearer) ... `);
      try {
        const authRes = await sendRequest('GET', ep, { Authorization: `Bearer ${adminTestToken}` });
        if (authRes.status === 200) {
          passedTests++;
          console.log('PASS (Status 200)');
        } else {
          failedTests++;
          console.log(`FAIL (Expected 200, got ${authRes.status})`);
          failureDetails.push(`GET ${ep}: Authenticated request failed with status ${authRes.status}`);
        }
      } catch (err) {
        failedTests++;
        console.log(`ERROR (${err.message})`);
        failureDetails.push(`GET ${ep}: Authenticated request error: ${err.message}`);
      }
    }
  } else {
    console.log('[i] NOTICE: ADMIN_TEST_TOKEN is unset in environment.');
    console.log('    Skipping positive authenticated checks (GET /api/admin/career, /api/admin/health, /api/mail/messages).');
  }

  // Cleanup
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }

  console.log('\n' + '='.repeat(78));
  console.log('TEST SUMMARY RESULTS');
  console.log('='.repeat(78));
  console.log(`Total Endpoint Handlers Tested: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);

  if (failureDetails.length > 0) {
    console.log('\nFailures:');
    failureDetails.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  } else {
    console.log('\n[SUCCESS] ALL API ENDPOINTS STRICTLY ENFORCE AUTHORIZATION MATRIX!');
    console.log('  ✔ Every non-public route successfully blocked unauthenticated access (401/403).');
    console.log('  ✔ Deprecated static x-admin-key bypass is completely dead (401/403).');
    console.log('  ✔ Forged / untrusted bearer tokens are completely rejected (401/403).');
    console.log('  ✔ All public allowlisted routes remain functioning as expected.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
