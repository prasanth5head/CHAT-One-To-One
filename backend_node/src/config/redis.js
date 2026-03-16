const { createClient } = require('redis');

let redisClient;
let isRedisReady = false;

// In-memory fallback cache when Redis is unavailable
const memoryCache = new Map();

const createRedisClient = () => {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.log('[Redis] Max reconnection attempts reached, using memory fallback');
          return false;
        }
        return Math.min(retries * 200, 5000);
      },
    },
  });

  client.on('error', (err) => {
    if (isRedisReady) {
      console.log('[Redis] Connection lost, falling back to memory cache');
      isRedisReady = false;
    }
  });

  client.on('ready', () => {
    isRedisReady = true;
    console.log('[Redis] ✅ Connected and ready');
  });

  client.on('reconnecting', () => {
    console.log('[Redis] ♻️ Reconnecting...');
  });

  return client;
};

redisClient = createRedisClient();

// Wrapper that provides a unified interface (Redis or memory fallback)
const cacheClient = {
  get isReady() {
    return isRedisReady && redisClient.isReady;
  },

  async get(key) {
    try {
      if (this.isReady) {
        return await redisClient.get(key);
      }
      const cached = memoryCache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.value;
      }
      memoryCache.delete(key);
      return null;
    } catch {
      return memoryCache.get(key)?.value || null;
    }
  },

  async set(key, value, options = {}) {
    try {
      if (this.isReady) {
        return await redisClient.set(key, value, options);
      }
      const expiry = options.EX ? Date.now() + options.EX * 1000 : Date.now() + 3600000;
      memoryCache.set(key, { value, expiry });
    } catch {
      const expiry = options.EX ? Date.now() + options.EX * 1000 : Date.now() + 3600000;
      memoryCache.set(key, { value, expiry });
    }
  },

  async del(key) {
    try {
      if (this.isReady) {
        return await redisClient.del(key);
      }
      memoryCache.delete(key);
    } catch {
      memoryCache.delete(key);
    }
  },
};

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('[Redis] ✅ Connected to Redis');
  } catch (err) {
    console.warn('[Redis] ⚠️ Connection failed, using in-memory fallback cache');
    console.warn('[Redis] Error:', err.message);
  }
};

module.exports = { redisClient: cacheClient, connectRedis };
