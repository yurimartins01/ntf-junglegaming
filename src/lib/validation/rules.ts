export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/
export const ETH_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/
export const ENS_ADDRESS_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/
export const ENS_LABEL_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/
export const PASSWORD_MIN_LENGTH = 8
export const AVATAR_MAX_BYTES = 1024 * 1024
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const MESSAGES = {
  required: 'Campo obrigatório.',
  email: 'Informe um e-mail válido.',
  username: 'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.',
  password: 'A senha precisa de 8 caracteres ou mais, com letras e números.',
  passwordMismatch: 'As senhas não coincidem.',
  walletAddress: 'Informe um endereço 0x com 40 caracteres hexadecimais ou um nome .eth.',
  ens: 'Use letras minúsculas, números e hífens.',
  avatarType: 'Envie uma imagem PNG, JPG ou WEBP.',
  avatarSize: 'A imagem deve ter no máximo 1 MB.',
} as const

export function isStrongPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH && /[a-zA-Z]/.test(value) && /\d/.test(value)
}

export function isWalletAddress(value: string): boolean {
  return ETH_ADDRESS_PATTERN.test(value) || ENS_ADDRESS_PATTERN.test(value)
}

export function shortenAddress(value: string): string {
  if (!ETH_ADDRESS_PATTERN.test(value)) return value
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}
