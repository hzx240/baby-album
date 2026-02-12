# 🧪 宝贝成长相册 - 回归测试与质量保证

## 📋 目录

- [测试套件说明](#测试套件)
- [快速开始](#快速开始)

---

## 🎯 快速开始

### 1️⃣ 安装 Git 钩子（首次使用）

```bash
node scripts/setup-hooks.js
```

### 2️⃣ 运行完整测试

```bash
npm test
```

---

## 📊 测试套件说明

### 测试覆盖的功能模块

| 模块 | 测试数量 | 关键功能 |
|------|----------|----------|
| **用户认证** | 4 | 注册、登录、刷新 token、获取用户信息 |
| **孩子管理** | 4 | 创建、列表、更新、删除 |
| **照片管理** | 5 | 列表、上传 URL、获取 URL、删除、验证 |
| **家庭成员** | 3 | 获取成员、创建邀请、获取邀请 |
| **性能验证** | 2 | 并发请求、响应时间 |

**总计：18 个自动化测试用例**

### 测试执行方式

1. **自动触发**：Git commit 时自动运行（通过 pre-commit 钩子）
2. **手动运行**：
   ```bash
   npm test              # 完整测试
   npm run test:quick  # 快速测试
   npm run test:auth    # 仅认证
   npm run test:photos  # 仅照片
   ```

### 测试执行流程

```
开始
  ↓
用户注册
  ↓
用户登录
  ↓
获取用户信息
  ↓
刷新 Token
  ↓
[孩子管理测试]
  ↓
[照片管理测试]
  ↓
[家庭成员测试]
  ↓
[性能验证测试]
  ↓
生成报告
  ↓
通过/失败
```

---

## 🎯 Git 提交工作流

### 标准提交流程

```bash
# 1. 修改代码
git add .

# 2. 提交（pre-commit 钩子自动运行测试）
git commit -m "type(scope): subject

类型 (type):
  feat:     新功能
  fix:      Bug 修复
  refactor:  代码重构
  perf:     性能优化
  test:     测试相关
  docs:     文档更新
  chore:    构建/工具相关

范围 (scope):
  backend:   后端改动
  frontend:  前端改动
  auth:     认证模块
  media:     照片/媒体模块
  db:        数据库相关

示例:
  feat(backend): 添加照片缓存
  fix(frontend): 修复虚拟滚动问题
  perf(auth): 优化 JWT 验证性能"
```

### Pre-Commit 钩子

`.git/hooks/pre-commit` 脚本会：
1. ✅ 检查是否有暂存的文件
2. ✅ 运行完整回归测试套件
3. ✅ 测试通过 → 允许提交（退出码 0）
4. ✅ 测试失败 → 阻止提交（退出码 1）
5. ✅ 显示详细的失败信息

### 绕过测试（紧急情况）

```bash
# 跳过 hooks 测试（不推荐）
git commit --no-verify -m "紧急修复"

# 或临时禁用 hooks
chmod -x .git/hooks/pre-commit
```

---

## 📈 性能基准

### 当前性能指标（优化后）

| 指标 | 目标值 | 当前值 | 状态 |
|--------|---------|--------|------|
| API 平均响应时间 | < 500ms | ~289ms | ✅ 优秀 |
| 照片上传响应 | < 1s | ~200-500ms | ✅ 优秀 |
| 首屏加载时间 | < 2.5s | TBD | 📊 待测 |
| Bundle 大小 | < 2MB | ~1.4MB | ✅ 良好 |
| Lighthouse 性能 | > 90 | TBD | 📊 待测 |

### 性能优化清单

- [x] 数据库查询优化（索引、select、transaction）
- [x] 图片处理并行化（Sharp Promise.all）
- [x] JWT 缓存策略（60秒 TTL）
- [x] 前端代码分割（manualChunks）
- [x] 组件渲染优化（React.memo）
- [x] 批量 API 请求（减少 N+1）
- [x] 图片懒加载（loading="lazy"）
- [x] Web Worker 计算（SHA-256）
- [x] 虚拟滚动（react-window）

---

## 🐛 故障排除

### 常见问题

#### Q: 测试超时或失败
**A:**
1. 确认服务运行中：
   ```bash
   # 后端
   cd backend && npm run start:dev

   # 前端
   cd frontend && npm run dev
   ```
2. 检查端口占用：
   ```bash
   # Windows
   netstat -ano | findstr :3001

   # 检查前端
   netstat -ano | findstr :5173
   ```
3. 查看后端日志确认无报错

#### Q: Git 钩子未生效
**A:** 运行 `node scripts/setup-hooks.js` 手动安装

#### Q: 想临时禁用测试
**A:**
```bash
# 方式1: 跳过验证
git commit --no-verify -m "message"

# 方式2: 临时禁用
chmod -x .git/hooks/pre-commit

# 重新启用
chmod +x .git/hooks/pre-commit
```

#### Q: 测试创建的用户干扰真实数据
**A:** 测试用户使用特定邮箱格式（`regression-test-{timestamp}@example.com`），可以：
- 手动删除测试数据
- 使用单独的测试家庭

---

## 📝 开发工作流检查清单

### 开始开发前
- [ ] 拉取最新代码：`git pull`
- [ ] 运行测试确保基线正常：`npm test`
- [ ] 创建功能分支：`git checkout -b feature/xxx`

### 开发过程中
- [ ] 定期保存进度
- [ ] 提交前运行相关测试：`npm run test:photos`
- [ ] 保持提交信息清晰

### 准备提交前
- [ ] 运行完整测试套件：`npm test`
- [ ] 检查测试通过
- [ ] 添加变更到暂存区：`git add .`
- [ ] 编写清晰的提交信息

### 提交时
- [ ] Pre-commit 钩子自动运行
- [ ] 测试通过则提交成功
- [ ] 测试失败则修复问题

---

## 🎯 质量目标

### 代码质量
- ✅ 测试覆盖率 > 80%
- ✅ 无 TypeScript 编译错误
- ✅ 无 ESLint 警告
- ✅ 遵循代码规范

### 性能目标
- ✅ API 响应时间 < 500ms (p95)
- ✅ 首屏加载 < 2.5s
- ✅ Lighthouse 性能分数 > 90
- ✅ 无明显卡顿或延迟

### 用户体验
- ✅ 所有核心功能正常工作
- ✅ 错误提示清晰友好
- ✅ 响应式设计适配移动端

---

## 📚 相关文档

- [前端开发指南](./frontend/README.md)
- [后端开发指南](./backend/README.md)
- [API 文档](./backend/API.md)
- [部署指南](./deployment/README.md)

---

**最后更新**: 2026-02-12
**维护者**: 开发团队
