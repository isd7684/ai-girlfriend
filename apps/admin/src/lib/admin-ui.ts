export type AdminAccentTone = 'amber' | 'sky' | 'mint' | 'rose'

type AdminAccentVariant = 'soft' | 'deep'

type AdminAccentStyle = {
  className: string
  dotClassName: string
}

const adminDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const adminAccentStyles: Record<AdminAccentTone, Record<AdminAccentVariant, AdminAccentStyle>> = {
  amber: {
    soft: {
      className: 'bg-amber-100 text-amber-800',
      dotClassName: 'bg-amber-500',
    },
    deep: {
      className: 'bg-amber-200 text-amber-900',
      dotClassName: 'bg-amber-600',
    },
  },
  sky: {
    soft: {
      className: 'bg-sky-100 text-sky-800',
      dotClassName: 'bg-sky-500',
    },
    deep: {
      className: 'bg-sky-200 text-sky-900',
      dotClassName: 'bg-sky-600',
    },
  },
  mint: {
    soft: {
      className: 'bg-emerald-100 text-emerald-800',
      dotClassName: 'bg-emerald-500',
    },
    deep: {
      className: 'bg-emerald-200 text-emerald-900',
      dotClassName: 'bg-emerald-600',
    },
  },
  rose: {
    soft: {
      className: 'bg-rose-100 text-rose-800',
      dotClassName: 'bg-rose-500',
    },
    deep: {
      className: 'bg-rose-200 text-rose-900',
      dotClassName: 'bg-rose-600',
    },
  },
}

export function getAdminAccentStyle(
  accent: AdminAccentTone,
  variant: AdminAccentVariant = 'soft',
): AdminAccentStyle {
  return adminAccentStyles[accent][variant]
}

export function formatAdminDate(value: number | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  return adminDateFormatter.format(date)
}

export function formatAdminDateTime(value: number | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleString()
}

export function formatOptionalAdminDateTime(value: number | null): string {
  if (value === null) {
    return 'Not available yet'
  }

  return formatAdminDateTime(value)
}
