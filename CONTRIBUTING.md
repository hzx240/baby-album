# 贡献指南

感谢你对宝贝成长相册项目的关注！我们欢迎所有形式的贡献。

---

## 目录

1. [行为准则](#行为准则)
2. [如何贡献](#如何贡献)
3. [开发流程](#开发流程)
4. [代码规范](#代码规范)
5. [提交规范](#提交规范)
6. [Pull Request 流程](#pull-request-流程)
7. [问题反馈](#问题反馈)

---

## 行为准则

### 我们的承诺

为了营造开放和友好的环境，我们承诺让每个人都能参与其中，无论他们的经验水平、性别、性别认同和表达、性取向、残疾、个人外貌、体型、种族、民族、年龄、宗教或国籍如何。

### 我们的标准

积极行为包括：
- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

不可接受的行为包括：
- 使用性化的语言或图像，以及不受欢迎的性关注或钓鱼
- 恶意攻击、侮辱/贬损的评论，以及人身或政治攻击
- 公开或私下的骚扰
- 未经明确许可发布他人的私人信息
- 其他在专业场合可能被合理认为不适当的行为

---

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请：
1. 检查 [Issues](../../issues) 确保问题尚未被报告
2. 创建新的 Issue，使用 Bug Report 模板
3. 提供详细的信息：
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（操作系统、浏览器版本等）
   - 截图或错误日志

### 提出新功能

如果你有新功能的想法：
1. 检查 [Issues](../../issues) 确保功能建议尚未被提出
2. 创建新的 Issue，使用 Feature Request 模板
3. 详细说明：
   - 功能描述
   - 使用场景
   - 预期收益
   - 可能的实现方案

### 提交代码

如果你想贡献代码：
1. Fork 项目仓库
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 开发流程

### 环境准备

#### 前置要求
- Node.js >= 18.17.0
- npm >= 9.0.0
- Git
- Docker (可选，用于容器化部署)

#### 克隆仓库

```bash
git clone https://github.com/your-username/baby-album.git
cd baby-album
```

#### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

#### 环境配置

```bash
# 复制环境配置文件
cp .env.example .env

# 根据需要修改 .env 文件
```

#### 数据库设置

```bash
cd backend

# 生成 Prisma Client
npx prisma generate

# 推送数据库 Schema
npx prisma db push

# (可选) 运行迁移
npx prisma migrate dev
```

#### 启动开发服务器

```bash
# 启动后端 (终端 1)
cd backend
npm run start:dev

# 启动前端 (终端 2)
cd frontend
npm run dev
```

访问：
- 前端: http://localhost:5173
- 后端 API: http://localhost:3001

---

## 代码规范

### 通用规范

- **语言**: 使用 TypeScript 编写代码
- **命名**:
  - 变量和函数: camelCase
  - 类和组件: PascalCase
  - 常量: UPPER_SNAKE_CASE
  - 文件名: kebab-case 或 PascalCase (组件)
- **注释**: 对复杂逻辑添加注释说明
- **代码格式化**:
  - 使用 Prettier 格式化代码
  - 使用 ESLint 检查代码质量

### 前端规范 (React + TypeScript)

```typescript
// ✅ 好的示例
interface UserProfileProps {
  userId: string;
  userName: string;
  onUpdate: () => void;
}

export function UserProfile({ userId, userName, onUpdate }: UserProfileProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 副作用逻辑
  }, [userId]);

  if (isLoading) {
    return <Skeleton />;
  }

  return <div>{userName}</div>;
}

// ❌ 避免的示例
// 缺少类型定义
// 缺少错误处理
// 组件过于复杂
```

**最佳实践**:
- 组件保持单一职责
- 使用自定义 Hook 复用逻辑
- 避免直接修改 State
- 使用 TypeScript 类型而非 any
- 合理使用 React.memo 优化性能

### 后端规范 (NestJS + TypeScript)

```typescript
// ✅ 好的示例
@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);

  constructor(
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
  ) {}

  async findAll(userId: string): Promise<Photo[]> {
    try {
      return await this.photoRepository.find({
        where: { userId },
        relations: ['child'],
      });
    } catch (error) {
      this.logger.error(`Failed to fetch photos: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch photos');
    }
  }
}

// ❌ 避免的示例
// 缺少错误处理
// 缺少日志
// 方法过于复杂
```

**最佳实践**:
- 使用 Dependency Injection
- 统一错误处理
- 添加适当的日志
- 使用 DTO 验证输入
- 保持 Service 简洁

### Git 分支策略

```
main              - 主分支，生产环境代码
├── develop       - 开发分支
│   ├── feature/*  - 功能分支
│   ├── bugfix/*   - Bug 修复分支
│   └── hotfix/*  - 紧急修复分支
```

**分支命名**:
- `feature/功能描述`: 新功能开发
- `bugfix/问题描述`: Bug 修复
- `hotfix/紧急问题`: 生产环境紧急修复
- `refactor/重构内容`: 代码重构
- `docs/文档内容`: 文档更新
- `test/测试内容`: 测试相关

---

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构（不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关
- `ci`: CI 配置

### 示例

```bash
# 新功能
git commit -m "feat(albums): add smart album creation feature"

# Bug 修复
git commit -m "fix(auth): resolve JWT token expiration issue"

# 文档更新
git commit -m "docs(readme): update installation instructions"

# 重构
git commit -m "refactor(photos): simplify photo upload logic"

# 性能优化
git commit -m "perf(api): optimize database query with indexing"

# 测试
git commit -m "test(auth): add unit tests for login service"
```

### 详细提交示例

```bash
git commit -m "feat(upload): implement batch upload feature

- Add drag-and-drop file upload
- Implement progress tracking
- Support chunk upload for large files
- Add error handling and retry logic

Closes #123
```

---

## Pull Request 流程

### PR 标题格式

```
<type>: <short description>
```

示例:
- `feat: Add smart album management`
- `fix: Resolve authentication redirect loop`
- `docs: Update API documentation`

### PR 描述模板

创建 PR 时，请提供以下信息：

```markdown
## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 重大变更（破坏性）
- [ ] 文档更新

## 变更说明
简要描述你的更改内容和原因。

## 相关 Issue
Closes #(issue number)

## 测试计划
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成
- [ ] 添加了新的测试用例

## 截图（如适用）
添加截图展示你的更改。

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 代码已自审
- [ ] 已添加注释到复杂代码
- [ ] 已更新相关文档
- [ ] 没有新的警告产生
- [ ] 已添加/更新测试
- [ ] 所有测试通过
```

### PR 审查标准

所有 PR 必须满足：
1. **代码质量**: 通过 ESLint 和 Prettier 检查
2. **测试覆盖**: 新功能有相应测试
3. **文档更新**: 相关文档已同步更新
4. **代码审查**: 至少一位维护者审查通过
5. **CI 通过**: 所有 CI 检查通过

### 审查流程

1. **自动检查**: CI 自动运行测试和代码检查
2. **人工审查**: 维护者审查代码变更
3. **反馈处理**: 根据反馈进行修改
4. **合并**: 审查通过后合并到目标分支

### 合并策略

- **feature/bugfix**: 合并到 `develop` 分支
- **hotfix**: 合并到 `main` 和 `develop` 分支
- **文档更新**: 可以直接合并

---

## 开发工具

### 推荐的 VS Code 扩展

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- GitLens
- GitHub Copilot (可选)

### 代码检查

```bash
# 前端代码检查
cd frontend
npm run lint
npm run format

# 后端代码检查
cd backend
npm run lint
npm run format
```

### 运行测试

```bash
# 后端测试
cd backend
npm run test
npm run test:e2e
npm run test:cov

# 前端测试
cd frontend
npm run test
npm run test:ui
```

---

## 获得帮助

如果你有任何问题：

1. **查看文档**: 先查看项目文档和相关技术文档
2. **搜索 Issues**: 检查是否已有类似问题
3. **提问**: 在 Issue 中提问，使用 Question 模板
4. **讨论**: 加入讨论区，与其他贡献者交流

---

## 许可证

通过贡献代码，你同意你的贡献将根据项目的 [MIT License](LICENSE) 进行许可。

---

**感谢你的贡献！**

---

## 附录

### 有用的资源

- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [React 文档](https://react.dev/)
- [NestJS 文档](https://docs.nestjs.com/)
- [Prisma 文档](https://www.prisma.io/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Git 工作流](https://www.atlassian.com/git/tutorials/comparing-workflows)

### 联系方式

- 项目维护者: @team-lead
- 技术问题: @backend-dev-1, @frontend-dev
- 文档问题: @hr-manager
