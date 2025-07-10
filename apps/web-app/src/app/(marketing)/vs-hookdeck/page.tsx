import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  description:
    'Compare Unhook and Hookdeck for webhook development. While Hookdeck offers an event gateway, Unhook provides team-focused webhook testing with VS Code integration.',
  keywords: [
    'Unhook vs Hookdeck',
    'Hookdeck alternative',
    'webhook testing',
    'event gateway',
    'team collaboration',
  ],
  title: 'Unhook vs Hookdeck: Webhook Testing vs Event Gateway | Unhook',
};

const hookdeckComparison = {
  competitor: 'Hookdeck',
  features: [
    {
      category: 'Core Focus',
      items: [
        {
          competitor: 'Production event gateway',
          feature: 'Primary use case',
          unhook: 'Webhook development & testing',
          unhookAdvantage: true,
        },
        {
          competitor: 'Requires configuration',
          feature: 'Setup complexity',
          unhook: 'Minutes to start',
          unhookAdvantage: true,
        },
        {
          competitor: 'Not available',
          feature: 'VS Code integration',
          unhook: 'Native extension',
          unhookAdvantage: true,
        },
        {
          competitor: 'Moderate to steep',
          feature: 'Learning curve',
          unhook: 'Minimal',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Team Features',
      items: [
        {
          competitor: 'Individual endpoints',
          feature: 'Shared webhook URLs',
          unhook: 'One URL for team',
          unhookAdvantage: true,
        },
        {
          competitor: 'Dashboard config',
          feature: 'Config file sharing',
          unhook: 'In your repo',
          unhookAdvantage: true,
        },
        {
          competitor: 'Individual focus',
          feature: 'Collaborative debugging',
          unhook: 'Built for teams',
          unhookAdvantage: true,
        },
        {
          competitor: 'Complex permissions',
          feature: 'Team management',
          unhook: 'Simple roles',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Production Features',
      items: [
        {
          competitor: 'Advanced queuing',
          feature: 'Event queuing',
          unhook: 'Basic retry',
          unhookAdvantage: false,
        },
        {
          competitor: 'Configurable',
          feature: 'Rate limiting',
          unhook: 'Standard',
          unhookAdvantage: false,
        },
        {
          competitor: 'Advanced routing',
          feature: 'Event transformation',
          unhook: 'Basic',
          unhookAdvantage: false,
        },
        {
          competitor: 'Production ready',
          feature: 'Production scale',
          unhook: 'Development focused',
          unhookAdvantage: false,
        },
      ],
    },
    {
      category: 'Developer Experience',
      items: [
        {
          competitor: 'Production oriented',
          feature: 'Local development',
          unhook: 'Optimized for local',
          unhookAdvantage: true,
        },
        {
          competitor: 'Dashboard based',
          feature: 'Event replay',
          unhook: 'One-click in editor',
          unhookAdvantage: true,
        },
        {
          competitor: 'Comprehensive but complex',
          feature: 'Documentation',
          unhook: 'Simple & clear',
          unhookAdvantage: true,
        },
        {
          competitor: 'Requires planning',
          feature: 'Getting started',
          unhook: 'Instant',
          unhookAdvantage: true,
        },
      ],
    },
  ],
  hero: {
    competitorLogo: (
      <div className="text-2xl font-bold text-blue-600">Hookdeck</div>
    ),
    description:
      'Hookdeck provides a powerful event gateway for production workloads. Unhook focuses on making webhook development and testing simple with team collaboration and VS Code integration.',
    subtitle: 'Simple Webhook Testing vs Complex Event Gateway',
    title: 'Unhook vs Hookdeck',
  },
  pricing: {
    competitor: [
      {
        features: [
          '100K requests/month',
          'Basic features',
          '3 team members',
          'Community support',
        ],
        name: 'Free',
        period: 'month',
        price: '$0',
      },
      {
        features: [
          '1M requests/month',
          'Advanced routing',
          'Unlimited team members',
          'Email support',
        ],
        name: 'Team',
        period: 'month',
        price: '$49',
      },
      {
        features: [
          '10M requests/month',
          'Priority queuing',
          'Custom retention',
          'Priority support',
        ],
        name: 'Growth',
        period: 'month',
        price: '$299',
      },
    ],
    unhook: [
      {
        features: [
          'Unlimited local testing',
          'Basic webhook monitoring',
          'Single developer',
          'Community support',
        ],
        name: 'Free',
        period: 'forever',
        price: '$0',
      },
      {
        features: [
          'Everything in Free',
          'Team webhook sharing',
          'VS Code integration',
          'Advanced monitoring',
          'Custom domains',
          'Priority support',
        ],
        name: 'Team',
        period: 'month',
        popular: true,
        price: '$29',
      },
      {
        features: [
          'Everything in Team',
          'Self-hosting option',
          'Advanced security',
          'SLA support',
          'Dedicated account manager',
        ],
        name: 'Enterprise',
        period: 'month',
        price: 'Custom',
      },
    ],
  },
  reasons: [
    {
      description:
        'While Hookdeck focuses on production event infrastructure, Unhook is optimized for the development and testing phase where you spend most of your time.',
      icon: '🛠️',
      title: 'Built for Development',
    },
    {
      description:
        'One shared webhook URL for your entire team with a config file that lives in your repo. No more hunting for the right endpoint.',
      icon: '👥',
      title: 'Team Collaboration',
    },
    {
      description:
        'Debug webhooks without leaving your editor. See events in real-time and replay with one click.',
      icon: '💻',
      title: 'VS Code Native',
    },
    {
      description:
        'Straightforward pricing focused on teams, not request volume. Perfect for development workflows.',
      icon: '💰',
      title: 'Simple Pricing',
    },
  ],
};

export default function UnhookVsHookdeckPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <ComparisonHero {...hookdeckComparison.hero} />
        <ComparisonFeatures
          competitor="Hookdeck"
          features={hookdeckComparison.features}
        />
        <ComparisonPricing
          competitor="Hookdeck"
          competitorPricing={hookdeckComparison.pricing.competitor}
          unhookPricing={hookdeckComparison.pricing.unhook}
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Development Teams Choose Unhook
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Hookdeck is great for production events, but Unhook is designed
                for where you spend 90% of your time: development and testing.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {hookdeckComparison.reasons.map((reason) => (
                <div
                  className="bg-card border rounded-lg p-6"
                  key={reason.title}
                >
                  <div className="text-4xl mb-4">{reason.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">{reason.title}</h3>
                  <p className="text-muted-foreground">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <ComparisonCTA
          competitor="Hookdeck"
          ctaText="Try Unhook for Development"
          description="Experience webhook testing designed for development teams."
        />
        <FooterSection />
      </main>
    </div>
  );
}
