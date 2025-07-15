import { Feature as FeatureComponent } from '@unhook/ui/magicui/feature-slideshow';
import { SectionHeader } from '~/app/(marketing)/_components/section-header';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function FeatureSection() {
  const { title, description, items } = siteConfig.featureSection;

  return (
    <section
      className="flex flex-col items-center justify-center gap-5 w-full relative"
      id="features"
    >
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          {title}
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">
          {description}
        </p>
      </SectionHeader>
      <div className="w-full h-full lg:h-[450px] flex items-center justify-center">
        <FeatureComponent
          collapseDelay={500000}
          featureItems={items}
          lineColor="bg-secondary"
          linePosition="bottom"
        />
      </div>
    </section>
  );
}
