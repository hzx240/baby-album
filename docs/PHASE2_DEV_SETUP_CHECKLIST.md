# Phase 2 Development Environment Setup
## 宝宝相册应用 - 第二阶段开发环境配置清单

**Last Updated:** 2026-02-13
**Target Date:** Complete by 2026-02-14 (before kickoff)

---

## Pre-Setup Checklist

### Prerequisites
- [ ] Node.js 20+ installed
- [ ] pnpm 8+ installed
- [ ] Docker Desktop installed and running
- [ ] Git installed and configured
- [ ] VS Code installed (recommended IDE)
- [ ] Postman or Insomnia installed (for API testing)

### Access Requirements
- [ ] GitHub repository access
- [ ] AWS S3 credentials (for uploads)
- [ ] Redis connection string (for caching)
- [ ] Database connection string
- [ ] AI Vision API credentials (if using Cloud Vision)

---

## Backend Development Setup

### 1. Environment Variables
```bash
cd backend
cp .env.example .env
```

**Required Variables:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/baby_album"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="baby-album-photos"

# AI Vision (Optional)
GOOGLE_CLOUD_VISION_API_KEY="your-api-key"

# App
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

### 2. Dependencies Installation
```bash
cd backend
pnpm install
```

**Key Dependencies for Phase 2:**
- `@nestjs/bull` - Job queue for batch processing
- `@tensorflow/tfjs-node` - AI vision processing
- `sharp` - Image optimization
- `bull-board` - Job queue monitoring
- `exifr` - EXIF data extraction

### 3. Database Setup
```bash
# Run database migrations
pnpm prisma migrate dev

# Seed database (optional)
pnpm prisma db seed

# Open Prisma Studio
pnpm prisma studio
```

### 4. Redis Setup (Local Development)
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or use docker-compose
docker-compose up -d redis
```

### 5. Start Backend Server
```bash
# Development mode
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod
```

**Verify:**
- [ ] Backend running on http://localhost:3001
- [ ] Health check: http://localhost:3001/health
- [ ] API docs: http://localhost:3001/api/docs

---

## Frontend Development Setup

### 1. Environment Variables
```bash
cd frontend
cp .env.example .env
```

**Required Variables:**
```env
VITE_API_URL="http://localhost:3001"
VITE_WS_URL="ws://localhost:3001"
VITE_ENABLE_BATCH_UPLOAD="true"
VITE_ENABLE_SMART_ALBUMS="true"
VITE_ENABLE_TIMELINE="true"
```

### 2. Dependencies Installation
```bash
cd frontend
pnpm install
```

**Key Dependencies for Phase 2:**
- `@tanstack/react-query` - Server state management
- `react-dropzone` - Drag-and-drop uploads
- `react-virtuoso` - Virtual scrolling for timeline
- `recharts` - Timeline visualization (optional)
- `socket.io-client` - Real-time progress updates

### 3. Start Frontend Server
```bash
# Development mode
pnpm dev

# Production build
pnpm build
pnpm preview
```

**Verify:**
- [ ] Frontend running on http://localhost:3000
- [ ] No console errors
- [ ] Backend API accessible

---

## Docker Setup (Optional but Recommended)

### 1. Start All Services
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- Backend API
- Frontend app
- Nginx proxy

### 2. Verify Services
```bash
docker-compose ps
```

**Expected Output:**
```
NAME                STATUS              PORTS
baby-album-db       Up                 0.0.0.0:5432->5432
baby-album-redis    Up                 0.0.0.0:6379->6379
baby-album-backend  Up                 0.0.0.0:3001->3001
baby-album-frontend Up                 0.0.0.0:3000->3000
baby-album-nginx    Up                 0.0.0.0:80->80
```

---

## Development Tools Setup

### 1. VS Code Extensions
Install these recommended extensions:
- [ ] ESLint
- [ ] Prettier
- [ ] Prisma
- [ ] Docker
- [ ] GitLens
- [ ] Thunder Client (for API testing)

### 2. Git Hooks
```bash
# Install Husky for pre-commit hooks
pnpm install

# Setup hooks
pnpm husky install
```

### 3. Testing Framework
```bash
# Backend tests
cd backend
pnpm test

# Frontend tests
cd frontend
pnpm test
```

---

## Phase 2 Feature-Specific Setup

### Batch Upload Feature

**Backend Setup:**
```bash
# Create upload directories
mkdir -p backend/uploads/temp
mkdir -p backend/uploads/processed

