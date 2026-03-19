import { useState, useRef, useCallback, useEffect } from 'react';
import React from 'react';
import { Message, EventData, UserTier, defaultEventData, defaultUserTier } from '@/types';
import { parseInitialMessage } from './useNLPParser';
import EventDraftPreview from '@/components/EventDraftPreview';
import QuickActionButtons, { ActionButton } from '@/components/QuickActionButtons';
import ExampleCards from '@/components/ExampleCards';
import TierUpgradePrompt from '@/components/TierUpgradePrompt';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useEventAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [eventData, setEventData] = useState<EventData>({ ...defaultEventData, tickets: [], dates: [] });
  const [userTier, setUserTier] = useState<UserTier>({ ...defaultUserTier });
  const [isTyping, setIsTyping] = useState(false);
  const [screen, setScreen] = useState<'agent' | 'success' | 'draft'>('agent');
  const [messageCount, setMessageCount] = useState(0);
  const [inputValue, setInputValue] = useState('');

  const mountedRef = useRef(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      if (mountedRef.current) fn();
    }, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = { ...msg, id: uid(), timestamp: new Date() };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  }, []);

  const agentReply = useCallback(
    (text: string, widget?: React.ReactNode, delayMs = 800): Promise<void> => {
      return new Promise((resolve) => {
        setIsTyping(true);
        addTimer(() => {
          setIsTyping(false);
          addMessage({ sender: 'agent', text, widget });
          resolve();
        }, delayMs);
      });
    },
    [addMessage, addTimer],
  );

  // --- Conversation flow functions ---

  const launchEvent = useCallback(() => {
    addMessage({ sender: 'user', text: 'Launch event' });
    setIsTyping(true);
    addTimer(() => {
      setIsTyping(false);
      addMessage({ sender: 'agent', text: '🚀 Launching your event...' });
      addTimer(() => {
        setScreen('success');
      }, 1200);
    }, 600);
  }, [addMessage, addTimer]);

  const saveAndExit = useCallback(() => {
    addMessage({ sender: 'user', text: 'Save and exit' });
    setIsTyping(true);
    addTimer(() => {
      setIsTyping(false);
      addMessage({ sender: 'agent', text: '✓ Draft saved! Your event is ready whenever you want to launch it.' });
      addTimer(() => {
        setScreen('draft');
      }, 1000);
    }, 600);
  }, [addMessage, addTimer]);

  const offerEnhancements = useCallback(() => {
    const actions: ActionButton[] = [
      { label: '💰 Group Pricing', action: () => explainFeature('groups') },
      { label: '🛍️ Add-ons & Merch', action: () => explainFeature('addons') },
      { label: '🎁 Referral Rewards', action: () => explainFeature('rewards') },
      { label: 'Save Draft & Exit', action: () => saveAndExit(), variant: 'primary' },
    ];
    addMessage({
      sender: 'agent',
      text: 'Want to boost sales? I can add:',
      widget: React.createElement(QuickActionButtons, { actions }),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMessage, saveAndExit]);

  const addFeature = useCallback(
    (feature: 'groups' | 'addons' | 'rewards') => {
      const labels: Record<string, string> = {
        groups: 'Group Pricing',
        addons: 'Add-ons',
        rewards: 'Referral Rewards',
      };
      addMessage({ sender: 'user', text: `Add ${labels[feature]}` });
      setEventData((prev) => {
        const key = feature === 'groups' ? 'hasGroups' : feature === 'addons' ? 'hasAddons' : 'hasRewards';
        return { ...prev, [key]: true };
      });
      agentReply('✓ Added! Your draft has been updated.', undefined, 800).then(() => {
        addTimer(() => offerEnhancements(), 600);
      });
    },
    [addMessage, agentReply, addTimer, offerEnhancements],
  );

  const explainFeature = useCallback(
    (feature: 'groups' | 'addons' | 'rewards') => {
      const info: Record<string, { title: string; desc: string; cta: string }> = {
        groups: {
          title: 'Group Pricing',
          desc: 'Encourage people to buy together. Example: Groups of 4+ get 10% off. <strong>Increases sales by 34% on average.</strong>',
          cta: 'Add Group Pricing',
        },
        addons: {
          title: 'Add-ons & Merch',
          desc: 'Let attendees purchase extras like t-shirts, parking, VIP upgrades, or donations. <strong>Increases average order value by $15\u201325.</strong>',
          cta: 'Add Add-ons',
        },
        rewards: {
          title: 'Referral Rewards',
          desc: 'Buyers earn rewards ($5, $10, $20) for sharing with friends. <strong>3x more shares, 2x ticket sales.</strong>',
          cta: 'Add Referral Rewards',
        },
      };

      const entry = info[feature];
      addMessage({ sender: 'user', text: `Tell me about ${entry.title}` });

      const actions: ActionButton[] = [
        { label: entry.cta, action: () => addFeature(feature), variant: 'primary' },
        { label: 'See Other Features', action: () => offerEnhancements() },
        { label: 'Skip for Now', action: () => saveAndExit() },
      ];

      agentReply(
        `<strong>${entry.title}</strong><br/>${entry.desc}`,
        React.createElement(QuickActionButtons, { actions }),
        800,
      );
    },
    [addMessage, agentReply, addFeature, offerEnhancements, saveAndExit],
  );

  const useQuickDate = useCallback(
    (dateString: string) => {
      addMessage({ sender: 'user', text: dateString });
      setEventData((prev) => ({ ...prev, dates: [...prev.dates, dateString] }));
      agentReply('✓ Date set! Anything else to add?', undefined, 800).then(() => {
        addTimer(() => offerEnhancements(), 600);
      });
    },
    [addMessage, agentReply, addTimer, offerEnhancements],
  );

  const setCapacity = useCallback(
    (value: string) => {
      const display = value === 'unlimited' ? 'Unlimited capacity' : `${value} people`;
      addMessage({ sender: 'user', text: display });
      setEventData((prev) => ({ ...prev, capacity: value }));
      agentReply('✓ Capacity set! Anything else?', undefined, 800).then(() => {
        addTimer(() => offerEnhancements(), 600);
      });
    },
    [addMessage, agentReply, addTimer, offerEnhancements],
  );

  const changePrice = useCallback(
    (ticketIndex: number, amount: number) => {
      setEventData((prev) => {
        const newTickets = [...prev.tickets];
        const current = newTickets[ticketIndex];
        const currentPrice = current.price ?? 0;
        const newPrice = Math.max(0, currentPrice + amount);
        newTickets[ticketIndex] = { ...current, price: newPrice };

        addMessage({ sender: 'user', text: `Changed ${current.name} to $${newPrice}` });

        return { ...prev, tickets: newTickets };
      });
      agentReply('✓ Updated!', undefined, 800).then(() => {
        addTimer(() => offerEnhancements(), 600);
      });
    },
    [agentReply, addMessage, addTimer, offerEnhancements],
  );

  const adjustPricing = useCallback(() => {
    addMessage({ sender: 'user', text: 'I want to adjust the pricing' });
    setEventData((current) => {
      const actions: ActionButton[] = [];
      current.tickets.forEach((ticket, idx) => {
        actions.push({ label: `${ticket.name} +$5`, action: () => changePrice(idx, 5) });
        actions.push({ label: `${ticket.name} -$5`, action: () => changePrice(idx, -5) });
      });

      agentReply(
        'Sure! What would you like to change?',
        React.createElement(QuickActionButtons, { actions }),
        800,
      );
      return current;
    });
  }, [addMessage, agentReply, changePrice]);

  const setDetail = useCallback(
    (type: 'date' | 'location' | 'capacity' | 'pricing' | 'description') => {
      if (type === 'date') {
        const actions: ActionButton[] = [
          { label: 'This Saturday 7PM', action: () => useQuickDate('This Saturday at 7:00 PM') },
          { label: 'Next Friday 8PM', action: () => useQuickDate('Next Friday at 8:00 PM') },
          { label: 'Next Sunday 3PM', action: () => useQuickDate('Next Sunday at 3:00 PM') },
        ];
        agentReply(
          'When is your event?',
          React.createElement(QuickActionButtons, { actions }),
          800,
        );
      } else if (type === 'location') {
        agentReply('Where is your event?', undefined, 800);
      } else if (type === 'capacity') {
        const actions: ActionButton[] = [
          { label: '50 people', action: () => setCapacity('50') },
          { label: '100 people', action: () => setCapacity('100') },
          { label: '500 people', action: () => setCapacity('500') },
          { label: 'Unlimited', action: () => setCapacity('unlimited') },
        ];
        agentReply(
          "What's the capacity?",
          React.createElement(QuickActionButtons, { actions }),
          800,
        );
      } else if (type === 'pricing') {
        agentReply('What should the ticket price be?', undefined, 800);
      } else if (type === 'description') {
        agentReply('Add a description for your event:', undefined, 800);
      }
    },
    [agentReply, useQuickDate, setCapacity],
  );

  const addDetails = useCallback(() => {
    addMessage({ sender: 'user', text: 'Let me add more details' });
    const actions: ActionButton[] = [
      { label: '📅 Set Date', action: () => setDetail('date') },
      { label: '📍 Set Location', action: () => setDetail('location') },
      { label: '📝 Add Description', action: () => setDetail('description') },
      { label: '🚀 Launch Now', action: () => launchEvent(), variant: 'primary' },
    ];
    agentReply(
      'Great! What would you like to add?',
      React.createElement(QuickActionButtons, { actions }),
      800,
    );
  }, [addMessage, agentReply, setDetail, launchEvent]);

  const handleFollowUp = useCallback(
    (message: string) => {
      const lower = message.toLowerCase();

      // 1. Date pattern
      const datePatterns = [
        /(?:on|at)\s+(\w+\s+\d+(?:,\s+\d{4})?(?:\s+at\s+\d+:\d+\s*(?:AM|PM)?)?)/i,
        /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/,
        /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d+/i,
        /(this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+\d+(?::\d+)?\s*(?:AM|PM)?)?/i,
        /(tomorrow|today)(?:\s+at\s+\d+(?::\d+)?\s*(?:AM|PM)?)?/i,
      ];

      for (const pattern of datePatterns) {
        const match = message.match(pattern);
        if (match) {
          const dateStr = match[0];
          setEventData((prev) => ({ ...prev, dates: [...prev.dates, dateStr] }));
          const actions: ActionButton[] = [
            { label: 'Adjust Pricing', action: () => adjustPricing() },
            { label: 'More Details', action: () => addDetails() },
            { label: '🚀 Launch Event', action: () => launchEvent(), variant: 'primary' },
          ];
          agentReply(
            `✓ Perfect! Your event is set for <strong>${dateStr}</strong>. Ready to launch?`,
            React.createElement(QuickActionButtons, { actions }),
            800,
          );
          return;
        }
      }

      // 2. Price keyword
      if (lower.includes('price') || lower.includes('cost')) {
        adjustPricing();
        return;
      }

      // 3. Detail keyword
      if (lower.includes('detail') || lower.includes('info')) {
        addDetails();
        return;
      }

      // 4. Launch keyword
      if (lower.includes('launch') || lower.includes('go live')) {
        launchEvent();
        return;
      }

      // 5. Location-like text (when agent asked "Where is your event?")
      if (message.trim().length > 2) {
        setEventData((prev) => ({ ...prev, location: message.trim() }));
      }

      // 6. Fallback
      const actions: ActionButton[] = [
        { label: 'Pricing', action: () => adjustPricing() },
        { label: 'Details', action: () => addDetails() },
        { label: '🚀 Launch', action: () => launchEvent(), variant: 'primary' },
      ];
      agentReply(
        "Got it! Anything else you'd like to adjust?",
        React.createElement(QuickActionButtons, { actions }),
        800,
      );
    },
    [agentReply, adjustPricing, addDetails, launchEvent],
  );

  // --- Tier limit flow ---

  const simulateUpgrade = useCallback(() => {
    addMessage({ sender: 'user', text: 'Upgrade to Pro' });
    setIsTyping(true);
    addTimer(() => {
      setIsTyping(false);
      setUserTier((prev) => ({ ...prev, plan: 'pro' }));
      addMessage({
        sender: 'agent',
        text: '🎉 Upgraded to Pro! You now have unlimited events and lower fees (3% + $0.50). Let me create your event series...',
      });
      addTimer(() => window.location.reload(), 2000);
    }, 800);
  }, [addMessage, addTimer]);

  const createFewerEvents = useCallback(() => {
    addMessage({ sender: 'user', text: 'Create fewer events within my limit' });
    setIsTyping(true);
    addTimer(() => {
      setIsTyping(false);
      const remaining = Math.min(
        userTier.limits.free.active - userTier.activeEvents,
        userTier.limits.free.yearly - userTier.yearlyEvents,
      );
      setEventData((prev) => ({ ...prev, seriesCount: remaining }));
      addMessage({
        sender: 'agent',
        text: `No problem! You can create up to ${remaining} more event(s). Let me adjust your series...`,
      });
      addTimer(() => window.location.reload(), 2000);
    }, 800);
  }, [addMessage, addTimer, userTier]);

  const showTierLimitPrompt = useCallback(
    (eventsNeeded: number, exceedsActive: boolean, exceedsYearly: boolean) => {
      const remaining = Math.min(
        userTier.limits.free.active - userTier.activeEvents,
        userTier.limits.free.yearly - userTier.yearlyEvents,
      );

      const widget = React.createElement(TierUpgradePrompt, {
        eventsNeeded,
        exceedsActive,
        exceedsYearly,
        activeEvents: userTier.activeEvents,
        yearlyEvents: userTier.yearlyEvents,
        remaining: Math.max(0, remaining),
        onUpgrade: () => simulateUpgrade(),
        onCreateFewer: () => createFewerEvents(),
        onCancel: () => window.location.reload(),
      });

      addMessage({
        sender: 'agent',
        text: `⚠️ This ${eventsNeeded > 1 ? 'series' : 'event'} requires <strong>${eventsNeeded} event(s)</strong>`,
        widget,
      });
    },
    [addMessage, userTier, simulateUpgrade, createFewerEvents],
  );

  // --- Check missing info ---
  const checkMissingInfo = useCallback(
    (data: EventData) => {
      const missing: string[] = [];
      if (!data.location) missing.push('location');
      if (!data.dates || data.dates.length === 0) missing.push('date');
      if (!data.capacity) missing.push('capacity');
      if (data.tickets.some((t) => t.price === null)) missing.push('pricing');

      if (missing.length > 0) {
        const fieldList = missing.map((f) => `<strong>${f}</strong>`).join(', ');
        const verb = missing.length === 1 ? 'is' : 'are';
        const pronoun = missing.length === 1 ? 'this' : 'these';

        const actions: ActionButton[] = [];
        if (missing.includes('date')) actions.push({ label: '📅 Add Date', action: () => setDetail('date') });
        if (missing.includes('location')) actions.push({ label: '📍 Add Location', action: () => setDetail('location') });
        if (missing.includes('capacity')) actions.push({ label: '👥 Add Capacity', action: () => setDetail('capacity') });
        if (missing.includes('pricing')) actions.push({ label: '💵 Add Pricing', action: () => setDetail('pricing') });

        addMessage({
          sender: 'agent',
          text: `I saved your draft, but I noticed ${fieldList} ${verb} not set yet. Want to add ${pronoun} now?`,
          widget: React.createElement(QuickActionButtons, { actions }),
        });
      } else {
        const seriesText = data.isSeries ? ' series' : '';
        addMessage({
          sender: 'agent',
          text: `✓ Draft saved! Your event${seriesText} is ready to customize.`,
        });
      }

      // Always offer enhancements after 800ms
      addTimer(() => offerEnhancements(), 800);
    },
    [addMessage, addTimer, setDetail, offerEnhancements],
  );

  // --- Main send message ---
  const sendMessage = useCallback(
    (overrideText?: string) => {
      const text = overrideText || inputValue.trim();
      if (!text) return;

      addMessage({ sender: 'user', text });
      setInputValue('');
      const newCount = messageCount + 1;
      setMessageCount(newCount);

      if (newCount === 1) {
        // First message: parse + tier check + draft preview
        startTimeRef.current = Date.now();
        setIsTyping(true);
        const delay = 1000 + Math.random() * 1000;

        addTimer(() => {
          setIsTyping(false);

          const parsed = parseInitialMessage(text);
          setEventData(parsed);

          // Determine events to create
          let eventsToCreate = 1;
          if (parsed.isSeries && parsed.seriesCount) {
            eventsToCreate = parsed.seriesCount;
          } else if (parsed.dates.length > 1) {
            eventsToCreate = parsed.dates.length;
          } else if (parsed.seriesFrequency) {
            eventsToCreate = 4;
          }

          // Check tier limits
          const planLimits = userTier.limits[userTier.plan as 'free' | 'pro'] || userTier.limits.pro;
          const wouldExceedActive =
            userTier.activeEvents + eventsToCreate > planLimits.active;
          const wouldExceedYearly =
            userTier.yearlyEvents + eventsToCreate > planLimits.yearly;

          if (userTier.plan === 'free' && (wouldExceedActive || wouldExceedYearly)) {
            showTierLimitPrompt(eventsToCreate, wouldExceedActive, wouldExceedYearly);
            return;
          }

          // Draft preview
          let replyText: string;
          if (parsed.isSeries && parsed.seriesCount) {
            replyText = `Perfect! I'll create a <strong>${parsed.seriesCount}-event series</strong> for you. Here's what I'm setting up:`;
          } else {
            replyText = `Perfect! I'll create <strong>${parsed.name}</strong> as a ${parsed.mode} event. Here's what I'm setting up:`;
          }

          const previewWidget = React.createElement(EventDraftPreview, {
            eventData: parsed,
            userTier,
          });

          addMessage({ sender: 'agent', text: replyText, widget: previewWidget });

          // After 1500ms, check missing info
          addTimer(() => checkMissingInfo(parsed), 1500);
        }, delay);
      } else {
        // Follow-up messages
        handleFollowUp(text);
      }
    },
    [
      inputValue,
      messageCount,
      addMessage,
      addTimer,
      userTier,
      showTierLimitPrompt,
      checkMissingInfo,
      handleFollowUp,
    ],
  );

  // --- Welcome message on mount ---
  useEffect(() => {
    const t = setTimeout(() => {
      if (mountedRef.current) {
        const widget = React.createElement(ExampleCards, {
          onSelect: (prompt: string) => {
            setInputValue(prompt);
            // Use a small delay so that inputValue has updated via the setInputValue call
            setTimeout(() => {
              // We call sendMessage with the prompt directly
              sendMessageDirect(prompt);
            }, 50);
          },
        });
        setMessages([
          {
            id: uid(),
            sender: 'agent',
            text: "👋 Hi! I'm your FEVO AI agent. Tell me about your event and I'll set everything up in seconds.",
            widget,
            timestamp: new Date(),
          },
        ]);
      }
    }, 300);
    return () => clearTimeout(t);
  // We only want this to run once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A stable ref for sendMessage that example cards can call
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  const sendMessageDirect = useCallback((text: string) => {
    sendMessageRef.current(text);
  }, []);

  // --- Launch from draft screen ---
  const launchDraft = useCallback(() => {
    const missing: string[] = [];
    if (!eventData.location) missing.push('location');
    if (eventData.dates.length === 0) missing.push('dates');
    if (missing.length > 0) {
      alert(`Before launching, please set: ${missing.join(', ')}`);
      return;
    }
    setScreen('success');
  }, [eventData]);

  return {
    messages,
    eventData,
    userTier,
    isTyping,
    screen,
    inputValue,
    setInputValue,
    sendMessage: () => sendMessage(),
    launchDraft,
  };
}
