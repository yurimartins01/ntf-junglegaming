import type {
  ArtworkKey,
  CategoryId,
  EditionId,
  NetworkId,
  NftDetail,
  NftEdition,
} from '@/lib/api/contracts'
import { CATEGORY_ORDER, EDITION_LABELS, NETWORK_LABELS } from '@/lib/domain'
import { createRandom } from './random'

export type NftFixture = Omit<NftDetail, 'version' | 'totalAvailable'>

export const CATALOG_REFERENCE_DATE = Date.parse('2026-07-29T12:00:00.000Z')
export const NEW_RELEASE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000
export const TRENDING_THRESHOLD = 80
export const MAX_PER_ORDER = 10
const OPEN_EDITION_STOCK = 500

const CATEGORY_COUNTS: Record<CategoryId, number> = {
  'digital-art': 33,
  photography: 12,
  music: 65,
  '3d-art': 39,
  collectibles: 23,
  generative: 17,
  games: 19,
  subscriptions: 13,
  utility: 18,
}
const NETWORK_COUNTS: Record<NetworkId, number> = { ethereum: 119, polygon: 78, solana: 86 }
export const CATALOG_SIZE = Object.values(NETWORK_COUNTS).reduce((a, b) => a + b, 0)

const COLLECTIONS: Record<ArtworkKey, string> = {
  'emerald-ape': 'Kurio Apes',
  'neon-vessel': 'Kurio Apes',
  'sage-nomad': 'Nomad Club',
  'golden-beat': 'Golden Frequencies',
}

const ATTRIBUTES: Record<ArtworkKey, string[]> = {
  'emerald-ape': ['Óculos', 'Esmeralda', 'Raro'],
  'sage-nomad': ['Chapéu', 'Moletom', 'Lendário'],
  'neon-vessel': ['Gola alta', 'Blazer', 'Raro'],
  'golden-beat': ['Fones', 'Jaqueta', 'Épico'],
}

interface DesignSeed {
  name: string
  number: string
  artworkKey: ArtworkKey
  price: string
  previousPrice?: string
  badge?: 'rare'
}

const DESIGN_SEEDS: DesignSeed[] = [
  { name: 'Emerald Ape', number: '042', artworkKey: 'emerald-ape', price: '1.19' },
  { name: 'Sage Nomad', number: '009', artworkKey: 'sage-nomad', price: '1.69' },
  { name: 'Neon Vessel', number: '552', artworkKey: 'neon-vessel', price: '1.99', previousPrice: '2.29', badge: 'rare' },
  { name: 'Cosmic Bloom', number: '118', artworkKey: 'sage-nomad', price: '1.29' },
  { name: 'Violet Nomad', number: '314', artworkKey: 'sage-nomad', price: '1.39' },
  { name: 'Ivory Baron', number: '088', artworkKey: 'neon-vessel', price: '1.79' },
  { name: 'Golden Beat', number: '207', artworkKey: 'golden-beat', price: '0.99' },
  { name: 'Golden Frequency', number: '071', artworkKey: 'golden-beat', price: '0.59' },
  { name: 'Golden Signal', number: '160', artworkKey: 'golden-beat', price: '0.39' },
]

const NAME_PREFIXES = [
  'Amber', 'Cobalt', 'Crimson', 'Dusk', 'Ember', 'Frost', 'Jade', 'Lunar', 'Onyx', 'Rust',
  'Saffron', 'Velvet', 'Copper', 'Solar', 'Misty', 'Hollow', 'Quiet', 'Wild', 'Royal', 'Echo',
]
const NAME_SUFFIXES: Record<ArtworkKey, string[]> = {
  'emerald-ape': ['Ape', 'Explorer', 'Drifter', 'Monarch'],
  'sage-nomad': ['Nomad', 'Bloom', 'Wanderer', 'Sage'],
  'neon-vessel': ['Vessel', 'Baron', 'Envoy', 'Curator'],
  'golden-beat': ['Beat', 'Signal', 'Frequency', 'Rhythm'],
}
const ARTWORKS: ArtworkKey[] = ['emerald-ape', 'sage-nomad', 'neon-vessel', 'golden-beat']

