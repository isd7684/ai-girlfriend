export async function hashTokenJti(jti: string): Promise<string> {
  // 数据库只存 jti 的摘要值，refresh token 泄漏时不会把可直接复用的原文留在库里。
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(jti),
  )

  // 十六进制字符串更适合直接落到 D1 里，也方便后续按值查询和调试。
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}
