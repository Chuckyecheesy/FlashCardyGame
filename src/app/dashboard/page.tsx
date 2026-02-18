import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserDashboardStats } from "@/db/queries/stats";
import { CreateDeckDialogClient } from "@/components/create-deck-dialog-client";
import { DeleteDeckDialogClient } from "@/components/delete-deck-dialog-client";

const FREE_PLAN_DECK_LIMIT = 3;

export default async function DashboardPage() {
  const { userId, has } = await auth();

  if (!userId) {
    redirect("/");
  }

  const hasProPlan = has?.({ plan: "pro_plan" }) ?? false;
  const { totalDecks, totalCards, studiedCards: cardsStudied, userDecks } = await getUserDashboardStats(userId);
  const atDeckLimit = !hasProPlan && totalDecks >= FREE_PLAN_DECK_LIMIT;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome back! Here's your learning overview.
                </p>
              </div>
              <Badge variant="secondary">🎯 Ready to Learn</Badge>
            </div>
          </div>

          {!hasProPlan && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="secondary">Free plan</Badge>
                  Deck limit: {totalDecks} / {FREE_PLAN_DECK_LIMIT}
                </CardTitle>
                <CardDescription>
                  You're on the Free plan. You can create up to {FREE_PLAN_DECK_LIMIT} study sets.
                  Want <strong>unlimited decks</strong> and <strong>AI-generated flashcards</strong>? Upgrade to Pro.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link href="/pricing">Upgrade to Pro →</Link>
                </Button>
              </CardFooter>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Sets</CardTitle>
                <span className="text-2xl">📚</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDecks}</div>
                <p className="text-xs text-muted-foreground">
                  {totalDecks === 0 ? "No study sets created yet" : "Study sets created"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cards Studied</CardTitle>
                <span className="text-2xl">🎴</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cardsStudied}</div>
                <p className="text-xs text-muted-foreground">
                  {cardsStudied === 0 ? "Start studying to see progress" : "Cards studied"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                <span className="text-2xl">🔥</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Days in a row</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with creating your first study set or explore features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {atDeckLimit ? (
                  <Button asChild variant="outline" className="h-auto p-6 flex flex-col items-start space-y-2 opacity-90">
                    <Link href="/pricing" className="text-left">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">➕</span>
                        <span className="font-semibold">Create Study Set</span>
                      </div>
                      <span className="text-sm text-left opacity-80 block">
                        Free limit reached (3 decks). Upgrade to Pro for unlimited decks.
                      </span>
                    </Link>
                  </Button>
                ) : (
                  <CreateDeckDialogClient>
                    <Button className="h-auto p-6 flex flex-col items-start space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">➕</span>
                        <span className="font-semibold">Create Study Set</span>
                      </div>
                      <span className="text-sm text-left opacity-80">
                        Start by creating your first collection of flashcards
                      </span>
                    </Button>
                  </CreateDeckDialogClient>
                )}
                <Button variant="outline" className="h-auto p-6 flex flex-col items-start space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">📊</span>
                    <span className="font-semibold">View Progress</span>
                  </div>
                  <span className="text-sm text-left opacity-80">
                    Track your learning progress and statistics
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Study Sets</CardTitle>
              <CardDescription>
                {totalDecks === 0
                  ? "Create your first study set to get started with learning."
                  : `You have ${totalDecks} study set${totalDecks === 1 ? "" : "s"} ready for learning.${!hasProPlan ? ` (${totalDecks} / ${FREE_PLAN_DECK_LIMIT} on Free plan)` : ""}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalDecks === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <span className="text-4xl mb-4 block">📚</span>
                  <p>No study sets created yet.</p>
                  <p className="text-sm mb-4">Click "Create Study Set" to get started!</p>
                  <CreateDeckDialogClient>
                    <Button>Create Your First Study Set</Button>
                  </CreateDeckDialogClient>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userDecks.map((deck) => (
                    <Card key={deck.id} className="hover:shadow-md transition-shadow">
                      <Link href={`/decks/${deck.id}`} className="block">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{deck.title}</CardTitle>
                          {deck.description && (
                            <CardDescription className="text-sm">{deck.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-end">
                            {deck.is_public && (
                              <Badge variant="secondary" className="text-xs">
                                Public
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Link>
                      <CardFooter className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>📅</span>
                          <span>Updated {new Date(deck.updated_at).toLocaleDateString()}</span>
                        </div>
                        <DeleteDeckDialogClient deckId={deck.id} deckTitle={deck.title}>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            🗑️ Delete Set
                          </Button>
                        </DeleteDeckDialogClient>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest study sessions and achievements will appear here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <span className="text-4xl mb-4 block">📝</span>
                <p>No recent activity yet.</p>
                <p className="text-sm">Start studying to see your progress here!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
