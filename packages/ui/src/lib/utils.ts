import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 合并条件类名与 Tailwind 样式覆盖。
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
