# UI/UX交互设计方案

> 🎨 新功能详细交互设计和用户体验规范

---

## 1. 批量上传功能交互设计

### 1.1 用户流程图

```
[开始]
  │
  ├─→ 打开批量上传页面
  │     │
  │     ├─→ [方式1] 拖拽文件到拖拽区
  │     │     │
  │     │     ├─→ 拖拽进入 → 区域高亮 + 提示文字变化
  │     │     ├─→ 松开文件 → 文件添加到列表
  │     │     └─→ 显示成功动画 ✨
  │     │
  │     ├─→ [方式2] 点击选择文件按钮
  │     │     │
  │     │     ├─→ 打开文件选择器
  │     │     ├─→ 选择文件（支持多选）
  │     │     └─→ 文件添加到列表
  │     │
  │     ├─→ [文件列表管理]
  │     │     │
  │     │     ├─→ 查看缩略图预览
  │     │     ├─→ 查看文件名和大小
  │     │     ├─→ 点击 ✗ 移除单个文件
  │     │     └─→ 点击"清空列表"移除全部
  │     │
  │     ├─→ [选择宝贝]（可选）
  │     │     │
  │     │     ├─→ 点击下拉框
  │     │     ├─→ 选择一个或多个宝贝
  │     │     └─→ 或选择"全部宝贝"
  │     │
  │     ├─→ [上传选项]
  │     │     │
  │     │     ├─→ ☑ 自动按日期分组到相册
  │     │     ├─→ ☑ 上传后添加到时间线
  │     │     └─→ ☑ 保留原始日期时间
  │     │
  │     ├─→ 点击"✨ 开始上传"
  │     │     │
  │     │     ├─→ 验证：文件列表不为空
  │     │     ├─→ 打开进度对话框
  │     │     ├─→ 逐个上传文件
  │     │     │     │
  │     │     │     ├─→ 显示当前文件名
  │     │     │     ├─→ 显示当前文件进度
  │     │     │     ├─→ 显示整体进度 (X/Y)
  │     │     │     ├─→ 已完成文件显示 ✅
  │     │     │     └─→ 等待中文件显示 ⏳
  │     │     │
  │     │     ├─→ [上传中操作]
  │     │     │     │
  │     │     │     ├─→ 点击"⏸ 暂停" → 暂停上传
  │     │     │     ├─→ 点击"▶ 继续" → 继续上传
  │     │     │     └─→ 点击"✗ 取消" → 确认后取消
  │     │     │
  │     │     └─→ 全部完成
  │     │           │
  │     │           ├─→ 显示成功动画 🎉
  │     │           ├─→ 显示统计信息
  │     │           │     ├─→ 成功上传 X 张
  │     │           │     ├─→ 失败 X 张
  │     │           │     └─→ 跳过重复 X 张
  │     │           ├─→ 自动关闭或点击"关闭"
  │     │           └─→ 返回照片列表
  │     │
  └─→ [结束]
```

### 1.2 交互状态详解

**拖拽区域状态**：

| 状态 | 视觉表现 | 交互提示 |
|-----|---------|---------|
| **默认** | 虚线边框 `border-primary-300`<br>背景 `bg-white` | "拖拽照片到这里上传<br>或点击选择文件" |
| **拖拽进入** | 虚线边框 `border-primary-500`<br>背景 `bg-primary-50`<br>图标动画 `animate-bounce` | "松开即可添加文件" |
| **文件已添加** | 虚线边框 `border-success-400`<br>背景 `bg-success-50`<br>成功图标 ✨ | "已添加 X 张照片" |
| **错误** | 虚线边框 `border-error-400`<br>背景 `bg-error-50`<br>抖动动画 | "文件格式不支持" |

**上传进度状态**：

| 阶段 | 视觉表现 | 交互说明 |
|-----|---------|---------|
| **准备中** | 进度条 0%<br>状态："准备上传..." | 按钮可用 |
| **上传中** | 进度条动态变化<br>当前文件名<br>整体进度 X/Y | 可暂停/取消 |
| **暂停** | 进度条静止<br>状态："已暂停"<br>按钮变"▶ 继续" | 可继续/取消 |
| **完成** | 进度条 100%<br>成功图标 🎉<br>统计信息 | 点击关闭返回 |

