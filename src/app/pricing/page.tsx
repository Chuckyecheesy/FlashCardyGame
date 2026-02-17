import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingButtons } from "@/components/pricing-buttons";
import { RefreshStatusButton } from "@/components/refresh-status-button";
import { unsubscribeFromPro } from "@/app/actions/billing-actions";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const { has } = await auth();

  const hasProPlan = has?.({ plan: "pro_plan" }) ?? false;
  const currentPlanLabel = hasProPlan ? "Pro plan active" : "Free plan active";
  const helperText = hasProPlan
    ? "Your Pro subscription is currently active."
    : "You’re currently on the Free plan. Click Subscribe on the Pro plan below to upgrade.";


  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Ensure PricingTable button text is visible */
          [class*="cl-pricing-table"] button,
          [class*="cl-pricing-table"] [role="button"],
          [data-clerk-element="pricingTable"] button,
          [data-clerk-element="pricingTable"] [role="button"] {
            color: hsl(var(--foreground)) !important;
            background-color: hsl(var(--background)) !important;
            border: 1px solid hsl(var(--border)) !important;
          }
          [class*="cl-pricing-table"] button:hover,
          [class*="cl-pricing-table"] [role="button"]:hover,
          [data-clerk-element="pricingTable"] button:hover,
          [data-clerk-element="pricingTable"] [role="button"]:hover {
            background-color: hsl(var(--accent)) !important;
            color: hsl(var(--accent-foreground)) !important;
          }
          /* Primary buttons (Subscribe buttons) */
          [class*="cl-pricing-table"] button[class*="primary"],
          [class*="cl-pricing-table"] [class*="primary"],
          [data-clerk-element="pricingTable"] button[class*="primary"],
          [data-clerk-element="pricingTable"] [class*="primary"] {
            color: hsl(var(--primary-foreground)) !important;
            background-color: hsl(var(--primary)) !important;
          }
        `
      }} />
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            const hasProPlan = ${hasProPlan};
            function updateButtonText() {
              const buttons = document.querySelectorAll('[class*="cl-pricing-table"] button, [data-clerk-element="pricingTable"] button');
              buttons.forEach(btn => {
                const text = btn.textContent?.trim() || '';
                if (hasProPlan && (text.includes('Resubscribe') || text.includes('Manage'))) {
                  if (btn.textContent !== 'Unsubscribe') {
                    btn.textContent = 'Unsubscribe';
                  }
                }
              });
            }
            // Run immediately and on interval
            updateButtonText();
            setInterval(updateButtonText, 500);
            // Also observe DOM changes
            new MutationObserver(updateButtonText).observe(document.body, {
              childList: true,
              subtree: true,
              characterData: true
            });
          })();
        `
      }} />
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>{helperText}</CardDescription>
              </div>
              <Badge variant={hasProPlan ? "default" : "secondary"}>
                {currentPlanLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PricingTable
              appearance={{
                elements: {
                  button: {
                    color: "hsl(var(--foreground))",
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  },
                  buttonPrimary: {
                    color: "hsl(var(--primary-foreground))",
                    backgroundColor: "hsl(var(--primary))",
                  },
                },
              }}
            />
            <PricingButtons hasProPlan={hasProPlan} onUnsubscribe={unsubscribeFromPro} />
            {hasProPlan && <RefreshStatusButton />}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