# Set permissions (Linux/Mac)
chmod 755 backend/uploads/*
```

**Frontend Setup:**
```typescript
// Create upload configuration file
// frontend/src/config/upload.config.ts
export const UPLOAD_CONFIG = {
  maxFiles: 50,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  chunkSize: 5 * 1024 * 1024, // 5MB chunks
};
```

### Smart Albums Feature

**AI Vision Setup:**
```bash
# Install TensorFlow.js (backend)
cd backend
pnpm add @tensorflow/tfjs-node

# Or use Google Cloud Vision
# Set up service account credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
```

**Testing AI:**
```typescript
// Test script: backend/scripts/test-ai-vision.ts
import { VisionService } from '../src/ai/vision.service';

async function testAI() {
  const vision = new VisionService();
  const result = await vision.analyzeImage('test-photo.jpg');
  console.log('AI Analysis:', result);
}

testAI();
```

### Timeline Enhancement

**Database Indexes:**
```sql
-- Create indexes for timeline queries
CREATE INDEX idx_photos_taken_at ON photos(taken_at DESC);
CREATE INDEX idx_photos_user_date ON photos(user_id, taken_at DESC);
```

**Frontend Virtual Scroll:**
```bash
# Install react-virtuoso
cd frontend
pnpm add react-virtuoso
```

---

## Feature Flags Setup

### Backend Feature Flags
Create `backend/src/config/feature-flags.ts`:
```typescript
export const FEATURE_FLAGS = {
  BATCH_UPLOAD: process.env.ENABLE_BATCH_UPLOAD === 'true',
  SMART_ALBUMS: process.env.ENABLE_SMART_ALBUMS === 'true',
  TIMELINE_ENHANCED: process.env.ENABLE_TIMELINE === 'true',
};
```

### Frontend Feature Flags
Create `frontend/src/config/feature-flags.ts`:
```typescript
export const FEATURE_FLAGS = {
  BATCH_UPLOAD: import.meta.env.VITE_ENABLE_BATCH_UPLOAD === 'true',
  SMART_ALBUMS: import.meta.env.VITE_ENABLE_SMART_ALBUMS === 'true',
  TIMELINE_ENHANCED: import.meta.env.VITE_ENABLE_TIMELINE === 'true',
};
```

---

## Verification Checklist

### Backend Verification
- [ ] Database migrations applied
- [ ] Redis connection successful
- [ ] S3 credentials configured
- [ ] JWT secret configured
- [ ] API health check passing
- [ ] Batch upload endpoint accessible
- [ ] AI vision service initialized
- [ ] Timeline queries optimized

### Frontend Verification
- [ ] Environment variables set
- [ ] Backend API reachable
- [ ] WebSocket connection working
- [ ] No console errors on load
- [ ] Batch upload UI renders
- [ ] Smart albums component loads
- [ ] Timeline component renders

### Integration Verification
- [ ] Frontend can call backend APIs
- [ ] File upload works end-to-end
- [ ] WebSocket real-time updates work
- [ ] Auth tokens pass correctly
- [ ] CORS configured properly

---

## Troubleshooting

### Common Issues

**Issue: Redis connection refused**
```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis
docker-compose up -d redis
```

**Issue: Database connection failed**
```bash
# Check database status
docker-compose ps db

# Restart database
docker-compose restart db
```

**Issue: S3 upload fails**
```bash
# Verify credentials
aws s3 ls

# Check bucket permissions
aws s3api get-bucket-policy --bucket your-bucket-name
```

**Issue: AI vision not working**
```bash
# Test TensorFlow installation
node -e "require('@tensorflow/tfjs-node'); console.log('TF.js loaded');"

# Or test Cloud Vision API
gcloud ai-platform endpoints list
```

---

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/batch-upload-backend
```

### 2. Make Changes
```bash
# Backend
pnpm start:dev

# Frontend
pnpm dev
```

### 3. Run Tests
```bash
# Backend
pnpm test

# Frontend
pnpm test
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat: implement batch upload backend"
```

### 5. Push and Create PR
```bash
git push origin feature/batch-upload-backend
```

---

## Quick Start Commands

### Backend
```bash
cd backend
pnpm install              # Install dependencies
pnpm start:dev           # Start dev server
pnpm test                # Run tests
pnpm prisma studio       # Open database UI
```

### Frontend
```bash
cd frontend
pnpm install             # Install dependencies
pnpm dev                 # Start dev server
pnpm test                # Run tests
pnpm build               # Build for production
```

### Docker
```bash
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
```

---

## Contact Information

**Setup Support:**
- **DevOps Issues:** devops-engineer
- **Backend Issues:** backend-dev, backend-dev-2
- **Frontend Issues:** frontend-dev
- **Database Issues:** backend-dev

**Setup Deadline:** Complete by 2026-02-14 9:00 AM (before kickoff meeting)

---

*Last Updated: 2026-02-13*
*Version: 1.0*
