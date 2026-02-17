import { db, studySessionsTable, decksTable, cardsTable } from '@/db'
import { eq, and, desc } from 'drizzle-orm'

/**
 * Record a study session for a user
 */
export async function recordUserStudySession(
  userId: string,
  sessionData: {
    deckId: number
    cardId: number
    correct: boolean
    responseTime?: number
  }
) {
  // Verify user owns the deck and card
  const deckCheck = await db
    .select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, sessionData.deckId),
      eq(decksTable.user_id, userId)
    ))
  
  if (deckCheck.length === 0) {
    throw new Error('Deck not found or access denied')
  }
  
  const result = await db
    .insert(studySessionsTable)
    .values({
      user_id: userId,
      deck_id: sessionData.deckId,
      card_id: sessionData.cardId,
      correct: sessionData.correct,
      response_time: sessionData.responseTime
    })
    .returning()
    
  return result[0]
}

/**
 * Get recent study sessions for a user
 */
export async function getRecentSessions(userId: string, limit: number = 10) {
  return await db
    .select({
      id: studySessionsTable.id,
      deck_id: studySessionsTable.deck_id,
      card_id: studySessionsTable.card_id,
      correct: studySessionsTable.correct,
      response_time: studySessionsTable.response_time,
      studied_at: studySessionsTable.studied_at,
      deck_title: decksTable.title,
      card_front: cardsTable.front
    })
    .from(studySessionsTable)
    .innerJoin(decksTable, eq(studySessionsTable.deck_id, decksTable.id))
    .innerJoin(cardsTable, eq(studySessionsTable.card_id, cardsTable.id))
    .where(eq(studySessionsTable.user_id, userId))
    .orderBy(desc(studySessionsTable.studied_at))
    .limit(limit)
}

/**
 * Get study statistics for a user, optionally filtered by deck
 */
export async function getUserStudyStats(userId: string, deckId?: number) {
  const conditions = deckId
    ? and(eq(studySessionsTable.user_id, userId), eq(studySessionsTable.deck_id, deckId))
    : eq(studySessionsTable.user_id, userId)

  return await db
    .select({
      id: studySessionsTable.id,
      correct: studySessionsTable.correct,
      response_time: studySessionsTable.response_time,
      studied_at: studySessionsTable.studied_at
    })
    .from(studySessionsTable)
    .where(conditions)
}

/**
 * Get study sessions for a specific deck
 */
export async function getDeckStudySessions(userId: string, deckId: number) {
  // Verify user owns the deck
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
  
  return await db
    .select()
    .from(studySessionsTable)
    .where(and(
      eq(studySessionsTable.user_id, userId),
      eq(studySessionsTable.deck_id, deckId)
    ))
    .orderBy(desc(studySessionsTable.studied_at))
}