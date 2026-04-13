# Phase 3 UI/UX 设计方案 (整合版)

**设计时间**: 2026-02-14
**设计师**: UI/UX Designer
**产品经理**: product-manager-4
**目标平台**: Web (响应式) + Mobile (PWA)
**设计系统**: 基于 design-tokens.ts 和 design-tokens-enhanced.ts

---

## 📋 文档说明

本文档是基于 **Phase 3 PRD v2.0** 的完整 UI/UX 设计方案,整合了产品需求与交互设计。

**参考文档**:
- `PHASE3_PRODUCT_REQUIREMENTS_DOCUMENT.md` - 产品需求文档
- `PROJECT_MANAGEMENT_PLAN.md` - 项目管理计划
- `frontend/src/lib/design-tokens.ts` - 设计规范

---

## 目录

1. [设计目标](#设计目标)
2. [模块一: AI 智能增强](#模块一-ai-智能增强)
3. [模块二: 成长记录工具](#模块二-成长记录工具)
4. [模块三: 社交分享优化](#模块三-社交分享优化)
5. [模块四: 照片打印与实物](#模块四-照片打印与实物)
6. [模块五: 视频功能](#模块五-视频功能)
7. [设计系统扩展](#设计系统扩展)
8. [响应式设计](#响应式设计)
9. [无障碍访问](#无障碍访问)
10. [开发交付清单](#开发交付清单)

---

## 设计目标

### 用户体验目标

1. **智能化操作**: AI 功能减少用户手动筛选工作
2. **信任感**: AI 决策透明,用户可随时干预
3. **情感连接**: 成长记录让回忆更生动
4. **协作顺畅**: 家庭成员协作简单直观
5. **数据洞察**: 可视化展示宝宝成长趋势

### 业务目标

1. **提升留存**: 智能功能提升用户粘性 (目标: 30 天留存率 60%)
2. **降低流失**: 自动化减少重复劳动 (目标: 照片管理效率提升 50%)
3. **增加活跃**: 社交功能促进互动 (目标: 社交互动率 30%)
4. **品质感知**: 精美设计提升产品价值

---

## 模块一: AI 智能增强

### 功能 1.1: AI 照片质量评分

#### 用户目标

- 快速识别高质量照片
- 批量筛选低质量照片
- 了解照片质量分析维度
- 一键精选最佳照片

#### 页面结构

##### 1.1.1 质量评分概览页

```
+---------------------------------------------------------------+
|  Header: 照片质量分析                            [筛选] [排序] |
+---------------------------------------------------------------+
|                                                               |
|  +---------------------------+  +---------------------------+  |
|  | 质量分布图               |  | 质量统计                 |  |
|  | [饼图/柱状图]            |  | A+ 优秀: 234 张 (12%)   |  |
|  | A+ 优秀: 12%             |  | A 良好: 1,245 张 (64%)   |  |
|  | A 良好: 64%              |  | B 一般: 312 张 (16%)     |  |
|  | B 一般: 16%              |  | C 较差: 102 张 (5%)     |  |
|  | C 较差: 5%              |  | D 很差: 56 张 (3%)      |  |
|  | D 很差: 3%              |  |                          |  |
|  +---------------------------+  +---------------------------+  |
|                                                               |
|  +---------------------------------------------------------+  |
|  | 照片网格 (带质量徽章)                                    |  |
|  |                                                         |  |
|  |  [A+]  [A]  [B]            |  |
|  |   [照片1]  [照片2]  [照片3]    |  |
|  |                                                         |  |
|  |  [C]  [D]  [A+]            |  |
|  |   [照片4]  [照片5]  [照片6]    |  |
|  |                                                         |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  [✓ 一键精选最佳照片]  [✗ 批量删除低质量]                    |
|                                                               |
+---------------------------------------------------------------+
```

##### 1.1.2 单张照片质量详情

```
+---------------------------------------------------------------+
|  ← 返回                  照片质量分析详情              [关闭]   |
+---------------------------------------------------------------+
|                                                               |
|  +-------------------------+  +------------------------------+  |
|  |                         |  | 质量评分: A+ (92/100)    |  |
|  |    [照片预览]          |  |                              |  |
|  |                         |  | 综合评价: 优秀              |  |
|  |                         |  +------------------------------+  |
|  +-------------------------+                                 |
|                                                               |
|  技术质量分析:                                                 |
|  +--------------------------------------------------------+  |
|  | ✓ 清晰度: 4.5/5.0         [进度条: ████████░ 90%]    |  |
|  | ✓ 曝光: 4.2/5.0           [进度条: ███████░░ 84%]    |  |
|  | ✓ 构图: 4.0/5.0           [进度条: ███████░░ 80%]    |  |
|  | ✓ 色彩饱和度: 4.3/5.0     [进度条: ███████░░ 86%]    |  |
|  +--------------------------------------------------------+  |
|                                                               |
|  情感价值分析:                                                 |
|  +--------------------------------------------------------+  |
|  | ✓ 笑容: 4.8/5.0           [进度条: █████████ 96%]    |  |
|  | ✓ 眼神交流: 4.5/5.0       [进度条: ████████░ 90%]    |  |
|  | ✓ 表情生动度: 4.7/5.0     [进度条: ██████████ 94%]    |  |
|  +--------------------------------------------------------+  |
|                                                               |
|  AI 建议:                                                     |
|  "这张照片光线充足,主体清晰,宝宝笑容甜美。建议保留到精选相册。"      |
|                                                               |
|  [✓ 保留到精选相册]  [✗ 删除]  [→ 分享]                     |
|                                                               |
+---------------------------------------------------------------+
```

#### 组件设计

##### 组件 A: `QualityBadge` (质量徽章)

**职责**: 显示照片质量评分的视觉徽章

**Props 接口**:

```typescript
interface QualityBadgeProps {
  score: number; // 0-100
  variant?: 'compact' | 'detailed';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
```

**样式设计**:

```tsx
// 质量等级定义
const qualityGrades = {
  excellent: { min: 90, label: 'A+', color: 'from-emerald-400 to-green-500', textColor: 'text-white' },
  good: { min: 75, label: 'A', color: 'from-blue-400 to-cyan-500', textColor: 'text-white' },
  fair: { min: 60, label: 'B', color: 'from-yellow-400 to-amber-500', textColor: 'text-white' },
  poor: { min: 40, label: 'C', color: 'from-orange-400 to-red-400', textColor: 'text-white' },
  bad: { min: 0, label: 'D', color: 'from-red-500 to-pink-500', textColor: 'text-white' },
};

// 示例渲染
<QualityBadge score={92} variant="detailed" />
// 输出: 渐变背景徽章,显示 "A+ 92"
```

**CSS 类名**:

```tsx
className={`
  absolute top-3 right-3
  bg-gradient-to-r ${qualityColor}
  ${qualityTextColor}
  px-3 py-1.5 rounded-full
  text-sm font-bold
  shadow-lg backdrop-blur-sm
  flex items-center gap-1.5
  transition-all duration-300
  hover:scale-110 hover:shadow-xl
  z-10
`}
```

##### 组件 B: `QualityFilterBar` (质量筛选栏)

**职责**: 提供质量筛选和排序功能

**Props 接口**:

```typescript
interface QualityFilterBarProps {
  onFilterChange: (filter: QualityFilter) => void;
  onSortChange: (sort: SortOption) => void;
  onOneClickSelect: (count: number) => void;
  currentFilter?: QualityFilter;
  currentSort?: SortOption;
  stats?: QualityStats;
}

interface QualityFilter {
  minScore?: number;
  maxScore?: number;
  grades?: ('A+' | 'A' | 'B' | 'C' | 'D')[];
}

interface QualityStats {
  total: number;
  byGrade: Record<string, number>; // {'A+': 234, 'A': 1245, ...}
}
```

**布局设计**:

```tsx
<div className="flex flex-wrap gap-4 items-center justify-between bg-white rounded-2xl shadow-md p-6">
  {/* 左侧: 等级筛选器 */}
  <div className="flex flex-wrap gap-2">
    <QualityToggle grade="A+" count={stats.byGrade['A+']} color="emerald" />
    <QualityToggle grade="A" count={stats.byGrade['A']} color="blue" />
    <QualityToggle grade="B" count={stats.byGrade['B']} color="yellow" />
    <QualityToggle grade="C" count={stats.byGrade['C']} color="orange" />
    <QualityToggle grade="D" count={stats.byGrade['D']} color="red" />
  </div>

  {/* 右侧: 操作按钮 */}
  <div className="flex gap-2">
    <SortDropdown />
    <BatchActionButton
      label="一键精选最佳 50 张"
      onClick={() => onOneClickSelect(50)}
      variant="primary"
    />
    <BatchActionButton
      label="批量删除低质量"
      onClick={handleBatchDelete}
      variant="danger"
    />
  </div>
</div>
```

##### 组件 C: `QualityProgressBar` (质量进度条)

**职责**: 显示单个维度的质量评分

**Props 接口**:

```typescript
interface QualityProgressBarProps {
  label: string;
  score: number; // 0-5
  maxScore?: number;
  color?: 'success' | 'info' | 'warning' | 'error';
  showValue?: boolean;
  animate?: boolean;
}
```

**样式设计**:

```tsx
<div className="flex items-center gap-3">
  {/* 标签 */}
  <span className="text-sm font-medium text-gray-700 w-24">{label}</span>

  {/* 进度条容器 */}
  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
    {/* 进度条填充 */}
    <div
      className={`
        h-full rounded-full
        bg-gradient-to-r ${getGradientColor(color)}
        transition-all duration-1000 ease-out
        ${animate ? 'animate-pulse' : ''}
      `}
      style={{ width: `${(score / maxScore) * 100}%` }}
    />
  </div>

  {/* 分数显示 */}
  {showValue && (
    <span className="text-sm font-bold text-gray-700 w-16 text-right">
      {score.toFixed(1)}/{maxScore}
    </span>
  )}
</div>
```

#### 交互流程

##### 流程 1: 一键精选最佳照片

```mermaid
graph TD
    A[用户进入质量分析页] --> B[查看质量分布]
    B --> C[点击"一键精选最佳照片"]
    C --> D[弹出选择 Modal]
    D --> E{选择精选数量}
    E -->|50 张| F[AI 自动筛选]
    E -->|100 张| F
    E -->|自定义| G[输入数量]
    G --> F
    F --> H[显示预览]
    H --> I{用户确认}
    I -->|调整| J[手动修改选择]
    J --> I
    I -->|确认| K[创建精选相册]
    K --> L[显示成功提示]
    L --> M[跳转到新相册]
```

##### 流程 2: 批量删除低质量

| 操作 | 触发方式 | UI 反馈 | 确认 |
|------|----------|---------|------|
| 批量删除 | 点击"批量删除低质量" | 进入选择模式 | 二次确认 |
| 阈值设置 | 设置删除阈值(如 < 60 分) | Slider 滑块 | 实时预览 |
| 执行删除 | 点击确认 | Toast + 进度条 | Modal 确认 |

**删除阈值设置 UI**:

```
+---------------------------------------------------------------+
|  批量删除低质量照片                                         |
|                                                               |
|  质量分数阈值:                                              |
|  +-----------------------------------------------------+    |
|  | ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░                |    |
|  +-----------------------------------------------------+    |
|  60 分                                                         |
|                                                               |
|  将删除 158 张照片 (8%)                                       |
|                                                               |
|  建议: 保留所有 B 级以上照片 (75 分以上)                      |
|                                                               |
|  [取消]  [确认删除]                                          |
+---------------------------------------------------------------+
```

#### 验收标准

- [ ] 照片上传后 30 秒内完成评分
- [ ] 评分准确率 > 85%
- [ ] 显示质量等级 (A+/A/B/C/D)
- [ ] 显示评分详情 (技术质量 + 情感价值)
- [ ] 提供一键筛选功能
- [ ] 支持批量操作
- [ ] 评分数据持久化存储

---

### 功能 1.2: 智能场景分类

#### 用户目标

- 快速找到特定场景的照片
- 自动归类减少手动整理
- 浏览不同场景的回忆

#### 页面结构

##### 1.2.1 场景分类首页

```
+---------------------------------------------------------------+
|  Header: 场景分类                           [+ 新建场景标签]   |
+---------------------------------------------------------------+
|                                                               |
|  +---------------------------------------------------------+  |
|  | 搜索场景标签: [________________] [搜索]                   |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  自动识别场景 (15 种):                                         |
|  +-------------------------------------------------------+   |
|  |                                                       |   |
|  |  +----------+  +----------+  +----------+  +----------+ |   |
|  |  | 🎂 生日  |  | 🏖️ 海边  |  | 🏠 在家  |  | 🌳 公园  | |   |
|  |  | 128 张   |  | 345 张   |  | 892 张   |  | 234 张   | |   |
|  |  +----------+  +----------+  +----------+  +----------+ |   |
|  |                                                       |   |
|  |  +----------+  +----------+  +----------+  +----------+ |   |
|  |  | 🍜 美食  |  | ✈️ 旅行  |  | 🎄 节日  |  | 🏫 学校  | |   |
|  |  | 56 张    |  | 478 张   |  | 23 张    |  | 12 张    | |   |
|  |  +----------+  +----------+  +----------+  +----------+ |   |
|  |                                                       |   |
|  +-------------------------------------------------------+   |
|                                                               |
|  自定义场景 (2 种):                                           |
|  +-------------------------------------------------------+   |
|  |  +----------+  +----------+                               |   |
|  |  | ⭐ 第一次 |  | 👶 满月  |                               |   |
|  |  | 45 张    |  | 23 张    |                               |   |
|  |  +----------+  +----------+                               |   |
|  +-------------------------------------------------------+   |
|                                                               |
|  未分类照片 (234 张):  [→ 开始自动分类]                         |
|                                                               |
+---------------------------------------------------------------+
```

#### 组件设计

##### 组件 A: `SceneCard` (场景卡片)

**Props 接口**:

```typescript
interface SceneCardProps {
  scene: Scene;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  variant?: 'grid' | 'list' | 'compact';
}

interface Scene {
  id: string;
  type: 'auto' | 'custom';
  category: SceneCategory;
  name: string;
  icon: string; // Emoji
  photoCount: number;
  coverPhoto?: string;
  confidence?: number; // AI 置信度
}

type SceneCategory =
  | 'BIRTHDAY'    // 生日
  | 'HOLIDAY'     // 节日
  | 'OUTDOOR'     // 户外
  | 'INDOOR'      // 室内
  | 'PARK'        // 公园
  | 'EATING'      // 吃饭
  | 'SLEEPING'    // 睡觉
  | 'PLAYING'     // 玩耍
  | 'TRAVEL'      // 旅行
  | 'SCHOOL'      // 学校
  | 'CUSTOM';     // 自定义
```

**样式设计**:

```tsx
<div className={`
  group relative overflow-hidden
  rounded-2xl shadow-md
  bg-white
  hover:shadow-xl hover:-translate-y-1
  transition-all duration-300
  cursor-pointer
`}>

  {/* 封面照片 (带渐变遮罩) */}
  <div className="aspect-[4/3] relative overflow-hidden">
    {coverPhoto ? (
      <img
        src={coverPhoto}
        alt={name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
    ) : (
      <div className={`w-full h-full bg-gradient-to-br ${getSceneGradient(category)}`} />
    )}

    {/* 图标和名称遮罩 */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

    <div className="absolute bottom-0 left-0 right-0 p-4">
      <div className="flex items-center gap-2">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="text-white font-bold text-lg">{name}</h3>
          <p className="text-white/80 text-sm">{photoCount} 张照片</p>
        </div>
      </div>

      {/* AI 置信度标签 */}
      {type === 'auto' && confidence && (
        <div className="absolute top-2 right-2">
          <span className="bg-blue-500/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            AI {Math.round(confidence * 100)}%
          </span>
        </div>
      )}
    </div>
  </div>

  {/* 场景标签(可编辑) */}
  <div className="p-3 flex items-center justify-between">
    <span className="text-xs text-gray-500">
      {type === 'auto' ? '自动识别' : '自定义'}
    </span>
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="p-1 hover:bg-gray-100 rounded">
        <EditIcon className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  </div>
</div>
```

#### 交互流程

##### 流程 1: AI 自动分类

```mermaid
graph TD
    A[用户点击"AI 自动分类"] --> B[显示确认 Modal]
    B --> C{用户确认?}
    C -->|否| A
    C -->|是| D[显示进度 Modal]
    D --> E[后端 AI 分析照片]
    E --> F[实时更新进度]
    F --> G{完成?}
    G -->|否| F
    G -->|是| H[显示分类结果]
    H --> I[新建了 X 个场景]
    I --> J[分类了 Y 张照片]
    J --> K[准确率: 82%]
    K --> L[用户可纠正错误]
```

**分类进度 UI**:

```
+---------------------------------------------------------------+
|  AI 正在自动分类照片...                                       |
|                                                               |
|  +---------------------------------------------------------+  |
|  | ████████████████████░░░░░░░░░░░░  67% (1234/1890)     |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  已识别场景:                                                  |
|  • 🏖️ 海边 - 234 张                                         |
|  • 🎂 生日 - 128 张                                          |
|  • 🏠 在家 - 567 张                                          |
|  • 🌳 公园 - 305 张                                          |
|                                                               |
|  预计剩余时间: 30 秒                                         |
|                                                               |
|  [取消]                                                       |
+---------------------------------------------------------------+
```

#### 验收标准

- [ ] 识别准确率 > 80%
- [ ] 支持 15+ 种预设场景
- [ ] 支持用户纠正反馈 (持续学习)
- [ ] 场景标签可搜索
- [ ] 照片上传后 1 分钟内完成分类
- [ ] 支持批量修改场景标签
- [ ] 支持自定义场景

---

### 功能 1.3: 智能去重

#### 用户目标

- 快速识别重复/相似照片
- 批量删除重复照片
- 保留质量最好的版本

#### 页面结构

##### 1.3.1 去重概览页

```
+---------------------------------------------------------------+
|  Header: 智能去重                              [开始扫描]       |
+---------------------------------------------------------------+
|                                                               |
|  +---------------------------------------------------------+  |
|  | 扫描结果: 发现 23 组重复照片 (共 56 张)                   |  |
|  |                                                         |  |
|  | [统计图表]                                               |  |
|  | 完全重复: 12 组 (24 张) - SHA-256 完全相同               |  |
|  | 高度相似: 11 组 (32 张) - pHash 相似度 > 95%            |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  +---------------------------------------------------------+  |
|  | 第 1 组 (3 张) - 相似度 95%                               |  |
|  |                                                         |  |
|  |   +----------+  +----------+  +----------+               |  |
|  |   | [照片1]  |  | [照片2]  |  | [照片3]  |               |  |
|  |   | ✓ 推荐   |  |          |  |          |               |  |
|  |   | A+ 92    |  | B 78     |  | A 88     |               |  |
|  |   +----------+  +----------+  +----------+               |  |
|  |                                                         |  |
|  |   [✓ 保留推荐] [→ 手动选择] [→ 全部删除]                 |  |
|  +---------------------------------------------------------+  |
|                                                               |
+---------------------------------------------------------------+
```

#### 组件设计

##### 组件 A: `DuplicateGroupCard` (重复组卡片)

**Props 接口**:

```typescript
interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  onKeepPhoto: (photoId: string) => void;
  onManualSelect: () => void;
  onDeleteAll: () => void;
  isExpanded?: boolean;
}

interface DuplicateGroup {
  id: string;
  type: 'exact' | 'similar';
  photos: DuplicatePhoto[];
  similarity: number; // 0-100
  recommendedPhotoId: string;
}

interface DuplicatePhoto {
  id: string;
  url: string;
  qualityScore: number;
  uploadDate: Date;
  hash256?: string;
}
```

#### 交互流程

##### 流程 1: 批量去重

```mermaid
graph TD
    A[用户点击"开始扫描"] --> B[显示进度 Modal]
    B --> C[后端计算 pHash]
    C --> D[实时更新扫描进度]
    D --> E{扫描完成}
    E --> F[显示去重概览页]
    F --> G[查看重复组]
    G --> H{选择处理方式}
    H -->|保留推荐| I[点击"保留推荐"]
    H -->|手动选择| J[进入对比视图]
    H -->|全部删除| K[二次确认后删除]
    I --> L[批量删除非推荐照片]
    J --> M[用户选择照片]
    M --> L
    K --> L
    L --> N[显示完成报告]
    N --> O[释放了 X MB 存储空间]
```

#### 验收标准

- [ ] 相似度检测准确率 > 90%
- [ ] 连拍组识别准确率 > 95% (基于时间差 < 3s)
- [ ] 推荐保留照片用户采纳率 > 80%
- [ ] 支持批量处理
- [ ] 预览对比流畅
- [ ] 处理 1000 张照片 < 1 分钟

---

### 功能 1.4: 自动标签建议

#### 用户目标

- 快速添加照片标签
- 减少 手动输入
- 发现相关标签

#### 组件设计

##### 组件 A: `TagSuggestions` (标签建议组件)

**Props 接口**:

```typescript
interface TagSuggestionsProps {
  photoId: string;
  onTagAdd: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  existingTags: string[];
  maxSuggestions?: number;
}
```

**样式设计**:

```tsx
<div className="space-y-3">
  {/* 标签输入框 */}
  <input
    type="text"
    placeholder="添加标签..."
    value={inputValue}
    onChange={(e) => setInputValue(e.target.value)}
    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
  />

  {/* AI 建议标签 */}
  {suggestions.length > 0 && (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <SparklesIcon className="text-purple-500" />
        <span className="text-sm font-medium text-gray-700">AI 建议标签</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map(tag => (
          <button
            key={tag}
            onClick={() => onTagAdd(tag)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium
              ${existingTags.includes(tag)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer'
              }
              transition-colors
            `}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )}

  {/* 已有标签 */}
  {existingTags.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {existingTags.map(tag => (
        <span
          key={tag}
          className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1"
        >
          {tag}
          <button
            onClick={() => onTagRemove(tag)}
            className="hover:bg-blue-200 rounded-full p-0.5"
          >
            <XIcon className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  )}
</div>
```

#### 验收标准

- [ ] 标签建议准确率 > 75%
- [ ] 每次提供 3-5 个建议
- [ ] 建议响应时间 < 1 秒
- [ ] 支持自定义标签学习
- [ ] 建议可关闭 (用户偏好)

---

## 模块二: 成长记录工具

### 功能 2.1: 成长曲线

#### 用户目标

- 记录宝宝身高、体重、头围
- 查看生长曲线趋势
- 对比 WHO 生长标准
- 了解发育情况

#### 页面结构

##### 2.1.1 成长记录页面

```
+---------------------------------------------------------------+
|  Header: 成长记录                                    [+ 添加记录] |
+---------------------------------------------------------------+
|                                                               |
|  宝宝选择: [👶 宝宝1 ▼]                                        |
|                                                               |
|  +---------------------------------------------------------+  |
|  | 数据类型: [o] 身高 [o] 体重 [o] 头围  [★ 显示全部]     |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  +---------------------------------------------------------+  |
|  |                                                         |  |
|  |  [生长曲线图]                                            |  |
|  |                                                         |  |
|  |     90 ┼                    ╭─╮ WHO 标准             |  |
|  |     85 ┤              ╭────╯                        |  |
|  |     80 ┤        ╭────╯    ╰─╮ 你的宝宝              |  |
|  |     75 ┤   ╭────╯           ╰─────╮                |  |
|  |     70 ┼───╯                       ╰──╮             |  |
|  |        └────────────────────────────┴─────────────       |  |
|  |         1月  2月  3月  4月  5月  6月               |  |
|  |                                                         |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  记录列表:                                                     |
|  +---------------------------------------------------------+  |
|  | 2024-01-15 | 身高 | 65.5 cm  [编辑] [删除]            |  |
|  | 2024-01-10 | 体重 | 7.8 kg   [编辑] [删除]            |  |
|  | 2024-01-05 | 头围 | 42.3 cm  [编辑] [删除]            |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  [↓ 导出 CSV]  [📄 生成报告]                                   |
+---------------------------------------------------------------+
```

#### 组件设计

##### 组件 A: `GrowthChart` (生长曲线图)

**Props 接口**:

```typescript
interface GrowthChartProps {
  childId: string;
  recordType: 'HEIGHT' | 'WEIGHT' | 'HEAD_CIRCUMFERENCE' | 'ALL';
  dateRange?: { start: Date; end: Date };
  showWHOStandard?: boolean;
  onDataPointClick?: (record: GrowthRecord) => void;
}

interface GrowthRecord {
  id: string;
  childId: string;
  recordDate: Date;
  recordType: 'HEIGHT' | 'WEIGHT' | 'HEAD_CIRCUMFERENCE';
  value: number;
  unit: string; // cm, kg
  notes?: string;
}
```

**样式设计 (使用 Recharts)**:

```tsx
<div className="bg-white rounded-2xl shadow-md p-6">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-xl font-bold text-gray-800">生长曲线</h3>
    <div className="flex gap-2">
      <select
        value={recordType}
        onChange={(e) => setRecordType(e.target.value)}
        className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
      >
        <option value="HEIGHT">身高</option>
        <option value="WEIGHT">体重</option>
        <option value="HEAD_CIRCUMFERENCE">头围</option>
      </select>
    </div>
  </div>

  {/* Recharts 图表 */}
  <ResponsiveContainer width="100%" height={400}>
    <LineChart data={chartData}>
      {/* WHO 标准曲线 */}
      {showWHOStandard && (
        <>
          <Line
            type="monotone"
            dataKey="whoP97"
            stroke="#94a3b8"
            strokeDasharray="5 5"
            dot={false}
            name="WHO P97 (上限)"
          />
          <Line
            type="monotone"
            dataKey="whoP50"
            stroke="#3b82f6"
            strokeDasharray="5 5"
            dot={false}
            name="WHO P50 (平均)"
          />
          <Line
            type="monotone"
            dataKey="whoP3"
            stroke="#94a3b8"
            strokeDasharray="5 5"
            dot={false}
            name="WHO P3 (下限)"
          />
        </>
      )}

      {/* 宝宝实际数据 */}
      <Line
        type="monotone"
        dataKey="value"
        stroke="#f59e0b"
        strokeWidth={3}
        dot={{ fill: '#f59e0b', r: 6 }}
        activeDot={{ r: 8 }}
        name="你的宝宝"
        onClick={onDataPointClick}
      />

      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
    </LineChart>
  </ResponsiveContainer>
</div>
```

##### 组件 B: `GrowthRecordForm` (成长记录表单)

**Props 接口**:

```typescript
interface GrowthRecordFormProps {
  childId: string;
  initialData?: GrowthRecord;
  onSubmit: (data: GrowthRecordFormData) => Promise<void>;
  onCancel: () => void;
}
```

**样式设计**:

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  {/* 日期选择 */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      测量日期
    </label>
    <input
      type="date"
      value={formData.date}
      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
      max={new Date().toISOString().split('T')[0]}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
      required
    />
  </div>

  {/* 记录类型选择 */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-3">
      记录类型
    </label>
    <div className="grid grid-cols-3 gap-3">
      {recordTypes.map(type => (
        <button
          key={type.value}
          type="button"
          onClick={() => setFormData({ ...formData, type: type.value })}
          className={`
            p-4 rounded-xl border-2 transition-all duration-300
            flex flex-col items-center gap-2
            ${formData.type === type.value
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
            }
          `}
        >
          <span className="text-3xl">{type.icon}</span>
          <span className="text-sm font-medium text-gray-700">{type.label}</span>
        </button>
      ))}
    </div>
  </div>

  {/* 数值输入 */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      测量数值
    </label>
    <div className="flex gap-2">
      <input
        type="number"
        step="0.1"
        value={formData.value}
        onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
        placeholder="例如: 65.5"
        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
        required
      />
      <select
        value={formData.unit}
        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
        className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-white"
      >
        <option value="cm">cm</option>
        <option value="kg">kg</option>
      </select>
    </div>
  </div>

  {/* 备注 (可选) */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      备注 (可选)
    </label>
    <textarea
      value={formData.notes}
      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      placeholder="例如: 今天体检,医生说发育正常..."
      rows={3}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
    />
  </div>

  {/* 操作按钮 */}
  <div className="flex gap-3 pt-4 border-t">
    <button
      type="button"
      onClick={onCancel}
      className="flex-1 px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
    >
      取消
    </button>
    <button
      type="submit"
      disabled={isSubmitting}
      className="flex-1 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:from-blue-600 hover:to-cyan-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {isSubmitting ? '保存中...' : '保存记录'}
    </button>
  </div>
</form>
```

#### 验收标准

- [ ] 支持多个孩子分别记录
- [ ] 曲线图支持缩放和拖动
- [ ] WHO 标准曲线准确
- [ ] 数据可导出 CSV/PDF
- [ ] 提供"发育正常"提示
- [ ] 数据可编辑和删除

---

### 功能 2.2: 成长报告生成

#### 用户目标

- 一键生成月度/年度成长报告
- 精美排版便于保存和分享
- AI 生成文案总结

#### 页面结构

##### 2.2.1 成长报告生成器

```
+---------------------------------------------------------------+
|  Header: 成长报告生成                          [← 返回]         |
+---------------------------------------------------------------+
|                                                               |
|  报告类型:                                                     |
|  +-------------------------------------------------------+   |
|  | [o] 月度报告  [o] 季度报告  [o] 年度报告              |   |
|  +-------------------------------------------------------+   |
|                                                               |
|  选择月份: [2024年] [01月 ▼]                                  |
|                                                               |
|  报告内容:                                                     |
|  +---------------------------------------------------------+  |
|  | [✓] 精选照片 (本月最佳 10 张)                           |  |
|  | [✓] 生长曲线 (身高/体重/头围)                           |  |
|  | [✓] 里程碑记录 (本月完成的里程碑)                         |  |
|  | [✓] AI 小结 (自动生成月度总结)                          |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  [✓ 生成报告]                                                |
|                                                               |
|  预览:                                                        |
|  +---------------------------------------------------------+  |
|  |                                                         |  |
|  |  [A4 页面预览]                                          |  |
|  |                                                         |  |
|  |   ┌─────────────────────────────────────────────────┐    |  |
|  |   │ 宝宝的 1 月成长报告                            │    |  |
|  |   │                                                 │    |  |
|  |   │  📸 精彩瞬间                                   │    |  |
|  |   │  [照片网格]                                    │    |  |
|  |   │                                                 │    |  |
|  |   │  📏 成长数据                                   │    |  |
|  |   │  [曲线图]                                      │    |  |
|  |   │                                                 │    |  |
|  |   │  🎉 里程碑                                     │    |  |
|  |   │  • 第一次抬头                                   │    |  |
|  |   │                                                 │    |  |
|  |   │  📝 AI 小结                                    │    |  |
|  |   │  "这个月宝宝学会了很多新技能..."               │    |  |
|  |   └─────────────────────────────────────────────────┘    |  |
|  |                                                         |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  [↓ 下载 PDF]  [→ 分享链接]                                   |
+---------------------------------------------------------------+
```

#### 组件设计

##### 组件 A: `ReportGenerator` (报告生成器)

**Props 接口**:

```typescript
interface ReportGeneratorProps {
  childId: string;
  reportType: 'monthly' | 'quarterly' | 'yearly';
  onGenerate: (options: ReportOptions) => Promise<string>; // 返回 PDF URL
}

interface ReportOptions {
  includePhotos: boolean;
  includeGrowthChart: boolean;
  includeMilestones: boolean;
  includeAISummary: boolean;
  photoCount?: number;
}
```

**样式设计**:

```tsx
<div className="max-w-4xl mx-auto space-y-6">
  {/* 报告类型选择 */}
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h3 className="text-lg font-bold text-gray-800 mb-4">报告类型</h3>
    <div className="grid grid-cols-3 gap-3">
      {reportTypes.map(type => (
        <button
          key={type.value}
          onClick={() => setReportType(type.value)}
          className={`
            p-4 rounded-xl border-2 transition-all duration-300
            ${reportType === type.value
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
            }
          `}
        >
          <div className="text-2xl mb-2">{type.icon}</div>
          <div className="font-medium text-gray-800">{type.label}</div>
          <div className="text-sm text-gray-500 mt-1">{type.description}</div>
        </button>
      ))}
    </div>
  </div>

  {/* 时间范围选择 */}
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h3 className="text-lg font-bold text-gray-800 mb-4">时间范围</h3>
    <div className="flex gap-3">
      <select
        value={year}
        onChange={(e) => setYear(parseInt(e.target.value))}
        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
      >
        <option value={2023}>2023 年</option>
        <option value={2024}>2024 年</option>
        <option value={2025}>2025 年</option>
      </select>
      <select
        value={month}
        onChange={(e) => setMonth(parseInt(e.target.value))}
        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <option key={i + 1} value={i + 1}>{i + 1} 月</option>
        ))}
      </select>
    </div>
  </div>

  {/* 报告内容选项 */}
  <div className="bg-white rounded-2xl shadow-md p-6">
    <h3 className="text-lg font-bold text-gray-800 mb-4">报告内容</h3>
    <div className="space-y-3">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={options.includePhotos}
          onChange={(e) => setOptions({ ...options, includePhotos: e.target.checked })}
          className="w-5 h-5 text-blue-500 rounded"
        />
        <span className="flex-1">
          <span className="font-medium text-gray-700">精选照片</span>
          <span className="text-sm text-gray-500 ml-2">本月最佳照片</span>
        </span>
      </label>

      {options.includePhotos && (
        <div className="ml-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            照片数量: {options.photoCount || 10} 张
          </label>
          <input
            type="range"
            min="5"
            max="20"
            value={options.photoCount || 10}
            onChange={(e) => setOptions({ ...options, photoCount: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      )}

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={options.includeGrowthChart}
          onChange={(e) => setOptions({ ...options, includeGrowthChart: e.target.checked })}
          className="w-5 h-5 text-blue-500 rounded"
        />
        <span className="flex-1">
          <span className="font-medium text-gray-700">生长曲线</span>
          <span className="text-sm text-gray-500 ml-2">身高/体重/头围数据</span>
        </span>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={options.includeMilestones}
          onChange={(e) => setOptions({ ...options, includeMilestones: e.target.checked })}
          className="w-5 h-5 text-blue-500 rounded"
        />
        <span className="flex-1">
          <span className="font-medium text-gray-700">里程碑记录</span>
          <span className="text-sm text-gray-500 ml-2">本月完成的里程碑</span>
        </span>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={options.includeAISummary}
          onChange={(e) => setOptions({ ...options, includeAISummary: e.target.checked })}
          className="w-5 h-5 text-blue-500 rounded"
        />
        <span className="flex-1">
          <span className="font-medium text-gray-700">AI 小结</span>
          <span className="text-sm text-gray-500 ml-2">自动生成月度总结</span>
        </span>
      </label>
    </div>
  </div>

  {/* 生成按钮 */}
  <button
    onClick={handleGenerate}
    disabled={isGenerating}
    className="w-full px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
  >
    {isGenerating ? (
      <>
        <Spinner />
        <span>正在生成报告...</span>
      </>
    ) : (
      <>
        <SparklesIcon />
        <span>生成报告</span>
      </>
    )}
  </button>

  {/* 预览 (生成后显示) */}
  {generatedReport && (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">预览</h3>
      <div className="aspect-[1/1.414] bg-gray-100 rounded-xl overflow-hidden">
        <iframe src={generatedReport} className="w-full h-full" />
      </div>
      <div className="flex gap-3 mt-4">
        <button className="flex-1 px-6 py-3 rounded-xl font-medium text-gray-700 border-2 border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
          <DownloadIcon />
          下载 PDF
        </button>
        <button className="flex-1 px-6 py-3 rounded-xl font-medium text-blue-600 border-2 border-blue-200 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
          <ShareIcon />
          分享链接
        </button>
      </div>
    </div>
  )}
</div>
```

#### 验收标准

- [ ] 报告包含: 精选照片、数据曲线、里程碑、AI 小结
- [ ] 报告生成时间 < 30 秒
- [ ] PDF 排版精美, A4 适合打印
- [ ] AI 小结用户满意度 > 70%
- [ ] 支持月度/季度/年度报告

---

### 功能 2.3: 身体发育里程碑提醒

#### 用户目标

- 不错过重要发育时刻
- 适时记录里程碑
- 获得基于月龄的推荐

#### 页面结构

##### 2.3.1 里程碑提醒页面

```
+---------------------------------------------------------------+
|  Header: 里程碑                                                     |
+---------------------------------------------------------------+
|                                                               |
|  宝宝月龄: 6 个月                                              |
|                                                               |
|  推荐记录的里程碑:                                             |
|  +---------------------------------------------------------+  |
|  |                                                         |  |
|  |  +---------------------------------------------------+ |  |
|  |  | 👶 独坐                                          | |  |
|  |  |                                                   | |  |
|  |  |  典型月龄: 6-8 个月                              | |  |
|  |  |  您的宝宝: 6 个月 2 天                            | |  |
|  |  |                                                   | |  |
|  |  |  📸 建议照片: 拍摄宝宝独自坐着的照片     | |  |
|  |  |  💬 描述建议: 记录宝宝能坐稳的时长和状态 | |  |
|  |  |                                                   | |  |
|  |  |  [✓ 记录里程碑]  [→ 稍后提醒]              | |  |
|  |  +---------------------------------------------------+ |  |
|  |                                                         |  |
|  |  +---------------------------------------------------+ |  |
|  |  | 🗣️ 说简单词                                      | |  |
|  |  |  典型月龄: 9-12 个月                            | |  |
|  |  |  [→ 还未到月龄]                                  | |  |
|  |  +---------------------------------------------------+ |  |
|  |                                                         |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  已记录的里程碑:                                               |
|  +---------------------------------------------------------+  |
|  | ✓ 第一次抬头 - 2024-01-05                              |  |
|  | ✓ 第一次微笑 - 2024-01-15                              |  |
|  | ✓ 第一次翻身 - 2024-02-01                              |  |
|  +---------------------------------------------------------+  |
|                                                               |
+---------------------------------------------------------------+
```

#### 组件设计

##### 组件 A: `MilestoneSuggestionCard` (里程碑建议卡片)

**Props 接口**:

```typescript
interface MilestoneSuggestionCardProps {
  childId: string;
  milestone: SuggestedMilestone;
  onRecord: (data: MilestoneData) => Promise<void>;
  onSnooze: (days: number) => void;
}

interface SuggestedMilestone {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  typicalAgeRange: { min: number; max: number }; // 月龄
  currentAge: number; // 宝宝当前月龄
  photoTips?: string;
  descriptionTips?: string;
  status: 'pending' | 'ready' | 'passed';
}
```

**样式设计**:

```tsx
<div className={`
  relative overflow-hidden rounded-2xl shadow-md
  ${status === 'ready'
    ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200'
    : status === 'pending'
      ? 'bg-gray-50 border-2 border-gray-200'
      : 'bg-green-50 border-2 border-green-200'
  }
`}>

  {/* 里程碑头部 */}
  <div className="p-6">
    <div className="flex items-start gap-4">
      {/* 图标 */}
      <div className="text-5xl">{getMilestoneIcon(type)}</div>

      {/* 内容 */}
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-3">{description}</p>

        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="text-gray-500" />
          <span className="text-gray-600">
            典型月龄: {typicalAgeRange.min} - {typicalAgeRange.max} 个月
          </span>
          <span className="text-gray-400">|</span>
          <span className={`
            font-medium
            ${status === 'ready' ? 'text-blue-600' : 'text-gray-600'}
          `}>
            您的宝宝: {formatAge(currentAge)}
          </span>
        </div>
      </div>

      {/* 状态标签 */}
      <div className="flex flex-col gap-2">
        {status === 'ready' && (
          <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
            ⏰ 建议记录
          </span>
        )}
        {status === 'pending' && (
          <span className="bg-gray-400 text-white text-xs px-3 py-1 rounded-full font-medium">
            待到月龄
          </span>
        )}
        {status === 'passed' && (
          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
            ✓ 已完成
          </span>
        )}
      </div>
    </div>
  </div>

  {/* 拍摄和描述建议 (仅在 ready 状态显示) */}
  {status === 'ready' && (
    <div className="px-6 pb-6 space-y-4">
      {/* 拍摄建议 */}
      {photoTips && (
        <div className="flex items-start gap-3 p-4 bg-white/60 rounded-xl">
          <CameraIcon className="text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-800 mb-1">拍摄建议</h4>
            <p className="text-sm text-gray-600">{photoTips}</p>
          </div>
        </div>
      )}

      {/* 描述建议 */}
      {descriptionTips && (
        <div className="flex items-start gap-3 p-4 bg-white/60 rounded-xl">
          <EditIcon className="text-purple-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-800 mb-1">描述建议</h4>
            <p className="text-sm text-gray-600">{descriptionTips}</p>
          </div>
        </div>
      )}
    </div>
  )}

  {/* 操作按钮 */}
  <div className={`
    px-6 py-4 border-t flex gap-3
    ${status === 'ready' ? 'bg-white/80' : 'bg-gray-100'}
  `}>
    {status === 'ready' && (
      <>
        <button
          onClick={handleRecord}
          className="flex-1 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <CheckIcon />
          记录里程碑
        </button>
        <button
          onClick={() => onSnooze(7)}
          className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors"
        >
          稍后提醒
        </button>
      </>
    )}

    {status === 'pending' && (
      <div className="flex-1 text-center text-gray-500">
        还未到典型月龄,请耐心等待
      </div>
    )}

    {status === 'passed' && (
      <div className="flex-1 flex items-center justify-center gap-2 text-green-600 font-medium">
        <CheckIcon />
        已在 {completedDate} 完成记录
      </div>
    )}
  </div>
</div>
```

#### 交互流程

##### 流程 1: 记录里程碑

```mermaid
graph TD
    A[查看里程碑推荐] --> B{状态判断}
    B -->|ready| C[显示建议卡片]
    B -->|pending| D[显示待到月龄]
    B -->|passed| E[显示已完成]
    C --> F[用户点击"记录里程碑"]
    F --> G[打开记录表单]
    G --> H[选择照片]
    H --> I[填写描述]
    I --> J[保存]
    J --> K[显示庆祝动画]
    K --> L[更新里程碑列表]
```

**庆祝动画效果**:

```css
@keyframes celebrate {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.celebrate-animation {
  animation: celebrate 0.8s ease-out;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  background: linear-gradient(45deg, #ff6b6b, #feca57);
  animation: confetti-fall 3s ease-out forwards;
}

@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
```

#### 验收标准

- [ ] 覆盖 0-6 岁主要发育里程碑
- [ ] 推送时机恰当 (不过早/过晚)
- [ ] 提醒可关闭
- [ ] 记录后给予庆祝动画
- [ ] 支持自定义里程碑

---

## 模块三: 社交分享优化

### 功能 3.1: 访问密码保护

#### 用户目标

- 给相册设置密码保护
- 控制谁可以访问
- 保护隐私

#### 页面结构

##### 3.1.1 密码设置界面

```
+---------------------------------------------------------------+
|  Header: 相册访问密码保护                              [← 返回]  |
+---------------------------------------------------------------|
|                                                               |
|  当前状态: [🔓 未设置密码]                                       |
|                                                               |
|  +---------------------------------------------------------+  |
|  | 设置访问密码                                             |  |
|  |                                                         |  |
|  |  密码: [____] [____] [____] [____]                       |  |
|  |                                                         |  |
|  |  确认密码: [____] [____] [____] [____]                   |  |
|  |                                                         |  |
|  |  [✓ 设置密码]                                          |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  安全说明:                                                     |
|  • 4-6 位数字密码                                              |
|  • 5 次错误后锁定 30 分钟                                      |
|  | 访客无需注册即可访问                                         |
|  • 您可以随时修改或移除密码                                     |
|                                                               |
|  [取消]                                                       |
+---------------------------------------------------------------|
```

##### 3.1.2 访客密码验证界面

```
+---------------------------------------------------------------+
|  Header: 家庭相册访问                                         |
+---------------------------------------------------------------|
|                                                               |
|  +---------------------------------------------------------+  |
|  |  🔒 此相册受密码保护                                    |  |
|  |                                                         |  |
|  |  请输入访问密码:                                         |  |
|  |                                                         |  |
|  |  [____] [____] [____] [____]                           |  |
|  |                                                         |  |
|  |  [→ 访问相册]                                          |  |
|  |                                                         |  |
|  |  剩余尝试次数: 5 次                                    |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  需要密码帮助? 联系相册主人。                                   |
+---------------------------------------------------------------|
```

#### 组件设计

##### 组件 A: `PasswordInput` (密码输入组件)

**Props 接口**:

```typescript
interface PasswordInputProps {
  length?: number; // 4-6
  value: string;
  onChange: (value: string) => void;
  onError?: (error: string) => void;
  autoFocus?: boolean;
}
```

**样式设计**:

```tsx
<div className="flex gap-2 justify-center">
  {Array.from({ length: 4 }).map((_, index) => (
    <input
      key={index}
      ref={index === 0 ? firstInputRef : null}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value[index] || ''}
      onChange={(e) => handleChange(e, index)}
      onKeyDown={(e) => handleKeyDown(e, index)}
      className={`
        w-16 h-16 text-center text-3xl font-bold
        border-2 rounded-xl
        transition-all duration-200
        ${error
          ? 'border-red-500 bg-red-50 shake-animation'
          : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
        }
      `}
      autoFocus={autoFocus && index === 0}
    />
  ))}
</div>
```

#### 验收标准

- [ ] 密码正确才能访问相册
- [ ] 5 次错误后锁定 30 分钟
- [ ] 支持清除访问记录
- [ ] 密码可重置
- [ ] 访问体验流畅

---

### 功能 3.2: 照片评论与互动

#### 用户目标

- 在照片上留言互动
- 表达对宝宝的爱
- 与家人分享感受

#### 页面结构

##### 3.2.1 照片评论区

```
+---------------------------------------------------------------+
|  [照片预览]                                                  |
+---------------------------------------------------------------|
|                                                               |
|  +---------------------------------------------------------+  |
|  | 评论区 (12 条评论)                                      |  |
|  |                                                         |  |
|  |  +-------+  👶 妈妈              今天 10:30            |  |
|  |  | [头像] |  太可爱了! 我已经保存了 💕                      |  |
|  |  +-------+                                              |  |
|  |                                                         |  |
|  |  +-------+  👵 爷爷              昨天 15:20            |  |
|  |  | [头像] |  我们的宝贝真是越长越帅了! 👍                  |  |
|  |  +-------+  [❤️ 3] [😂 1]                             |  |
|  |                                                         |  |
|  |  +-------+  👵 奶奶              02-12 09:45          |  |
|  |  | [头像] |  看到宝宝笑得这么开心,奶奶也高兴!               |  |
|  |  +-------+                                              |  |
|  |                                                         |  |
|  |  [加载更多...]                                          |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  快捷反应:                                                     |
|  +---------------------------------------------------------+  |
|  | [❤️] [😂] [😍] [👍] [🎉] [+ 更多]                   |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  [_______] [写评论...]                         [→ 发送]       |
+---------------------------------------------------------------|
```

#### 组件设计

##### 组件 A: `CommentItem` (评论项)

**Props 接口**:

```typescript
interface CommentItemProps {
  comment: Comment;
  onDelete?: (commentId: string) => void;
  onReactionAdd: (commentId: string, emoji: string) => void;
  currentUserId?: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  reactions: Reaction;
  createdAt: Date;
  updatedAt?: Date;
}

interface Reaction {
  emoji: string;
  users: string[]; // userId list
}
```

**样式设计**:

```tsx
<div className="flex gap-3 p-4 hover:bg-gray-50 transition-colors">
  {/* 头像 */}
  <div className="flex-shrink-0">
    {authorAvatar ? (
      <img
        src={authorAvatar}
        alt={authorName}
        className="w-10 h-10 rounded-full object-cover"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
        {authorName.charAt(0)}
      </div>
    )}
  </div>

  {/* 评论内容 */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-1">
      <span className="font-semibold text-gray-800">{authorName}</span>
      <span className="text-xs text-gray-500">
        {formatRelativeTime(createdAt)}
      </span>
    </div>

    <p className="text-gray-700 whitespace-pre-wrap">{content}</p>

    {/* 反应 */}
    {reactions.length > 0 && (
      <div className="flex gap-1 mt-2">
        {reactions.map(reaction => (
          <button
            key={reaction.emoji}
            onClick={() => onReactionAdd(id, reaction.emoji)}
            className={`
              px-2 py-1 rounded-full text-sm flex items-center gap-1 transition-colors
              ${reaction.users.includes(currentUserId)
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            <span>{reaction.emoji}</span>
            <span className="text-xs">{reaction.users.length}</span>
          </button>
        ))}
      </div>
    )}
  </div>

  {/* 删除按钮 (仅作者可见) */}
  {currentUserId === authorId && (
    <button
      onClick={() => onDelete(id)}
      className="flex-shrink-0 p-2 hover:bg-red-50 rounded-lg transition-colors"
      aria-label="删除评论"
    >
      <TrashIcon className="w-4 h-4 text-red-500" />
    </button>
  )}
</div>
```

##### 组件 B: `ReactionPicker` (表情选择器)

**Props 接口**:

```typescript
interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  commonEmojis?: string[];
}
```

**样式设计**:

```tsx
<div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-4">
  <div className="grid grid-cols-6 gap-2">
    {commonEmojis.map(emoji => (
      <button
        key={emoji}
        onClick={() => onSelect(emoji)}
        className="w-10 h-10 text-2xl hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
      >
        {emoji}
      </button>
    ))}
  </div>
</div>
```

#### 验收标准

- [ ] 支持文字评论和表情
- [ ] 评论后通知相册主人
- [ ] 支持删除不当评论
- [ ] 评论可导出
- [ ] 实时更新评论 (WebSocket)

---

### 功能 3.3: 分享链接美化

#### 用户目标

- 自定义分享链接
- 优化社交媒体预览
- 提升分享点击率

#### 页面结构

##### 3.3.1 分享设置界面

```
+---------------------------------------------------------------+
|  Header: 分享设置                                    [← 返回]   |
+---------------------------------------------------------------|
|                                                               |
|  预览:                                                        |
|  +---------------------------------------------------------+  |
|  |                                                         |  |
|  |    [自定义封面图]                                        |  |
|  |                                                         |  |
|  |    [自定义标题: 宝宝的满月照片集]                        |  |
|  |                                                         |  |
|  |    [自定义描述: 记录宝宝满月的美好瞬间...]              |  |
|  |                                                         |  |
|  |    https://family-album.app/s/abc123                    |  |
|  |                                                         |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  编辑选项:                                                     |
|  +---------------------------------------------------------+  |
|  | 封面图片:                                                |  |
|  |  [+ 从照片中选择]  [使用默认封面]                       |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  +---------------------------------------------------------+  |
|  | 分享标题:                                                |  |
|  |  [________________________________________________]    |  |
|  |                                                         |  |
|  |  提示: 标题会在社交媒体预览中显示                         |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  +---------------------------------------------------------+  |
|  | 分享描述:                                                |  |
|  |  [________________________________________________]    |  |
|  |  [________________________________________________]    |  |
|  |                                                         |  |
|  |  提示: 描述会在社交媒体预览中显示                         |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  访问设置:                                                     |
|  +---------------------------------------------------------+  |
|  | [o] 任何人可访问  [o] 需要密码  [o] 仅家庭成员         |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  [✓ 保存设置]                                                |
|                                                               |
+---------------------------------------------------------------|
```

#### 组件设计

##### 组件 A: `SharePreviewCard` (分享预览卡片)

**Props 接口**:

```typescript
interface SharePreviewCardProps {
  title: string;
  description: string;
  coverImage?: string;
  shortCode: string;
  onEdit: () => void;
}
```

**样式设计**:

```tsx
<div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
  {/* 封面图 */}
  <div className="aspect-[16/9] relative group cursor-pointer" onClick={onEdit}>
    {coverImage ? (
      <img
        src={coverImage}
        alt="分享封面"
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
        <CameraIcon className="text-white/50 w-16 h-16" />
      </div>
    )}

    {/* 编辑遮罩 */}
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
      <span className="text-white font-medium">点击更换封面</span>
    </div>
  </div>

  {/* 标题和描述 */}
  <div className="p-6 space-y-3">
    <h3 className="text-xl font-bold text-gray-800">{title || '未设置标题'}</h3>
    <p className="text-gray-600 line-clamp-3">{description || '未设置描述'}</p>
  </div>

  {/* 分享链接 */}
  <div className="px-6 pb-6">
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
      <LinkIcon className="text-gray-500" />
      <span className="flex-1 text-sm text-gray-600 font-mono truncate">
        {`https://family-album.app/s/${shortCode}`}
      </span>
      <button
        onClick={() => navigator.clipboard.writeText(shareUrl)}
        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        title="复制链接"
      >
        <CopyIcon className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  </div>
</div>
```

#### 验收标准

- [ ] 支持自定义标题/描述/封面
- [ ] 微信分享卡片正常显示
- [ ] 短链接永久有效
- [ ] 提供分享数据统计

---

## 模块四: 照片打印与实物

### 功能 4.1: 在线打印服务集成

#### 验收标准

- [ ] 支持 4R、6R、A4 等规格
- [ ] 价格透明
- [ ] 支持批量打印
- [ ] 订单跟踪

**设计建议**: 使用第三方打印服务 API 对接,无需自建打印功能。

---

## 模块五: 视频功能

### 功能 5.1: 视频上传支持

#### 验收标准

- [ ] 支持最大 500MB 视频
- [ ] 自动压缩不影响观看
- [ ] 生成 3 秒预览
- [ ] 流畅播放

**技术挑战**: 存储成本高,需要付费扩容。

---

## 设计系统扩展

### 新增颜色系统

#### 质量评分颜色

```typescript
export const qualityColors = {
  excellent: {
    bg: 'from-emerald-400 to-green-500',
    text: 'text-white',
    solid: '#10b981',
    label: 'A+',
  },
  good: {
    bg: 'from-blue-400 to-cyan-500',
    text: 'text-white',
    solid: '#3b82f6',
    label: 'A',
  },
  fair: {
    bg: 'from-yellow-400 to-amber-500',
    text: 'text-white',
    solid: '#f59e0b',
    label: 'B',
  },
  poor: {
    bg: 'from-orange-400 to-red-400',
    text: 'text-white',
    solid: '#f97316',
    label: 'C',
  },
  bad: {
    bg: 'from-red-500 to-pink-500',
    text: 'text-white',
    solid: '#ef4444',
    label: 'D',
  },
} as const;
```

#### 成长曲线颜色

```typescript
export const growthChartColors = {
  height: {
    primary: '#3b82f6', // 蓝色
    gradient: 'from-blue-400 to-blue-600',
  },
  weight: {
    primary: '#10b981', // 绿色
    gradient: 'from-green-400 to-green-600',
  },
  headCircumference: {
    primary: '#a855f7', // 紫色
    gradient: 'from-purple-400 to-purple-600',
  },
  whoStandard: {
    p97: '#94a3b8', // 灰色虚线
    p50: '#3b82f6', // 蓝色虚线
    p3: '#94a3b8', // 灰色虚线
  },
} as const;
```

---

## 响应式设计

### 断点策略

| 屏幕尺寸 | 宽度 | 布局调整 |
|----------|------|----------|
| Mobile | < 640px | 单列,隐藏次要信息 |
| Tablet | 640-1023px | 双列,横向滚动 |
| Desktop | 1024-1279px | 3-4 列 |
| Wide | ≥ 1280px | 4-5 列,完整布局 |

---

## 无障碍访问

### 关键实践

1. **语义化 HTML**: 使用正确的标签
2. **键盘导航**: 全功能键盘可访问
3. **屏幕阅读器**: ARIA 属性支持
4. **颜色对比**: WCAG AA 标准 (4.5:1)
5. **焦点可见**: 明显的焦点环

---

## 开发交付清单

### 设计资产

- [x] 完整的组件树结构
- [x] 每个 UI 组件的 Props 接口定义
- [x] 响应式断点规则
- [x] 交互流程图 (Mermaid)
- [x] A11y 检查清单
- [x] 颜色/字体/间距规范更新

### 技术文档需求

- [ ] API 接口需求 (待技术总监确认)
- [ ] 数据库 Schema 扩展 (已在 PRD 中定义)
- [ ] 性能优化建议
- [ ] 测试用例建议

---

## 附录

### A. MoSCoW 优先级对照

| 优先级 | 功能 | 设计完成度 | 备注 |
|--------|------|-----------|------|
| **Must Have** | AI 照片质量评分 | ✅ 完成 | Week 1-2 |
| **Must Have** | 智能场景分类 | ✅ 完成 | Week 1-2 |
| **Must Have** | 成长曲线 | ✅ 完成 | Week 2 |
| **Must Have** | 里程碑提醒 | ✅ 完成 | Week 2 |
| **Must Have** | 访问密码保护 | ✅ 完成 | Week 2 |
| **Should Have** | 智能去重 | ✅ 完成 | Week 3 |
| **Should Have** | 成长报告生成 | ✅ 完成 | Week 3 |
| **Should Have** | 分享链接美化 | ✅ 完成 | Week 4 |
| **Should Have** | 照片评论与互动 | ✅ 完成 | Week 4 |
| **Could Have** | 访问统计 | ⚠️ 需补充 | Week 5 |
| **Could Have** | 在线打印服务 | ⚠️ 第三方集成 | Week 5 |
| **Could Have** | 视频上传支持 | ⚠️ 技术复杂 | Week 5 |
| **Won't Have** | 相册排版工具 | - | Phase 4 |
| **Won't Have** | 视频剪辑工具 | - | Phase 4 |

---

**文档版本**: 1.0
**设计师**: UI/UX Designer
**最后更新**: 2026-02-14
**状态**: ✅ 设计方案完成,待团队评审

