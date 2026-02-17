'use client'

import dynamic from 'next/dynamic'

const DeleteDeckDialog = dynamic(
  () => import('@/components/delete-deck-dialog').then((mod) => ({ default: mod.DeleteDeckDialog })),
  { ssr: false }
)

interface DeleteDeckDialogClientProps {
  children: React.ReactNode
  deckId: number
  deckTitle: string
}

export function DeleteDeckDialogClient({ children, deckId, deckTitle }: DeleteDeckDialogClientProps) {
  return (
    <DeleteDeckDialog deckId={deckId} deckTitle={deckTitle}>
      {children}
    </DeleteDeckDialog>
  )
}
