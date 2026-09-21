# 共享样式与组件

Tailwind CSS v4 由各子站独立编译。版本集中在根目录 `pnpm-workspace.yaml` 的 catalog，主题集中在 `src/styles.css`，组件使用完整、静态的类名。

## 接入子站

1. 子站声明 `@repo/ui: workspace:*` 和开发依赖 `@tailwindcss/postcss: catalog:`。
2. 在子站 `postcss.config.mjs` 中导出 `{ plugins: { "@tailwindcss/postcss": {} } }`。
3. 在根布局导入的 `app/globals.css` 顶部加入：

```css
@import "@repo/ui/styles.css";
@source "../";
```

共享入口关闭自动扫描并注册 UI 源码；子站的 `@source` 扫描本站，路径相对于 CSS 文件。新增共享包时，显式注册该包的源码目录。不要扫描整个仓库。

基础 reset 放入 `@layer base`；普通、不分层的 CSS 优先于 Tailwind utilities。现有 CSS Modules 可以继续使用。

## 验证

```tsx
import { StylePreview } from "@repo/ui/style-preview";

<StylePreview siteName="Web" />;
```

启动 `pnpm run dev:web` 或 `pnpm run dev:admin`，首页应显示深青色品牌标识、带间距的预览卡片；640px 及以上两列，窄屏一列。点击“查看样式验证说明”展开内容。修改共享 `--color-brand` 可验证两站主题是否同步生效。

参考：[源码扫描](https://tailwindcss.com/docs/detecting-classes-in-source-files)、[共享主题](https://tailwindcss.com/docs/theme)。
