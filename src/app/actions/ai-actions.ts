'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getDeckById } from '@/db/queries/decks'
import { createCardsForDeckBatch } from '@/db/queries/cards'

const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set. Add it to your .env.local file.')
  }
  return createOpenAI({ apiKey })
}

const GenerateAICardsSchema = z.object({
  deckId: z.string().transform(Number),
})
type GenerateAICardsInput = z.infer<typeof GenerateAICardsSchema>

const CARD_COUNT = 20

export async function generateAICards(input: GenerateAICardsInput) {
  const { userId, has } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const hasAiFeature = has?.({ plan: 'pro_plan' }) ?? false
  if (!hasAiFeature) {
    throw new Error('AI-generated cards require a Pro subscription')
  }

  const validated = GenerateAICardsSchema.parse(input)
  const deck = await getDeckById(userId, validated.deckId)
  if (!deck) throw new Error('Deck not found or unauthorized')

  const topic = deck.description
    ? `${deck.title}. ${deck.description}`
    : deck.title

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const keySuffix = apiKey ? `...${apiKey.slice(-4)}` : '(not set)'

  const openai = getOpenAI()
  let object: Array<{ front: string; back: string }>
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      output: 'array',
      maxRetries: 0,
      schema: z.object({
        front: z.string().describe('Question or term on the front of the card'),
        back: z.string().describe('Answer or definition on the back of the card'),
      }),
      prompt: `Generate exactly ${CARD_COUNT} flashcards about "${topic}". Each card should have a front (question or term) and back (answer or definition). Create diverse, educational content.`,
    })
    object = result.object as Array<{ front: string; back: string }>
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('Incorrect API key') || message.includes('API key')) {
      throw new Error(
        `OpenAI API key rejected (key ends in ${keySuffix}). ` +
          'Verify: 1) Your .env.local key ends with these 4 characters. 2) If not, another env source is overriding. ' +
          '3) Regenerate the key at platform.openai.com/api-keys. 4) Ensure only OPENAI_API_KEY is set, restart dev server.'
      )
    }
    throw err
  }

  const cards = object

  if (cards.length === 0) {
    throw new Error('No cards were generated')
  }

  await createCardsForDeckBatch(userId, validated.deckId, cards)
  revalidatePath(`/decks/${validated.deckId}`)
  revalidatePath('/dashboard')

  return { count: cards.length }
}
