'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { deleteCard } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface Card {
  id: number | string
  front: string
  back: string
  deck_id: number
  order: number
  created_at: string | Date
  updated_at: string | Date
}

interface DeleteCardDialogProps {
  card: Card
  trigger?: React.ReactNode
}

export function DeleteCardDialog({ card, trigger }: DeleteCardDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const cardId = card?.id != null ? String(card.id) : ""

  const handleDelete = async () => {
    if (!cardId) {
      alert("Card could not be loaded. Please refresh the page.")
      return
    }
    setIsDeleting(true)
    try {
      await deleteCard({ cardId })
      
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting card:', error)
      alert('Failed to delete card. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
            aria-label="Delete card"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Flashcard</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this flashcard? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Front:</span>
              <p className="text-sm mt-1">{card.front}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Back:</span>
              <p className="text-sm mt-1">{card.back}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}