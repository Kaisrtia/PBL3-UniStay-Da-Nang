import { createHash } from 'node:crypto';
import { Request, RequestHandler } from 'express';
import HttpStatus from 'http-status';
import { cacheConnection } from '../config/redis.connection';

type RateLimitOptions = {
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string | undefined;
};

type LocalCounter = {
  count: number;
  expiresAt: number;
};

const localCounters = new Map<string, LocalCounter>();

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, counter] of localCounters) {
    if (counter.expiresAt <= now) {
      localCounters.delete(key);
    }
  }
}, 60_000);
cleanupTimer.unref();

const RATE_LIMIT_SCRIPT = `
  local current = redis.call('INCR', KEYS[1])
  if current == 1 then
    redis.call('PEXPIRE', KEYS[1], ARGV[1])
  end
  local ttl = redis.call('PTTL', KEYS[1])
  return { current, ttl }
`;

const hashKey = (value: string) =>
  createHash('sha256').update(value).digest('hex');

const consumeLocalLimit = (key: string, windowMs: number) => {
  const now = Date.now();
  const existing = localCounters.get(key);

  if (!existing || existing.expiresAt <= now) {
    const counter = { count: 1, expiresAt: now + windowMs };
    localCounters.set(key, counter);
    return counter;
  }

  existing.count += 1;
  return existing;
};

const consumeLimit = async (key: string, windowMs: number) => {
  try {
    const result = (await cacheConnection.eval(
      RATE_LIMIT_SCRIPT,
      1,
      key,
      windowMs
    )) as [number, number];

    return {
      count: Number(result[0]),
      retryAfterMs: Math.max(Number(result[1]), 0)
    };
  } catch {
    const counter = consumeLocalLimit(key, windowMs);
    return {
      count: counter.count,
      retryAfterMs: Math.max(counter.expiresAt - Date.now(), 0)
    };
  }
};

export const createRateLimiter = ({
  keyPrefix,
  maxRequests,
  windowMs,
  keyGenerator
}: RateLimitOptions): RequestHandler => {
  return (req, res, next) => {
    const clientKey = keyGenerator?.(req) ?? req.ip;
    if (!clientKey) {
      next();
      return;
    }

    const key = `rate-limit:${keyPrefix}:${hashKey(clientKey)}`;

    void consumeLimit(key, windowMs).then(({ count, retryAfterMs }) => {
      if (count <= maxRequests) {
        next();
        return;
      }

      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        error: {
          code: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.'
        }
      });
    });
  };
};

export const normalizedEmailKey = (req: Request) => {
  const email = req.body?.email;
  return typeof email === 'string' ? email.trim().toLowerCase() : undefined;
};
