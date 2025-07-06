import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  title: 'Unhook vs Hookdeck: Webhook Testing vs Event Gateway | Unhook',
  description:
    'Compare Unhook and Hookdeck for webhook development. While Hookdeck offers an event gateway, Unhook provides team-focused webhook testing with VS Code integration.',
  keywords: [
    'Unhook vs Hookdeck',
    'Hookdeck alternative',
    'webhook testing',
    'event gateway',
    'team collaboration',
  ],
};

const hookdeckComparison = {
  competitor: 'Hookdeck',
  hero: {
    title: 'Unhook vs Hookdeck',
    subtitle: 'Simple Webhook Testing vs Complex Event Gateway',
    description:
      'Hookdeck provides a powerful event gateway for production workloads. Unhook focuses on making webhook development and testing simple with team collaboration and VS Code integration.',
    competitorLogo: (
      <div className="text-2xl font-bold text-blue-600">Hookdeck</div>
    ),
  },
  features: [
    {
      category: 'Core Focus',
      items: [
        {
          feature: 'Primary use case',
          unhook: 'Webhook development & testing',
          competitor: 'Production event gateway',
          unhookAdvantage: true,
        },
        {
          feature: 'Setup complexity',
          unhook: 'Minutes to start',
          competitor: 'Requires configuration',
          unhookAdvantage: true,
        },
        {
          feature: 'VS Code integration',
          unhook: 'Native extension',
          competitor: 'Not available',
          unhookAdvantage: true,
        },
        {
          feature: 'Learning curve',
          unhook: 'Minimal',
          competitor: 'Moderate to steep',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Team Features',
      items: [
        {
          feature: 'Shared webhook URLs',
          unhook: 'One URL for team',
          competitor: 'Individual endpoints',
          unhookAdvantage: true,
        },
        {
          feature: 'Config file sharing',
          unhook: 'In your repo',
          competitor: 'Dashboard config',
          unhookAdvantage: true,
        },
        {
          feature: 'Collaborative debugging',
          unhook: 'Built for teams',
          competitor: 'Individual focus',
          unhookAdvantage: true,
        },
        {
          feature: 'Team management',
          unhook: 'Simple roles',
          competitor: 'Complex permissions',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Production Features',
      items: [
        {
          feature: 'Event queuing',
          unhook: 'Basic retry',
          competitor: 'Advanced queuing',
          unhookAdvantage: false,
        },
        {
          feature: 'Rate limiting',
          unhook: 'Standard',
          competitor: 'Configurable',
          unhookAdvantage: false,
        },
        {
          feature: 'Event transformation',
          unhook: 'Basic',
          competitor: 'Advanced routing',
          unhookAdvantage: false,
        },
        {
          feature: 'Production scale',
          unhook: 'Development focused',
          competitor: 'Production ready',
          unhookAdvantage: false,
        },
      ],
    },
    {
      category: 'Developer Experience',
      items: [
        {
          feature: 'Local development',
          unhook: 'Optimized for local',
          competitor: 'Production oriented',
          unhookAdvantage: true,
        },
        {
          feature: 'Event replay',
          unhook: 'One-click in editor',
          competitor: 'Dashboard based',
          unhookAdvantage: true,
        },
        {
          feature: 'Documentation',
          unhook: 'Simple & clear',
          competitor: 'Comprehensive but complex',
          unhookAdvantage: true,
        },
        {
          feature: 'Getting started',
          unhook: 'Instant',
          competitor: 'Requires planning',
          unhookAdvantage: true,
        },
      ],
    },
  ],
  pricing: {
    unhook: [
      {
        name: 'Free',
        price: '$0',
        period: 'forever',
        features: [
          'Unlimited local testing',
          'Basic webhook monitoring',
          'Single developer',
          'Community support',
        ],
      },
      {
        name: 'Team',
        price: '$29',
        period: 'month',
        features: [
          'Everything in Free',
          'Team webhook sharing',
          'VS Code integration',
          'Advanced monitoring',
          'Custom domains',
          'Priority support',
        ],
        popular: true,
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        period: 'month',
        features: [
          'Everything in Team',
          'Self-hosting option',
          'Advanced security',
          'SLA support',
          'Dedicated account manager',
        ],
      },
    ],
    competitor: [
      {
        name: 'Free',
        price: '$0',
        period: 'month',
        features: [
          '100K requests/month',
          'Basic features',
          '3 team members',
          'Community support',
        ],
      },
      {
        name: 'Team',
        price: '$49',
        period: 'month',
        features: [
          '1M requests/month',
          'Advanced routing',
          'Unlimited team members',
          'Email support',
        ],
      },
      {
        name: 'Growth',
        price: '$299',
        period: 'month',
        features: [
          '10M requests/month',
          'Priority queuing',
          'Custom retention',
          'Priority support',
        ],
      },
    ],
  },
  reasons: [
    {
      title: 'Built for Development',
      description:
        'While Hookdeck focuses on production event infrastructure, Unhook is optimized for the development and testing phase where you spend most of your time.',
      icon: '🛠️',
    },
    {
      title: 'Team Collaboration',
      description:
        'One shared webhook URL for your entire team with a config file that lives in your repo. No more hunting for the right endpoint.',
      icon: '👥',
    },
    {
      title: 'VS Code Native',
      description:
        'Debug webhooks without leaving your editor. See events in real-time and replay with one click.',
      icon: '💻',
    },
    {
      title: 'Simple Pricing',
      description:
        'Straightforward pricing focused on teams, not request volume. Perfect for development workflows.',
      icon: '💰',
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
          features={hookdeckComparison.features}
          competitor="Hookdeck"
        />
        <ComparisonPricing
          unhookPricing={hookdeckComparison.pricing.unhook}
          competitorPricing={hookdeckComparison.pricing.competitor}
          competitor="Hookdeck"
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
                  key={reason.title}
                  className="bg-card border rounded-lg p-6"
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
