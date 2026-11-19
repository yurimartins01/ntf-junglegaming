import type { CSSProperties } from 'react'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-4 text-success" />,
      info: <InfoIcon className="size-4 text-primary" />,
      warning: <TriangleAlertIcon className="size-4 text-amber" />,
      error: <OctagonXIcon className="size-4 text-coral" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    toastOptions={{ classNames: { toast: 'font-body14-regular--lh-20' } }}
    style={
      {
        '--normal-bg': 'var(--color-surface-card)',
        '--normal-text': 'var(--color-foreground)',
        '--normal-border': 'var(--color-border-soft)',
        '--border-radius': 'var(--radius)',
      } as CSSProperties
    }
    {...props}
  />
)

export { Toaster }
