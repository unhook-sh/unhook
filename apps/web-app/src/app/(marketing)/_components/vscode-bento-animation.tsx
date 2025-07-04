'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

const events = [
  {
    id: 1,
    type: 'stripe.payment',
    status: 200,
    time: '2s ago',
    color: 'text-green-400',
  },
  {
    id: 2,
    type: 'github.push',
    status: 200,
    time: '5s ago',
    color: 'text-blue-400',
  },
  {
    id: 3,
    type: 'clerk.user',
    status: 500,
    time: '12s ago',
    color: 'text-purple-400',
  },
  {
    id: 4,
    type: 'discord.message',
    status: 200,
    time: '18s ago',
    color: 'text-indigo-400',
  },
];

export function VSCodeBentoAnimation() {
  const [currentEvent, setCurrentEvent] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEvent((prev) => (prev + 1) % events.length);
      setAnimationKey((prev) => prev + 1);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const selectedEvent = events[currentEvent];

  return (
    <div className="relative w-full h-full bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-800">
      {/* VS Code Title Bar */}
      <div className="flex items-center justify-between bg-[#323233] px-3 py-1.5 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <div className="text-xs text-gray-300 ml-2">VS Code</div>
        </div>
        <div className="text-xs text-gray-400">Unhook Active</div>
      </div>

      <div className="flex h-40">
        {/* Sidebar */}
        <div className="w-32 bg-[#252526] border-r border-gray-700 p-2">
          <div className="mb-2">
            <div className="flex items-center space-x-1 mb-1">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-white text-xs font-medium">UNHOOK</span>
            </div>
            <div className="text-xs text-gray-400">
              Events ({events.length})
            </div>
          </div>

          {/* Event List */}
          <div className="space-y-1">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                className={`p-1.5 rounded text-xs cursor-pointer transition-colors ${
                  index === currentEvent
                    ? 'bg-[#37373d] text-white'
                    : 'bg-[#2d2d30] text-gray-300 hover:bg-[#37373d]'
                }`}
                animate={{
                  backgroundColor:
                    index === currentEvent ? '#37373d' : '#2d2d30',
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center">
                  <span className={event.color}>
                    {event.type.split('.')[0]}
                  </span>
                  <span
                    className={`text-xs ${
                      event.status === 200 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400">{event.time}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-[#1e1e1e] p-2">
          <div className="mb-2">
            <div className="text-xs text-gray-400 mb-1">Event Details</div>
            <motion.div
              key={animationKey}
              className="bg-[#2d2d30] rounded p-2 font-mono text-xs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className={selectedEvent.color}>
                {`{
  "event": "${selectedEvent.type}",
  "status": ${selectedEvent.status},
  "timestamp": "${new Date().toISOString()}",
  "data": { ... }
}`}
              </div>
            </motion.div>
          </div>

          <div className="flex space-x-1">
            <motion.button
              key={`replay-${animationKey}`}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              Replay
            </motion.button>
            <motion.button
              key={`copy-${animationKey}`}
              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              Copy
            </motion.button>
          </div>
        </div>
      </div>

      {/* Activity Indicator */}
      <motion.div
        className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"
        animate={{
          opacity: [1, 0.3, 1],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
