'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, Loader2 } from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

const mockResponses: Record<string, string> = {
  default: 'I can help you analyze government promises, track policy implementation, compare political parties, and explore governance transparency data. What would you like to know?',
  'healthcare promise': 'According to our database, healthcare promises have a 78% fulfillment rate across all parties. The Democratic Party has focused on expanding coverage, while the Republican Party emphasizes market-based solutions.',
  'policy': 'We have 370 active policies across various sectors. Healthcare leads with 52 policies, followed by education with 48 policies. Would you like detailed information about any specific sector?',
  'comparison': 'The Democratic Party has completed 112 out of 145 promises (77%), while the Republican Party has completed 98 out of 138 (71%). Infrastructure and education are areas where both parties show strong commitment.',
  'fulfilled': 'Overall, 262 out of 370 promises have been fulfilled (71%). Healthcare policies show the highest fulfillment rate at 84%, while environmental policies are at 42%.',
  'timeline': 'Promise fulfillment has been accelerating. In January we had 42 completed promises, growing to 130 by June. This represents a 209% increase in implementation pace.',
  'environment': 'Environmental policies show varying levels of commitment. Democratic promises are at 92% priority, while Republican environmental initiatives are at 35%. There are 28 active environmental projects.',
  'education': 'Education sector has 48 active policies with 65% fulfillment rate. Key initiatives include student loan relief (completed), free college (in progress), and education reform (pending).',
  'economy': 'Economic policies show strong bipartisan support with 88% commitment. Tax reform is completed, while economic stimulus programs are 60% implemented.',
  'infrastructure': 'Infrastructure received 1.2T in investment through recent bills. Projects include road renewal, bridge repair, public transit, and broadband expansion. Current completion rate is 65%.',
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      content: mockResponses.default,
      role: 'assistant',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate API delay
    setTimeout(() => {
      let response = mockResponses.default

      const lowerInput = input.toLowerCase()
      for (const [key, value] of Object.entries(mockResponses)) {
        if (lowerInput.includes(key) && key !== 'default') {
          response = value
          break
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 800)
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
            'What healthcare promises have been fulfilled?',
            'Compare Democratic and Republican performance',
            'Show me education policy updates',
            'What is the overall promise fulfillment rate?',
            'Tell me about infrastructure progress',
            'Which party has the best environmental policies?',
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
