'use client'

import { Button } from "@/components/ui/button"

export function RefreshStatusButton() {
  return (
    <div className="text-center text-sm text-muted-foreground space-y-2">
      <p>After canceling your subscription in the billing portal, refresh this page to see your Free plan status.</p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.reload()}
      >
        Refresh Status
      </Button>
    </div>
  )
}
