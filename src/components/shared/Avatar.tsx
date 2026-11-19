import type { User } from '@/lib/api/contracts'
import { Icon } from './Icon'

export function Avatar({ user, size = 50 }: { user: Pick<User, 'avatarUrl' | 'displayName'> | null; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-soft bg-surface-raised text-primary"
      style={{ width: size, height: size }}
    >
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt={`Avatar de ${user.displayName}`} width={size} height={size} className="size-full object-cover" />
      ) : (
        <Icon name="imagePlus" size={Math.round(size * 0.45)} />
      )}
    </span>
  )
}