### 1.3 微交互设计

**文件添加动画**：
```css
/* 新文件卡片从下方滑入 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.photo-card-enter {
  animation: slideInUp 0.3s ease-out;
}
```

**上传成功动画**：
```css
/* 完成时彩带效果 */
@keyframes confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
}

.confetti {
  animation: confetti 1s ease-out forwards;
}
```

**进度条动画**：
```css
/* 平滑过渡 */
.progress-bar {
  transition: width 0.3s ease-out;
}

/* 完成时闪烁 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.progress-complete {
  animation: pulse 0.5s ease-in-out 2;
}
```

---

## 2. 智能相册功能交互设计

### 2.1 用户流程图

```
[开始]
  │
  ├─→ 打开智能相册页面
  │     │
  │     ├─→ 查看相册列表
  │     │     │
  │     │     ├─→ [浏览相册]
  │     │     │     │
  │     │     │     ├─→ 滚动浏览
  │     │     │     ├─→ 悬停卡片 → 上浮 + 阴影加深
  │     │     │     └─→ 点击卡片 → 进入相册详情
  │     │     │
  │     │     ├─→ [搜索相册]
  │     │     │     │
  │     │     │     ├─→ 点击搜索框
  │     │     │     ├─→ 输入关键词
  │     │     │     ├─→ 实时过滤相册
  │     │     │     └─→ 高亮匹配文字
  │     │     │
  │     │     └─→ [筛选相册]
  │     │           │
  │     │           ├─→ 点击标签页
  │     │           ├─→ 选择：全部/自动分类/手动创建/收藏
  │     │           └─→ 列表动画切换
  │     │
  │     ├─→ [创建新相册]
  │     │     │
  │     │     ├─→ 点击"+ 新建相册"按钮
  │     │     ├─→ 打开创建表单对话框
  │     │     │     │
  │     │     │     ├─→ 输入相册名称
  │     │     │     ├─→ 选择封面照片
  │     │     │     ├─→ 选择相册图标
  │     │     │     ├─→ 添加描述（可选）
  │     │     │     ├─→ 选择标签（可选）
  │     │     │     └─→ 点击"创建"
  │     │     │
  │     │     ├─→ 验证输入
  │     │     ├─→ 创建成功 ✨
  │     │     └─→ 刷新列表
  │     │
  │     ├─→ 点击相册卡片
  │     │     │
  │     │     ├─→ [相册详情页]
  │     │     │     │
  │     │     │     ├─→ 查看相册信息
  │     │     │     ├─→ 查看照片网格
  │     │     │     │     │
  │     │     │     │     ├─→ 虚拟滚动加载
  │     │     │     │     ├─→ 点击照片 → 打开查看器
  │     │     │     │     └─→ 滑动浏览
  │     │     │     │
  │     │     │     ├─→ [相册操作]
  │     │     │     │     │
  │     │     │     │     ├─→ 点击"⋮ 更多"
  │     │     │     │     ├─→ 打开操作菜单
  │     │     │     │     │     │
  │     │     │     │     │     ├─→ ✏️ 编辑相册名称
  │     │     │     │     │     ├─→ 🖼️ 更换封面
  │     │     │     │     │     ├─→ 📤 分享相册
  │     │     │     │     │     ├─→ ⬇️ 下载全部
  │     │     │     │     │     └─→ 🗑️ 删除相册
  │     │     │     │     │
  │     │     │     │     └─→ [添加照片]
  │     │     │     │           │
  │     │     │     │           ├─→ 点击"添加照片"
  │     │     │     │           ├─→ 打开批量上传
  │     │     │     │           └─→ 自动添加到当前相册
  │     │     │     │
  │     │     │     └─→ 点击"◀ 返回"
  │     │     │
  │     └─→ [AI自动分类]
  │           │
  │           ├─→ 后台自动扫描照片
  │           ├─→ 识别：人脸、场景、时间
  │           ├─→ 自动创建相册
  │           ├─→ 显示"🤖 AI"标签
  │           └─→ 用户可编辑或删除
  │
  └─→ [结束]
```

