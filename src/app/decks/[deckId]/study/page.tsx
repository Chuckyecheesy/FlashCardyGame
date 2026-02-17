import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getDeckWithCards } from "@/db/queries/decks";
import { StudySession } from "@/components/study-session";

interface StudyPageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function StudyPage({ params }: StudyPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const { deckId: deckIdParam } = await params;
  const deckId = parseInt(deckIdParam);
  if (isNaN(deckId)) {
    notFound();
  }

  const deck = await getDeckWithCards(userId, deckId);
  
  if (!deck) {
    notFound();
  }

  if (deck.cards.length === 0) {
    redirect(`/decks/${deckId}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <StudySession deck={deck} />
    </div>
  );
}