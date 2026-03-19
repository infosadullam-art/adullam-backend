import Redis from 'ioredis';

// Détecte si on est en phase de build
const isBuildPhase = process.env.NODE_ENV === 'production' && !process.env.REDIS_HOST;

class LazyRedis {
  private client: Redis | null = null;

  private getClient(): Redis | null {
    // ⚠️ PENDANT LE BUILD, PAS DE CONNEXION REDIS
    if (isBuildPhase) {
      return null;
    }

    if (!this.client) {
      try {
        this.client = new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          // Pour Upstash (production)
          ...(process.env.REDIS_SSL === 'true' ? { tls: {} } : {}),
          retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 50, 2000);
          },
        });

        this.client.on('error', (err) => {
          console.debug('⚠️ Redis error:', err.message);
        });

        this.client.on('connect', () => {
          console.log('✅ Redis Client Connected');
        });
      } catch (e) {
        console.debug('⚠️ Redis initialization failed:', e);
        return null;
      }
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    if (!client) return null;
    try {
      return await client.get(key);
    } catch (e) {
      console.debug('⚠️ Redis get error:', e);
      return null;
    }
  }

  async set(key: string, value: string, ...args: any[]): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      await client.set(key, value, ...args);
      return true;
    } catch (e) {
      console.debug('⚠️ Redis set error:', e);
      return false;
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      await client.setex(key, seconds, value);
      return true;
    } catch (e) {
      console.debug('⚠️ Redis setex error:', e);
      return false;
    }
  }

  async del(...keys: string[]): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      await client.del(...keys);
      return true;
    } catch (e) {
      console.debug('⚠️ Redis del error:', e);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    const client = this.getClient();
    if (!client) return [];
    try {
      return await client.keys(pattern);
    } catch (e) {
      console.debug('⚠️ Redis keys error:', e);
      return [];
    }
  }
}

const redis = new LazyRedis();
export default redis;