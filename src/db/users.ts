import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }

    const inserted = await db.insert(users).values({
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      shopName: 'Neighborhood Kiosk & Mart',
      currency: 'USD',
    }).returning();

    return inserted[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Failed to retrieve or initialize user profile', { cause: error });
  }
}
