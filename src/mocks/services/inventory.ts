import type { EditionId } from '@/lib/api/contracts'
import { db } from '../db/db'
import { MockHttpError } from '../http'
import { publishNftUpdated } from '../socket/server'

export interface NftPatch {
  price?: string
  available?: Partial<Record<EditionId, number>>
}

export function updateNft(nftId: string, patch: NftPatch) {
  const state = db().nfts[nftId]
  if (!state) throw new MockHttpError(404, 'NOT_FOUND', 'NFT não encontrado.')
  if (patch.price !== undefined && patch.price !== state.price) {
    state.previousPrice = null
    state.price = patch.price
  }
  if (patch.available) {
    for (const [edition, available] of Object.entries(patch.available) as [EditionId, number][]) {
      state.available[edition] = Math.max(0, Math.floor(available))
    }
  }
  state.version += 1
  publishNftUpdated(nftId)
  return state
}
