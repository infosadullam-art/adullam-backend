import Redis from 'ioredis';

// Réutilise la même config que BullMQ
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  // Pour Upstash (production)
  ...(process.env.REDIS_SSL === 'true' ? { tls: {} } : {}),
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis Client Connected');
});

export default redis;