# Phase 2 Frontend Development Guide

## 🎯 Phase 2 Overview

**Objective**: Build responsive UI with excellent UX
**Duration**: Week 1-3
**Team Role**: Frontend Developer (frontend-dev)

---

## 📋 Task List

### 1. Family Feed Component
**Priority**: P1
**Estimated Time**: 6-8 hours
**Files**: `frontend/src/app/(family)/feed/page.tsx`

**Requirements**:
- Infinite scroll pagination
- Real-time updates (WebSocket)
- Media gallery grid
- Like/comment interactions
- Post creation with rich text

**Component Structure**:
```typescript
// components/feed/family-feed.tsx
export function FamilyFeed() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['family-posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const { posts } = useWebSocket('family-updates', {
    onMessage: (newPost) => {
      queryClient.setQueryData(['family-posts'], (old) => [
        newPost,
        ...old,
      ]);
    },
  });

  return (
    <div>
      <PostComposer />
      <InfiniteScroll
        loadMore={fetchNextPage}
        hasMore={hasNextPage}
      >
        {data.map(post => <PostCard key={post.id} post={post} />)}
      </InfiniteScroll>
    </div>
  );
}
```

---

### 2. Media Upload Widget
**Priority**: P1
**Estimated Time**: 4-6 hours
**Files**: `frontend/src/components/media/uploader.tsx`

**Requirements**:
- Drag-and-drop support
- Image preview before upload
- Progress indicators
- Batch upload (max 10 files)
- Client-side validation (size, type)
- Retry failed uploads

**Implementation**:
```typescript
export function MediaUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const uploadMedia = useMutation({
    mutationFn: async (file: File) => {
      // 1. Request upload URL
      const { uploadUrl, fileId } = await api.post('/media/request-upload', {
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      // 2. Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      // 3. Confirm upload
      await api.post('/media/confirm-upload', { fileId });
    },
  });

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles].slice(0, 10));
  };

  return (
    <div>
      <Dropzone onDrop={handleDrop} accept={{ 'image/*': ['.png', '.jpg'] }}>
        {({getRootProps}) => <div {...getRootProps()} />}
      </Dropzone>

      {files.map(file => (
        <UploadProgress
          key={file.name}
          file={file}
          onUpload={() => uploadMedia.mutate(file)}
        />
      ))}
    </div>
  );
}
```

---

### 3. Real-Time Notifications
**Priority**: P2
**Estimated Time**: 3-4 hours
**Files**: `frontend/src/components/notifications/toast.tsx`

**Requirements**:
- Toast notifications for likes, comments, invites
- Sound notifications (opt-in)
- Notification center with history
- Mark as read functionality

**WebSocket Integration**:
```typescript
// hooks/use-notifications.ts
export function useNotifications() {
  const { data } = useWebSocket('notifications', {
    onMessage: (notification) => {
      toast.show({
        title: notification.title,
        message: notification.message,
        onClick: () => router.push(notification.link),
      });

      // Update notification badge
      queryClient.setQueryData(['notifications'], (old) => [
        notification,
        ...old,
      ]);
    },
  });

  return { notifications: data };
}
```

---

### 4. Responsive Design
**Priority**: P2
**Estimated Time**: 4-5 hours
**Files**: All page components

**Breakpoints**:
```css
/* tailwind.config.js */
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
    },
  },
};
```

**Implementation Checklist**:
- [ ] Mobile-first CSS
- [ ] Touch-friendly buttons (min 44x44px)
- [ ] Readable text (min 16px)
- [ ] Responsive grids (1 col mobile, 2 col tablet, 3-4 col desktop)
- [ ] Collapsible navigation on mobile
- [ ] Optimized images (WebP, lazy loading)

---

## 🎨 Design System

### Colors
```css
--primary: #6366f1;
--primary-dark: #4f46e5;
--secondary: #ec4899;
--success: #10b981;
--danger: #ef4444;
--warning: #f59e0b;
--background: #ffffff;
--surface: #f9fafb;
--text-primary: #111827;
--text-secondary: #6b7280;
```

### Typography
```css
/* Font: Inter */
--font-sans: 'Inter', sans-serif;

text-h1: 2.5rem (40px)
text-h2: 2rem (32px)
text-h3: 1.5rem (24px)
text-body: 1rem (16px)
text-small: 0.875rem (14px)
```

### Components
- Button, Input, Select, Modal, Dialog, Dropdown
- All with variants: default, primary, secondary, danger

---

## ✅ Definition of Done

- [ ] Component implements all requirements
- [ ] Responsive on mobile, tablet, desktop
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Loading states for async operations
- [ ] Error handling with user-friendly messages
- [ ] Unit tests (Jest + React Testing Library)
- [ ] Storybook story created
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Performance < 3s First Contentful Paint

---

## 🧪 Testing Commands

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Storybook
npm run storybook

# Build for production
npm run build

# Lighthouse CI
npm run lighthouse
```

---

## 📝 Notes

- Use Tailwind CSS for styling
- Follow React best practices (hooks, functional components)
- Optimize images (use Next.js Image component)
- Lazy load routes and heavy components
- Use semantic HTML
- Test with screen readers (NVDA, VoiceOver)

---

## 🔗 Related Documentation

- [Phase 1 Summary](../docs/phase1-summary.md)
- [Backend Guide](../docs/phase2-backend-guide.md)
- [QA Guide](../docs/phase2-qa-guide.md)
- [Design System](../docs/design-system.md)
