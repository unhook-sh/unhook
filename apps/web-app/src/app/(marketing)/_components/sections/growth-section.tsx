'use client';

import { SectionHeader } from '~/app/(marketing)/_components/section-header';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function GrowthSection() {
  const { title, description, items } = siteConfig.growthSection;

  return (
    <section
      className="flex flex-col items-center justify-center w-full relative px-2 md:px-10"
      id="growth"
    >
      <div className="border-x mx-2 md:mx-10 relative">
        {/* Decorative borders */}
        <div className="absolute top-0 -left-4 md:-left-14 h-full w-4 md:w-14 text-gray-950/5 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]" />
        <div className="absolute top-0 -right-4 md:-right-14 h-full w-4 md:w-14 text-gray-950/5 bg-[size:10px_10px] [background-image:repeating-linear-gradient(315deg,currentColor_0_1px,#0000_0_50%)]" />

        {/* Section Header */}
        <SectionHeader>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
            {title}
          </h2>
          <p className="text-muted-foreground text-center text-balance font-medium">
            {description}
          </p>
        </SectionHeader>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-x md:divide-y-0">
          {items.map((item) => (
            <div
              className="flex flex-col items-start justify-end gap-2 p-6 min-h-[500px]"
              key={item.id}
            >
              {item.content}
              <h3 className="text-lg tracking-tighter font-semibold">
                {item.title}
              </h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
