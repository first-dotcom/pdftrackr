import { db } from "../utils/database";
import { sql } from "drizzle-orm";
import { config } from "../config";
import { logger } from "../utils/logger";

async function runConcurrentQueries(concurrency: number): Promise<void> {
  const start = Date.now();
  logger.info("Starting DB pool concurrency test", {
    requestedConcurrency: concurrency,
    poolMax: (config.database as any).poolMax,
    databaseUrl: config.database.url?.split("@").pop()?.replace(/:[^/]+\//, ":****/"),
  });

  const results: Array<{ ok: boolean; error?: string; ms: number }> = [];

  await Promise.all(
    Array.from({ length: concurrency }).map(async (_v, idx) => {
      const t0 = Date.now();
      try {
        // Simple no-op query to test connection checkout/return
        await db.execute(sql`SELECT 1`);
        results.push({ ok: true, ms: Date.now() - t0 });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({ ok: false, error: message, ms: Date.now() - t0 });
        logger.error("Query failed", { idx, message });
      }
    }),
  );

  const totalMs = Date.now() - start;
  const okCount = results.filter((r) => r.ok).length;
  const errCount = results.length - okCount;
  const p95 = percentile(results.map((r) => r.ms), 95);
  const p99 = percentile(results.map((r) => r.ms), 99);

  logger.info("DB pool concurrency test finished", {
    totalRequests: results.length,
    success: okCount,
    errors: errCount,
    totalMs,
    avgMs: +(results.reduce((a, r) => a + r.ms, 0) / results.length).toFixed(2),
    p95Ms: p95,
    p99Ms: p99,
  });
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  const weight = rank - low;
  return sorted[low] * (1 - weight) + sorted[high] * weight;
}

// Default to 20 concurrent queries; override via CLI arg
const concurrency = Number(process.argv[2] || 20);

runConcurrentQueries(concurrency)
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error("DB pool test encountered an error", { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  });


