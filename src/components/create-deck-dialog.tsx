"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createDeck } from "@/app/actions/deck-actions"

interface CreateDeckDialogProps {
  children: React.ReactNode
}

export function CreateDeckDialog({ children }: CreateDeckDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isPublic: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      return
    }

    startTransition(async () => {
      try {
        await createDeck({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          isPublic: formData.isPublic
        })
        setFormData({ title: "", description: "", isPublic: false })
        setOpen(false)
      } catch (error) {
        console.error("Failed to create deck:", error)
      }
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isPending) {
      setOpen(newOpen)
      if (!newOpen) {
        setFormData({ title: "", description: "", isPublic: false })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Study Set</DialogTitle>
          <DialogDescription>
            Create a new collection of flashcards to start learning.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Spanish Vocabulary"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              disabled={isPending}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description of your study set..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isPending}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isPublic: checked === true }))
              }
              disabled={isPending}
            />
            <Label htmlFor="isPublic" className="text-sm">
              Make this study set public
            </Label>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !formData.title.trim()}
            >
              {isPending ? "Creating..." : "Create Study Set"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}