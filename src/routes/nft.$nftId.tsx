import { createFileRoute } from '@tanstack/react-router'
import { NftDetailPage } from '@/features/nft/NftDetailPage'
import { nftQueryOptions, relatedQueryOptions } from '@/features/catalog/api'

export const Route = createFileRoute('/nft/$nftId')({
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftQueryOptions(params.nftId))
    void context.queryClient.prefetchQuery(relatedQueryOptions(params.nftId))
  },
  component: NftRoute,
})

function NftRoute() {
  const { nftId } = Route.useParams()
  return <NftDetailPage nftId={nftId} />
}
