// 展示子站共用的品牌样式、响应式布局和原生交互。
export function StylePreview({ siteName }: { siteName: string }) {
  return (
    <section
      className="w-full max-w-2xl overflow-hidden rounded-2xl border border-stone-200 border-t-4 border-t-brand bg-stone-50 p-6 text-left text-stone-900 shadow-sm sm:p-8"
      data-testid="style-preview"
      aria-label="共享样式预览"
    >
      <span
        className="inline-flex rounded-full bg-brand px-3 py-1 text-xs font-semibold tracking-wide text-white"
        data-testid="preview-brand"
      >
        SHARED UI
      </span>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">
        共享样式预览
      </h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        {siteName} 正在使用共享组件与统一品牌样式。
      </p>
      <div
        className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
        data-testid="preview-grid"
      >
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm font-semibold text-brand">统一品牌</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            多个子站共用同一套品牌颜色。
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm font-semibold text-brand">响应式布局</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            窄屏单列，宽屏自动切换为双列。
          </p>
        </div>
      </div>
      <details className="mt-5 rounded-xl border border-stone-200 bg-white p-4">
        <summary className="cursor-pointer rounded text-sm font-medium text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          查看样式验证说明
        </summary>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          深青色标识、卡片间距和双列布局由 Tailwind CSS
          生成；此展开区域使用浏览器原生交互。
        </p>
      </details>
    </section>
  );
}
