interface LoginAttemptRecord {
  count: number
  firstAttempt: number
  lockedUntil?: number
}
const loginRateLimitStore = new Map<string, LoginAttemptRecord>()

interface LoginRateLimitResult {
  allowed: boolean
  retryAfter?: number
}

export function checkLoginRateLimit(
  ip: string,
  maxAttempts = 10,
  windowMs = 15 * 60 * 1000,
): LoginRateLimitResult {
  const now = Date.now()
  const rec = loginRateLimitStore.get(ip)
  if (!rec) return { allowed: true }

  if (rec.lockedUntil && now < rec.lockedUntil) {
    return {
      allowed: false,
      retryAfter: Math.ceil((rec.lockedUntil - now) / 1000),
    }
  }

  if (now - rec.firstAttempt > windowMs) {
    loginRateLimitStore.delete(ip)
    return { allowed: true }
  }

  if (rec.count >= maxAttempts) {
    rec.lockedUntil = now + windowMs
    return { allowed: false, retryAfter: Math.ceil(windowMs / 1000) }
  }

  return { allowed: true }
}

export function recordFailedLoginAttempt(ip: string, maxAttempts = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const rec = loginRateLimitStore.get(ip) || { count: 0, firstAttempt: now }
  if (now - rec.firstAttempt > windowMs) {
    rec.count = 1
    rec.firstAttempt = now
    rec.lockedUntil = undefined
  } else {
    rec.count++
  }
  if (rec.count >= maxAttempts) {
    rec.lockedUntil = now + windowMs
  }
  loginRateLimitStore.set(ip, rec)
}

export function clearLoginAttempts(ip: string) {
  loginRateLimitStore.delete(ip)
}
