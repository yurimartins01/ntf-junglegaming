import { Fragment } from 'react'
import { Link } from '@tanstack/react-router'

export interface Crumb {
  label: string
  to?: '/' | '/cart' | '/checkout'
  hash?: string
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Você está em" className="hidden md:block">
      <ol className="flex flex-wrap items-center font-body14-bold--lh-20 text-fg">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <Fragment key={item.label}>
              <li>
                {item.to && !last ? (
                  <Link to={item.to} hash={item.hash} className="hover:text-accent">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined}>{item.label}</span>
                )}
              </li>
              {!last && (
                <li aria-hidden="true" className="px-2">
                  /
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
