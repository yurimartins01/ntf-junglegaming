import type { SVGProps } from 'react'

export function GoogleLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="var(--logo-google-blue)" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81Z" />
      <path fill="var(--logo-google-green)" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.1A12 12 0 0 0 12 24Z" />
      <path fill="var(--logo-google-yellow)" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.27a12 12 0 0 0 0 10.76l4.01-3.1Z" />
      <path fill="var(--color-error)" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.62l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  )
}

export function FacebookLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="var(--logo-facebook)"
        d="M13.5 24V13.05h3.68l.55-4.27H13.5V6.06c0-1.24.34-2.08 2.12-2.08H17.9V.17A30.6 30.6 0 0 0 14.6 0c-3.27 0-5.5 2-5.5 5.66v3.12H5.4v4.27h3.7V24h4.4Z"
      />
    </svg>
  )
}
