'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import {
  createDeckForUser,
  updateUserDeck,
  deleteUserDeck,
  getDeckById,
  getDeckCountForUser,
} from '@/db/queries/decks'
import { createCardForDeck } from '@/db/queries/cards'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const CreateDeckSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
})
type CreateDeckInput = z.infer<typeof CreateDeckSchema>

export async function createDeck(input: CreateDeckInput) {
  const { userId, has } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Enforce 3-deck limit for free plan users
  const hasProPlan = has?.({ plan: 'pro_plan' })
  if (!hasProPlan) {
    const hasFreeDeckLimit = has?.({ feature: '3_deck_limit' })
    if (hasFreeDeckLimit) {
      const deckCount = await getDeckCountForUser(userId)
      if (deckCount >= 3) {
        throw new Error('Deck limit reached for free plan')
      }
    }
  }

  const validated = CreateDeckSchema.parse(input)
  const newDeck = await createDeckForUser(userId, validated)
  redirect(`/decks/${newDeck.id}`)
}

const UpdateDeckSchema = z.object({
  deckId: z.string().transform(Number),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean(),
})
type UpdateDeckInput = z.input<typeof UpdateDeckSchema>

export async function updateDeck(input: UpdateDeckInput) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  const validated = UpdateDeckSchema.parse(input)
  const updated = await updateUserDeck(userId, validated.deckId, {
    title: validated.title,
    description: validated.description,
    isPublic: validated.isPublic,
  })
  if (!updated) throw new Error('Deck not found or unauthorized')
  revalidatePath(`/decks/${updated.id}`)
  revalidatePath('/dashboard')
  return updated
}

const DeleteDeckSchema = z.object({ deckId: z.string().transform(Number) })
type DeleteDeckInput = z.input<typeof DeleteDeckSchema>

export async function deleteDeck(input: DeleteDeckInput) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  const validated = DeleteDeckSchema.parse(input)
  const deleted = await deleteUserDeck(userId, validated.deckId)
  if (!deleted) throw new Error('Deck not found or unauthorized')
  revalidatePath('/dashboard')
  return deleted
}

const CreateCardSchema = z.object({
  deckId: z.string().transform(Number),
  front: z.string().min(1).max(1000),
  back: z.string().min(1).max(1000),
})
type CreateCardInput = z.input<typeof CreateCardSchema>

export async function createCard(input: CreateCardInput) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  const validated = CreateCardSchema.parse(input)
  const deck = await getDeckById(userId, validated.deckId)
  if (!deck) throw new Error('Deck not found or unauthorized')
  const newCard = await createCardForDeck(userId, validated.deckId, {
    front: validated.front,
    back: validated.back,
  })
  revalidatePath(`/decks/${validated.deckId}`)
  revalidatePath('/dashboard')
  return newCard
}
