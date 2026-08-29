'use client';

import { useState } from 'react';
import type { CitizenProfile } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: string[];
}

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  citizenProfile: CitizenProfile;
}

export function AssistantPanel({
  isOpen,
  onClose,
  citizenProfile,
}: AssistantPanelProps) {
  if (!isOpen) return null;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Namaste! I am your GramSetu Civic Assistant. I can help explain scheme eligibility criteria, statutory benefits, and required application documents. How can I help you today?`,
      timestamp: 'Just now',
      sources: ['National Schemes Gazette', 'Ministry of Agriculture', 'MoHFW'],
    },
  ]);

  const quickQuestions = [
    'Why am I eligible for PM-KISAN?',
    'What documents do I need for PMAY-G?',
    'What health benefits does PM-JAY offer?',
    'How do I apply for Raitha Vidya Nidhi?',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    setTimeout(() => {
      let reply = '';
      let sources = ['Official Scheme Guidelines'];

      const lower = text.toLowerCase();
      if (lower.includes('pm-kisan') || lower.includes('kisan') || lower.includes('farmer')) {
        reply = `Under **PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)**, eligible landholding farmer families receive ₹6,000 per year directly transferred in three equal installments of ₹2,000 into their Aadhaar-linked bank accounts. To apply, you need your Aadhaar card, Land Ownership Records (ROR/Khatauni), and bank passbook.`;
        sources = ['pmkisan.gov.in', 'Ministry of Agriculture'];
      } else if (lower.includes('pmay') || lower.includes('awas') || lower.includes('housing')) {
        reply = `**PMAY-Gramin** provides ₹1,20,000 (plain areas) or ₹1,30,000 (hilly/difficult areas) for pucca house construction to homeless or kutcha house rural households identified in SECC/BPL lists. Beneficiaries also receive 90–95 days of unskilled labour wages under MGNREGA.`;
        sources = ['pmayg.nic.in', 'Ministry of Rural Development'];
      } else if (lower.includes('jay') || lower.includes('ayushman') || lower.includes('health')) {
        reply = `**Ayushman Bharat (PM-JAY)** provides comprehensive cashless health insurance coverage up to ₹5,00,000 per family per year for secondary and tertiary care hospitalization across all empaneled hospitals in India.`;
        sources = ['nha.gov.in', 'National Health Authority'];
      } else if (lower.includes('vidya') || lower.includes('karnataka') || lower.includes('scholarship')) {
        reply = `**Karnataka Raitha Vidya Nidhi** is a Karnataka state scholarship offering ₹2,000 to ₹11,000 annually for children of registered farmers pursuing higher education (PUC, ITI, Degree, Postgraduate).`;
        sources = ['raitamitra.karnataka.gov.in', 'Karnataka Agriculture Dept'];
      } else {
        reply = `GramSetu AI evaluates your profile against statutory eligibility criteria. Based on your current profile (${citizenProfile.occupation || 'citizen'}, ${citizenProfile.state || 'India'}, ${citizenProfile.landholding !== undefined ? `${citizenProfile.landholding} acres` : 'land'}), you can view exact criteria breakdowns on the Find Schemes page.`;
        sources = ['GramSetu Statutory Rules Engine'];
      }

      const botMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: 'Just now',
        sources,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-reveal">
      <div className="bg-card w-full max-w-md h-full flex flex-col shadow-2xl border-l border-border text-left">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="stamp-tag text-[#147466] dark:text-[#2dd4bf] border-[#147466] dark:border-[#2dd4bf]">
              CIVIC INTELLIGENCE
            </span>
            <h3 className="font-bold text-sm text-foreground mt-1">GramSetu Assistant</h3>
          </div>

          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-code font-bold uppercase text-muted-foreground hover:text-foreground border border-border cursor-pointer"
          >
            [ Close ]
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] p-3.5 text-xs leading-relaxed space-y-1.5 border ${
                  msg.sender === 'user'
                    ? 'bg-foreground text-background border-foreground font-medium'
                    : 'bg-card text-foreground border-border'
                }`}
              >
                <div className="whitespace-pre-line font-normal">{msg.text}</div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-1.5 border-t border-border/40 font-code text-[10px] text-muted-foreground">
                    SOURCES: {msg.sources.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggested Prompts */}
        <div className="p-3 border-t border-border bg-card space-y-1.5">
          <span className="font-code text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            SUGGESTED INQUIRIES:
          </span>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-[10px] font-code px-2 py-1 bg-muted/60 hover:bg-muted text-foreground border border-border text-left transition cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input Box */}
        <div className="p-3 border-t border-border bg-card flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about scheme rules, documents..."
            className="flex-1 h-10 px-3 text-xs bg-background text-foreground border border-border focus:border-foreground focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="btn-civic-primary h-10 px-4 text-xs shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
