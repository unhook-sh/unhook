'use client';

import { Button } from '@unhook/ui/components/button';
import { motion } from 'motion/react';
import Link from 'next/link';
export function CTASection() {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto px-6">
        <motion.div
          animate="visible"
          className="bg-gradient-to-r from-primary/10 to-secondary/10 border rounded-lg p-12 text-center"
          initial="hidden"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-balance text-center mb-4">
            Ready to See the Difference?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            Join developers who've made the switch to better webhook testing
            with team collaboration and VS Code integration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="rounded-full"
              size="lg"
              variant="secondary"
            >
              <Link href="/app/webhooks/create?utm_source=marketing-site&utm_medium=comparisons-cta">
                Create Webhook URL
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full"
              size="lg"
              variant="outline"
            >
              <Link href="https://cal.com/seawatts/30min">Schedule Demo</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