### 2.2 相册卡片交互

**悬停效果**：
```css
.album-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.album-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* 操作按钮显示 */
.album-card:hover .action-buttons {
  opacity: 1;
  transform: translateY(0);
}
```

**点击反馈**：
```css
.album-card:active {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

**封面图片切换**：
```css
/* 如果相册有多张照片，封面每3秒切换 */
@keyframes coverSwitch {
  0%, 30% { opacity: 1; }
  33%, 100% { opacity: 0; }
}

.cover-image {
  animation: coverSwitch 9s infinite;
}
```

### 2.3 搜索和筛选交互

**搜索输入**：
```typescript
// 实时搜索，防抖300ms
const handleSearch = useDebouncedCallback((query: string) => {
  if (query.length >= 2) {
    // 高亮匹配文字
    filterAlbums(query);
  }
}, 300);

// 高亮匹配
<HighlightText text={album.name} query={searchQuery} />
```

**筛选切换动画**：
```css
/* 标签页切换 */
.filter-tab {
  position: relative;
  transition: all 0.3s;
}

.filter-tab.active {
  color: var(--primary-500);
}

.filter-tab.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, var(--primary-500), var(--accent-500));
  border-radius: 2px;
  animation: slideIn 0.3s ease-out;
}
```

---

## 3. 时间线功能交互设计

### 3.1 用户流程图

```
[开始]
  │
  ├─→ 打开成长时间线
  │     │
  │     ├─→ [浏览时间线]
  │     │     │
  │     │     ├─→ 垂直滚动浏览
  │     │     │     │
  │     │     │     ├─→ 自动加载更多（无限滚动）
  │     │     │     ├─→ 年份自动高亮（在视口中）
  │     │     │     └─→ 平滑滚动动画
  │     │     │
  │     │     ├─→ [查看里程碑]
  │     │     │     │
  │     │     │     ├─→ 里程碑卡片特殊样式
  │     │     │     ├─→ 点击展开详情
  │     │     │     ├─→ 查看照片网格
  │     │     │     └─→ 查看备注
  │     │     │
  │     │     ├─→ [快速导航]
  │     │     │     │
  │     │     │     ├─→ 点击年份链接
  │     │     │     ├─→ 平滑滚动到该年份
  │     │     │     └─→ 高亮显示
  │     │     │
  │     │     └─→ [查看照片]
  │     │           │
  │     │           ├─→ 点击缩略图
  │     │           ├─→ 打开照片查看器
  │     │           ├─→ 全屏查看
  │     │           └─→ 缩放、旋转、切换
  │     │
  │     ├─→ [添加里程碑]
  │     │     │
  │     │     ├─→ 点击"+ 添加里程碑"
  │     │     ├─→ 打开添加表单
  │     │     │     │
  │     │     │     ├─→ 选择日期 📅
  │     │     │     ├─→ 输入标题 ⭐
  │     │     │     ├─→ 输入描述 💬
  │     │     │     ├─→ 选择图标 🏷️
  │     │     │     │     ├─→ [⭐] [🎂] [👶] [🎉]
  │     │     │     │     ├─→ [🏠] [🎓] [✈️] [🏆]
  │     │     │     │     └─→ 点击选中
  │     │     │     └─→ 点击"保存"
  │     │     │
  │     │     ├─→ 验证输入
  │     │     ├─→ 创建成功 ✨
  │     │     └─→ 插入到时间线
  │     │
  │     ├─→ [添加备注]
  │     │     │
  │     │     ├─→ 点击"💬 添加备注"
  │     │     ├─→ 打开备注对话框
  │     │     │     │
  │     │     │     ├─→ 输入备注内容
  │     │     │     ├─→ 选择表情（可选）
  │     │     │     └─→ 点击"保存"
  │     │     │
  │     │     └─→ 备注计数更新
  │     │
  │     └─→ [时间线设置]
  │           │
  │           ├─→ 点击"⋮ 更多"
  │           ├─→ 打开设置菜单
  │           │     │
  │           │     ├─→ 🔔 里程碑提醒
  │           │     ├─→ 📊 统计信息
  │           │     ├─→ 🎨 显示设置
  │           │     └─→ ⬇️ 导出时间线
  │           │
  └─→ [结束]
