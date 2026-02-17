"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteDeck } from "@/app/actions/deck-actions"

interface DeleteDeckDialogProps {
  children: React.ReactNode
  deckId: number
  deckTitle: string
}

export function DeleteDeckDialog({ children, deckId, deckTitle }: DeleteDeckDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteDeck({ deckId: deckId.toString() })
        // The server action will handle the redirect, so we don't need to do anything here
      } catch (error) {
        console.error("Failed to delete deck:", error)
        // In a real app, you'd want to show a toast notification here
        setOpen(false)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Study Set</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{deckTitle}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div>
            <strong className="text-sm">This will permanently delete:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
              <li>The study set and all its cards</li>
              <li>All study session history</li>
              <li>All progress and statistics</li>
            </ul>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting..." : "Delete Study Set"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}