import { clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '../client';
import { Users } from '../schema';

/**
 * Ensures a user exists in the database by fetching from Clerk and upserting
 * This is useful for handling race conditions where Clerk webhooks haven't completed yet
 */
export async function ensureUserFromClerk(userId: string) {
  try {
    // Check if user already exists in database
    const existingUser = await db.query.Users.findFirst({
      where: eq(Users.id, userId),
    });

    if (existingUser) {
      console.log(`User ${userId} already exists in database`);
      return existingUser;
    }

    // Fetch user from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (!user) {
      throw new Error(`User not found in Clerk: ${userId}`);
    }

    const emailAddress = user.primaryEmailAddress?.emailAddress;
    if (!emailAddress) {
      throw new Error(`User email not found for userId: ${userId}`);
    }

    // Upsert user into database
    const [dbUser] = await db
      .insert(Users)
      .values({
        avatarUrl: user.imageUrl ?? null,
        clerkId: userId,
        email: emailAddress,
        firstName: user.firstName ?? null,
        id: userId,
        lastLoggedInAt: new Date(),
        lastName: user.lastName ?? null,
      })
      .onConflictDoUpdate({
        set: {
          avatarUrl: user.imageUrl ?? null,
          email: emailAddress,
          firstName: user.firstName ?? null,
          lastLoggedInAt: new Date(),
          lastName: user.lastName ?? null,
          updatedAt: new Date(),
        },
        target: Users.clerkId,
      })
      .returning();

    if (!dbUser) {
      throw new Error(
        `Failed to create user for userId: ${userId}, email: ${emailAddress}`,
      );
    }

    console.log(`User ${userId} ensured in database`);
    return dbUser;
  } catch (error) {
    console.error(`Failed to ensure user exists for userId: ${userId}`, error);
    throw error;
  }
}
