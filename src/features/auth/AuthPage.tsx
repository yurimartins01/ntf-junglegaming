import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/shared/Icon'
import { TextField, PasswordField } from '@/components/shared/FormField'
import { UnavailableAction } from '@/components/shared/UnavailableAction'
import { useAnnouncer } from '@/components/shared/LiveRegion'
import { HomePage } from '@/features/catalog/HomePage'
import { useIsTabletUp } from '@/hooks/use-media-query'
import { applyApiErrors, safeRedirect } from '@/lib/form-errors'
import { loginSchema, registerSchema, type LoginForm, type RegisterForm } from '@/lib/validation/schemas'
import { useLogin, useRegister } from './api'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'register'

interface AuthPageProps {
  mode: Mode
  redirect?: string
  reason?: string
}

function SocialButtons() {
  return (
    <>
      <div className="relative my-5 flex items-center justify-center md:my-6">
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-border md:-inset-x-8" />
        <span className="relative bg-ink px-3 font-caption12-regular--lh-16 text-fg md:bg-surface-card md:font-caption12-bold">Ou continue com</span>
      </div>
      <div className="flex flex-col gap-3">
        <UnavailableAction className="flex h-10 w-full items-center justify-center gap-3 rounded-[4px] border border-border font-caption12-bold text-fg-muted max-md:rounded-[2px] md:font-caption12-bold">
          <Icon name="googleLogo" size={22} />
          Continuar com Google
        </UnavailableAction>
        <UnavailableAction className="flex h-10 w-full items-center justify-center gap-3 rounded-[4px] border border-border font-caption12-bold text-fg-muted">
          <Icon name="facebookLogo" size={22} />
          Continuar com Facebook
        </UnavailableAction>
      </div>
    </>
  )
}

