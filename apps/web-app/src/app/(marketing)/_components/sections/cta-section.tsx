'use client';
import { Button } from '@unhook/ui/button';
import { MagicCard } from '@unhook/ui/magicui/magic-card';
import { motion } from 'motion/react';
import Link from 'next/link';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function CTASection() {
  const { ctaSection } = siteConfig;

  return (
    <section className="w-full py-20" id="cta">
      <div className="container mx-auto px-6">
        <motion.div
          animate="visible"
          className="group"
          initial="hidden"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          whileHover={{
            scale: 1.01,
            transition: { duration: 0.2, ease: 'easeOut' },
            y: -2,
          }}
        >
          <MagicCard
            className="p-12 transition-all duration-300 group-hover:shadow-lg"
            gradientColor="var(--muted)"
            gradientFrom="var(--primary)"
            gradientOpacity={0.6}
            gradientTo="var(--secondary)"
          >
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-balance text-center mb-4">
                {ctaSection.title}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
                {ctaSection.subtext}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  className="rounded-full"
                  size="lg"
                  variant="secondary"
                >
                  <Link href={ctaSection.button.href}>
                    {ctaSection.button.text}
                  </Link>
                </Button>
              </div>
            </div>
          </MagicCard>
        </motion.div>
      </div>
    </section>
  );
}
