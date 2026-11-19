import type { WalletsResponse } from '@/lib/api/contracts'

export interface UserSeed {
  id: string
  username: string
  email: string
  password: string
  displayName: string
  ensName: string
  walletNickname: string
  favorites: string[]
  wallets: WalletsResponse
}

const SEED_DATE = '2026-07-01T12:00:00.000Z'

export const USER_SEEDS: UserSeed[] = [
  {
    id: 'usr_nova',
    username: 'nova',
    email: 'nova@kurio.test',
    password: 'Kurio@2026',
    displayName: 'Nova Sato',
    ensName: 'nova',
    walletNickname: 'Principal',
    favorites: ['emerald-ape-042'],
    wallets: {
      primary: {
        slot: 'primary',
        displayName: 'Nova Sato',
        nickname: 'Principal',
        network: 'ethereum',
        profileName: 'Nova Sato',
        address: '0xA91F3b2C7d4E5f60718293a4B5c6D7e8F9a0E82C',
        secondaryAddress: '',
        provider: 'metamask',
        referralCode: 'KURIO-NOVA',
        email: 'nova@kurio.test',
        ensName: 'nova',
        updatedAt: SEED_DATE,
      },
      secondary: {
        slot: 'secondary',
        displayName: 'Nova Sato',
        nickname: 'Reserva',
        network: 'polygon',
        profileName: 'Nova Sato',
        address: 'nova.kurio.eth',
        secondaryAddress: '',
        provider: 'coinbase',
        referralCode: 'KURIO-NOVA',
        email: 'nova@kurio.test',
        ensName: 'nova.kurio',
        updatedAt: SEED_DATE,
      },
      secondarySameAsPrimary: false,
    },
  },
  {
    id: 'usr_theo',
    username: 'theo',
    email: 'theo@kurio.test',
    password: 'Kurio@2026',
    displayName: 'Theo Martins',
    ensName: 'theo',
    walletNickname: '',
    favorites: [],
    wallets: { primary: null, secondary: null, secondarySameAsPrimary: false },
  },
]

export interface CouponSeed {
  code: string
  percentOff: number
  expiresAt: string
}

export const COUPON_SEEDS: CouponSeed[] = [
  { code: 'KURIO10', percentOff: 10, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'GENESIS5', percentOff: 5, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'EXPIRADO20', percentOff: 20, expiresAt: '2025-01-01T00:00:00.000Z' },
]

export const NETWORK_FEES = { ethereum: '0.016', polygon: '0.004', solana: '0.002' } as const
