import { db } from '../utils/database';
import { users, files, shareLinks } from '../models/schema';
import { logger } from '../utils/logger';

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Create a test user (this would normally be created by Clerk)
    const testUser = await db.insert(users).values({
      clerkId: 'user_test123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      plan: 'pro',
    }).returning();

    logger.info(`Created test user: ${testUser[0]?.email}`);

    // You can add more seed data here as needed
    
    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();