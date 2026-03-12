'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, Loader2 } from 'lucide-react'
import { apiAskAI } from '@/lib/api'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      content:
        "Ask me about Indian government promises, policies, bills, budgets, and timelines — I’ll answer using the platform’s database and show supporting evidence.",
      role: 'assistant',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setError(null)

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const result = await apiAskAI({ question: userMessage.content })
      const evidenceLine =
        result.evidence?.length
          ? `\n\nEvidence used: ${result.evidence
              .map((e: any) => (e?.type ? `${e.type}${e?.id ? `#${e.id}` : ''}` : 'item'))
              .slice(0, 6)
              .join(', ')}`
          : ''
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `${result.answer ?? 'No answer returned.'}${evidenceLine}`,
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error(err)
      setError('Failed to reach the AI service. Check that the backend is running and CORS is configured.')
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          'I could not reach the AI service right now. Please ensure the backend is running (FastAPI) and the frontend `NEXT_PUBLIC_API_BASE_URL` is set correctly.',
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Governance AI Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Ask questions about government promises, policies, and political performance
        </p>
      </div>

      {/* Chat Container */}
      <Card className="flex flex-col h-96 md:h-[600px] border-2">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md p-3">
              {error}
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-sm md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-foreground rounded-bl-none'
                }`}
              >
                <p className="text-sm md:text-base">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground px-4 py-3 rounded-lg rounded-bl-none flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 md:p-6">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about promises, policies, or performance..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>

      {/* Suggestions */}
      <div className="mt-8">
        <p className="text-sm font-medium text-muted-foreground mb-3">Try asking about:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            'What promises are in the Healthcare sector and what is their status?',
            'Show recent policy timeline events in Education',
            'How has the Infrastructure budget changed over the years?',
            'Which sectors have the most promises with no_progress?',
            'List key policies in Agriculture and their current status',
            'What does the data suggest about progress in Environment?',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="text-left p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
