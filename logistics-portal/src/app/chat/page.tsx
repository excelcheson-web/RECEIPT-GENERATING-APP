'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import SiteNav from '@/components/SiteNav'
import SiteFooter from '@/components/SiteFooter'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

const quickQuestions = [
  'Track my shipment',
  'Shipping rates',
  'Delivery time',
  'Contact support',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Skyship AI Assistant. How can I help you with your logistics needs today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes('track') || lowerMessage.includes('shipment') || lowerMessage.includes('where')) {
      return "You can track your shipment by entering your tracking number on our homepage. Would you like me to guide you to the tracking page?"
    } else if (lowerMessage.includes('rate') || lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
      return "Our shipping rates depend on weight, dimensions, and destination. For international shipping, rates start at $25 for documents and $45 for packages. Would you like a custom quote?"
    } else if (lowerMessage.includes('time') || lowerMessage.includes('delivery') || lowerMessage.includes('how long') || lowerMessage.includes('when')) {
      return "Delivery times vary by service: Air Freight (1–3 days), Ocean Freight (10–30 days), Road Freight (1–5 days). Express options are available for urgent shipments."
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('human')) {
      return "You can reach our 24/7 support team via Live Chat right here, or visit our Contact page for more ways to get in touch."
    } else if (lowerMessage.includes('service') || lowerMessage.includes('offer') || lowerMessage.includes('what do you do')) {
      return "We offer comprehensive logistics services:\n✈️ Air Freight\n🚢 Ocean Freight\n🚛 Road Freight\n📦 Warehousing\n🌍 International Shipping\n📋 Customs Clearance\nWhich service interests you?"
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! Welcome to Skyship Logistics. I'm here to help with tracking, shipping rates, delivery times, or any logistics questions. What can I assist you with today?"
    } else if (lowerMessage.includes('thank')) {
      return "You're welcome! I'm glad I could help. Is there anything else you need assistance with regarding your logistics needs?"
    } else {
      return `I understand you're asking about "${userMessage}". I can help with tracking shipments, shipping rates, delivery times, and general logistics support. Could you provide more details about what you need?`
    }
  }

  const sendMessage = (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(text),
        sender: 'ai',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputText)
    }
  }

  return (
    <div className="mesh-gradient min-h-screen flex flex-col">
      <SiteNav />

      {/* Page header */}
      <section className="pt-32 pb-6 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-[#9DC400] text-sm font-semibold uppercase tracking-[0.25em] mb-3">Support</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          AI Live <span className="text-[#9DC400]">Chat</span>
        </h1>
        <div className="w-16 h-1 bg-[#9DC400] mx-auto rounded-full mb-3" />
        <p className="text-white/60 text-sm">Get instant answers to your logistics questions</p>
      </section>

      {/* Chat container */}
      <section className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="glass-panel overflow-hidden flex flex-col" style={{ height: '600px' }}>

            {/* Chat header */}
            <div className="bg-[#9DC400]/15 px-5 py-4 border-b border-white/10 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#9DC400] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#001f3f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Skyship AI Assistant</p>
                <p className="text-white/55 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Online — typically replies instantly
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-[#9DC400]/20 border border-[#9DC400]/30 flex items-center justify-center shrink-0 mr-2 mt-1">
                      <svg className="w-3.5 h-3.5 text-[#9DC400]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                      message.sender === 'user'
                        ? 'bg-[#9DC400] text-[#001f3f] font-medium rounded-br-sm'
                        : 'bg-white/10 text-white border border-white/15 rounded-bl-sm'
                    }`}
                  >
                    {message.text}
                    <p className={`text-[10px] mt-1.5 ${message.sender === 'user' ? 'text-[#001f3f]/50' : 'text-white/35'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-[#9DC400]/20 border border-[#9DC400]/30 flex items-center justify-center shrink-0 mr-2 mt-1" />
                  <div className="bg-white/10 text-white px-4 py-3 rounded-2xl rounded-bl-sm border border-white/15">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick questions */}
            <div className="px-4 sm:px-5 py-2.5 border-t border-white/10 shrink-0">
              <p className="text-white/45 text-xs mb-2">Quick questions</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1 text-xs bg-white/8 hover:bg-[#9DC400]/15 text-white/80 hover:text-white rounded-full border border-white/15 hover:border-[#9DC400]/40 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-white/5 shrink-0">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="glass-input glass-input-lime flex-1"
                />
                <button
                  onClick={() => sendMessage(inputText)}
                  disabled={!inputText.trim()}
                  className="skyship-button px-5 py-3 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-white/35 text-xs mt-2 text-center">
                Powered by Skyship AI
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="glass-button px-6 py-2.5 text-sm inline-block">
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
