// Test script: Verify custom password registration and authentication flow
async function runTests() {
  console.log('🧪 Starting Registration & Custom Password Flow Tests...\n');
  const baseUrl = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert(healthRes.status === 200, 'Server health check returns 200');

    // 2. Registration validation - rejection on short password (< 6 chars)
    const shortPassRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pass User',
        email: 'shortpass@musclecraft.lk',
        password: '123'
      })
    });
    assert(shortPassRes.status === 400, 'Rejects registration with password shorter than 6 characters');
    const shortPassData = await shortPassRes.json();
    assert(shortPassData.error && shortPassData.error.includes('6 characters'), 'Returns helpful password length error message');

    // 3. Successful registration with custom password
    const testEmail = `athlete_${Date.now()}@testcraft.lk`;
    const customPassword = 'MySecretPass2026!';
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kasun Bandara',
        email: testEmail,
        password: customPassword,
        phone: '+94 77 123 4567',
        packageId: 'standard-strength',
        packageName: 'Standard Strength Program'
      })
    });
    assert(regRes.status === 201, `Registers new athlete successfully (HTTP 201) with custom password`);
    const regData = await regRes.json();
    assert(regData.success === true && regData.user.email === testEmail, 'Response contains created user details');

    // 4. Duplicate registration prevention
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kasun Bandara Duplicate',
        email: testEmail,
        password: 'DifferentPassword123'
      })
    });
    assert(dupRes.status === 409, 'Rejects duplicate email registration with HTTP 409 Conflict');

    // 5. Login with WRONG password
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!'
      })
    });
    assert(wrongPassRes.status === 401, 'Rejects sign in with wrong password (HTTP 401)');
    const wrongPassData = await wrongPassRes.json();
    assert(wrongPassData.error && wrongPassData.error.includes('Incorrect password'), 'Returns friendly incorrect password error message');

    // 6. Login with CORRECT custom password
    const correctPassRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: customPassword
      })
    });
    assert(correctPassRes.status === 200, 'Authenticates successfully with the user\'s custom password (HTTP 200)');
    const authData = await correctPassRes.json();
    assert(authData.user && authData.user.email === testEmail, 'Session contains athlete user details');
    assert(authData.user.role === 'client', 'Athlete assigned correct client role');

    // 7. Seeded admin login still works seamlessly
    const adminRes = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'adeesha@musclecraft.lk',
        password: 'admin'
      })
    });
    assert(adminRes.status === 200, 'Owner/Coach Adeesha login functions seamlessly');
    const adminData = await adminRes.json();
    assert(adminData.user && adminData.user.role === 'admin', 'Admin user retains admin role');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