function AuthTabs({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const search = { redirect }
  return (
    <div role="tablist" aria-label="Acesso" className="flex items-center justify-center gap-0 font-body-large18-medium text-[20px]">
      <Link
        to="/login"
        search={search}
        role="tab"
        aria-selected={mode === 'login'}
        className={cn('px-2', mode === 'login' ? 'text-accent' : 'text-fg hover:text-accent')}
      >
        Entrar
      </Link>
      <span aria-hidden="true" className="h-5 w-px bg-primary" />
      <Link
        to="/register"
        search={search}
        role="tab"
        aria-selected={mode === 'register'}
        className={cn('px-2', mode === 'register' ? 'text-accent' : 'text-fg hover:text-accent')}
      >
        Criar conta
      </Link>
    </div>
  )
}

function LoginFormView({ redirect, reason }: { redirect?: string; reason?: string }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const announce = useAnnouncer()
  const login = useLogin(queryClient)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    login.mutate(values, {
      onSuccess: () => {
        announce('Login realizado com sucesso.')
        void navigate({ to: safeRedirect(redirect), replace: true })
      },
      onError: (error) => {
        const message = applyApiErrors(error, form.setError, ['email', 'password'])
        if (message) setFormError(message)
      },
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      {reason === 'expired' && (
        <p role="status" className="rounded-[4px] border border-primary px-3 py-2 text-center font-caption12-regular--lh-16 text-fg">
          Sua sessão expirou. Entre novamente para continuar de onde parou.
        </p>
      )}
      <TextField
        label="E-mail"
        hideLabel
        error={errors.email?.message}
        registration={form.register('email')}
        inputProps={{ type: 'email', placeholder: 'contato@email.com', autoComplete: 'email', inputMode: 'email' }}
        inputClassName="h-10 rounded-[2px] max-md:h-[50px] max-md:rounded-[12px]"
      />
      <PasswordField
        label="Senha"
        hideLabel
        error={errors.password?.message}
        registration={form.register('password')}
        inputProps={{ placeholder: 'Senha', autoComplete: 'current-password' }}
        inputClassName="h-10 rounded-[2px] max-md:h-[50px] max-md:rounded-[12px]"
      />
      <div className="flex justify-end">
        <UnavailableAction className="font-body14-regular--lh-20 text-accent">Esqueceu a senha?</UnavailableAction>
      </div>
      {formError && (
        <p role="alert" className="font-body14-regular--lh-20 text-coral">
          {formError}
        </p>
      )}
      <Button type="submit" size="none" disabled={login.isPending} className="mt-2 h-[46px] rounded-[2px] font-body-large18-bold--lh-24 max-md:h-[60px] max-md:rounded-[16px]">
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

function RegisterFormView({ redirect }: { redirect?: string }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const announce = useAnnouncer()
  const register = useRegister(queryClient)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })
  const { errors } = form.formState
  const field = 'h-10 rounded-[2px] max-md:h-[50px] max-md:rounded-[12px]'

  const onSubmit = form.handleSubmit(({ confirmPassword: _confirm, ...values }) => {
    setFormError(null)
    register.mutate(values, {
      onSuccess: () => {
        announce('Conta criada com sucesso.')
        void navigate({ to: safeRedirect(redirect), replace: true })
      },
      onError: (error) => {
        const message = applyApiErrors(error, form.setError, ['username', 'email', 'password'])
        if (message) setFormError(message)
      },
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <TextField label="Nome de usuário" hideLabel error={errors.username?.message} registration={form.register('username')} inputProps={{ placeholder: 'Nome de usuário', autoComplete: 'username', autoCapitalize: 'none' }} inputClassName={field} />
      <TextField label="E-mail" hideLabel error={errors.email?.message} registration={form.register('email')} inputProps={{ type: 'email', placeholder: 'Digite seu e-mail', autoComplete: 'email' }} inputClassName={field} />
      <PasswordField label="Senha" hideLabel error={errors.password?.message} registration={form.register('password')} inputProps={{ placeholder: 'Senha', autoComplete: 'new-password' }} inputClassName={field} />
      <PasswordField label="Confirmar senha" hideLabel error={errors.confirmPassword?.message} registration={form.register('confirmPassword')} inputProps={{ placeholder: 'Confirmar senha', autoComplete: 'new-password' }} inputClassName={field} />
      {formError && (
        <p role="alert" className="font-body14-regular--lh-20 text-coral">
          {formError}
        </p>
      )}
      <Button type="submit" size="none" disabled={register.isPending} className="mt-3 h-[46px] rounded-[2px] font-body-large18-bold--lh-24 max-md:h-[60px] max-md:rounded-[16px]">
        {register.isPending ? 'Criando…' : 'Criar conta'}
      </Button>
    </form>
  )
}

export function AuthPage({ mode, redirect, reason }: AuthPageProps) {
  const navigate = useNavigate()
  const isTabletUp = useIsTabletUp()
  const close = () => void navigate({ to: safeRedirect(redirect) })

  const copy =
    mode === 'login'
      ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
      : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'

  if (isTabletUp) {
    return (
      <>
        <div aria-hidden="true" inert>
          <HomePage search={{}} onSearchChange={() => {}} pageLink={() => null} />
        </div>
        <Dialog open onOpenChange={(open) => !open && close()}>
          <DialogContent className="max-w-[500px] gap-0 border-b-[10px] border-primary p-0 px-10 pt-[46px] pb-10 sm:max-w-[500px]" data-testid="auth-dialog">
            <DialogTitle className="sr-only">{mode === 'login' ? 'Entrar' : 'Criar conta'}</DialogTitle>
            <DialogDescription className="sr-only">{copy}</DialogDescription>
            <AuthTabs mode={mode} redirect={redirect} />
            <p className="mx-auto mt-8 mb-5 max-w-[400px] text-center font-caption12-regular--lh-16 text-fg">{copy}</p>
            <div className="px-5">
              {mode === 'login' ? <LoginFormView redirect={redirect} reason={reason} /> : <RegisterFormView redirect={redirect} />}
              <SocialButtons />
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-7 pt-[110px] pb-10">
      <Link to="/" className="text-center font-display32-bold !text-[32px] uppercase text-fg" aria-label="Kurio — início">
        Kurio
      </Link>
      <h1 className="mt-[70px] mb-9 text-center font-title22-bold !leading-7 text-fg">
        {mode === 'login' ? 'Entrar' : 'Criar perfil de colecionador'}
      </h1>
      {mode === 'login' ? <LoginFormView redirect={redirect} reason={reason} /> : <RegisterFormView redirect={redirect} />}
      <SocialButtons />
      <p className="mt-10 text-center font-body-large16-regular--lh-auto text-fg-muted">
        {mode === 'login' ? (
          <>
            Novo na Kurio?{' '}
            <Link to="/register" search={{ redirect }} className="text-fg-muted underline-offset-4 hover:underline">
              Crie uma conta
            </Link>
          </>
        ) : (
          <>
            Já tem uma conta?{' '}
            <Link to="/login" search={{ redirect }} className="text-fg-muted underline-offset-4 hover:underline">
              Entre
            </Link>
          </>
        )}
      </p>
    </main>
  )
}
