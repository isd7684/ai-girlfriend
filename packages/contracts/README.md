# API 契约

`@repo/contracts` 维护前后端共用的错误码、响应结构和 Zod Schema，不依赖 Hono、React 或平台运行时。沿用 workspace catalog 的 Zod 3。

## 使用

消费方在 dependencies 中声明 `"@repo/contracts": "workspace:*"`，从包根导入。当前导出 TypeScript 源码，由 Next.js、Wrangler 或其他支持 TypeScript 的工具编译，无独立构建产物。

```ts
import {
  PingRequestSchema,
  PingApiResponseSchema,
  type ApiResponse,
  type PingResponse,
} from "@repo/contracts";

const request = PingRequestSchema.parse({ name: " 小夏 " });
const response: ApiResponse<PingResponse> = PingApiResponseSchema.parse({
  ok: true,
  data: { service: "api", message: `你好，${request.name}` },
  meta: {
    requestId: "request-123",
    timestamp: new Date().toISOString(),
  },
});
```

- `PingResponseSchema` 校验业务载荷；`PingApiResponseSchema` 校验完整成功/失败响应。
- `createApiSuccessSchema(dataSchema)` 和 `createApiResponseSchema(dataSchema)` 为其他业务载荷复用响应封装。
- `ApiMetaSchema` 要求非空 requestId 和带时区的 ISO 时间；不生成元信息，也不限定请求标识为 UUID。
- `ApiFailureSchema` 校验错误码和非空错误消息；`details` 可选且默认为 unknown，使用前由业务方进一步校验。
- `ApiResponse<T, E>` 是以 `ok` 为判别字段的联合类型。类型声明本身不执行校验；对外部输入使用 Schema 的 `parse` 或 `safeParse`。
- 对象沿用 Zod 默认行为，解析时去掉未声明字段。Ping name 去掉首尾空格并拒绝空白。

本包不注册 API 路由；现有 `/health` 保持原样，也未新增 `/ping` 接口。

## 检查

```sh
pnpm --filter @repo/contracts check-types
pnpm --filter @repo/contracts lint
pnpm --filter @repo/contracts test
```

测试使用 Node 内置 test runner 与 TypeScript 类型擦除，无额外测试框架。运行环境遵循仓库的 Node >=24 要求。
