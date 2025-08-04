import { createClient } from "redis";
import { config } from "../config";
import { logger } from "./logger";

export const redis: ReturnType<typeof createClient> = createClient({
  url: config.redis.url,
});

redis.on("error", (err) => {
  logger.error("Redis Client Error:", {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
});

redis.on("connect", () => {
  logger.info("Redis client connected");
});

redis.on("ready", () => {
  logger.info("Redis client ready");
});

redis.on("end", () => {
  logger.info("Redis client disconnected");
});

export async function connectRedis() {
  try {
    await redis.connect();
    logger.info("Redis connected successfully");
  } catch (error) {
    logger.error("Redis connection failed:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function closeRedis() {
  try {
    await redis.quit();
    logger.info("Redis connection closed");
  } catch (error) {
    logger.error("Error closing Redis connection:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

// Cache utility functions
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (!value) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error("Cache get error", { key, error });
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setEx(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  } catch (error) {
    logger.error("Cache set error", { key, error });
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error("Cache delete error", { key, error });
  }
}

export async function clearCache(): Promise<void> {
  try {
    await redis.flushDb();
    logger.info("Cache cleared");
  } catch (error) {
    logger.error("Cache clear error", { error });
  }
}

export async function getCacheKeys(pattern: string): Promise<string[]> {
  try {
    return await redis.keys(pattern);
  } catch (error) {
    logger.error("Cache keys error", { pattern, error });
    return [];
  }
}

export async function getCacheSize(): Promise<number> {
  try {
    return await redis.dbSize();
  } catch (error) {
    logger.error("Cache size error", { error });
    return 0;
  }
}

export async function pingCache(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch (error) {
    logger.error("Cache ping error", { error });
    return false;
  }
}

// Session management
export async function setSession(
  sessionId: string,
  data: unknown,
  ttlSeconds = 3600,
): Promise<void> {
  await setCache(`session:${sessionId}`, data, ttlSeconds);
}

export async function getSession<T>(sessionId: string): Promise<T | null> {
  return await getCache<T>(`session:${sessionId}`);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await deleteCache(`session:${sessionId}`);
}
