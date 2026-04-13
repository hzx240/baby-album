# Backend Test Directory

## 目录结构

```
test/
├── setup.ts                    # 测试环境初始化
├── mocks/                      # Mock模块
│   ├── prisma.mock.ts         # Prisma数据库Mock
│   ├── redis.mock.ts          # Redis缓存Mock
│   ├── s3.mock.ts             # AWS S3 Mock
│   ├── sharp.mock.ts          # 图像处理Mock
│   ├── jwt.mock.ts            # JWT认证Mock
│   └── bcrypt.mock.ts         # 密码加密Mock
└── utils/                      # 测试工具
    └── test-helpers.ts        # Mock数据生成器
```

## 使用方法

### 在测试文件中导入Mock

```typescript
// 导入Prisma Mock
import { mockPrismaService } from '../../test/mocks/prisma.mock';

// 导入测试辅助工具
import {
  createMockUser,
  createMockPhoto,
  createMockFileUpload,
} from '../../test/utils/test-helpers';
```

### 使用测试辅助工具

```typescript
// 创建Mock用户
const mockUser = createMockUser({
  id: 'user-123',
  email: 'test@example.com',
  familyId: 'family-123',
});

// 创建Mock照片
const mockPhoto = createMockPhoto({
  id: 'photo-123',
  checksum: 'abc123',
});

// 创建Mock上传数据
const mockUpload = createMockFileUpload({
  filename: 'test.jpg',
  contentType: 'image/jpeg',
});
```

### 使用Prisma Mock

```typescript
import { mockPrismaService } from '../../test/mocks/prisma.mock';

beforeEach(() => {
  // Mock已自动重置
  // 直接使用
  mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
  mockPrismaService.photo.findMany.mockResolvedValue([mockPhoto1, mockPhoto2]);
});
```

## Mock配置

### setup.ts
设置测试环境变量和全局配置

### mocks/prisma.mock.ts
Mock所有Prisma数据库操作

### mocks/redis.mock.ts
Mock Redis缓存操作

### mocks/s3.mock.ts
Mock AWS S3文件存储操作

### mocks/sharp.mock.ts
Mock Sharp图像处理操作

### mocks/jwt.mock.ts
Mock JWT token生成和验证

### mocks/bcrypt.mock.ts
Mock密码哈希和比较

### utils/test-helpers.ts
提供Mock数据生成函数:
- createMockUser()
- createMockFamily()
- createMockChild()
- createMockPhoto()
- createMockInvitation()
- createMockFileUpload()
- createMockAuthHeaders()
- createMockPagination()
- testDates
- wait()

## 最佳实践

1. **使用测试辅助工具**而不是手动创建Mock数据
2. **在beforeEach中设置Mock**，afterEach中重置
3. **使用describe分组**相关测试
4. **遵循AAA模式**: Arrange-Act-Assert
5. **测试正常和异常场景**

## 示例测试文件

参考:
- `src/auth/auth.service.spec.ts` - 认证服务测试 (17个测试)
- `src/media/media.service.spec.ts` - 媒体服务测试 (14个测试)
- `src/children/children.service.spec.ts` - 宝宝档案测试 (18个测试)

---

**维护者**: qa-engineer
**创建日期**: 2026-02-13
