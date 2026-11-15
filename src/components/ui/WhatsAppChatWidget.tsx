import React, { useMemo, useState } from 'react';
import { ExternalLink, MessageCircle, Send, X } from 'lucide-react';
import { usePunarchakra } from '../../context/PunarchakraContext';
import { TRANSLATIONS } from '../../i18n/translations';

interface ChatMsg {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

const WHATSAPP_NUMBER = '918041208899';

export const WhatsAppChatWidget: React.FC = () => {
  const { state, language, getApplicableRate, checkPinServiceability, navigateTo } = usePunarchakra();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'wa-welcome',
      sender: 'bot',
      text: 'Namaskara! Welcome to Punarchakra Bengaluru WhatsApp Desk. We serve North Bengaluru homes (B2C) and Bengaluru Industrial Areas (B2B). Check today’s rates, verify a 560xxx PIN, or schedule a pickup.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const t = TRANSLATIONS[language];

  const liveRateSummary = useMemo(() => {
    const copper = getApplicableRate('cat-copper', 'b2c', 'Bengaluru');
    const alu = getApplicableRate('cat-aluminium', 'b2c', 'Bengaluru');
    const paper = getApplicableRate('cat-newspapers', 'b2c', 'Bengaluru');
    const ewaste = getApplicableRate('cat-ewaste', 'b2c', 'Bengaluru');
    return language === 'kn'
      ? `ಬೆಂಗಳೂರು ಲೈವ್ B2C ದರಗಳು: ದಿನಪತ್ರಿಕೆ ₹${paper}/kg, ಅಲ್ಯೂಮಿನಿಯಂ ₹${alu}/kg, ತಾಮ್ರ ₹${copper}/kg, ಇ-ತ್ಯಾಜ್ಯ ₹${ewaste}/kg.`
      : `Live Bengaluru B2C rates: Newspapers ₹${paper}/kg · Aluminium ₹${alu}/kg · Copper ₹${copper}/kg · E-Waste ₹${ewaste}/kg.`;
  }, [getApplicableRate, language]);

  const generateReply = (query: string): string => {
    const q = query.trim().toLowerCase();
    const pinMatch = q.match(/\b(\d{6})\b/);
    if (pinMatch) {
      const pin = pinMatch[1];
      const check = checkPinServiceability(pin);
      if (check.serviceable && check.zone) {
        return language === 'kn'
          ? `ಪಿನ್ ${pin} (${check.zone.name}) ಬೆಂಗಳೂರಿನಲ್ಲಿ ಸಕ್ರಿಯವಾಗಿದೆ. ಲಭ್ಯವಿರುವ ಸ್ಲಾಟ್‌ಗಳು: ${check.zone.dailySlots.join(', ')}.`
          : `PIN ${pin} is serviceable under ${check.zone.name}, Bengaluru. Available slots: ${check.zone.dailySlots.join(', ')}.`;
      }
      return language === 'kn'
        ? `ಪಿನ್ ${pin} ಪ್ರಸ್ತುತ ನಮ್ಮ ಬೆಂಗಳೂರು ಸೇವಾ ವಲಯದಲ್ಲಿಲ್ಲ. ಕೇವಲ ಬೆಂಗಳೂರು (560xxx) ಪಿನ್ ಕೋಡ್‌ಗಳಿಗೆ ಸೇವೆ ಲಭ್ಯವಿದೆ.`
        : `PIN ${pin} is not in an active Bengaluru pickup corridor. Punarchakra currently serves Bengaluru (560xxx) PIN codes exclusively.`;
    }
    if (q.includes('rate') || q.includes('price') || q.includes('ದರ') || q.includes('ಬೆಲೆ')) {
      return liveRateSummary;
    }
    if (q.includes('b2b') || q.includes('bulk') || q.includes('quote') || q.includes('ಕಾರ್ಪೊರೇಟ್')) {
      return language === 'kn'
        ? 'ಬೆಂಗಳೂರು B2B ಕಾರ್ಪೊರೇಟ್ ಪಿಕಪ್ ಮತ್ತು GST ಬಿಲ್ಲಿಂಗ್‌ಗಾಗಿ B2B ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಕೊಟೇಶನ್ ಸಲ್ಲಿಸಿ ಅಥವಾ +91 80 4120 8899 ಗೆ ಕರೆ ಮಾಡಿ.'
        : 'For Bengaluru B2B bulk scrap, GST invoicing, and Form-6 e-waste manifests, submit a quotation in the B2B Portal or reach our Enterprise Desk at +91 80 4120 8899.';
    }
    if (q.includes('book') || q.includes('pickup') || q.includes('ಪಿಕಪ್')) {
      return language === 'kn'
        ? 'ಮನೆಬಾಗಿಲ ಪಿಕಪ್ ಬುಕ್ ಮಾಡಲು "ಈಗಲೇ ಸ್ಕ್ರ್ಯಾಪ್ ಮಾರಾಟ ಮಾಡಿ" ಬಟನ್ ಒತ್ತಿ ಮತ್ತು ನಿಮ್ಮ ಬೆಂಗಳೂರು ವಿಳಾಸ ಹಾಗೂ ಸಮಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.'
        : 'You can schedule a calibrated doorstep pickup in Bengaluru within 60 seconds via "SELL SCRAP NOW" — choose your slot and pay zero pickup fees.';
    }
    return language === 'kn'
      ? `ನಿಮ್ಮ ಸಂದೇಶಕ್ಕೆ ಧನ್ಯವಾದಗಳು! ${liveRateSummary} ಹೆಚ್ಚಿನ ಸಹಾಯಕ್ಕಾಗಿ ನೇರವಾಗಿ WhatsApp ನಲ್ಲಿ ಚಾಟ್ ಮಾಡಿ.`
      : `Thanks for messaging Punarchakra Bengaluru! ${liveRateSummary} Tap "Continue on WhatsApp" below to connect directly with our dispatch coordinator.`;
  };

  const handleSend = (textToSend?: string) => {
    const content = (textToSend ?? input).trim();
    if (!content) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: content,
      time: nowTime,
    };
    const botMsg: ChatMsg = {
      id: `b-${Date.now() + 1}`,
      sender: 'bot',
      text: generateReply(content),
      time: nowTime,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    if (!textToSend) setInput('');
  };

  const whatsappExternalHref = useMemo(() => {
    const lastUserText = [...messages].reverse().find((m) => m.sender === 'user')?.text;
    const prefill = lastUserText
      ? `Hi Punarchakra Bengaluru, ${lastUserText}`
      : 'Hi Punarchakra Bengaluru, I would like to schedule a scrap pickup.';
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(prefill)}`;
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-[330px] sm:w-[360px] bg-white rounded-2xl border border-[#202820]/15 shadow-2xl overflow-hidden flex flex-col"
          role="dialog"
          aria-label="WhatsApp Live Chat"
        >
          <div className="bg-[#174B37] text-white px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-sm truncate">{t.whatsappHeader}</p>
                <p className="text-[11px] text-[#A5D66D] truncate">
                  {t.whatsappSub} · {state.serviceZones.filter((z) => z.isActive).length} Zones
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close WhatsApp chat"
              className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 bg-[#F7F9F6] space-y-2.5 max-h-72 overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#174B37] text-white rounded-br-xs'
                      : 'bg-white text-[#202820] border border-[#202820]/10 rounded-bl-xs'
                  }`}
                >
                  <p>{m.text}</p>
                  <p
                    className={`text-[10px] mt-1 text-right ${
                      m.sender === 'user' ? 'text-white/65' : 'text-[#202820]/45'
                    }`}
                  >
                    {m.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 py-2 bg-white border-t border-[#202820]/10 flex flex-wrap gap-1.5">
            {[
              { label: language === 'kn' ? 'ಬೆಂಗಳೂರು ದರಗಳು' : 'Bengaluru Rates', q: 'Today Bengaluru scrap rates' },
              { label: 'North BLR 560092', q: 'Check PIN 560092' },
              { label: 'Peenya B2B 560058', q: 'Check PIN 560058' },
              { label: language === 'kn' ? 'B2B ಕೊಟೇಶನ್' : 'B2B Quote', q: 'B2B bulk quote' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSend(chip.q)}
                className="px-2.5 py-1 rounded-lg bg-[#F7F9F6] border border-[#202820]/10 text-[11px] font-medium text-[#174B37] hover:bg-[#174B37]/8 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigateTo('auth', { authMode: 'register', role: 'b2c' });
              }}
              className="px-2.5 py-1 rounded-lg bg-[#28A66A]/10 border border-[#28A66A]/25 text-[11px] font-semibold text-[#174B37] hover:bg-[#28A66A]/20 cursor-pointer"
            >
              {language === 'kn' ? 'ಪಿಕಪ್ ಬುಕ್ ಮಾಡಿ' : 'Book Pickup'}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white border-t border-[#202820]/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.whatsappPlaceholder}
              className="flex-1 h-9 px-3 rounded-xl border border-[#202820]/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#28A66A]/30"
            />
            <button
              type="submit"
              aria-label="Send chat message"
              className="w-9 h-9 rounded-xl bg-[#174B37] text-white flex items-center justify-center hover:bg-[#103527] cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <a
            href={whatsappExternalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#25D366] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#1fb858] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t.whatsappOpenExternal} (+91 80 4120 8899)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open WhatsApp Live Chat"
        className="h-12 px-4 rounded-2xl bg-[#25D366] text-white font-display font-bold text-xs sm:text-sm shadow-lg hover:bg-[#1fb858] transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174B37]"
      >
        <MessageCircle className="w-5 h-5 shrink-0" />
        <span className="whitespace-nowrap">WhatsApp Chat</span>
      </button>
    </div>
  );
};