```

### 3.2 时间线滚动交互

**年份高亮**：
```typescript
// 监听滚动，高亮当前视口中的年份
useEffect(() => {
  const handleScroll = () => {
    const yearHeaders = document.querySelectorAll('.year-header');
    yearHeaders.forEach(header => {
      const rect = header.getBoundingClientRect();
      if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
        // 高亮该年份
        setActiveYear(header.dataset.year);
      }
    });
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

**平滑滚动**：
```css
html {
  scroll-behavior: smooth;
}

/* 点击年份链接，平滑滚动到对应位置 */
.year-link {
  cursor: pointer;
  transition: all 0.3s;
}

.year-link:hover {
  color: var(--primary-500);
  transform: scale(1.1);
}
```

**无限滚动加载**：
```typescript
// 当滚动到接近底部时，自动加载更多
const [hasMore, setHasMore] = useState(true);

useEffect(() => {
  const handleScroll = () => {
    const scrollBottom = window.innerHeight + window.scrollY;
    const offset = document.body.offsetHeight - 300;

    if (scrollBottom >= offset && hasMore && !loading) {
      loadMoreTimelineEntries();
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [hasMore, loading]);
```

### 3.3 里程碑交互

**里程碑卡片动画**：
```css
/* 里程碑卡片进入动画 */
@keyframes milestoneEnter {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.milestone-card {
  animation: milestoneEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 星星图标闪烁 */
@keyframes starGlow {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 5px rgba(250, 204, 21, 0.5));
  }
  50% {
    transform: scale(1.2);
    filter: drop-shadow(0 0 15px rgba(250, 204, 21, 0.8));
  }
}

.milestone-icon {
  animation: starGlow 2s ease-in-out infinite;
}
```

**展开/收起详情**：
```typescript
const [expanded, setExpanded] = useState(false);

const toggleExpand = () => {
  setExpanded(!expanded);
  // 触发重排动画
};

// 详情区域
<div
  className={`milestone-details ${expanded ? 'expanded' : 'collapsed'}`}
  style={{
    maxHeight: expanded ? '1000px' : '0',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-out'
  }}
>
  {/* 详情内容 */}
</div>
```

### 3.4 照片网格交互

**照片悬停效果**：
```css
.timeline-photo {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.timeline-photo:hover {
  transform: scale(1.05);
  z-index: 10;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

/* 显示操作按钮 */
.timeline-photo:hover .overlay {
  opacity: 1;
}
```

**点击查看大图**：
```typescript
const openPhotoViewer = (photo: Photo, index: number) => {
  setCurrentIndex(index);
  setViewerOpen(true);
  // 从点击位置放大到全屏的动画
};

// 使用Framer Motion实现流畅动画
import { motion, AnimatePresence } from 'framer-motion';

<motion.img
  src={photo.url}
  layoutId={`photo-${photo.id}`}
  onClick={() => openPhotoViewer(photo, index)}
/>
```

---

## 4. 通用交互模式

### 4.1 加载状态

**骨架屏**：
```tsx
<SkeletonCard>
  <Skeleton variant="circle" width={60} height={60} />
  <Skeleton variant="text" width="80%" />
  <Skeleton variant="text" width="60%" />
</SkeletonCard>
```

**加载动画**：
```tsx
<Spinner type="dots" /> {/* 点状加载 */}
<Spinner type="pulse" /> {/* 脉冲加载 */}
<Spinner type="bars" /> {/* 条状加载 */}
```

### 4.2 错误处理

**友好错误提示**：
```tsx
<ErrorAlert
  icon="😔"
  title="加载失败"
  message="照片加载失败，请检查网络后重试"
  action={{
    label: "重新加载",
    onClick: () => retry()
  }}
/>
```

**重试机制**：
```typescript
const [retryCount, setRetryCount] = useState(0);

const handleError = () => {
  if (retryCount < 3) {
    setRetryCount(retryCount + 1);
    setTimeout(() => fetchData(), 1000 * (retryCount + 1));
  }
};
```

### 4.3 空状态

**引导性空状态**：
```tsx
<EmptyState
  icon="📷"
  title="还没有照片"
  description="点击下方按钮上传第一张照片，开始记录美好时光"
  action={{
    label: "上传照片",
    icon: "📸",
    onClick: () => openUpload()
  }}
  type="photos"
/>
```

### 4.4 确认对话框

**自定义确认对话框**：
```tsx
<ConfirmDialog
  isOpen={showDeleteConfirm}
  type="danger"
  icon="🗑️"
  title="删除相册"
  message="这个相册将被永久删除，无法恢复。确定要继续吗？"
  confirmText="确认删除"
  cancelText="再想想"
  onConfirm={handleDelete}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

---

## 5. 手势交互（移动端）

### 5.1 滑动手势

**照片查看器滑动切换**：
```typescript
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => goToNext(),
  onSwipedRight: () => goToPrev(),
  trackMouse: true
});

