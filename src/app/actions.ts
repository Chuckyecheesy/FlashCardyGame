'use server'

import { auth } from '@clerk/nextjs/server'
import { updateUserCard, deleteUserCard } from '@/db/queries/cards'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const UpdateCardSchema = z.object({
  cardId: z.union([z.string(), z.number()]).transform((v) => (typeof v === "string" ? parseInt(v, 10) : v)),
  front: z.string().min(1, "Front side is required").max(1000),
  back: z.string().min(1, "Back side is required").max(1000),
})

type UpdateCardInput = z.input<typeof UpdateCardSchema>

export async function updateCard(input: UpdateCardInput) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  
  // Validate input with Zod
  const validatedData = UpdateCardSchema.parse(input)
  
  // Use query helper for database operation
  const updatedCard = await updateUserCard(userId, validatedData.cardId, {
    front: validatedData.front,
    back: validatedData.back
  })
  
  if (!updatedCard) {
    throw new Error('Card not found or unauthorized')
  }
  
  // Revalidate the deck page to show updated data
  revalidatePath(`/decks/${updatedCard.deck_id}`)
  revalidatePath('/dashboard')
  
  return updatedCard
}

const DeleteCardSchema = z.object({
  cardId: z.union([z.string(), z.number()]).transform((v) => (typeof v === "string" ? parseInt(v, 10) : v)),
})

type DeleteCardInput = z.input<typeof DeleteCardSchema>

export async function deleteCard(input: DeleteCardInput) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  
  // Validate input with Zod
  const validatedData = DeleteCardSchema.parse(input)
  
  // Use query helper for database operation
  const deletedCard = await deleteUserCard(userId, validatedData.cardId)
  
  if (!deletedCard) {
    throw new Error('Card not found or unauthorized')
  }
  
  // Revalidate the deck page to show updated data
  revalidatePath(`/decks/${deletedCard.deck_id}`)
  revalidatePath('/dashboard')
  
  return deletedCard
}