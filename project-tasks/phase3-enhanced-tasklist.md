# Phase 3 增强版任务清单 v1.0

**生成者**: 高级项目经理代理  
**生成时间**: 2026-03-27  
**依据**: PHASE3_PRD_V4_NO_AI.md + 代码现状扫描 + UI美化目标  
**状态**: ✅ 已批准，开始执行

---

## 项目目标

让"宝宝成长相册"更完善（功能）、更美观（视觉），完成 Phase 3 v4.0 核心交付。

**三个维度**：
1. 🎨 **视觉升级** — 从冷蓝白配色升级为温暖粉橙，中文化界面，移动端优先
2. 🛠️ **功能完善** — 评论系统、分享优化、成长曲线、里程碑提醒
3. ⚡ **性能优化** — 虚拟滚动、懒加载、缓存策略统一

---

## 任务清单

### 🎨 T1 — 全局 UI 美化
**代理**: 前端开发者 + UI设计师  
**工时估算**: 4h  
**优先级**: P0（其他任务的视觉基础）

**需求**（来自 PHASE3_PRD_V4_NO_AI.md §3 + 现状分析）：
- 当前问题：`index.css` body 背景是 `#f0f9ff` 冷蓝，主色是 `#3b82f6` 蓝色
- `design-tokens.ts` 主色是蓝色系，不适合宝宝应用的温暖感
- 缺少心跳、闪烁等微动效

**具体修改文件**：
- `frontend/src/lib/design-tokens.ts` — 新增 `warm` 暖色系色板
- `frontend/src/index.css` — body 背景改为粉橙渐变，新增微动效 CSS 类

**验收标准**：
- [ ] body 背景色变为粉橙暖色渐变
- [ ] 新增 `animate-heartbeat`、`animate-sparkle` 动效类
- [ ] 新增 `warm` 色板（粉/橙/薄荷）到 design-tokens
- [ ] 旧的蓝色类保留（向后兼容）
- [ ] 前端编译无报错

---

### 🏠 T2 — Dashboard 全面升级
**代理**: 前端开发者  
**工时估算**: 3h  
**优先级**: P0  
**依赖**: T1（使用新色板）

**需求**（来自 PRD + 现状分析）：
- 当前 Dashboard 使用英文标签（"Dashboard", "Total Photos", "Albums"等）
- 缺少宝宝年龄横幅
- 统计卡片配色是冷蓝白系
- 快速操作区样式单调

**具体修改文件**：
- `frontend/src/pages/DashboardPage.tsx` — 全面升级

**功能清单**：
1. 顶部添加"宝宝年龄横幅"（如："小明今天 8 个月零 3 天 🎉"，基于 children 数据计算）
2. 统计卡片文案中文化 + 改用暖色系渐变
3. 快速操作区改为 2×2 大图标卡片
4. "最近照片"改为 3 列紧凑网格
5. "即将到来的日期"区域改为中文
6. 底部欢迎引导横幅改为中文暖色系

**验收标准**：
- [ ] 截图：首页是中文，无英文残留
- [ ] 截图：统计卡片是暖色系
- [ ] 功能：至少有一个孩子时显示年龄横幅
- [ ] 移动端（375px）布局正常

---

### 🔔 T3 — 里程碑提醒后端完善
**代理**: 后端架构师  
**工时估算**: 6h  
**优先级**: P0  
**依赖**: 无

**需求**（来自 PRD §1.1.3）：
- `backend/src/milestone-reminder/` 已有基础，需完善
- 需接入 WHO 里程碑数据（0-5岁）
- 需实现定时扫描和应用内通知

**具体修改文件**：
- `backend/src/milestone-reminder/` — 完善模块
- `backend/src/common/` — 如需添加通知服务

**功能清单**：
1. 完善 WHO 里程碑数据集（分类：大运动/精细动作/语言/社交）
2. 实现 `GET /milestones/upcoming?childId=xxx` API
3. 定时任务：每天检查，提前 7 天提醒
4. 应用内通知存储到数据库

**验收标准**：
- [ ] API `/milestones/upcoming` 返回正确数据结构
- [ ] 里程碑数据覆盖 0-60 个月
- [ ] 定时任务配置正确（NestJS Schedule）
- [ ] 后端编译无报错，单元测试通过

---

### 📈 T4 — 成长曲线图表视觉升级
**代理**: 前端开发者  
**工时估算**: 4h  
**优先级**: P0  
**依赖**: T1（新色板），成长模块后端已就绪

