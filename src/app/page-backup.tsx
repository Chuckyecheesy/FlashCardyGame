import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthRedirect } from "@/components/auth-redirect";

export default async function Home() {
  const { userId } = await auth();

  // If user is authenticated, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <>
      <AuthRedirect />
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-4">
            <CardTitle className="text-6xl font-bold tracking-tight">
              FlashCardy
            </CardTitle>
            <CardDescription className="text-xl">
              Your personal flashcard platform
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <SignInButton mode="modal">
              <Button variant="outline" size="lg" className="w-full">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="lg" className="w-full">
                Sign Up
              </Button>
            </SignUpButton>
          </CardContent>
        </Card>
      </main>
    </>
  );
}