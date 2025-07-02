'use client';

import { Button } from '@unhook/ui/components/button';
import { ArrowRight } from 'lucide-react';

interface ComparisonCTAProps {
  competitor: string;
  ctaText: string;
  description: string;
}

export function ComparisonCTA({ competitor, ctaText, description }: ComparisonCTAProps) {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto px-6">
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border rounded-lg p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to {ctaText}?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Free forever plan available
          </p>
        </div>
      </div>
    </section>
  );
}