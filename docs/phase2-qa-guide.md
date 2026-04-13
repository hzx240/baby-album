# Phase 2 QA Testing Guide

## 🎯 Phase 2 Overview

**Objective**: Comprehensive quality assurance for Phase 2 deliverables
**Duration**: Week 1-4 (parallel with development)
**Team Role**: QA Engineer

---

## 📋 Test Coverage Checklist

### Backend Tests
**File**: `backend/test/`

#### Unit Tests
```bash
# Test coverage targets
npm run test:cov

# Minimum coverage:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%
```

**Test Files to Create**:
```
backend/test/unit/
├── auth/
│   ├── auth.service.spec.ts
│   ├── jwt.strategy.spec.ts
│   └── local.strategy.spec.ts
├── family/
│   ├── family.service.spec.ts
│   └── family.controller.spec.ts
├── media/
│   ├── media.service.spec.ts
│   └── file-validation.service.spec.ts
├── users/
│   └── users.service.spec.ts
└── common/
    └── interceptors.spec.ts
```

#### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test
npm run test:e2e -- auth.e2e-spec.ts
```

**Test Files to Create**:
```
backend/test/e2e/
├── auth.e2e-spec.ts
├── family.e2e-spec.ts
├── media.e2e-spec.ts
├── users.e2e-spec.ts
└── security.e2e-spec.ts
```

---

### Frontend Tests
**File**: `frontend/test/`

#### Unit Tests
```bash
npm run test
```

**Test Files to Create**:
```
frontend/src/__tests__/
├── components/
│   ├── feed/post-card.test.tsx
│   ├── media/uploader.test.tsx
│   └── auth/login-form.test.tsx
├── hooks/
│   ├── use-auth.test.ts
│   └── use-websocket.test.ts
└── lib/
    └── api-client.test.ts
```

#### E2E Tests (Playwright)
```bash
npm run test:e2e
```

**Test Scenarios**:
```
frontend/test/e2e/
├── auth/
│   ├── login.spec.ts
│   ├── register.spec.ts
│   └── logout.spec.ts
├── family/
│   ├── create-family.spec.ts
│   ├── invite-member.spec.ts
│   └── feed.spec.ts
└── media/
    └── upload.spec.ts
```

---

## 🔍 Security Test Scenarios

### P0: Cross-Family Data Access
```typescript
// backend/test/e2e/security.e2e-spec.ts
describe('Cross-Family Access Prevention', () => {
  it('should block user from accessing other family data', async () => {
    // User 1 in Family A
    const user1 = await createUser();
    const familyA = await createFamily(user1);

    // User 2 in Family B
    const user2 = await createUser();
    const familyB = await createFamily(user2);

    // User 2 tries to access Family A posts
    const response = await request(app.getHttpServer())
      .get(`/families/${familyA.id}/posts`)
      .set('Authorization', `Bearer ${user2.token}`)
      .expect(403);
  });
});
```

### P0: Token Blacklist Verification
```typescript
describe('Logout Token Revocation', () => {
  it('should invalidate access token after logout', async () => {
    const user = await createUser();
    const token = user.token;

    // Logout
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Try to use token again
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401); // Unauthorized
  });
});
```

### File Upload Security
```typescript
describe('File Upload Security', () => {
  it('should reject files with dangerous extensions', async () => {
    const fakeExe = Buffer.from([0x4d, 0x5a]); // MZ header

    await request(app.getHttpServer())
      .post('/media/request-upload')
      .field('filename', 'test.exe')
      .field('contentType', 'image/jpeg')
      .field('fileSize', fakeExe.length)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('should verify magic numbers match declared type', async () => {
    const fakeJpg = Buffer.from([0x00, 0x00, 0x00]); // Invalid JPEG

    await request(app.getHttpServer())
      .post('/media/validate')
      .send({ buffer: fakeJpg, mimeType: 'image/jpeg' })
      .expect(400);
  });
});
```

---

## 🧪 Performance Testing

### Load Testing (k6)
```javascript
// tests/performance/feed-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up
    { duration: '1m', target: 100 },    // Sustained load
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],     // Error rate < 1%
  },
};

export default function () {
  let response = http.get('http://localhost:3000/api/family/posts', {
    headers: { Authorization: `Bearer ${__ENV.TOKEN}` },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Run load test**:
```bash
k6 run tests/performance/feed-load.js
```

---

## 📱 Cross-Browser Testing

### Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Test Script (Playwright)
```typescript
// frontend/test/e2e/browser-compat.spec.ts
import { test, expect } from '@playwright/test';

for (const browser of ['chromium', 'firefox', 'webkit']) {
  test.describe(`Browser: ${browser}`, () => {
    test.use({ browserName: browser });

    test('feed renders correctly', async ({ page }) => {
      await page.goto('/feed');
      await expect(page.locator('[data-testid="post-list"]')).toBeVisible();
    });

    test('media upload works', async ({ page }) => {
      await page.goto('/media/upload');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('test-image.jpg');
      await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    });
  });
}
```

---

## 🐛 Bug Reporting Template

```markdown
## Bug Report

### Summary
[One-line description]

### Steps to Reproduce
1. Go to...
2. Click on...
3. Scroll to...
4. See error

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happened]

### Screenshots
[Attach if applicable]

### Environment
- Browser: [Chrome 120]
- OS: [Windows 11]
- Device: [Desktop/Mobile]

### Severity
- [ ] P0 - Blocker
- [ ] P1 - Critical
- [ ] P2 - Major
- [ ] P3 - Minor

### Logs
```
[Paste error logs here]
```
```

---

## ✅ Phase 2 Exit Criteria

### Backend
- [ ] Unit test coverage > 80%
- [ ] All E2E tests passing
- [ ] Security tests passing (no P0/P1 vulnerabilities)
- [ ] API response time P95 < 500ms
- [ ] No memory leaks under load
- [ ] Database queries optimized (N+1 fixed)

### Frontend
- [ ] Component tests passing
- [ ] E2E tests passing on all browsers
- [ ] Lighthouse score > 90 for all metrics
- [ ] No console errors
- [ ] Accessibility score > 95
- [ ] Responsive on all breakpoints

### Security
- [ ] OWASP ZAP scan: 0 high/critical issues
- [ ] All P0 security tests passing
- [ ] No hardcoded secrets
- [ ] HTTPS enforced in production
- [ ] Rate limiting functional

---

## 📝 QA Notes

- Run tests after every code change
- Create test cases for bug fixes (regression tests)
- Document all test results
- Maintain test data fixtures
- Keep test environment in sync with production
- Automate repetitive test scenarios

---

## 🔗 Related Documentation

- [Phase 1 Summary](../docs/phase1-summary.md)
- [Backend Guide](../docs/phase2-backend-guide.md)
- [Frontend Guide](../docs/phase2-frontend-guide.md)
