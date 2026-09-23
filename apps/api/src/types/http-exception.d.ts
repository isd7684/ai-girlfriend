import type { HTTPException } from "hono/http-exception";

declare global {
  // 从 Hono 构造签名推导异常选项。
  type HTTPExceptionOptions = NonNullable<
    ConstructorParameters<typeof HTTPException>[1]
  >;
}
