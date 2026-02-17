import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getDeckById } from '@/db/queries/decks'
import { createCardsForDeckBatch } from '@/db/queries/cards'

const CARD_COUNT = 20

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { userId, has } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAiFeature = has?.({ plan: 'pro_plan' }) ?? false
    if (!hasAiFeature) {
      return NextResponse.json(
        { error: 'AI-generated cards require a Pro subscription' },
        { status: 403 }
      )
    }

    const { deckId } = await params
    const deckIdNum = parseInt(deckId)
    if (isNaN(deckIdNum)) {
      return NextResponse.json({ error: 'Invalid deck ID' }, { status: 400 })
    }

    const deck = await getDeckById(userId, deckIdNum)
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found or unauthorized' }, { status: 404 })
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not set' },
        { status: 500 }
      )
    }

    const topic = deck.description
      ? `${deck.title}. ${deck.description}`
      : deck.title

    const openai = createOpenAI({ apiKey })
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      output: 'array',
      maxRetries: 0,
      schema: z.object({
        front: z.string().describe('Question or term on the front of the card'),
        back: z.string().describe('Answer or definition on the back of the card'),
      }),
      prompt: `Generate exactly ${CARD_COUNT} flashcards about "${topic}". Each card should have a front (question or term) and back (answer or definition). Create diverse, educational content.`,
    })

    const cards = object as Array<{ front: string; back: string }>

    if (cards.length === 0) {
      return NextResponse.json(
        { error: 'No cards were generated' },
        { status: 500 }
      )
    }

    await createCardsForDeckBatch(userId, deckIdNum, cards)
    revalidatePath(`/decks/${deckIdNum}`)
    revalidatePath('/dashboard')

    return NextResponse.json({ count: cards.length }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Generate cards error:', err)

    if (message.includes('quota') || message.includes('billing')) {
      return NextResponse.json(
        { error: 'OpenAI quota exceeded. Check your billing at platform.openai.com.' },
        { status: 402 }
      )
    }
    if (message.includes('Incorrect API key') || message.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Check your configuration.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: message || 'Failed to generate cards' },
      { status: 500 }
    )
  }
}
