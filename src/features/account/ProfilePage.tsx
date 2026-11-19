import { useRef, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Avatar } from '@/components/shared/Avatar'
import { EnsField } from '@/components/shared/EnsField'
import { PasswordField, TextField } from '@/components/shared/FormField'
import { useAnnouncer } from '@/components/shared/LiveRegion'
import { ErrorState } from '@/components/shared/StateViews'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/lib/api/contracts'
import { toApiError } from '@/lib/api/errors'
import { applyApiErrors } from '@/lib/form-errors'
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES, MESSAGES } from '@/lib/validation/rules'
import { passwordChangeSchema, profileSchema } from '@/lib/validation/schemas'
import { ProfileLayout } from './ProfileLayout'
import { useChangePassword, useProfile, useRemoveAvatar, useUpdateAvatar, useUpdateProfile } from './api'

const profileFormSchema = profileSchema
  .extend({ currentPassword: z.string(), newPassword: z.string(), confirmPassword: z.string() })
  .superRefine((values, ctx) => {
    const touched = Boolean(values.currentPassword || values.newPassword || values.confirmPassword)
    if (!touched) return
    const parsed = passwordChangeSchema.safeParse({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    })
    if (!parsed.success) {
      for (const issue of parsed.error.issues) ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message })
    }
  })
type ProfileFormValues = z.infer<typeof profileFormSchema>

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function AvatarControl({ user }: { user: User }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const update = useUpdateAvatar()
  const remove = useRemoveAvatar()
  const announce = useAnnouncer()

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!AVATAR_MIME_TYPES.includes(file.type as (typeof AVATAR_MIME_TYPES)[number])) return setError(MESSAGES.avatarType)
    if (file.size > AVATAR_MAX_BYTES) return setError(MESSAGES.avatarSize)
    setError(null)
    update.mutate(await readAsDataUrl(file), {
      onSuccess: () => announce('Avatar atualizado.'),
      onError: (e) => setError(toApiError(e).fieldErrors.avatar ?? toApiError(e).message),
    })
  }

  return (
    <div>
      <p id="avatar-label" className="font-body-large16-regular--lh-auto text-fg">
        Avatar
      </p>
      <div className="mt-3 flex items-center gap-6">
        <Avatar user={user} size={50} />
        <input ref={inputRef} type="file" accept={AVATAR_MIME_TYPES.join(',')} onChange={onFile} className="sr-only" aria-labelledby="avatar-label" tabIndex={-1} data-testid="avatar-input" />
        <Button type="button" size="none" className="h-10 rounded-[2px] px-6 font-body14-bold--lh-20" disabled={update.isPending} onClick={() => inputRef.current?.click()}>
          {update.isPending ? 'Enviando…' : 'Alterar'}
        </Button>
        <button
          type="button"
          disabled={!user.avatarUrl || remove.isPending}
          onClick={() => remove.mutate(undefined, { onSuccess: () => announce('Avatar removido.') })}
          className="font-body14-regular--lh-20 text-fg hover:text-accent disabled:opacity-50"
        >
          Remover
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 font-caption12-regular--lh-16 text-coral" data-testid="avatar-error">
          {error}
        </p>
      )}
    </div>
  )
}

function ProfileForm({ user }: { user: User }) {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const announce = useAnnouncer()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      ensName: user.ensName,
      walletNickname: user.walletNickname,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })
  const { errors } = form.formState
  const saving = updateProfile.isPending || changePassword.isPending

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    const { currentPassword, newPassword, confirmPassword: _confirm, ...profile } = values
    try {
      await updateProfile.mutateAsync(profile)
    } catch (error) {
      const message = applyApiErrors(error, form.setError, ['displayName', 'username', 'email', 'ensName', 'walletNickname'])
      if (message) setFormError(message)
      return
    }
    if (currentPassword || newPassword) {
      try {
        await changePassword.mutateAsync({ currentPassword, newPassword })
        form.reset({ ...profile, currentPassword: '', newPassword: '', confirmPassword: '' })
        toast.success('Perfil e senha atualizados.')
        announce('Perfil e senha atualizados.')
      } catch (error) {
        const message = applyApiErrors(error, form.setError, ['currentPassword', 'newPassword'])
        if (message) setFormError(message)
      }
      return
    }
    form.reset({ ...profile, currentPassword: '', newPassword: '', confirmPassword: '' })
    toast.success('Perfil atualizado.')
    announce('Perfil atualizado.')
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
        <TextField label="Nome de exibição" required error={errors.displayName?.message} registration={form.register('displayName')} inputProps={{ autoComplete: 'name' }} />
        <TextField label="Nome de usuário" required error={errors.username?.message} registration={form.register('username')} inputProps={{ autoComplete: 'username', autoCapitalize: 'none' }} />
        <TextField label="E-mail" required error={errors.email?.message} registration={form.register('email')} inputProps={{ type: 'email', autoComplete: 'email' }} />
        <EnsField label="Nome ENS" required error={errors.ensName?.message} registration={form.register('ensName')} />
        <TextField label="Apelido da carteira" required error={errors.walletNickname?.message} registration={form.register('walletNickname')} />
        <AvatarControl user={user} />
      </div>

      <fieldset className="flex max-w-[417px] flex-col gap-5">
        <legend className="mb-5 font-body-large16-bold--lh-20 text-fg">Alterar senha</legend>
        <PasswordField label="Senha atual" error={errors.currentPassword?.message} registration={form.register('currentPassword')} inputProps={{ autoComplete: 'current-password' }} inputClassName="h-10" />
        <PasswordField label="Nova senha" error={errors.newPassword?.message} registration={form.register('newPassword')} inputProps={{ autoComplete: 'new-password' }} hint="Mínimo de 8 caracteres, com letras e números." />
        <PasswordField label="Confirmar nova senha" error={errors.confirmPassword?.message} registration={form.register('confirmPassword')} inputProps={{ autoComplete: 'new-password' }} />
      </fieldset>

      {formError && (
        <p role="alert" className="font-body14-regular--lh-20 text-coral">
          {formError}
        </p>
      )}
      <div>
        <Button type="submit" size="none" disabled={saving} className="h-10 rounded-[2px] px-10 font-body14-bold--lh-20">
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

export function ProfilePage() {
  const profile = useProfile()
  return (
    <ProfileLayout title="Perfil do colecionador">
      {profile.isPending ? (
        <div className="grid gap-5 md:grid-cols-2" aria-busy="true" aria-label="Carregando perfil">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[66px]" />
          ))}
        </div>
      ) : profile.isError ? (
        <ErrorState message={toApiError(profile.error).message} onRetry={() => void profile.refetch()} retrying={profile.isFetching} />
      ) : (
        <ProfileForm user={profile.data} />
      )}
    </ProfileLayout>
  )
}
