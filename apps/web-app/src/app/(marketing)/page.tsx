import { BentoSection } from '~/app/(marketing)/_components/sections/bento-section';
import { CTASection } from '~/app/(marketing)/_components/sections/cta-section';
import { FAQSection } from '~/app/(marketing)/_components/sections/faq-section';
import { FooterSection } from '~/app/(marketing)/_components/sections/footer-section';
import { GrowthSection } from '~/app/(marketing)/_components/sections/growth-section';
import { HeroSection } from '~/app/(marketing)/_components/sections/hero-section';
import { Navbar } from '~/app/(marketing)/_components/sections/navbar';
import { siteConfig } from './_lib/config';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <HeroSection />
        {/* <CompanyShowcase /> */}
        <BentoSection />
        {/* <QuoteSection /> */}
        {/* <FeatureSection /> */}
        <GrowthSection />
        {/* <PricingSection /> */}
        {/* <TestimonialSection /> */}
        <FAQSection />
        <CTASection />
        <FooterSection />
      </main>
    </div>
  );
}
