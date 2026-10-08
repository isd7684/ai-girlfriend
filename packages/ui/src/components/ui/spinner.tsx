import type { ReactNode } from "react"
import { LoaderCircleIcon } from "lucide-react"

import { cn } from "../../lib/utils"

type SpinnerProps = React.ComponentProps<"div"> & {
  children?: ReactNode
  label?: string
  loading?: boolean
  size?: "sm" | "md" | "lg"
  spinnerClassName?: string
}

const sizeClassNameMap: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
}

function Spinner({
  children,
  className,
  label = "Loading...",
  loading = true,
  size = "md",
  spinnerClassName,
  ...props
}: SpinnerProps) {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/80 backdrop-blur-[1px]">
          <div role="status" aria-live="polite" className={cn("inline-flex items-center gap-2 text-muted-foreground", spinnerClassName)}>
            <LoaderCircleIcon className={cn("animate-spin", sizeClassNameMap[size])} />
            <span className="text-sm">{label}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { Spinner }
