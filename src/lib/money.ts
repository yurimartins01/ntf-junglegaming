import Big from 'big.js'
import type { EthAmount } from '@/lib/api/contracts'

Big.DP = 18
Big.RM = Big.roundHalfUp

export const eth = (value: EthAmount | Big | number): Big => new Big(value)

export function addEth(...values: EthAmount[]): EthAmount {
  return values.reduce((acc, v) => acc.plus(v), new Big(0)).toString()
}

export function mulEth(value: EthAmount, quantity: number): EthAmount {
  if (!Number.isInteger(quantity)) throw new Error('Quantities must be integers')
  return new Big(value).times(quantity).toString()
}

export function subEth(a: EthAmount, b: EthAmount): EthAmount {
  return new Big(a).minus(b).toString()
}

export function percentOf(value: EthAmount, percent: number): EthAmount {
  return new Big(value).times(percent).div(100).round(6, Big.roundHalfUp).toString()
}

export function compareEth(a: EthAmount, b: EthAmount): number {
  return new Big(a).cmp(b)
}

export function isZero(value: EthAmount): boolean {
  return new Big(value).eq(0)
}

export function formatEthValue(value: EthAmount): string {
  const fixed = new Big(value).toFixed(6)
  const [int, frac = ''] = fixed.split('.')
  const trimmed = frac.replace(/0+$/, '')
  return `${int}.${trimmed.padEnd(2, '0')}`
}

export function formatEth(value: EthAmount): string {
  return `${formatEthValue(value)} ETH`
}

export function formatDiscount(value: EthAmount): string {
  return isZero(value) ? '(-) 00.00' : `(-) ${formatEth(value)}`
}

export function formatEthComma(value: EthAmount): string {
  return new Big(value).toFixed(2).replace('.', ',')
}

export function isValidEthInput(value: string): boolean {
  return /^\d+(\.\d{1,18})?$/.test(value)
}
