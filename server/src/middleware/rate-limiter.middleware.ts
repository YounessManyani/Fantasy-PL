import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

const requests = new Map<string, number[]>();

export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let timestamps = requests.get(ip) || [];
    
    timestamps = timestamps.filter(time => time > windowStart);

    if (timestamps.length >= config.max) {
      res.status(429).json({
        error: 'Too many requests',
        message: config.message
      });
      return;
    }

    timestamps.push(now);
    requests.set(ip, timestamps);

    next();
  };
}

export function rateLimitConfig(): RateLimitConfig {
  return {
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
  };
}