<div {...handlers}>
  <img src={currentPhoto.url} />
</div>
```

**下拉刷新**：
```typescript
import { usePullDownRefresh } from '@/hooks/usePullDownRefresh';

const { isPulling, pullDistance } = usePullDownRefresh({
  onRefresh: loadData,
  threshold: 80
});

<div style={{ transform: `translateY(${pullDistance}px)` }}>
  {isPulling && <RefreshIcon />}
</div>
```

### 5.2 捏合缩放

**双指缩放照片**：
```typescript
const [scale, setScale] = useState(1);

const handlePinch = (event: HammerInput) => {
  setScale(event.scale);
};

<Hammer
  onPinch={handlePinch}
  options={{ recognizers: { pinch: { enable: true } } }}
>
  <img
    src={photo.url}
    style={{ transform: `scale(${scale})` }}
  />
</Hammer>
```

### 5.3 长按操作

**长按显示菜单**：
```typescript
const handleLongPress = () => {
  setShowMenu(true);
  // 触觉反馈
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
};

<Hammer
  onPress={handleLongPress}
  options={{ recognizers: { press: { time: 500 } } }}
>
  <PhotoCard />
</Hammer>
```

---

## 6. 动画和过渡

### 6.1 页面切换动画

**淡入淡出**：
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.page-enter {
  animation: fadeIn 0.3s ease-out;
}

.page-exit {
  animation: fadeIn 0.3s ease-in reverse;
}
```

**滑动切换**：
```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ x: 300, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: -300, opacity: 0 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  <PageContent />
</motion.div>
```

### 6.2 列表动画

**交错进入动画**：
```typescript
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      delay: index * 0.05, // 每个延迟50ms
      type: 'spring',
      stiffness: 300
    }}
  >
    <ItemCard item={item} />
  </motion.div>
))}
```

**删除动画**：
```typescript
const [removingId, setRemovingId] = useState(null);

const handleDelete = (id) => {
  setRemovingId(id);
  setTimeout(() => {
    setItems(items.filter(item => item.id !== id));
    setRemovingId(null);
  }, 300);
};

<motion.div
  layout
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.3 }
  }}
>
  <ItemCard item={item} isRemoving={removingId === item.id} />
</motion.div>
```

### 6.3 微动画

**按钮点击涟漪效果**：
```typescript
const Button = ({ children, onClick }) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = (event) => {
    const newRipple = {
      x: event.clientX - event.target.offsetLeft,
      y: event.clientY - event.target.offsetTop,
      id: Date.now()
    };

    setRipples([...ripples, newRipple]);
    setTimeout(() => {
      setRipples(ripples.filter(r => r.id !== newRipple.id));
    }, 600);

    onClick(event);
  };

  return (
    <button onClick={handleClick} className="btn-ripple">
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y
          }}
        />
      ))}
    </button>
  );
};
```

