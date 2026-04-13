# 前端组件库文档

> **版本**: 1.0.0
> **更新日期**: 2026-02-14
> **维护者**: frontend-dev-4

---

## 📚 目录

1. [快速开始](#快速开始)
2. [基础组件](#基础组件)
3. [业务组件](#业务组件)
4. [设计规范](#设计规范)
5. [最佳实践](#最佳实践)
6. [迁移指南](#迁移指南)

---

## 🚀 快速开始

### 安装

```bash
cd frontend
npm install
```

### 使用

```tsx
import { Button, Card, Modal } from '@/components/ui';

function Example() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <Button onClick={() => setIsOpen(true)}>
        打开对话框
      </Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        内容
      </Modal>
    </Card>
  );
}
```

---

## 🎨 基础组件

### Button

**功能**: 可点击的按钮，支持多种样式和尺寸

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'` | `'primary'` | 按钮样式 |
| `size` | `'sm' | 'md' | 'lg'` | `'md'` | 按钮尺寸 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `className` | `string` | - | 自定义类名 |
| `onClick` | `() => void` | - | 点击事件 |
| `children` | `ReactNode` | - | 按钮内容 |

#### 示例

```tsx
// 基础按钮
<Button>点击我</Button>

// 主要按钮
<Button variant="primary">保存</Button>

// 危险按钮
<Button variant="danger">删除</Button>

// 不同尺寸
<Button size="sm">小按钮</Button>
<Button size="lg">大按钮</Button>

// 禁用状态
<Button disabled>禁用按钮</Button>

// 自定义样式
<Button className="bg-gradient-to-r from-blue-500 to-purple-600">
  渐变按钮
</Button>
```

---

### Input

**功能**: 文本输入框，支持多种类型和验证

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | - | 输入框标签 |
| `type` | `'text' | 'password' | 'email' | 'date' | 'number'` | `'text'` | 输入类型 |
| `placeholder` | `string` | - | 占位符 |
| `value` | `string` | - | 输入值 |
| `onChange` | `(e: ChangeEvent) => void` | - | 值变化事件 |
| `error` | `string` | - | 错误提示 |
| `helperText` | `string` | - | 帮助文本 |
| `required` | `boolean` | `false` | 是否必填 |
| `maxLength` | `number` | - | 最大长度 |
| `disabled` | `boolean` | `false` | 是否禁用 |

#### 示例

```tsx
// 基础输入框
<Input label="用户名" placeholder="请输入用户名" />

// 密码输入框
<Input label="密码" type="password" />

// 带验证
<Input
  label="邮箱"
  type="email"
  error="请输入有效的邮箱地址"
  required
/>

// 帮助文本
<Input
  label="密码"
  type="password"
  helperText="密码至少8位，包含字母和数字"
  maxLength={20}
/>
```

---

### Card

**功能**: 卡片容器，用于内容分组

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `className` | `string` | - | 自定义类名 |
| `children` | `ReactNode` | - | 卡片内容 |

#### 示例

```tsx
// 基础卡片
<Card>
  <h2>标题</h2>
  <p>内容</p>
</Card>

// 带样式
<Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2">
  内容
</Card>
```

---

### Badge

**功能**: 标签徽章，用于状态标识

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'primary' | 'secondary' | 'success' | 'warning' | 'danger'` | `'primary'` | 徽章样式 |
| `size` | `'sm' | 'md' | `'md'` | 徽章尺寸 |
| `className` | `string` | - | 自定义类名 |
| `children` | `ReactNode` | - | 徽章内容 |

#### 示例

```tsx
// 不同状态
<Badge variant="primary">主要</Badge>
<Badge variant="success">成功</Badge>
<Badge variant="warning">警告</Badge>
<Badge variant="danger">错误</Badge>

// 不同尺寸
<Badge size="sm">小徽章</Badge>
<Badge size="md">中徽章</Badge>
```

---

### Modal

**功能**: 模态对话框，用于弹出内容

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isOpen` | `boolean` | - | 是否打开 |
| `onClose` | `() => void` | - | 关闭事件 |
| `title` | `ReactNode` | - | 对话框标题 |
| `footer` | `ReactNode` | - | 底部操作区 |
| `size` | `'sm' | 'md' | 'lg'` | `'md'` | 对话框尺寸 |
| `showClose` | `boolean` | `true` | 是否显示关闭按钮 |

#### 示例

```tsx
function Example() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>打开对话框</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="对话框标题"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button onClick={() => console.log('确认')}>
              确认
            </Button>
          </>
        }
      >
        <p>对话框内容</p>
      </Modal>
    </>
  );
}
```

---

### Select

**功能**: 下拉选择框

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | `string` | - | 选择框标签 |
| `options` | `{ value: string; label: string }[]` | - | 选项列表 |
| `value` | `string` | - | 当前值 |
| `onChange` | `(e: ChangeEvent) => void` | - | 值变化事件 |
| `placeholder` | `string` | - | 占位符 |
| `helperText` | `string` | - | 帮助文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |

#### 示例

```tsx
const options = [
  { value: 'china', label: '中国' },
  { value: 'usa', label: '美国' },
  { value: 'japan', label: '日本' },
];

<Select
  label="国家"
  options={options}
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
/>
```

---

### Progress

**功能**: 进度条，用于加载状态

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `number` | - | 进度百分比 (0-100) |
| `size` | `'sm' | 'md'` | `'md'` | 进度条尺寸 |

#### 示例

```tsx
<Progress value={75} />
<Progress value={50} size="sm" />
```

---

### Toast

**功能**: 轻量提示消息

#### 用法

```tsx
import { toast } from '@/components/ui/Toast';

// 成功提示
toast.success('操作成功');

// 错误提示
toast.error('操作失败');

// 警告提示
toast.warning('请注意');

// 信息提示
toast.info('提示信息');
```

---

## 💼 业务组件

### PhotoCard

**功能**: 照片卡片，显示单张照片

#### 特性
- 显示缩略图
- 悬停效果
- 点击查看
- 删除功能

#### 示例

```tsx
<PhotoCard
  photo={photo}
  photoUrl={url}
  onClick={() => console.log('点击')}
  onDelete={(id) => console.log('删除', id)}
/>
```

---

### VirtualPhotoGrid

**功能**: 虚拟化照片网格，优化大量照片渲染

#### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `photos` | `Photo[]` | 照片列表 |
| `photoUrls` | `Map<string, string>` | 照片 URL 映射 |
| `columnCount` | `number` | 列数 (2-5) |
| `rowHeight` | `number` | 行高 |
| `onPhotoClick` | `(index: number) => void` | 点击事件 |
| `onPhotoDelete` | `(id: string) => void` | 删除事件 |

#### 示例

```tsx
<VirtualPhotoGrid
  photos={photos}
  photoUrls={photoUrls}
  columnCount={4}
  rowHeight={350}
  onPhotoClick={(index) => console.log(index)}
  onPhotoDelete={(id) => console.log(id)}
/>
```

---

### BatchUpload

**功能**: 批量上传组件

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `onUpload` | `(file: File, onProgress: (p: number) => void) => Promise<void>` | - | 上传函数 |
| `onComplete` | `(files: UploadFile[]) => void` | - | 完成回调 |
| `maxFiles` | `number` | `50` | 最大文件数 |
| `maxSize` | `number` | `10 * 1024 * 1024` | 最大文件大小 |

#### 示例

```tsx
<BatchUpload
  onUpload={async (file, onProgress) => {
    // 上传逻辑
    onProgress(50);
  }}
  onComplete={(files) => console.log('完成', files)}
/>
```

---

### SmartRuleBuilder

**功能**: 智能规则构建器，用于智能相册

#### 规则类型
- `child` - 按宝贝
- `date_range` - 按日期范围
- `tag` - 按标签
- `person` - 按人物
- `location` - 按位置
- `advanced` - 高级条件

#### 示例

```tsx
<SmartRuleBuilder
  initialRules={rules}
  onRulesChange={(rules) => console.log(rules)}
  error="请至少添加一条规则"
/>
```

---

## 🎨 设计规范

### 颜色系统

基于 `design-tokens.ts`：

```tsx
// 主色调
colors.primary.500    // #3b82f6
colors.primary.600    // #2563eb

// 辅助色
colors.accent.500      // #f43f5e
colors.accent.600      // #e11d48

// 语义色
colors.success.500    // #22c55e
colors.warning.500    // #f59e0b
colors.error.500      // #ef4444
```

### 字体系统

```tsx
// 字体家族
fontFamily.sans  // 'Inter', 'Nunito', sans-serif

// 字体大小
fontSize.xs  // 12px
fontSize.sm  // 14px
fontSize.base // 16px
fontSize.lg  // 18px
```

### 间距系统

```tsx
// 内边距
spacing.padding.md  // 1rem (16px)
spacing.padding.lg  // 1.5rem (24px)

// 外边距
spacing.margin.md  // 1rem (16px)
```

### 动画系统

```tsx
// 过渡
transition.default  // 200ms ease-out

// 关键帧
animation.fadeIn    // fadeIn 0.5s
animation.slideUp   // slideUp 0.4s
animation.scaleIn   // scaleIn 0.3s
```

---

## ✨ 最佳实践

### 1. 组件组合

```tsx
// ✅ 推荐：组件组合
<Card>
  <CardHeader>
    <h2>标题</h2>
  </CardHeader>
  <CardBody>
    <p>内容</p>
  </CardBody>
</Card>

// ❌ 避免：过度嵌套
<div className="card">
  <div className="card-header">
    <h2>标题</h2>
  </div>
</div>
```

### 2. 状态管理

```tsx
// ✅ 推荐：使用 Zustand stores
import { useAuthStore } from '@/stores/auth.store';
import { useChildStore } from '@/stores/child.store';

function Component() {
  const { user } = useAuthStore();
  const { children } = useChildStore();

  return <div>{user.name}</div>;
}

// ❌ 避免：过度使用 Context
```

### 3. API 调用

```tsx
// ✅ 推荐：使用 TanStack Query
import { useQuery } from '@tanstack/react-query';
import { photoApi } from '@/api/photo';

function Component() {
  const { data, isLoading } = useQuery({
    queryKey: ['photos'],
    queryFn: () => photoApi.getPhotos(),
  });

  if (isLoading) return <Loading />;
  return <div>{data.length}</div>;
}

// ❌ 避免：直接使用 fetch
```

### 4. 类型安全

```tsx
// ✅ 推荐：使用类型定义
import type { Photo, Album } from '@/types';

function Component({ photo }: { photo: Photo }) {
  return <img src={photo.url} />;
}

// ❌ 避免：使用 any
```

### 5. 性能优化

```tsx
// ✅ 推荐：使用 useMemo 和 useCallback
function Component({ items, onSelect }) {
  const processedItems = useMemo(() =>
    items.map(item => ({ ...item, processed: true })),
    [items]
  );

  const handleClick = useCallback((id) =>
    onSelect(id),
    [onSelect]
  );

  return <List items={processedItems} onClick={handleClick} />;
}

// ❌ 避免：重复计算
```

---

## 🔄 迁移指南

### 从旧组件迁移

如果你有使用旧组件，请按以下步骤迁移：

#### Button 组件

```tsx
// ❌ 旧版本
<button className="btn btn-primary">点击</button>

// ✅ 新版本
<Button variant="primary">点击</Button>
```

#### Input 组件

```tsx
// ❌ 旧版本
<input className="form-control" />

// ✅ 新版本
<Input label="用户名" />
```

---

## 📖 相关文档

- [设计规范](./design-tokens.ts)
- [API 文档](../api/README.md)
- [状态管理](../stores/README.md)
- [路由配置](../router/README.md)

---

## 🤝 贡献指南

### 添加新组件

1. 在 `src/components/ui/` 创建组件文件
2. 编写组件代码和类型定义
3. 添加使用示例到文档
4. 提交 Pull Request

### 组件规范

- 使用 TypeScript
- 遵循设计规范
- 添加 PropTypes 注释
- 编写单元测试

---

**文档版本**: 1.0.0
**最后更新**: 2026-02-14
**维护者**: frontend-dev-4
