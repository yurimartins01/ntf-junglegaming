import type { ArtworkKey } from '@/lib/api/contracts'
import emeraldApe from '@/assets/images/nft/emerald-ape.png?webp'
import emeraldApeMedium from '@/assets/images/nft/emerald-ape-medium.png?webp'
import emeraldApeLarge from '@/assets/images/nft/emerald-ape-large.png?webp'
import sageNomad from '@/assets/images/nft/sage-nomad.png?webp'
import sageNomadMedium from '@/assets/images/nft/sage-nomad-medium.png?webp'
import neonVessel from '@/assets/images/nft/neon-vessel.png?webp'
import goldenBeat from '@/assets/images/nft/golden-beat.png?webp'

export type ArtworkVariant = 'thumb' | 'card' | 'large' | 'portrait'

interface ArtworkSet {
  thumb: string
  card: string
  large: string
  portrait: string
}

export const ARTWORK: Record<ArtworkKey, ArtworkSet> = {
  'emerald-ape': { thumb: emeraldApe, card: emeraldApeMedium, large: emeraldApeLarge, portrait: emeraldApeLarge },
  'sage-nomad': { thumb: sageNomadMedium, card: sageNomadMedium, large: sageNomad, portrait: sageNomad },
  'neon-vessel': { thumb: neonVessel, card: neonVessel, large: neonVessel, portrait: neonVessel },
  'golden-beat': { thumb: goldenBeat, card: goldenBeat, large: goldenBeat, portrait: goldenBeat },
}

export function artworkUrl(key: ArtworkKey, variant: ArtworkVariant = 'card'): string | undefined {
  return ARTWORK[key]?.[variant]
}

export const ARTWORK_INTRINSIC = {
  thumb: { width: 250, height: 250 },
  card: { width: 250, height: 250 },
  large: { width: 450, height: 450 },
  portrait: { width: 310, height: 366 },
} as const

const LARGE_WIDTH: Record<ArtworkKey, number> = {
  'emerald-ape': 450,
  'sage-nomad': 310,
  'neon-vessel': 250,
  'golden-beat': 250,
}

export function artworkSrcSet(key: ArtworkKey): string | undefined {
  const set = ARTWORK[key]
  if (!set || set.large === set.card) return undefined
  return `${set.card} ${ARTWORK_INTRINSIC.card.width}w, ${set.large} ${LARGE_WIDTH[key]}w`
}
