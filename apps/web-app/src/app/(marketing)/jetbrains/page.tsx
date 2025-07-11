import type { Metadata } from 'next';
import { AIMCPSection } from '~/app/(marketing)/_components/sections/ai-mcp-section';
import { BentoSection } from '~/app/(marketing)/_components/sections/bento-section';
import { CTASection } from '~/app/(marketing)/_components/sections/cta-section';
import { FAQSection } from '~/app/(marketing)/_components/sections/faq-section';
import { FooterSection } from '~/app/(marketing)/_components/sections/footer-section';
import { GrowthSection } from '~/app/(marketing)/_components/sections/growth-section';
import { Navbar } from '~/app/(marketing)/_components/sections/navbar';
import { SharedWebhooksSection } from '~/app/(marketing)/_components/sections/shared-webhooks-section';
import { JetBrainsFeaturesSection } from '~/app/(marketing)/_components/sections/jetbrains-features-section';
import { JetBrainsHeroSection } from '~/app/(marketing)/_components/sections/jetbrains-hero-section';
import { siteConfig } from '../_lib/config';

export const metadata: Metadata = {
  title: 'JetBrains Plugin | Unhook - Webhook Testing for IntelliJ IDEA & More',
  description: 'Debug webhooks directly in JetBrains IDEs. Native plugin for IntelliJ IDEA, WebStorm, PyCharm, and all JetBrains IDEs. Real-time monitoring and team collaboration.',
  keywords: ['JetBrains', 'IntelliJ IDEA', 'WebStorm', 'PyCharm', 'PhpStorm', 'webhook testing', 'plugin', 'debugging', 'development tools'],
  openGraph: {
    title: 'JetBrains Plugin | Unhook - Webhook Testing for IntelliJ IDEA & More',
    description: 'Debug webhooks directly in JetBrains IDEs. Native plugin for IntelliJ IDEA, WebStorm, PyCharm, and all JetBrains IDEs.',
    url: '/jetbrains',
  },
  twitter: {
    title: 'JetBrains Plugin | Unhook - Webhook Testing for IntelliJ IDEA & More',
    description: 'Debug webhooks directly in JetBrains IDEs. Native plugin for IntelliJ IDEA, WebStorm, PyCharm, and all JetBrains IDEs.',
  },
};

export default function JetBrainsPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <JetBrainsHeroSection />
        {/* <CompanyShowcase /> */}
        <BentoSection />
        <SharedWebhooksSection />
        <JetBrainsFeaturesSection />
        <AIMCPSection />
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