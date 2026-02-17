import { db, cardsTable, decksTable } from '@/db'
import { eq, and, desc, sql, count } from 'drizzle-orm'

/**
 * Get card count for a deck (for plan limits), ensuring user owns the deck
 */
export async function getCardCountForDeck(userId: string, deckId: number): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deck_id, decksTable.id))
    .where(and(
      eq(cardsTable.deck_id, deckId),
      eq(decksTable.user_id, userId)
    ))
  return result[0]?.count ?? 0
}

/**
 * Get all cards for a specific deck, ensuring user owns the deck
 */
export async function getCardsByDeck(userId: string, deckId: number) {
  return await db
    .select({
      id: cardsTable.id,
      front: cardsTable.front,
      back: cardsTable.back,
      deck_id: cardsTable.deck_id,
      order: cardsTable.order,
      created_at: cardsTable.created_at,
      updated_at: cardsTable.updated_at
    })
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deck_id, decksTable.id))
    .where(and(
      eq(cardsTable.deck_id, deckId),
      eq(decksTable.user_id, userId)
    ))
    .orderBy(desc(cardsTable.updated_at), desc(cardsTable.id))
}

/**
 * Get a specific card by ID, ensuring user owns the deck
 */
export async function getCardById(userId: string, cardId: number) {
  const result = await db
    .select({
      id: cardsTable.id,
      front: cardsTable.front,
      back: cardsTable.back,
      deck_id: cardsTable.deck_id,
      order: cardsTable.order,
      created_at: cardsTable.created_at,
      updated_at: cardsTable.updated_at
    })
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deck_id, decksTable.id))
    .where(and(
      eq(cardsTable.id, cardId),
      eq(decksTable.user_id, userId)
    ))
  
  return result[0] || null
}

/**
 * Create a new card for a deck, ensuring user owns the deck
 */
export async function createCardForDeck(
  userId: string, 
  deckId: number, 
  cardData: {
    front: string
    back: string
    order?: number
  }
) {
  // First verify user owns the deck
  const deckCheck = await db
    .select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.user_id, userId)
    ))
  
  if (deckCheck.length === 0) {
    throw new Error('Deck not found or access denied')
  }
  
  const result = await db
    .insert(cardsTable)
    .values({
      front: cardData.front,
      back: cardData.back,
      deck_id: deckId,
      order: cardData.order || 0,
      created_at: sql`NOW()`,
      updated_at: sql`NOW()`
    })
    .returning()
    
  return result[0]
}

/**
 * Create multiple cards for a deck in a single batch, ensuring user owns the deck
 */
export async function createCardsForDeckBatch(
  userId: string,
  deckId: number,
  cardsData: Array<{ front: string; back: string }>
) {
  if (cardsData.length === 0) return []

  const deckCheck = await db
    .select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.user_id, userId)
    ))

  if (deckCheck.length === 0) {
    throw new Error('Deck not found or access denied')
  }

  const values = cardsData.map((card, index) => ({
    front: card.front,
    back: card.back,
    deck_id: deckId,
    order: index,
  }))

  const result = await db
    .insert(cardsTable)
    .values(values)
    .returning()

  return result
}

/**
 * Update a user's card
 */
export async function updateUserCard(
  userId: string, 
  cardId: number, 
  updates: {
    front?: string
    back?: string
    order?: number
  }
) {
  // First verify user owns the deck containing this card
  const cardCheck = await db
    .select()
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deck_id, decksTable.id))
    .where(and(
      eq(cardsTable.id, cardId),
      eq(decksTable.user_id, userId)
    ))
  
  if (cardCheck.length === 0) {
    throw new Error('Card not found or access denied')
  }
  
  // Build the update object with only defined values
  const updateData: any = {
    updated_at: sql`NOW()`
  }
  
  if (updates.front !== undefined) {
    updateData.front = updates.front
  }
  if (updates.back !== undefined) {
    updateData.back = updates.back
  }
  if (updates.order !== undefined) {
    updateData.order = updates.order
  }
  
  const result = await db
    .update(cardsTable)
    .set(updateData)
    .where(eq(cardsTable.id, cardId))
    .returning()
    
  return result[0] || null
}

/**
 * Delete a user's card
 */
export async function deleteUserCard(userId: string, cardId: number) {
  // First verify user owns the deck containing this card
  const cardCheck = await db
    .select()
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deck_id, decksTable.id))
    .where(and(
      eq(cardsTable.id, cardId),
      eq(decksTable.user_id, userId)
    ))
  
  if (cardCheck.length === 0) {
    throw new Error('Card not found or access denied')
  }
  
  const result = await db
    .delete(cardsTable)
    .where(eq(cardsTable.id, cardId))
    .returning()
    
  return result[0] || null
}