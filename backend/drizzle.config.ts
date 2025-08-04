import type { Config } from 'drizzle-kit';
import { config } from './src/config';

export default {
  schema: './src/models/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: config.database.url,
  },
} satisfies Config;