import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionStore, useSession } from '@/features/auth/session-store'
import { api } from '@/lib/api/client'
import type {
  ChangePasswordRequest,
  SaveWalletRequest,
  UpdateProfileRequest,
  User,
  WalletSlot,
  WalletsResponse,
} from '@/lib/api/contracts'
import { queryKeys } from '@/lib/api/query-keys'

function useUserId(): string {
  return useSession()?.user.id ?? 'anonymous'
}

export function useProfile() {
  const userId = useUserId()
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: async ({ signal }) => (await api.get<User>('/profile', { signal })).data,
    enabled: userId !== 'anonymous',
  })
}

function useProfileMutation<TVariables>(request: (variables: TVariables) => Promise<User>) {
  const userId = useUserId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.profile(userId), user)
      sessionStore.updateUser(user)
    },
  })
}

export function useUpdateProfile() {
  return useProfileMutation(async (body: UpdateProfileRequest) => (await api.patch<User>('/profile', body)).data)
}

export function useUpdateAvatar() {
  return useProfileMutation(async (dataUrl: string) => (await api.put<User>('/profile/avatar', { dataUrl })).data)
}

export function useRemoveAvatar() {
  return useProfileMutation(async () => (await api.delete<User>('/profile/avatar')).data)
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (body: ChangePasswordRequest) => {
      await api.post('/profile/password', body)
    },
  })
}

export function useWallets() {
  const userId = useUserId()
  return useQuery({
    queryKey: queryKeys.wallets(userId),
    queryFn: async ({ signal }) => (await api.get<WalletsResponse>('/wallets', { signal })).data,
    enabled: userId !== 'anonymous',
  })
}

export function useSaveWallet() {
  const userId = useUserId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ slot, body }: { slot: WalletSlot; body: SaveWalletRequest }) =>
      (await api.put<WalletsResponse>(`/wallets/${slot}`, body)).data,
    onSuccess: (wallets) => queryClient.setQueryData(queryKeys.wallets(userId), wallets),
  })
}
