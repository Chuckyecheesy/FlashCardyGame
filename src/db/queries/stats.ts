import { db, decksTable, cardsTable, studySessionsTable } from '@/db'
import { eq, count } from 'drizzle-orm'

/**
 * Get total number of cards across all user's decks
 */
export async function getUserTotalCardsCount(userId: string) {
  const result = await db
    .select({ count: count() })
    .from(cardsTable)
    .innerJoin(decksTable, eq(cardsTable.deck_id, decksTable.id))
    .where(eq(decksTable.user_id, userId))
    
  return result[0]?.count || 0
}

/**
 * Get total number of cards studied by user (study sessions count)
 */
export async function getUserStudiedCardsCount(userId: string) {
  const result = await db
    .select({ count: count() })
    .from(studySessionsTable)
    .where(eq(studySessionsTable.user_id, userId))
    
  return result[0]?.count || 0
}

/**
 * Get comprehensive dashboard statistics for a user
 */
export async function getUserDashboardStats(userId: string) {
  // Get user's decks count
  const userDecks = await db
    .select()
    .from(decksTable)
    .where(eq(decksTable.user_id, userId))
  
  // Get total cards count
  const totalCards = await getUserTotalCardsCount(userId)
  
  // Get studied cards count
  const studiedCards = await getUserStudiedCardsCount(userId)
  
  return {
    totalDecks: userDecks.length,
    totalCards,
    studiedCards,
    userDecks
  }
}

/**
 * Get study streak for a user (placeholder - would need more complex logic for real streak calculation)
 */
export async function getUserStudyStreak(userId: string): Promise<number> {
  // TODO: Implement actual streak calculation based on consecutive study days
  // For now, return 0 as placeholder
  return 0
}