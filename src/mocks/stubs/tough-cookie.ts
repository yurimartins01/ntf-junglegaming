export class Cookie {
  key = ''
  domain: string | null = null
  path: string | null = null
  static fromJSON(): Cookie | null {
    return null
  }
  toJSON(): Record<string, unknown> {
    return {}
  }
}

export class MemoryCookieStore {
  idx: Record<string, Record<string, Record<string, Cookie>>> = {}
}

export class CookieJar {
  constructor(_store?: MemoryCookieStore) {}
  getCookiesSync(): Cookie[] {
    return []
  }
  async setCookie(): Promise<void> {}
}
