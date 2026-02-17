'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Sparkles } from 'lucide-react'

interface GenerateAICardsButtonProps {
  hasAiFeature: boolean
  deckId: number
}

export function GenerateAICardsButton({ hasAiFeature, deckId }: GenerateAICardsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/decks/${deckId}/generate-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed: ${res.status}`)
      }
      router.refresh()
    } catch (error) {
      console.error('Error generating cards:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate cards')
    } finally {
      setIsLoading(false)
    }
  }

  const button = (
    <Button
      variant="outline"
      size="sm"
      disabled={hasAiFeature ? isLoading : false}
      onClick={hasAiFeature ? handleGenerate : undefined}
      asChild={!hasAiFeature}
      className="gap-2"
    >
      {hasAiFeature ? (
        <>
          <Sparkles className="h-4 w-4" />
          {isLoading ? 'Generating...' : 'Generate Cards with AI'}
        </>
      ) : (
        <Link href="/pricing" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Generate Cards with AI
        </Link>
      )}
    </Button>
  )

  if (!hasAiFeature) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            Upgrade to Pro to use AI-generated cards
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}
