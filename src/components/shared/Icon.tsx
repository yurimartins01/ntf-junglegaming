import type { ComponentType, SVGProps } from 'react'
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Download,
  EllipsisVertical,
  EyeOff,
  Eye,
  Heart,
  House,
  ImagePlus,
  Mail,
  MapPin,
  Minus,
  Plus,
  ScanLine,
  SlidersHorizontal,
  Star,
  Trash2,
  TrendingUp,
  TriangleAlert,
  User,
  Wallet,
  X,
  ShoppingCart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ArrowSvg from '@/assets/icons/arrow.svg?react'
import CartSvg from '@/assets/icons/cart.svg?react'
import FacebookSvg from '@/assets/icons/Facebook.svg?react'
import InstagramSvg from '@/assets/icons/Instagram.svg?react'
import LinkedinSvg from '@/assets/icons/Linkedin.svg?react'
import LoginSvg from '@/assets/icons/login.svg?react'
import SearchSvg from '@/assets/icons/search.svg?react'
import ThankYouSvg from '@/assets/icons/Thank You Icon.svg?react'
import TwitterSvg from '@/assets/icons/Twitter.svg?react'
import YoutubeSvg from '@/assets/icons/Youtube.svg?react'
import { FacebookLogo, GoogleLogo } from './BrandLogos'

const ICONS = {
  arrow: ArrowSvg,
  cart: CartSvg,
  facebook: FacebookSvg,
  instagram: InstagramSvg,
  linkedin: LinkedinSvg,
  login: LoginSvg,
  search: SearchSvg,
  thankYou: ThankYouSvg,
  twitter: TwitterSvg,
  youtube: YoutubeSvg,
  googleLogo: GoogleLogo,
  facebookLogo: FacebookLogo,
  arrowRight: ArrowRight,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  download: Download,
  ellipsis: EllipsisVertical,
  eye: Eye,
  eyeOff: EyeOff,
  heart: Heart,
  home: House,
  imagePlus: ImagePlus,
  mail: Mail,
  mapPin: MapPin,
  minus: Minus,
  plus: Plus,
  scan: ScanLine,
  filters: SlidersHorizontal,
  star: Star,
  trash: Trash2,
  trending: TrendingUp,
  warning: TriangleAlert,
  user: User,
  userCircle: CircleUserRound,
  wallet: Wallet,
  close: X,
  cartOutline: ShoppingCart,
} satisfies Record<string, ComponentType<SVGProps<SVGSVGElement>>>

export type IconName = keyof typeof ICONS

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  name: IconName
  size?: number
  label?: string
}

export function Icon({ name, size = 20, label, className, ...props }: IconProps) {
  const Component = ICONS[name] as ComponentType<SVGProps<SVGSVGElement>>
  return (
    <Component
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
      {...props}
    />
  )
}