**需求**（来自 PRD §1.1.1）：
- 现有 `GrowthChart.tsx` 已有 Recharts + WHO 数据，需视觉升级
- 图表区域背景单调，缺少美化
- 指标切换 Tab 样式可更好
- GrowthPage 整体布局可优化

**具体修改文件**：
- `frontend/src/components/growth/GrowthChart.tsx` — 美化图表样式
- `frontend/src/pages/growth/GrowthPage.tsx` — 升级整体布局

**功能清单**：
1. 图表区域添加渐变背景卡片（粉/橙主题）
2. 实际数据曲线使用渐变填充（AreaChart 替代 LineChart 或加 Area）
3. 指标切换 Tab 改为胶囊按钮样式，颜色：身高=粉色、体重=橙色、头围=薄荷
4. 空状态图改为带插图的友好提示
5. GrowthPage 页面整体增加暖色系背景卡片

**验收标准**：
- [ ] 截图：图表有渐变填充，视觉更丰富
- [ ] 截图：Tab 按钮样式美观
- [ ] 截图：空状态友好提示
- [ ] 功能：切换指标正常，日期筛选正常

---

### 💬 T5 — 照片评论后端 API
**代理**: 后端架构师  
**工时估算**: 6h  
**优先级**: P1  
**依赖**: 无

**需求**（来自 PRD §1.2.1）：
- 新增 `PhotoComment` 模型（见 PRD §2.3）
- 实现完整 CRUD API

**具体修改文件**：
- `backend/prisma/schema.prisma` — 新增 PhotoComment 模型
- `backend/src/` — 新增 `comments` 模块

**功能清单**：
1. Prisma schema 新增 PhotoComment 模型（支持嵌套回复）
2. `POST /photos/:id/comments` — 创建评论
3. `GET /photos/:id/comments` — 获取评论列表（分页）
4. `DELETE /photos/:id/comments/:commentId` — 删除自己的评论
5. `POST /photos/:id/comments/:commentId/like` — 点赞
6. 权限控制：仅家庭成员可评论

**验收标准**：
- [ ] `prisma db push` 成功
- [ ] API 测试：CRUD 全部正常
- [ ] 权限测试：非家庭成员返回 403
- [ ] 后端编译无报错

---

### 💬 T6 — 照片详情页评论区
**代理**: 前端开发者  
**工时估算**: 5h  
**优先级**: P1  
**依赖**: T5（评论后端）

**需求**（来自 PRD §1.2.1）：
- 在 PhotoDetailPage 下方添加评论区
- 需要新建 CommentThread 组件

**具体修改文件**：
- `frontend/src/components/photo/CommentThread.tsx` — 新建
- `frontend/src/pages/family/PhotoDetailPage.tsx` — 集成评论区
- `frontend/src/api/` — 新增 comments API 方法

**功能清单**：
1. 创建 `CommentThread` 组件
   - 评论列表（头像字母缩略 + 名字 + 内容 + 时间 + 点赞数）
   - Emoji 快捷反应栏（❤️ 😍 😂 😮）
   - 输入框（固定在评论区底部）
   - 发送按钮
2. PhotoDetailPage 集成：照片信息下方添加评论区
3. 点赞动画效果

**验收标准**：
- [ ] 截图：照片详情页有评论区
- [ ] 功能：输入评论并发送成功
- [ ] 功能：点赞有动画反馈
- [ ] 空评论状态友好提示

---

### 🔗 T7 — 相册分享后端 API
**代理**: 后端架构师  
**工时估算**: 5h  
**优先级**: P1  
**依赖**: 无

**需求**（来自 PRD §1.2.2）：
- 新增 `AlbumShare` 模型
- 实现 Token 分享机制

**具体修改文件**：
- `backend/prisma/schema.prisma` — 新增/更新 AlbumShare 模型
- `backend/src/albums/` — 添加分享相关路由

**功能清单**：
1. `POST /albums/:id/share` — 创建分享（支持密码、有效期、权限）
2. `GET /share/:token` — 公开访问（无需登录）
3. `DELETE /albums/:id/share/:shareId` — 撤销分享
4. `GET /albums/:id/shares` — 查看分享列表及统计

**验收标准**：
- [ ] 无需登录可用 token 访问公开分享
- [ ] 密码保护：错误密码返回 401
- [ ] 过期分享：返回 403

---

### 🔗 T8 — 分享对话框前端升级
**代理**: 前端开发者  
**工时估算**: 4h  
**优先级**: P1  
**依赖**: T7（分享后端）

