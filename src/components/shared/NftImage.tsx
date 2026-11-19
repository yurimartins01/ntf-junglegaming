import { useState } from 'react'
import type { ArtworkKey } from '@/lib/api/contracts'
import { ARTWORK_INTRINSIC, artworkSrcSet, artworkUrl, type ArtworkVariant } from '@/lib/assets'
import { cn } from '@/lib/utils'

interface NftImageProps {
  artworkKey: ArtworkKey
  alt: string
  variant?: ArtworkVariant
  className?: string
  priority?: boolean
  sizes?: string
}

export function NftImage({ artworkKey, alt, variant = 'card', className, priority = false, sizes }: NftImageProps) {
  const src = artworkUrl(artworkKey, variant)
  const [failed, setFailed] = useState(false)
  const { width, height } = ARTWORK_INTRINSIC[variant]

  if (!src || failed) {
    return (
      <div role="img" aria-label={alt} className={cn('flex items-center justify-center bg-surface-raised text-fg-subtle', className)}>
        <span className="font-caption12-bold uppercase">Kurio</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      srcSet={variant === 'large' && sizes ? artworkSrcSet(artworkKey) : undefined}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  )
}
