'use client'

import dynamic from 'next/dynamic'

const CreateDeckDialog = dynamic(
  () => import('@/components/create-deck-dialog').then((mod) => ({ default: mod.CreateDeckDialog })),
  { ssr: false }
)

interface CreateDeckDialogClientProps {
  children: React.ReactNode
}

export function CreateDeckDialogClient({ children }: CreateDeckDialogClientProps) {
  return <CreateDeckDialog>{children}</CreateDeckDialog>
}
