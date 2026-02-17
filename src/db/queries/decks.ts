import { db, decksTable, cardsTable } from '@/db'
import { eq, and, desc, sql, count } from 'drizzle-orm'

/**
 * Get the number of decks belonging to a user (for plan limits)
 */
export async function getDeckCountForUser(userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(decksTable)
    .where(eq(decksTable.user_id, userId))
  return result[0]?.count ?? 0
}

/**
 * Get all decks belonging to a specific user
 */
export async function getUserDecks(userId: string) {
  return await db
    .select()
    .from(decksTable)
    .where(eq(decksTable.user_id, userId))
}

/**
 * Get a specific deck by ID, ensuring it belongs to the user
 */
export async function getDeckById(userId: string, deckId: number) {
  const result = await db
    .select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.user_id, userId)
    ))
  
  return result[0] || null
}

/**
 * Create a new deck for a user
 */
export async function createDeckForUser(
  userId: string, 
  deckData: { 
    title: string
    description?: string
    isPublic?: boolean 
  }
) {
  const result = await db
    .insert(decksTable)
    .values({
      title: deckData.title,
      description: deckData.description,
      is_public: deckData.isPublic || false,
      user_id: userId
    })
    .returning()
    
  return result[0]
}

/**
 * Update a user's deck
 */
export async function updateUserDeck(
  userId: string, 
  deckId: number, 
  updates: {
    title?: string
    description?: string
    isPublic?: boolean
  }
) {
  const result = await db
    .update(decksTable)
    .set({
      title: updates.title,
      description: updates.description,
      is_public: updates.isPublic,
      updated_at: sql`NOW()`
    })
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.user_id, userId)
    ))
    .returning()
    
  return result[0] || null
}

/**
 * Get a specific deck with its cards, ensuring it belongs to the user
 */
export async function getDeckWithCards(userId: string, deckId: number) {
  const deck = await getDeckById(userId, deckId)
  if (!deck) return null
  
  const cards = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.deck_id, deckId))
    .orderBy(desc(cardsTable.updated_at), desc(cardsTable.id))
  
  return {
    ...deck,
    cards
  }
}

/**
 * Delete a user's deck
 */
export async function deleteUserDeck(userId: string, deckId: number) {
  const result = await db
    .delete(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.user_id, userId)
    ))
    .returning()
    
  return result[0] || null
}