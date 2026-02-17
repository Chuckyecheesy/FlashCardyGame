'use client'

import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

interface PricingButtonsProps {
  hasProPlan: boolean
  onUnsubscribe: () => Promise<unknown>
}

export function PricingButtons({ hasProPlan, onUnsubscribe }: PricingButtonsProps) {
  const router = useRouter()
  const unsubscribeHandlerRef = useRef<(() => Promise<unknown>) | null>(null)
  const modifiedButtonsRef = useRef<Set<HTMLElement>>(new Set())

  useEffect(() => {
    unsubscribeHandlerRef.current = async () => {
      try {
        await onUnsubscribe()
        router.refresh()
      } catch (error) {
        console.error('Failed to unsubscribe:', error)
        alert('Please cancel your subscription through your account settings or the Clerk dashboard.')
      }
    }
  }, [onUnsubscribe, router])

  useEffect(() => {
    // Find and modify buttons in the pricing table
    const modifyButtons = () => {
      // More comprehensive selectors to find all possible buttons
      const selectors = [
        '[class*="cl-pricing-table"] button',
        '[class*="cl-pricing-table"] [role="button"]',
        '[data-clerk-element="pricingTable"] button',
        '[data-clerk-element="pricingTable"] [role="button"]',
        'button[class*="cl-"]',
        'button[data-clerk-element]',
      ]

      const allButtons: HTMLElement[] = []
      selectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(btn => {
            allButtons.push(btn as HTMLElement)
          })
        } catch (e) {
          // Ignore invalid selectors
        }
      })

      for (const buttonElement of allButtons) {
        // Skip if already modified
        if (modifiedButtonsRef.current.has(buttonElement)) {
          continue
        }

        const buttonText = buttonElement.textContent?.trim() || ''
        const innerHTML = buttonElement.innerHTML || ''
        
        // Check if this is the Pro Plan button (Resubscribe, Manage, Active, etc.)
        const isProPlanButton = hasProPlan && (
          buttonText.toLowerCase().includes('resubscribe') ||
          buttonText.toLowerCase().includes('manage') ||
          (buttonText.toLowerCase().includes('active') && !buttonText.toLowerCase().includes('unsubscribe')) ||
          innerHTML.toLowerCase().includes('resubscribe')
        )

        // Check if this is a Subscribe button for Free plan
        const isSubscribeButton = !hasProPlan && (
          buttonText.toLowerCase().includes('subscribe') ||
          buttonText.toLowerCase().includes('upgrade')
        )

        if (isProPlanButton) {
          // Change button text to "Unsubscribe"
          buttonElement.textContent = 'Unsubscribe'
          modifiedButtonsRef.current.add(buttonElement)
          
          // Remove all existing event listeners by cloning
          const newButton = buttonElement.cloneNode(true) as HTMLElement
          buttonElement.parentNode?.replaceChild(newButton, buttonElement)
          
          // Add unsubscribe handler - show instructions and refresh after cancellation
          newButton.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            
            // Show instructions dialog
            const confirmed = confirm(
              'To unsubscribe from Pro plan:\n\n' +
              '1. Click your profile icon (top right)\n' +
              '2. Select "Manage account"\n' +
              '3. Go to "Billing" section\n' +
              '4. Cancel your Pro plan\n\n' +
              'After canceling, click OK to refresh this page and see your Free plan status.\n\n' +
              'Would you like to open your account settings now?'
            )
            
            if (confirmed) {
              // Try to open Clerk account portal
              const userButton = document.querySelector('[data-clerk-element="userButton"], button[class*="cl-userButton"], [class*="cl-userButton"]') as HTMLElement
              if (userButton) {
                userButton.click()
              }
              
              // Show reminder to refresh after canceling
              setTimeout(() => {
                const refreshConfirmed = confirm(
                  'After you cancel your Pro subscription in the billing portal, click OK to refresh this page and see your Free plan status.'
                )
                if (refreshConfirmed) {
                  router.refresh()
                }
              }, 2000)
            }
          })
          
          modifiedButtonsRef.current.add(newButton)
        } else if (isSubscribeButton && !hasProPlan) {
          // Ensure Subscribe button text is correct
          if (!buttonText.toLowerCase().includes('subscribe')) {
            buttonElement.textContent = 'Subscribe'
          }
          modifiedButtonsRef.current.add(buttonElement)
        }
      }
    }

    // Run immediately and then with intervals
    modifyButtons()
    
    const timeouts: NodeJS.Timeout[] = []
    // Try more frequently
    for (let i = 0; i < 10; i++) {
      timeouts.push(setTimeout(modifyButtons, 200 * (i + 1)))
    }

    // Observe for changes
    const observer = new MutationObserver(() => {
      modifyButtons()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    })

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
      observer.disconnect()
      modifiedButtonsRef.current.clear()
    }
  }, [hasProPlan])

  return null
}