export function toNftId(name: string, number: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${number}`
}

function placeFirst<T>(list: T[], wanted: T, index: number) {
  if (list[index] === wanted) return
  const from = list.findIndex((value, i) => i > index && value === wanted)
  if (from === -1) return
  ;[list[index], list[from]] = [list[from] as T, list[index] as T]
}

function buildEditions(random: ReturnType<typeof createRandom>, designIndex: number): NftEdition[] {
  const make = (id: EditionId, supply: number | null, available: number): NftEdition => ({
    id,
    label: EDITION_LABELS[id],
    supply,
    available,
  })
  if (designIndex === 0) {
    return [make('1/1', 1, 0), make('1/10', 10, 4), make('1/50', 50, 18), make('open', null, OPEN_EDITION_STOCK)]
  }
  return [
    make('1/1', 1, random.next() < 0.6 ? 1 : 0),
    make('1/10', 10, random.int(0, 10)),
    make('1/50', 50, random.int(5, 50)),
    make('open', null, OPEN_EDITION_STOCK),
  ]
}

function buildTexts(name: string, network: NetworkId, collection: string) {
  const networkName = NETWORK_LABELS[network]
  return {
    summary: `Um colecionável digital finalizado à mão da coleção ${collection === 'Kurio Apes' ? 'Kurio Editions' : collection}, verificado na ${networkName}, com arte desbloqueável e acesso para colecionadores.`,
    description: [
      `${name} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${networkName}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
    ],
    networkInfo: `Cunhado na ${networkName} com procedência imutável e metadados armazenados no IPFS.`,
    contractInfo: 'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
    royaltiesInfo: '0x7A42...19E8 • Contrato inteligente ERC-721 verificado.',
  }
}

function generate(): NftFixture[] {
  const random = createRandom(20260729)

  const categories: (CategoryId | null)[] = []
  for (const id of CATEGORY_ORDER) for (let i = 0; i < CATEGORY_COUNTS[id]; i++) categories.push(id)
  while (categories.length < CATALOG_SIZE) categories.push(null)

  const networks: NetworkId[] = []
  for (const [id, count] of Object.entries(NETWORK_COUNTS) as [NetworkId, number][])
    for (let i = 0; i < count; i++) networks.push(id)

  const shuffledCategories = random.shuffle(categories)
  const shuffledNetworks = random.shuffle(networks)
  for (let i = 0; i < DESIGN_SEEDS.length; i++) {
    placeFirst(shuffledCategories, 'digital-art', i)
    placeFirst(shuffledNetworks, 'ethereum', i)
  }

  const usedIds = new Set<string>()
  const items: NftFixture[] = []

  for (let index = 0; index < CATALOG_SIZE; index++) {
    const design = DESIGN_SEEDS[index]
    let name: string
    let number: string
    let artworkKey: ArtworkKey
    let price: string
    let previousPrice: string | null = null
    let badge: 'rare' | null = null

    if (design) {
      ;({ name, number, artworkKey, price } = design)
      previousPrice = design.previousPrice ?? null
      badge = design.badge ?? null
    } else {
      artworkKey = ARTWORKS[index % ARTWORKS.length] as ArtworkKey
      do {
        name = `${random.pick(NAME_PREFIXES)} ${random.pick(NAME_SUFFIXES[artworkKey])}`
        number = String(random.int(1, 999)).padStart(3, '0')
      } while (usedIds.has(toNftId(name, number)))
      const cents = index % 7 === 0 ? random.int(300, 1230) : random.int(2, 300)
      price = (cents / 100).toFixed(2)
      if (random.next() < 0.1) previousPrice = ((cents + random.int(10, 60)) / 100).toFixed(2)
      if (random.next() < 0.08) badge = 'rare'
    }

    const id = toNftId(name, number)
    usedIds.add(id)
    const network = shuffledNetworks[index] as NetworkId
    const collection = COLLECTIONS[artworkKey]

    items.push({
      id,
      name: `${name} #${number}`,
      tokenId: `#${number.padStart(4, '0')}`,
      collection,
      artworkKey,
      price,
      previousPrice,
      network,
      category: shuffledCategories[index] ?? null,
      badge,
      createdAt: new Date(CATALOG_REFERENCE_DATE - index * 7 * 60 * 60 * 1000).toISOString(),
      popularity: design ? 95 - index : random.int(10, 99),
      ...buildTexts(`${name} #${number}`, network, collection),
      attributes: ATTRIBUTES[artworkKey],
      rating: 4.8,
      reviewCount: 19,
      editions: buildEditions(random, design ? index : -1),
      gallery: [artworkKey, artworkKey, artworkKey, artworkKey],
      maxPerOrder: MAX_PER_ORDER,
    })
  }
  return items
}

export const NFT_FIXTURES: readonly NftFixture[] = generate()
export const NFT_FIXTURES_BY_ID: ReadonlyMap<string, NftFixture> = new Map(
  NFT_FIXTURES.map((nft) => [nft.id, nft]),
)
