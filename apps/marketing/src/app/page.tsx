import { Icons } from '@acme/ui/icons'
import { Particles } from '@acme/ui/magicui/particles'
import { SphereMask } from '@acme/ui/magicui/sphere-mask'

import { BentoFeaturesSection } from './_components/bento-features-section'
import { CallToActionSection } from './_components/cta-section'
import { FAQSection } from './_components/faq-section'
import { FeatureSection } from './_components/feature-section/section'
import { FundraiseSection } from './_components/fundraise-section/section'
import {
  HeroBadge,
  HeroCta,
  HeroImage,
  HeroSection,
  HeroSubTitle,
  HeroTitle,
} from './_components/hero-section'
import { IntegrationsSection } from './_components/integrations-section'
import { InvestorNetworkSection } from './_components/investor-network-section'
import { PricingSection } from './_components/pricing-section'
import { TimeSavedSection } from './_components/time-saved-section'

export default function Page() {
  return (
    <main className="mx-auto flex flex-1 flex-col gap-64 overflow-hidden">
      <div>
        <HeroSection>
          <HeroBadge>
            <span>✨ Introducing Pitch Deck Analysis</span>{' '}
            <Icons.ArrowRight
              size="xs"
              className="ml-1 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
            />
          </HeroBadge>
          <HeroTitle>Fundraising on Autopilot</HeroTitle>
          <HeroSubTitle>
            Let AI raise your next round <strong>5x</strong> faster.
          </HeroSubTitle>
          <HeroCta>
            <span className="flex items-center gap-2">
              Finish Your Raise Now
              <Icons.ChevronRight className="ml-1 transition-all duration-300 ease-out group-hover:translate-x-1" />
            </span>
          </HeroCta>
          <HeroImage
            src="/hero-dark.png"
            alt="hero"
            className="hidden dark:block"
          />
          <HeroImage
            src="/hero-light.png"
            alt="hero"
            className="block dark:hidden"
          />
        </HeroSection>
        <TimeSavedSection />
        {/* <ClientSection /> */}
        <SphereMask />
      </div>
      <FeatureSection />
      <BentoFeaturesSection />
      <IntegrationsSection />
      <div>
        <FundraiseSection />
        <SphereMask />
      </div>
      <InvestorNetworkSection />
      <PricingSection />
      <CallToActionSection />
      <FAQSection />
      <Particles
        className="absolute inset-0 -z-10"
        quantity={50}
        ease={70}
        size={0.05}
        staticity={40}
        color={'#ffffff'}
      />
    </main>
  )
}
