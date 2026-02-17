import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Flashcardy Course",
  description: "Learn with interactive flashcards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      appearance={{
        baseTheme: dark,
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
          card: "shadow-lg",
        },
      }}
    >
      <html lang="en" className="dark">
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <script dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: 'class',
                theme: {
                  extend: {
                    colors: {
                      background: "hsl(var(--background))",
                      foreground: "hsl(var(--foreground))",
                      card: {
                        DEFAULT: "hsl(var(--card))",
                        foreground: "hsl(var(--card-foreground))",
                      },
                      popover: {
                        DEFAULT: "hsl(var(--popover))",
                        foreground: "hsl(var(--popover-foreground))",
                      },
                      primary: {
                        DEFAULT: "hsl(var(--primary))",
                        foreground: "hsl(var(--primary-foreground))",
                      },
                      secondary: {
                        DEFAULT: "hsl(var(--secondary))",
                        foreground: "hsl(var(--secondary-foreground))",
                      },
                      muted: {
                        DEFAULT: "hsl(var(--muted))",
                        foreground: "hsl(var(--muted-foreground))",
                      },
                      accent: {
                        DEFAULT: "hsl(var(--accent))",
                        foreground: "hsl(var(--accent-foreground))",
                      },
                      destructive: {
                        DEFAULT: "hsl(var(--destructive))",
                        foreground: "hsl(var(--destructive-foreground))",
                      },
                      border: "hsl(var(--border))",
                      input: "hsl(var(--input))",
                      ring: "hsl(var(--ring))",
                    },
                    borderRadius: {
                      lg: "var(--radius)",
                      md: "calc(var(--radius) - 2px)",
                      sm: "calc(var(--radius) - 4px)",
                    },
                    fontFamily: {
                      sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
                    },
                  },
                },
              }
            `
          }} />
          <style dangerouslySetInnerHTML={{
            __html: `
              /* Force proper contrast for all interactive elements in dark mode */
              .dark * {
                color: inherit;
              }
              
              .dark body {
                background-color: hsl(0 0% 3.9%);
                color: hsl(0 0% 98%);
              }
              
              .dark button {
                color: hsl(0 0% 98%) !important;
              }
              
              .dark button[class*="outline"] {
                background-color: transparent !important;
                color: hsl(0 0% 98%) !important;
                border: 1px solid hsl(0 0% 14.9%) !important;
              }
              
              .dark button[class*="outline"]:hover {
                background-color: hsl(0 0% 14.9%) !important;
                color: hsl(0 0% 98%) !important;
              }
              
              .dark button[class*="ghost"] {
                background-color: transparent !important;
                color: hsl(0 0% 98%) !important;
              }
              
              .dark button[class*="ghost"]:hover {
                background-color: hsl(0 0% 14.9%) !important;
                color: hsl(0 0% 98%) !important;
              }
              
              .dark button[class*="default"]:not([class*="outline"]):not([class*="ghost"]) {
                background-color: hsl(0 0% 98%) !important;
                color: hsl(0 0% 9%) !important;
              }
              
              .dark a {
                color: hsl(0 0% 98%) !important;
              }
              
              .dark a:hover {
                color: hsl(0 0% 80%) !important;
              }
              
              /* Header specific fixes */
              .dark header {
                background-color: hsl(0 0% 3.9%);
                border-bottom: 1px solid hsl(0 0% 14.9%);
              }
              
              .dark header a,
              .dark header button {
                color: hsl(0 0% 98%) !important;
              }
              
              /* Card backgrounds */
              .dark [class*="card"] {
                background-color: hsl(0 0% 3.9%);
                color: hsl(0 0% 98%);
                border: 1px solid hsl(0 0% 14.9%);
              }
              
              /* Ensure muted text is still readable */
              .dark .text-muted-foreground,
              .dark [class*="muted-foreground"] {
                color: hsl(0 0% 63.9%) !important;
              }
              
              /* Badge visibility */
              .dark [class*="badge"] {
                color: hsl(0 0% 9%);
                background-color: hsl(0 0% 96.1%);
              }
              
              .dark [class*="badge"][class*="secondary"] {
                background-color: hsl(0 0% 14.9%);
                color: hsl(0 0% 98%);
              }
            `
          }} />
        </head>
        <body className={`${poppins.variable} antialiased`}>
          <header className="flex items-center justify-between p-4 border-b">
            <Link href="/" className="text-xl font-semibold hover:text-primary transition-colors">
              Flashcardy Course
            </Link>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm" className="text-visible">
                <Link href="/pricing">Pricing</Link>
              </Button>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="outline" className="text-visible">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="text-visible">Sign Up</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Button asChild variant="ghost" size="sm" className="text-visible">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
