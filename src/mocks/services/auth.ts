import type { SessionResponse } from '@/lib/api/contracts'
import { db, randomId, toPublicUser, type StoredUser } from '../db/db'
import { MockHttpError } from '../http'
import { getScenario } from '../scenarios/scenarios'

const SESSION_TTL_MS = 2 * 60 * 60 * 1000
const SHORT_SESSION_TTL_MS = 20 * 1000

export function readToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim() || null
}

export function resolveToken(token: string | null): StoredUser | null {
  if (!token) return null
  const session = db().sessions[token]
  if (!session || session.expiresAt <= Date.now()) return null
  return db().users[session.userId] ?? null
}

export function optionalUser(request: Request): StoredUser | null {
  const token = readToken(request)
  if (!token) return null
  return requireUser(request)
}

export function requireUser(request: Request): StoredUser {
  const token = readToken(request)
  if (!token) throw new MockHttpError(401, 'UNAUTHORIZED', 'Entre para continuar.')
  const session = db().sessions[token]
  if (!session) throw new MockHttpError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  if (session.expiresAt <= Date.now()) {
    delete db().sessions[token]
    throw new MockHttpError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  }
  const user = db().users[session.userId]
  if (!user) throw new MockHttpError(401, 'UNAUTHORIZED', 'Entre para continuar.')
  return user
}

export function requirePrivateAccess(request: Request): StoredUser {
  const user = requireUser(request)
  if (getScenario() === 'forbidden') {
    throw new MockHttpError(403, 'FORBIDDEN', 'Você não tem permissão para acessar este recurso.')
  }
  return user
}

export function createSession(user: StoredUser): SessionResponse {
  const token = randomId('tok')
  const ttl = getScenario() === 'session-expired' ? SHORT_SESSION_TTL_MS : SESSION_TTL_MS
  const expiresAt = Date.now() + ttl
  db().sessions[token] = { userId: user.id, expiresAt }
  return { token, expiresAt: new Date(expiresAt).toISOString(), user: toPublicUser(user) }
}

export function expireAllSessions() {
  for (const session of Object.values(db().sessions)) session.expiresAt = Date.now() - 1
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const normalized = email.trim().toLowerCase()
  return Object.values(db().users).find((u) => u.email.toLowerCase() === normalized)
}

export function findUserByUsername(username: string): StoredUser | undefined {
  const normalized = username.trim().toLowerCase()
  return Object.values(db().users).find((u) => u.username.toLowerCase() === normalized)
}
