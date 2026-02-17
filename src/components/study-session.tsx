'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { recordStudySession } from '@/app/actions/study-actions'

interface StudyCard {
  id: number
  front: string
  back: string
  deck_id: number
  order: number
  created_at: string | Date
  updated_at: string | Date
}

interface StudyDeck {
  id: number
  title: string
  description: string | null
  user_id: string
  is_public: boolean
  created_at: string | Date
  updated_at: string | Date
  cards: StudyCard[]
}

interface StudySessionProps {
  deck: StudyDeck
}

export function StudySession({ deck }: StudySessionProps) {
  const router = useRouter()
  
  // Initialize with a shuffled version of the cards
  const [shuffledCards, setShuffledCards] = useState<StudyCard[]>(() => {
    // Create shuffled cards immediately but consistently
    const cards = [...deck.cards]
    return cards // We'll shuffle after mount to avoid hydration issues
  })
  
  // Ref to access current shuffled cards length in callbacks
  const shuffledCardsRef = useRef(shuffledCards)
  
  const [isClientMounted, setIsClientMounted] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  })
  const [startTime, setStartTime] = useState<number>(0)
  const [cardStartTime, setCardStartTime] = useState<number>(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [keyboardHelpJustShown, setKeyboardHelpJustShown] = useState(false)

  const handleBackToDeck = useCallback(() => {
    router.push(`/decks/${deck.id}`)
  }, [router, deck.id])

  // Handle case where deck has no cards
  if (shuffledCards.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-4xl mb-4">📭</div>
              <h2 className="text-xl font-semibold mb-2">No Cards to Study</h2>
              <p className="text-muted-foreground mb-4">This deck doesn't have any cards yet.</p>
              <Button onClick={handleBackToDeck} className="text-visible">
                Back to Deck
              </Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const currentCard = shuffledCards[currentCardIndex]
  const progress = ((currentCardIndex) / shuffledCards.length) * 100
  const remainingCards = shuffledCards.length - currentCardIndex

  // Safety check for current card
  if (!currentCard) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-4xl mb-4">🎴</div>
              <p className="text-muted-foreground">Loading cards...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Keep ref in sync with shuffled cards
  useEffect(() => {
    shuffledCardsRef.current = shuffledCards
  }, [shuffledCards])

  // Initialize client-side state after hydration
  useEffect(() => {
    // Mark as client mounted
    setIsClientMounted(true)
    
    // Shuffle cards on client side only
    const cards = [...deck.cards]
    if (cards.length > 0) {
      // Fisher-Yates shuffle
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]]
      }
    }
    setShuffledCards(cards)
    
    // Initialize timestamps
    const now = Date.now()
    setStartTime(now)
    setCardStartTime(now)
  }, [])

  useEffect(() => {
    setCardStartTime(Date.now())
  }, [currentCardIndex])

  // Show keyboard help hint on first load
  useEffect(() => {
    // Only run on client side to avoid hydration issues
    if (isClientMounted) {
      const hasSeenKeyboardHelp = localStorage.getItem('flashcard-keyboard-help-seen')
      if (!hasSeenKeyboardHelp && currentCardIndex === 0) {
        const timer = setTimeout(() => {
          setKeyboardHelpJustShown(true)
          setTimeout(() => setKeyboardHelpJustShown(false), 3000)
          localStorage.setItem('flashcard-keyboard-help-seen', 'true')
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [isClientMounted, currentCardIndex])

  const handleShowAnswer = useCallback(() => {
    setShowAnswer(true)
  }, [])

  const handleRestart = useCallback(() => {
    // Re-shuffle cards for a new session
    const cards = [...deck.cards]
    if (cards.length > 0) {
      // Fisher-Yates shuffle
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]]
      }
    }
    setShuffledCards(cards)
    
    setCurrentCardIndex(0)
    setShowAnswer(false)
    setSessionStats({ correct: 0, incorrect: 0, total: 0 })
    const now = Date.now()
    setStartTime(now)
    setCardStartTime(now)
    setIsCompleted(false)
  }, [deck.cards])

  const handlePreviousCard = useCallback(() => {
    setCurrentCardIndex(prev => {
      if (prev > 0) {
        setShowAnswer(false)
        return prev - 1
      }
      return prev
    })
  }, [])

  const handleNextCard = useCallback(() => {
    setCurrentCardIndex(prev => {
      if (prev < shuffledCardsRef.current.length - 1) {
        setShowAnswer(false)
        return prev + 1
      }
      return prev
    })
  }, [])

  const handleAnswer = useCallback(async (correct: boolean) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    const responseTime = cardStartTime > 0 ? Date.now() - cardStartTime : 0

    try {
      await recordStudySession({
        deckId: deck.id,
        cardId: currentCard.id,
        correct,
        responseTime
      })

      // Update session stats
      setSessionStats(prev => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
        total: prev.total + 1
      }))

      // Move to next card or complete session
      if (currentCardIndex + 1 >= shuffledCards.length) {
        setIsCompleted(true)
      } else {
        setCurrentCardIndex(prev => prev + 1)
        setShowAnswer(false)
      }
    } catch (error) {
      console.error('Failed to record study session:', error)
      // Continue anyway to not interrupt the study flow
      if (currentCardIndex + 1 >= shuffledCards.length) {
        setIsCompleted(true)
      } else {
        setCurrentCardIndex(prev => prev + 1)
        setShowAnswer(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, cardStartTime, deck.id, currentCard?.id, currentCardIndex, shuffledCards.length])

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't handle keys if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Don't handle keys if the keyboard help dialog is open (let users scroll)
      if (showKeyboardHelp) {
        return
      }

      if (isCompleted) {
        // Keyboard shortcuts for completion screen
        switch (event.key) {
          case 'r':
          case 'R':
            event.preventDefault()
            handleRestart()
            break
          case 'b':
          case 'B':
          case 'Escape':
            event.preventDefault()
            handleBackToDeck()
            break
        }
        return
      }

      if (isSubmitting) return
      
      switch (event.key) {
        case ' ':
        case 'Enter':
          event.preventDefault()
          if (!showAnswer) {
            handleShowAnswer()
          }
          break
        case '1':
        case 'x':
        case 'X':
          event.preventDefault()
          if (showAnswer) {
            handleAnswer(false)
          }
          break
        case '2':
        case 'c':
        case 'C':
          event.preventDefault()
          if (showAnswer) {
            handleAnswer(true)
          }
          break
        case 'ArrowLeft':
        case 'h':
        case 'H':
          event.preventDefault()
          if (showAnswer) {
            handleAnswer(false)
          } else {
            handlePreviousCard()
          }
          break
        case 'ArrowRight':
        case 'l':
        case 'L':
          event.preventDefault()
          if (showAnswer) {
            handleAnswer(true)
          } else {
            handleNextCard()
          }
          break
        case 'ArrowUp':
        case 'k':
        case 'K':
          if (!showAnswer) {
            event.preventDefault() // Only prevent default when we're handling the action
            handleShowAnswer()
          }
          // If showAnswer is true, let the browser handle scrolling naturally
          break
        case 'ArrowDown':
        case 'j':
        case 'J':
          if (!showAnswer) {
            event.preventDefault() // Only prevent default when we're handling the action
            handleShowAnswer()
          }
          // If showAnswer is true, let the browser handle scrolling naturally
          break
        case 'Escape':
        case 'q':
        case 'Q':
          event.preventDefault()
          handleBackToDeck()
          break
        case 'i':
        case 'I':
          event.preventDefault()
          if (showAnswer) {
            handleAnswer(false)
          }
          break
        case 'o':
        case 'O':
          event.preventDefault()
          if (showAnswer) {
            handleAnswer(true)
          }
          break
        case 'r':
        case 'R':
          event.preventDefault()
          if (event.ctrlKey || event.metaKey) {
            handleRestart()
          }
          break
        case 's':
        case 'S':
          event.preventDefault()
          // Skip current card (go to next without answering)
          handleNextCard()
          break
        case 'p':
        case 'P':
          event.preventDefault()
          // Go to previous card
          handlePreviousCard()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showAnswer, isCompleted, isSubmitting, handleRestart, handleBackToDeck, handleShowAnswer, handlePreviousCard, handleNextCard, handleAnswer])

  const getAccuracyPercentage = () => {
    if (sessionStats.total === 0) return 0
    return Math.round((sessionStats.correct / sessionStats.total) * 100)
  }

  const getSessionDuration = () => {
    if (startTime === 0) return "0:00"
    const duration = Date.now() - startTime
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getMotivationalMessage = () => {
    const accuracy = getAccuracyPercentage()
    if (accuracy === 100) return "Perfect! 🎯"
    if (accuracy >= 90) return "Excellent work! 🌟"
    if (accuracy >= 80) return "Great job! 👏"
    if (accuracy >= 70) return "Good effort! 💪"
    if (accuracy >= 60) return "Keep practicing! 📚"
    return "Every step counts! 🚀"
  }

  if (isCompleted) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Completion Header */}
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold">Study Session Complete!</h1>
            <p className="text-muted-foreground">
              Great job studying <strong>{deck.title}</strong>
            </p>
            <p className="text-lg font-medium text-primary">
              {getMotivationalMessage()}
            </p>
          </div>

          {/* Session Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Session Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {sessionStats.correct}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-red-600">
                    {sessionStats.incorrect}
                  </div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {getAccuracyPercentage()}%
                  </div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {getSessionDuration()}
                  </div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleRestart} variant="default" className="text-visible">
                  Study Again
                </Button>
                <Button onClick={handleBackToDeck} variant="outline" className="text-visible">
                  Back to Deck
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{deck.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Card {currentCardIndex + 1} of {shuffledCards.length}</span>
                <span>•</span>
                <span>{remainingCards} remaining</span>
                {isClientMounted && (
                  <>
                    <span>•</span>
                    <span>Shuffled</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!showAnswer && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handlePreviousCard}
                    disabled={currentCardIndex === 0}
                    className="text-visible"
                    title="Previous card"
                  >
                    ←
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleNextCard}
                    disabled={currentCardIndex >= shuffledCards.length - 1}
                    className="text-visible"
                    title="Next card"
                  >
                    →
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowKeyboardHelp(true)}
                className="text-visible"
                title="View all keyboard shortcuts"
              >
                <span className="flex items-center gap-1">
                  <span>?</span>
                  <span className="text-xs">Keyboard shortcuts</span>
                </span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBackToDeck}
                className="text-visible"
              >
                Exit Study
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="w-full" />
          
          {/* Session Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✓ {sessionStats.correct}
              </Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                ✗ {sessionStats.incorrect}
              </Badge>
              {sessionStats.total > 0 && (
                <Badge variant="outline">
                  {getAccuracyPercentage()}% accuracy
                </Badge>
              )}
            </div>
            
          </div>
        </div>

        {/* Flashcard */}
        <Card className="min-h-[400px]">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center min-h-[300px] space-y-6">
              {!showAnswer ? (
                <>
                  {/* Front of Card */}
                  <div className="text-center space-y-4">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Question
                    </div>
                    <div className="text-xl md:text-2xl font-medium leading-relaxed">
                      {currentCard.front}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleShowAnswer}
                    size="lg"
                    className="mt-8 text-visible"
                  >
                    Show Answer
                  </Button>
                </>
              ) : (
                <>
                  {/* Back of Card */}
                  <div className="text-center space-y-6">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Question
                      </div>
                      <div className="text-lg text-muted-foreground">
                        {currentCard.front}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Answer
                      </div>
                      <div className="text-xl md:text-2xl font-medium leading-relaxed">
                        {currentCard.back}
                      </div>
                    </div>
                  </div>
                  
                  {/* Answer Buttons */}
                  <div className="flex gap-4 mt-8">
                    <Button 
                      onClick={() => handleAnswer(false)}
                      variant="outline"
                      size="lg"
                      disabled={isSubmitting}
                      className="border-red-200 hover:bg-red-50 hover:border-red-300 text-visible"
                    >
                      ✗ Incorrect
                    </Button>
                    <Button 
                      onClick={() => handleAnswer(true)}
                      size="lg"
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      ✓ Correct
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Help Notification */}
        {keyboardHelpJustShown && (
          <div className="fixed top-4 right-4 bg-card border rounded-lg shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-sm">
              <span>⌨️</span>
              <span>Click <strong>?</strong> button for keyboard shortcuts</span>
            </div>
          </div>
        )}

        {/* Keyboard Help Dialog */}
        <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pb-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">During Study</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd>
                    <span>Show answer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
                    <span>Show answer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">↑</kbd>
                    <span>Show answer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">↓</kbd>
                    <span>Show answer</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Answer Card</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">1</kbd>
                    <span>Incorrect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">2</kbd>
                    <span>Correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">←</kbd>
                    <span>Incorrect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">→</kbd>
                    <span>Correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">X</kbd>
                    <span>Incorrect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">C</kbd>
                    <span>Correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">I</kbd>
                    <span>Incorrect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">O</kbd>
                    <span>Correct</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Card Navigation</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">← (before answer)</kbd>
                    <span>Previous card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">→ (before answer)</kbd>
                    <span>Next card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">P</kbd>
                    <span>Previous card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">S</kbd>
                    <span>Skip card</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">General</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
                    <span>Exit study</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Q</kbd>
                    <span>Exit study</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+R</kbd>
                    <span>Restart session</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Completion Screen</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">R</kbd>
                    <span>Study again</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">B</kbd>
                    <span>Back to deck</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t space-y-2">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Pro Tips:</strong>
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <strong>Before showing answer:</strong> ←/→ navigate between cards</li>
                  <li>• <strong>After showing answer:</strong> ←/→ mark incorrect/correct</li>
                  <li>• Use P/S keys to go to previous/skip cards anytime</li>
                  <li>• Press keys quickly for faster studying</li>
                  <li>• Keyboard shortcuts work even when buttons aren't focused</li>
                  <li>• Use Ctrl+R to restart the session anytime</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}