'use client';

import { AnimatedList } from '@unhook/ui/magicui/animated-list';
import { OrbitingCircles } from '@unhook/ui/magicui/orbiting-circle';
import { Code, Play, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const features = [
  {
    icon: <Code className="w-6 h-6" />,
    title: 'Native Integration',
    description: 'Seamlessly integrates with VS Code sidebar',
    time: '2s ago',
  },
  {
    icon: <Play className="w-6 h-6" />,
    title: 'One-Click Replay',
    description: 'Replay webhook events instantly',
    time: '5s ago',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Team Collaboration',
    description: 'Share and debug with your team',
    time: '8s ago',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Real-time Monitoring',
    description: 'Live webhook event tracking',
    time: '12s ago',
  },
];

const FeatureItem = ({ icon, title, description, time }: any) => (
  <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg border border-border/50 backdrop-blur-sm">
    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-primary text-sm">{title}</h3>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
    <div className="text-xs text-muted-foreground">{time}</div>
  </div>
);

export function VSCodeFeaturesSection() {
  return (
    <section className="w-full py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Powerful Features for VS Code
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to debug webhooks efficiently, right in your
            editor
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Orbiting circles demo */}
          <motion.div
            className="relative flex items-center justify-center h-96"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="relative flex h-80 w-80 items-center justify-center">
              {/* Central VS Code icon */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Code className="h-10 w-10" />
              </div>

              {/* Orbiting feature icons */}
              <OrbitingCircles
                className="size-6 border-none bg-transparent"
                duration={20}
                delay={0}
                radius={80}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
                  <Play className="h-6 w-6" />
                </div>
              </OrbitingCircles>

              <OrbitingCircles
                className="size-6 border-none bg-transparent"
                duration={20}
                delay={5}
                radius={80}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
                  <Zap className="h-6 w-6" />
                </div>
              </OrbitingCircles>

              <OrbitingCircles
                className="size-6 border-none bg-transparent"
                duration={20}
                delay={10}
                radius={80}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 text-white">
                  <Users className="h-6 w-6" />
                </div>
              </OrbitingCircles>

              {/* Outer orbit */}
              <OrbitingCircles
                className="size-6 border-none bg-transparent"
                radius={140}
                duration={30}
                reverse
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white">
                  <Code className="h-5 w-5" />
                </div>
              </OrbitingCircles>
            </div>
          </motion.div>

          {/* Right side - Animated feature list */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <AnimatedList>
              {features.map((feature, index) => (
                <FeatureItem key={index} {...feature} />
              ))}
            </AnimatedList>
          </motion.div>
        </div>

        {/* Bottom feature grid */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mt-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-primary mb-2">Developer First</h3>
            <p className="text-muted-foreground text-sm">
              Built by developers, for developers. No context switching
              required.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-primary mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground text-sm">
              Instant webhook replay and real-time event monitoring.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-primary mb-2">Team Ready</h3>
            <p className="text-muted-foreground text-sm">
              Collaborate seamlessly with your team on webhook debugging.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
