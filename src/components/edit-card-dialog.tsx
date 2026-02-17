'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { updateCard } from '@/app/actions'
import { useRouter } from 'next/navigation'

interface Card {
  id: number | string
  front: string
  back: string
  deck_id: number
  order: number
  created_at: string | Date
  updated_at: string | Date
}

interface EditCardDialogProps {
  card: Card
  trigger?: React.ReactNode
}

export function EditCardDialog({ card, trigger }: EditCardDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [front, setFront] = useState(String(card?.front ?? ""))
  const [back, setBack] = useState(String(card?.back ?? ""))
  const router = useRouter()
  const cardId = card?.id != null ? String(card.id) : ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!front.trim() || !back.trim()) {
      alert('Both front and back sides are required')
      return
    }

    setIsLoading(true)
    
    try {
      if (!cardId) {
        alert("Card could not be loaded. Please refresh the page.")
        return
      }
      await updateCard({
        cardId,
        front: front.trim(),
        back: back.trim()
      })
      
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating card:', error)
      alert('Failed to update card. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFront(String(card?.front ?? ""))
      setBack(String(card?.back ?? ""))
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm" aria-label="Edit card">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
            <DialogDescription>
              Make changes to your flashcard. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-front">Front Side</Label>
              <Input
                id="edit-front"
                placeholder="e.g., Hello (English word/phrase)"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-back">Back Side</Label>
              <Input
                id="edit-back"
                placeholder="e.g., Hola (Spanish translation)"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}