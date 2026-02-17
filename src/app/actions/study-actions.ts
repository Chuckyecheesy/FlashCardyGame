'use server'

import { auth } from '@clerk/nextjs/server'
import { recordUserStudySession } from '@/db/queries/sessions'
import { z } from 'zod'

const StudySessionSchema = z.object({
  deckId: z.number().int().positive(),
  cardId: z.number().int().positive(),
  correct: z.boolean(),
  responseTime: z.number().int().positive().optional()
})

type StudySessionInput = z.infer<typeof StudySessionSchema>

export async function recordStudySession(input: StudySessionInput) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  
  // Validate input with Zod
  const validatedData = StudySessionSchema.parse(input)
  
  // Use query helper for database operation
  return await recordUserStudySession(userId, validatedData)
}