**需求**（来自 PRD §3.3）：
- 现有 `ShareDialog` 组件（`frontend/src/components/ui/ShareDialog.tsx`）需大幅升级
- 添加权限控制、有效期、二维码

**具体修改文件**：
- `frontend/src/components/ui/ShareDialog.tsx` — 升级
- `frontend/package.json` — 添加 `qrcode.react` 依赖

**功能清单**：
1. 分享方式：公开/密码保护切换
2. 权限级别：仅查看 / 可评论 / 可下载
3. 有效期：1天 / 7天 / 30天 / 永久
4. 二维码展示（qrcode.react）
5. 一键复制链接
6. 访问统计展示（访问次数、访客人数）
7. 撤销分享按钮（红色）

**验收标准**：
- [ ] 截图：分享对话框完整视觉
- [ ] 功能：二维码正确生成
- [ ] 功能：复制链接成功提示

---

### ⚡ T9 — 性能优化
**代理**: 高级开发工程师  
**工时估算**: 4h  
**优先级**: P1  
**依赖**: T1~T8 全部完成

**需求**（来自 PRD §1.4）：
- VirtualPhotoGrid 已有，深度调优
- 图片懒加载升级
- 路由级代码分割

**具体修改文件**：
- `frontend/src/App.tsx` 或路由配置 — 路由懒加载
- `frontend/src/components/VirtualPhotoGrid.tsx` — 调优
- `frontend/vite.config.ts` — Bundle 优化

**功能清单**：
1. 路由页面改为 `React.lazy + Suspense`
2. 图片实现 blur-up 渐进加载
3. VirtualPhotoGrid 过视窗预加载优化
4. Vite 手动 chunk 拆分（vendor / recharts / pdf 等大包分离）

**验收标准**：
- [ ] Bundle 分析：无单个 chunk > 500KB
- [ ] 首屏加载体验：有 Suspense fallback
- [ ] 1000 张照片虚拟滚动流畅

---

### 📊 T10 — 成长报告 PDF 生成
**代理**: 前端开发者  
**工时估算**: 5h  
**优先级**: P2  
**依赖**: T4（成长曲线），T1（视觉基础）

**需求**（来自 PRD §1.1.2）：

**具体修改文件**：
- `frontend/src/components/growth/GrowthReport.tsx` — 新建
- `frontend/src/pages/growth/GrowthPage.tsx` — 添加生成报告入口
- `frontend/package.json` — 添加 `jspdf`、`html2canvas`

**功能清单**：
1. 报告模板（隐藏的渲染层）：
   - 宝宝信息卡片（头像/姓名/年龄）
   - 成长曲线截图（通过 html2canvas）
   - 近期里程碑
   - 最近 6 张照片
2. 点击"生成报告"触发 jsPDF 导出
3. 报告包含宝宝应用水印/Logo

**验收标准**：
- [ ] PDF 生成成功，无乱码
- [ ] 中文字体正常显示
- [ ] 文件大小合理（< 5MB）

---

## 任务依赖关系

```
T1(UI美化) → T2(Dashboard) → T4(成长曲线) → T10(报告)
T3(里程碑后端)  [并行]
T5(评论后端) → T6(评论前端)
T7(分享后端) → T8(分享对话框)
T1~T8 完成 → T9(性能优化)
所有任务完成 → 集成测试
```

## 进度跟踪

| 任务 | 代理 | 状态 | QA | 重试次数 |
|------|------|------|----|---------|
| T1 UI美化 | 前端开发者 | 🔄 进行中 | - | 0 |
| T2 Dashboard | 前端开发者 | ⬜ 待开始 | - | 0 |
| T3 里程碑后端 | 后端架构师 | ✅ 已完成 | ✅ 通过 | 0 |
| T4 成长曲线 | 前端开发者 | ⬜ 待开始 | - | 0 |
| T5 评论后端 | 后端架构师 | ✅ 已完成 | ✅ 通过 | 0 |
| T6 评论前端 | 前端开发者 | ⬜ 待开始 | - | 0 |
| T7 分享后端 | 后端架构师 | ✅ 已完成 | ✅ 通过 | 0 |
| T8 分享对话框 | 前端开发者 | ⬜ 待开始 | - | 0 |
| T9 性能优化 | 高级工程师 | ✅ 已完成 | ✅ 通过 | 0 |
| T10 成长报告 | 前端开发者 | ✅ 已完成 | ✅ 通过 | 0 |
| 集成测试 | 测试现实检查器 | ⬜ 等待 | - | 0 |

---

*高级项目经理代理输出 · 2026-03-27*
