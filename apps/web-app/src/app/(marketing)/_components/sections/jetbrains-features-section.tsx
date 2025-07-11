'use client';

import { AnimatedList } from '@unhook/ui/magicui/animated-list';
import { OrbitingCircles } from '@unhook/ui/magicui/orbiting-circle';
import {
  Brain,
  Bug,
  Code,
  Layers,
  Play,
  Settings,
  Users,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';

const features = [
  {
    description: 'Seamlessly integrates with all JetBrains IDEs',
    icon: <Code className="w-6 h-6" />,
    time: '2s ago',
    title: 'Native Tool Window',
  },
  {
    description: 'Replay webhook events with one click',
    icon: <Play className="w-6 h-6" />,
    time: '5s ago',
    title: 'Instant Replay',
  },
  {
    description: 'Share and debug with your team',
    icon: <Users className="w-6 h-6" />,
    time: '8s ago',
    title: 'Team Collaboration',
  },
  {
    description: 'Real-time webhook event monitoring',
    icon: <Zap className="w-6 h-6" />,
    time: '12s ago',
    title: 'Live Events',
  },
];

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}

const FeatureItem = ({ icon, title, description, time }: FeatureItemProps) => (
  <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border border-border/50 backdrop-blur-sm">
    <div className="flex-shrink-0 w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-primary text-sm">{title}</h3>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
    <div className="text-xs text-muted-foreground">{time}</div>
  </div>
);

export function JetBrainsFeaturesSection() {
  return (
    <section className="w-full py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Powerful Features for JetBrains IDEs
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to debug webhooks efficiently, right in your
            favorite IDE
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Orbiting circles demo */}
          <motion.div
            className="relative flex items-center justify-center h-96"
            initial={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            <div className="relative flex h-80 w-80 items-center justify-center">
              {/* Central JetBrains icon */}
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
                <svg
                  aria-label="JetBrains Logo"
                  className="h-10 w-10"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>JetBrains Logo</title>
                  <path d="M0 0h24v24H0V0z" />
                  <path d="M3 3h7.5v7.5H3z" />
                  <path d="M13.5 3H21v7.5h-7.5z" />
                  <path d="M3 13.5h7.5V21H3z" />
                  <path d="M13.5 13.5H21V21h-7.5z" />
                </svg>
              </div>

              {/* Orbiting feature icons */}
              <OrbitingCircles
                className="size-6 border-none bg-transparent"
                delay={0}
                duration={20}
                radius={80}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
                  <Play className="h-6 w-6" />
                </div>
              </OrbitingCircles>

              <OrbitingCircles
                className="size-6 border-none bg-transparent"
                delay={5}
                duration={20}
                radius={80}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
                  <Zap className="h-6 w-6" />
                </div>
              </OrbitingCircles>

              <OrbitingCircles
                className="size-6 border-none bg-transparent"
                delay={10}
                duration={20}
                radius={80}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 text-white">
                  <Users className="h-6 w-6" />
                </div>
              </OrbitingCircles>

              {/* Outer orbit */}
              <OrbitingCircles
                className="size-6 border-none bg-transparent"
                duration={30}
                radius={140}
                reverse
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white">
                  <Bug className="h-5 w-5" />
                </div>
              </OrbitingCircles>

              <OrbitingCircles
                className="size-6 border-none bg-transparent"
                delay={15}
                duration={30}
                radius={140}
                reverse
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 text-white">
                  <Settings className="h-5 w-5" />
                </div>
              </OrbitingCircles>
            </div>
          </motion.div>

          {/* Right side - Animated feature list */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <AnimatedList>
              {features.map((feature) => (
                <FeatureItem key={feature.title} {...feature} />
              ))}
            </AnimatedList>
          </motion.div>
        </div>

        {/* Bottom feature grid */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mt-20"
          initial={{ opacity: 0, y: 40 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-primary mb-2">
              Smart IDE Integration
            </h3>
            <p className="text-muted-foreground text-sm">
              Built specifically for JetBrains IDEs with native tool windows and
              seamless UX.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-primary mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground text-sm">
              Instant webhook replay and real-time event monitoring across all
              IDEs.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-primary mb-2">
              Universal Support
            </h3>
            <p className="text-muted-foreground text-sm">
              Works with IntelliJ IDEA, WebStorm, PyCharm, PhpStorm, and all
              JetBrains IDEs.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
