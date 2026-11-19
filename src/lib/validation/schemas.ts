import { z } from 'zod'
import {
  EMAIL_PATTERN,
  ENS_LABEL_PATTERN,
  MESSAGES,
  USERNAME_PATTERN,
  isStrongPassword,
  isWalletAddress,
} from './rules'

const required = z.string().trim().min(1, MESSAGES.required)
const email = z.string().trim().min(1, MESSAGES.required).regex(EMAIL_PATTERN, MESSAGES.email)
const password = z.string().min(1, MESSAGES.required).refine(isStrongPassword, MESSAGES.password)
const username = z.string().trim().min(1, MESSAGES.required).regex(USERNAME_PATTERN, MESSAGES.username)
const ensLabel = z.string().trim().min(1, MESSAGES.required).regex(ENS_LABEL_PATTERN, MESSAGES.ens)
const walletAddress = z.string().trim().min(1, MESSAGES.required).refine(isWalletAddress, MESSAGES.walletAddress)
const optionalWallet = z
  .string()
  .trim()
  .refine((value) => value === '' || isWalletAddress(value), MESSAGES.walletAddress)

export const loginSchema = z.object({
  email,
  password: z.string().min(1, MESSAGES.required),
})
export type LoginForm = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({ username, email, password, confirmPassword: z.string().min(1, MESSAGES.required) })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: MESSAGES.passwordMismatch })
export type RegisterForm = z.infer<typeof registerSchema>

export const profileSchema = z.object({
  displayName: required,
  username,
  email,
  ensName: ensLabel,
  walletNickname: required,
})
export type ProfileForm = z.infer<typeof profileSchema>

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, MESSAGES.required),
    newPassword: password,
    confirmPassword: z.string().min(1, MESSAGES.required),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: MESSAGES.passwordMismatch })
export type PasswordChangeForm = z.infer<typeof passwordChangeSchema>

const networkField = z.enum(['ethereum', 'polygon', 'solana'], { error: 'Selecione uma rede.' })
const providerField = z.enum(['metamask', 'walletconnect', 'coinbase'], { error: 'Selecione uma carteira.' })

const walletFields = {
  displayName: required,
  network: networkField,
  profileName: required,
  address: walletAddress,
  secondaryAddress: optionalWallet,
  provider: providerField,
  referralCode: required,
  email,
  ensName: ensLabel,
}

export const walletSchema = z.object({ ...walletFields, nickname: required })
export type WalletForm = z.infer<typeof walletSchema>

export const checkoutSchema = z.object({
  ...walletFields,
  username,
  note: z.string().trim().max(500, 'No máximo 500 caracteres.'),
})
export type CheckoutForm = z.infer<typeof checkoutSchema>

export type WalletFieldValues = Pick<
  WalletForm,
  'displayName' | 'network' | 'profileName' | 'address' | 'secondaryAddress' | 'provider' | 'referralCode' | 'email' | 'ensName'
>
