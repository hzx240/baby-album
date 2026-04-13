# Phase 2 Backend Development Guide

## 🎯 Phase 2 Overview

**Objective**: Implement core business logic and data persistence layer
**Duration**: Week 1-2
**Team Role**: Backend Developer (backend-dev)

---

## 📋 Task List

### 1. Token Blacklist Implementation (P0 Remnant)
**Priority**: P0 - Critical Security
**Estimated Time**: 2-3 hours
**Files**:
- `backend/src/auth/auth.service.ts:97-120`
- `backend/src/auth/strategies/jwt.strategy.ts`

**Requirements**:
```typescript
// 1. Add to AuthService.logout()
async logout(userId: string, accessToken: string) {
  // Blacklist both access AND refresh tokens
  const decoded = this.jwtService.decode(accessToken);
  const ttl = decoded.exp - Date.now() / 1000;

  await this.cacheService.set(
    `blacklist:${accessToken}`,
    '1',
    Math.ceil(ttl),
  );

  // Also blacklist refresh token
  const refreshToken = await this.prisma.refreshToken.findUnique({
    where: { token: refreshToken }
  });

  if (refreshToken) {
    await this.cacheService.set(
      `blacklist:${refreshToken.token}`,
      '1',
      60 * 60 * 24 * 7, // 7 days
    );
    await this.prisma.refreshToken.delete({
      where: { token: refreshToken.token }
    });
  }
}

// 2. Add JWT Strategy validation
async validate(payload: any) {
  // Check blacklist
  const isBlacklisted = await this.cacheService.get(
    `blacklist:${this.request.headers.authorization?.replace('Bearer ', '')}`
  );

  if (isBlacklisted) {
    throw new UnauthorizedException('Token has been revoked');
  }

  // ... rest of validation
}
```

**Testing**:
```bash
# Test token blacklist
npm run test:e2e -- auth-logout.spec.ts
```

---

### 2. Prisma Schema Relations
**Priority**: P1
**Files**: `backend/prisma/schema.prisma`

**Actions**:
1. Review all relations for proper cascade behavior
2. Add `onDelete` constraints where missing
3. Verify indexes exist for foreign keys

**Example**:
```prisma
model Family {
  members      FamilyMember[] @relation(onDelete: Cascade)
  invitations  Invitation[]    @relation(onDelete: Cascade)
  posts        Post[]          @relation(onDelete: Cascade)
  albums       Album[]         @relation(onDelete: Cascade)
}

model Post {
  family      Family     @relation(fields: [familyId], references: [id], onDelete: Cascade)
  author      User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments    Comment[]  @relation(onDelete: Cascade)
  likes       Like[]     @relation(onDelete: Cascade)
}
```

---

### 3. Database Transaction Safety
**Priority**: P1
**Files**: All service files with multi-step operations

**Pattern**:
```typescript
async complexOperation(data: any) {
  return this.prisma.$transaction(async (tx) => {
    // Step 1
    const item = await tx.item.create({ ... });

    // Step 2
    await tx.related.create({ ... });

    // Step 3
    await tx.auditLog.create({ ... });

    return item;
  });
}
```

**Apply to**:
- `FamilyService.inviteMember()`
- `PostService.createPost()`
- `MediaService.uploadComplete()`

---

### 4. Performance Optimization
**Priority**: P2
**Actions**:

#### 4.1 Add Database Indexes
```prisma
// Add to schema.prisma
model Post {
  // ... fields

  @@index([familyId, createdAt(sort: Desc)])
  @@index([authorId])
}

model Comment {
  @@index([postId, createdAt(sort: Desc)])
}

model Like {
  @@index([userId, postId])
  @@unique([userId, postId]) // Prevent duplicate likes
}
```

#### 4.2 Add Response Caching
```typescript
// Add to controllers
@Get()
@CacheKey('family-posts')
@CacheTTL(60) // 60 seconds
async getPosts() {
  // ...
}
```

---

## ✅ Definition of Done

- [ ] Token blacklist fully implemented and tested
- [ ] All Prisma relations have proper cascade deletes
- [ ] Multi-step operations wrapped in transactions
- [ ] Critical database indexes added
- [ ] All endpoints have unit tests (>80% coverage)
- [ ] E2E tests pass for modified features
- [ ] API documentation updated

---

## 🧪 Testing Commands

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Test specific file
npm run test -- auth.service.spec.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

---

## 📝 Notes

- Always write tests before implementation (TDD)
- Run linter before committing: `npm run lint`
- Use TypeScript strict mode compliance
- Follow existing code patterns and conventions
- Document any breaking changes in CHANGELOG.md

---

## 🔗 Related Documentation

- [Phase 1 Summary](../docs/phase1-summary.md)
- [Frontend Guide](../docs/phase2-frontend-guide.md)
- [QA Guide](../docs/phase2-qa-guide.md)
