import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDeckWithCards } from "@/db/queries/decks";
import { AddCardDialog } from "@/components/add-card-dialog";
import { GenerateAICardsButton } from "@/components/generate-ai-cards-button";
import { EditDeckDialog } from "@/components/edit-deck-dialog";
import { EditCardDialog } from "@/components/edit-card-dialog";
import { DeleteCardDialog } from "@/components/delete-card-dialog";
import { DeleteDeckDialogClient } from "@/components/delete-deck-dialog-client";

interface DeckPageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { userId, has } = await auth();

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

  const hasAiFeature = has?.({ plan: 'pro_plan' }) ?? false;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="text-visible">
                      ← Back to Dashboard
                    </Button>
                  </Link>
                  {deck.is_public && (
                    <Badge variant="secondary">Public</Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{deck.title}</h1>
                {deck.description && (
                  <p className="text-muted-foreground text-lg">
                    {deck.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <EditDeckDialog deck={deck} />
                <DeleteDeckDialogClient deckId={deck.id} deckTitle={deck.title}>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    Delete Set
                  </Button>
                </DeleteDeckDialogClient>
                {deck.cards.length > 0 ? (
                  <Link href={`/decks/${deck.id}/study`}>
                    <Button className="text-visible">
                      Start Study Session
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="text-visible">
                    Start Study Session
                  </Button>
                )}
              </div>
            </div>
          </div>


          {/* Cards Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Flashcards</CardTitle>
                  <CardDescription>
                    {deck.cards.length === 0 
                      ? "No cards in this deck yet. Add some cards to get started!"
                      : `${deck.cards.length} card${deck.cards.length === 1 ? '' : 's'} in this deck`
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <GenerateAICardsButton
                    hasAiFeature={hasAiFeature}
                    deckId={deck.id}
                  />
                  <AddCardDialog 
                    deckId={deck.id}
                    trigger={
                      <Button variant="outline" size="sm">
                        Add Card
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {deck.cards.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <span className="text-6xl mb-4 block">🎴</span>
                  <h3 className="text-lg font-semibold mb-2">No cards yet</h3>
                  <p className="mb-4">Add your first flashcard to start learning!</p>
                  <AddCardDialog 
                    deckId={deck.id}
                    trigger={
                      <Button>
                        Create First Card
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deck.cards.map((card) => (
                    <Card key={card.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-end gap-1">
                          <EditCardDialog card={card} />
                          <DeleteCardDialog card={card} />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Front</h4>
                            <p className="text-sm">{card.front}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Back</h4>
                            <p className="text-sm">{card.back}</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>📅</span>
                          <span>Updated {new Date(card.updated_at).toLocaleDateString()}</span>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
