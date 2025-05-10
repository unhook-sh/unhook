/* eslint-disable @next/next/no-img-element */
'use client';

import { Clock } from 'lucide-react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

export function FirstBentoAnimation() {
  const ref = useRef(null);
  const isInView = useInView(ref);
  const [showPayload, setShowPayload] = useState(false);
  const [showEvent, setShowEvent] = useState(false);

  useEffect(() => {
    let eventTimeout: NodeJS.Timeout;
    let payloadTimeout: NodeJS.Timeout;
    if (isInView) {
      eventTimeout = setTimeout(() => {
        setShowEvent(true);
        payloadTimeout = setTimeout(() => {
          setShowPayload(true);
        }, 1200);
      }, 800);
    } else {
      setShowEvent(false);
      setShowPayload(false);
    }
    return () => {
      if (eventTimeout) clearTimeout(eventTimeout);
      if (payloadTimeout) clearTimeout(payloadTimeout);
    };
  }, [isInView]);

  const event = {
    expires: {
      label: '2 minutes ago',
      icon: <Clock className="size-4 text-warning" />, // Use your icon system
      color: 'text-warning',
    },
    from: 'Stripe',
    to: 'localhost:3000',
    url: '/webhooks/stripe',
    event: 'payment.created',
    code: 200,
  };

  const payload = {
    id: 'evt_1N...',
    type: 'payment.created',
    data: {
      object: {
        amount: 2000,
        currency: 'usd',
        status: 'succeeded',
        customer: 'cus_12345',
      },
    },
    created: 1712345678,
  };

  return (
    <div
      ref={ref}
      className="w-full h-full p-4 flex flex-col items-center justify-center gap-5"
    >
      <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-background to-transparent z-20" />
      <div className="max-w-md w-full mx-auto bg-background border border-border rounded-xl shadow-lg p-0 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <div className="font-mono text-xs text-muted-foreground">
            $ unhook --port 3000
          </div>
          <div className="font-mono text-xs text-primary">
            https://unhook.sh/wh_AH21J
          </div>
        </div>
        <div className="w-full px-2 pb-2">
          <AnimatePresence>
            {showEvent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg bg-accent/60 border border-border p-3 mt-2"
              >
                <div className="grid grid-cols-4 md:grid-cols-6 gap-1 items-center font-mono text-xs">
                  <div
                    className={`items-center gap-1 col-span-2 hidden md:flex ${event.expires.color}`}
                  >
                    {event.expires.icon}
                    <span>{event.expires.label}</span>
                  </div>
                  <div className="col-span-1">{event.from}</div>
                  <div className="col-span-2">{event.to}</div>
                  <div
                    className={`col-span-1 font-bold text-right ${event.code === 200 ? 'text-secondary' : event.code === 500 ? 'text-destructive' : 'text-muted-foreground'}`}
                  >
                    {event.code}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showPayload && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="mt-4 bg-background border border-border rounded-lg p-4 shadow-inner"
              >
                <div className="font-mono text-xs text-muted-foreground mb-2">
                  Inspect webhook payload
                </div>
                <pre className="text-xs font-mono bg-muted rounded p-3 overflow-x-auto text-primary">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
