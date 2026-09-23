# 共享样式与组件

Tailwind CSS v4 由各子站独立编译。版本集中在根目录 `pnpm-workspace.yaml` 的 catalog，主题与共享源码扫描集中在 `src/theme.css`。

## 接入子站

子站声明 `@repo/ui: workspace:*`，使用 `@tailwindcss/postcss` 插件。在根布局导入的 `app/globals.css` 中保留：

```css
@import "tailwindcss";
@import "@repo/ui/theme.css";
```

共享主题通过 `@source` 扫描 UI 包源码，子站继续使用 Tailwind 自动扫描。无需 Tailwind v3 配置文件，也无需在两个应用复制组件。

## 基础组件

首批组件基于 [shadcn/ui](https://ui.shadcn.com/) 的 new-york / Tailwind v4 源码，使用独立 Radix 包。组件源码由本仓库维护，配置位于 `components.json`，依赖统一声明在 `@repo/ui`。

```tsx
import { Button } from "@repo/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Separator } from "@repo/ui/separator";
```

- Button 支持 `variant`、`size`、`asChild` 和原生按钮属性；旧模板的 `appName` 已移除。
- Card 提供 Header / Title / Description / Action / Content / Footer；旧模板的 `title`、`href` 专用接口已移除。
- Input 支持原生属性和 React 19 ref；Label 使用 `htmlFor` 关联输入。
- Separator 默认水平且为装饰元素；语义分隔线设置 `decorative={false}`。垂直方向设置 `orientation="vertical"` 并为父级提供高度。
- `cn` 位于 `@repo/ui/lib/utils`，使用 clsx 与 tailwind-merge 合并条件类名和覆盖样式。

`src/theme.css` 保留品牌 tokens，并提供 shadcn 语义色变量。根元素添加 `.dark` 启用暗色主题。基础样式位于 `@layer base`，可被组件 utilities 覆盖。

## 验证

运行 `pnpm dev:web`（3000）和 `pnpm dev:admin`（3006）。两站首页分别提供聊天偏好与角色草稿表单，均实际使用五个基础组件。修改字段并提交可查看反馈，重置恢复初值；数据仅存在当前页面，不写入后端。

```sh
pnpm --filter @repo/ui --filter web --filter admin lint
pnpm --filter @repo/ui --filter web --filter admin check-types
pnpm --filter web --filter admin build
```