**心形动画（点赞）**：
```css
@keyframes heartBeat {
  0% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
}

.heart-button:active .heart-icon {
  animation: heartBeat 0.8s ease-in-out;
}
```

---

## 7. 可访问性交互

### 7.1 键盘导航

**Tab键顺序**：
```tsx
// 确保交互元素可通过Tab访问
<button
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  按钮
</button>
```

**焦点管理**：
```typescript
// 模态框打开时，焦点移到模态框内
useEffect(() => {
  if (isOpen) {
    const firstFocusable = modalRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }
}, [isOpen]);

// 模态框关闭时，焦点返回触发元素
useEffect(() => {
  return () => {
    triggerRef.current?.focus();
  };
}, []);
```

### 7.2 屏幕阅读器支持

**ARIA标签**：
```tsx
<button
  aria-label="删除照片"
  aria-describedby="delete-description"
>
  🗑️
</button>
<span id="delete-description" className="sr-only">
  这张照片将被永久删除，无法恢复
</span>
```

**实时区域更新**：
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {uploadStatus}
</div>
```

### 7.3 焦点可见性

**焦点样式**：
```css
.focus-visible:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: 4px;
}

/* 为所有交互元素添加焦点环 */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

---

## 8. 性能优化

### 8.1 虚拟滚动

**照片列表虚拟化**：
```typescript
import { VariableSizeGrid as Grid } from 'react-window';

const PhotoGrid = ({ photos }) => {
  const getColumnCount = () => {
    if (window.innerWidth < 640) return 2;
    if (window.innerWidth < 1024) return 4;
    return 6;
  };

  return (
    <Grid
      columnCount={getColumnCount()}
      columnWidth={(index) => window.innerWidth / getColumnCount()}
      height={window.innerHeight * 0.7}
      rowCount={Math.ceil(photos.length / getColumnCount())}
      rowHeight={350}
      width={window.innerWidth}
      itemData={photos}
    >
      {PhotoCard}
    </Grid>
  );
};
```

### 8.2 图片懒加载

**Intersection Observer**：
```typescript
const LazyImage = ({ src, alt }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // 提前100px加载
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <img ref={imgRef} src={imageSrc || 'placeholder.jpg'} alt={alt} />
  );
};
```

### 8.3 防抖和节流

**搜索输入防抖**：
```typescript
import { useDebouncedCallback } from 'use-debounce';

const SearchInput = () => {
  const debouncedSearch = useDebouncedCallback(
    (value) => {
      performSearch(value);
    },
    300 // 300ms延迟
  );

  return (
    <input
      type="text"
      onChange={(e) => debouncedSearch(e.target.value)}
    />
  );
};
```

**滚动事件节流**：
```typescript
import { useThrottledCallback } from 'use-debounce';

const handleScroll = useThrottledCallback(() => {
  // 处理滚动
}, 100); // 100ms节流

useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [handleScroll]);
```

---

## 9. 状态管理

### 9.1 乐观更新

**删除照片**：
```typescript
const deletePhoto = async (photoId: string) => {
  // 立即更新UI
  setPhotos(photos.filter(p => p.id !== photoId));

  try {
    await photoApi.deletePhoto(photoId);
    showSuccessToast('照片已删除');
  } catch (error) {
    // 失败时回滚
    setPhotos(photos);
    showErrorToast('删除失败，请重试');
  }
};
```

**添加备注**：
```typescript
const addNote = async (noteContent: string) => {
  const tempId = `temp-${Date.now()}`;

  // 立即显示
  setNotes([...notes, {
    id: tempId,
    content: noteContent,
    createdAt: new Date(),
    pending: true
  }]);

  try {
    const newNote = await api.addNote(noteContent);
    // 替换临时数据
    setNotes(notes.map(n => n.id === tempId ? newNote : n));
  } catch (error) {
    // 失败时移除
    setNotes(notes.filter(n => n.id !== tempId));
  }
};
```

### 9.2 错误边界

**组件级错误边界**：
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}
```

---

**文档创建**: UI/UX设计团队
**最后更新**: 2026-02-13
**版本**: v1.0.0
