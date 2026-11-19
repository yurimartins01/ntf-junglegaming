import { http, HttpResponse } from 'msw'
import {
  API_BASE_URL,
  type ChangePasswordRequest,
  type LoginRequest,
  type RegisterRequest,
  type UpdateAvatarRequest,
  type UpdateProfileRequest,
} from '@/lib/api/contracts'
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  EMAIL_PATTERN,
  ENS_LABEL_PATTERN,
  MESSAGES,
  USERNAME_PATTERN,
  isStrongPassword,
} from '@/lib/validation/rules'
import { db, hashPassword, randomId, toPublicUser } from '../db/db'
import { MockHttpError, readJson, route, validationError } from '../http'
import {
  createSession,
  findUserByEmail,
  findUserByUsername,
  readToken,
  requirePrivateAccess,
  requireUser,
} from '../services/auth'

function assertUnique(email: string, username: string, exceptUserId?: string) {
  const byEmail = findUserByEmail(email)
  if (byEmail && byEmail.id !== exceptUserId) {
    throw new MockHttpError(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado.', { email: 'Este e-mail já está cadastrado.' })
  }
  const byUsername = findUserByUsername(username)
  if (byUsername && byUsername.id !== exceptUserId) {
    throw new MockHttpError(409, 'USERNAME_TAKEN', 'Este nome de usuário já está em uso.', {
      username: 'Este nome de usuário já está em uso.',
    })
  }
}

export const authHandlers = [
  http.post(
    `${API_BASE_URL}/auth/register`,
    route(
      async ({ request }) => {
        const body = await readJson<RegisterRequest>(request)
        const errors: Record<string, string> = {}
        const username = (body.username ?? '').trim().toLowerCase()
        const email = (body.email ?? '').trim().toLowerCase()
        if (!USERNAME_PATTERN.test(username)) errors.username = MESSAGES.username
        if (!EMAIL_PATTERN.test(email)) errors.email = MESSAGES.email
        if (!isStrongPassword(body.password ?? '')) errors.password = MESSAGES.password
        if (Object.keys(errors).length) throw validationError(errors)
        assertUnique(email, username)

        const id = randomId('usr')
        const salt = randomId('salt')
        db().users[id] = {
          id,
          username,
          email,
          displayName: username,
          ensName: '',
          walletNickname: '',
          avatarUrl: null,
          salt,
          passwordHash: await hashPassword(body.password, salt),
        }
        db().favorites[id] = []
        db().wallets[id] = { primary: null, secondary: null, secondarySameAsPrimary: false }
        return HttpResponse.json(createSession(db().users[id]!), { status: 201 })
      },
      { mutates: true },
    ),
  ),

  http.post(
    `${API_BASE_URL}/auth/login`,
    route(
      async ({ request }) => {
        const body = await readJson<LoginRequest>(request)
        const errors: Record<string, string> = {}
        if (!EMAIL_PATTERN.test(body.email ?? '')) errors.email = MESSAGES.email
        if (!body.password) errors.password = MESSAGES.required
        if (Object.keys(errors).length) throw validationError(errors)
        const user = findUserByEmail(body.email)
        if (!user || (await hashPassword(body.password, user.salt)) !== user.passwordHash) {
          throw new MockHttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
        }
        return HttpResponse.json(createSession(user))
      },
      { mutates: true },
    ),
  ),

  http.get(
    `${API_BASE_URL}/session`,
    route(({ request }) => {
      const user = requireUser(request)
      const token = readToken(request)!
      const session = db().sessions[token]!
      return HttpResponse.json({ token, expiresAt: new Date(session.expiresAt).toISOString(), user: toPublicUser(user) })
    }),
  ),

  http.post(
    `${API_BASE_URL}/auth/logout`,
    route(
      ({ request }) => {
        const token = readToken(request)
        if (token) delete db().sessions[token]
        return new HttpResponse(null, { status: 204 })
      },
      { mutates: true },
    ),
  ),

  http.get(
    `${API_BASE_URL}/profile`,
    route(({ request }) => HttpResponse.json(toPublicUser(requirePrivateAccess(request)))),
  ),

  http.patch(
    `${API_BASE_URL}/profile`,
    route(
      async ({ request }) => {
        const user = requirePrivateAccess(request)
        const body = await readJson<UpdateProfileRequest>(request)
        const errors: Record<string, string> = {}
        const username = (body.username ?? '').trim().toLowerCase()
        const email = (body.email ?? '').trim().toLowerCase()
        if (!body.displayName?.trim()) errors.displayName = MESSAGES.required
        if (!USERNAME_PATTERN.test(username)) errors.username = MESSAGES.username
        if (!EMAIL_PATTERN.test(email)) errors.email = MESSAGES.email
        if (!body.ensName?.trim()) errors.ensName = MESSAGES.required
        else if (!ENS_LABEL_PATTERN.test(body.ensName.trim())) errors.ensName = MESSAGES.ens
        if (!body.walletNickname?.trim()) errors.walletNickname = MESSAGES.required
        if (Object.keys(errors).length) throw validationError(errors)
        assertUnique(email, username, user.id)
        Object.assign(user, {
          displayName: body.displayName.trim(),
          username,
          email,
          ensName: body.ensName.trim(),
          walletNickname: body.walletNickname.trim(),
        })
        return HttpResponse.json(toPublicUser(user))
      },
      { mutates: true },
    ),
  ),

  http.put(
    `${API_BASE_URL}/profile/avatar`,
    route(
      async ({ request }) => {
        const user = requirePrivateAccess(request)
        const { dataUrl } = await readJson<UpdateAvatarRequest>(request)
        const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl ?? '')
        if (!match || !AVATAR_MIME_TYPES.includes(match[1] as (typeof AVATAR_MIME_TYPES)[number])) {
          throw validationError({ avatar: MESSAGES.avatarType })
        }
        if (Math.floor((match[2]!.length * 3) / 4) > AVATAR_MAX_BYTES) throw validationError({ avatar: MESSAGES.avatarSize })
        user.avatarUrl = dataUrl
        return HttpResponse.json(toPublicUser(user))
      },
      { mutates: true },
    ),
  ),

  http.delete(
    `${API_BASE_URL}/profile/avatar`,
    route(
      ({ request }) => {
        const user = requirePrivateAccess(request)
        user.avatarUrl = null
        return HttpResponse.json(toPublicUser(user))
      },
      { mutates: true },
    ),
  ),

  http.post(
    `${API_BASE_URL}/profile/password`,
    route(
      async ({ request }) => {
        const user = requirePrivateAccess(request)
        const body = await readJson<ChangePasswordRequest>(request)
        if (!body.currentPassword) throw validationError({ currentPassword: MESSAGES.required })
        if ((await hashPassword(body.currentPassword, user.salt)) !== user.passwordHash) {
          throw validationError({ currentPassword: 'Senha atual incorreta.' })
        }
        if (!isStrongPassword(body.newPassword ?? '')) throw validationError({ newPassword: MESSAGES.password })
        if (body.newPassword === body.currentPassword) {
          throw validationError({ newPassword: 'A nova senha deve ser diferente da atual.' })
        }
        user.salt = randomId('salt')
        user.passwordHash = await hashPassword(body.newPassword, user.salt)
        return new HttpResponse(null, { status: 204 })
      },
      { mutates: true },
    ),
  ),
]
