import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  title:
    'Unhook vs Smee.io: Professional Webhook Testing vs Basic Proxy | Unhook',
  description:
    'Compare Unhook and Smee.io for webhook testing. While Smee.io offers basic webhook proxying, Unhook provides team collaboration, VS Code integration, and enterprise features.',
  keywords: [
    'Unhook vs Smee.io',
    'Smee.io alternative',
    'webhook testing',
    'GitHub webhook proxy',
    'team collaboration',
  ],
};

const smeeComparison = {
  competitor: 'Smee.io',
  hero: {
    title: 'Unhook vs Smee.io',
    subtitle: 'From Basic Proxy to Professional Webhook Testing',
    description:
      'Smee.io is great for quick GitHub webhook testing, but teams need more. Unhook provides enterprise-grade webhook testing with team collaboration, VS Code integration, and advanced monitoring.',
    competitorLogo: (
      <div className="text-2xl font-bold text-primary">Smee.io</div>
    ),
  },
  features: [
    {
      category: 'Core Features',
      items: [
        {
          feature: 'Team collaboration',
          unhook: 'Full team features',
          competitor: 'Individual use only',
          unhookAdvantage: true,
        },
        {
          feature: 'VS Code integration',
          unhook: 'Native extension',
          competitor: 'Not available',
          unhookAdvantage: true,
        },
        {
          feature: 'Event replay',
          unhook: 'Built-in replay',
          competitor: 'Manual copy/paste',
          unhookAdvantage: true,
        },
        {
          feature: 'Custom domains',
          unhook: 'Full support',
          competitor: 'Not available',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Webhook Capabilities',
      items: [
        {
          feature: 'Webhook inspection',
          unhook: 'Advanced monitoring',
          competitor: 'Basic viewing',
          unhookAdvantage: true,
        },
        {
          feature: 'Request history',
          unhook: 'Persistent storage',
          competitor: 'Temporary only',
          unhookAdvantage: true,
        },
        {
          feature: 'Response configuration',
          unhook: 'Full control',
          competitor: 'Not available',
          unhookAdvantage: true,
        },
        {
          feature: 'Authentication',
          unhook: 'Multiple methods',
          competitor: 'None',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Reliability & Support',
      items: [
        {
          feature: 'Uptime guarantee',
          unhook: '99.9% SLA',
          competitor: 'Best effort',
          unhookAdvantage: true,
        },
        {
          feature: 'Support',
          unhook: 'Priority support',
          competitor: 'GitHub issues only',
          unhookAdvantage: true,
        },
        {
          feature: 'Data retention',
          unhook: 'Configurable',
          competitor: 'Session only',
          unhookAdvantage: true,
        },
        {
          feature: 'Enterprise features',
          unhook: 'Full suite',
          competitor: 'None',
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
        period: 'forever',
        features: [
          'Basic webhook proxying',
          'GitHub integration',
          'Temporary URLs',
          'No authentication',
          'No support',
        ],
      },
    ],
  },
  reasons: [
    {
      title: 'Professional Features',
      description:
        'While Smee.io offers basic proxying, Unhook provides professional webhook testing with team collaboration, authentication, and enterprise-grade reliability.',
      icon: '🚀',
    },
    {
      title: 'Team Collaboration',
      description:
        'Share webhook URLs across your team with a config file in your repo. No more individual testing silos.',
      icon: '👥',
    },
    {
      title: 'VS Code Integration',
      description:
        'Test and debug webhooks without leaving your editor. See events in real-time and replay with one click.',
      icon: '💻',
    },
    {
      title: 'Reliable Infrastructure',
      description:
        'Get 99.9% uptime SLA, priority support, and enterprise features when you need them.',
      icon: '🛡️',
    },
  ],
};

export default function UnhookVsSmeePage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <ComparisonHero {...smeeComparison.hero} />
        <ComparisonFeatures
          features={smeeComparison.features}
          competitor="Smee.io"
        />
        <ComparisonPricing
          unhookPricing={smeeComparison.pricing.unhook}
          competitorPricing={smeeComparison.pricing.competitor}
          competitor="Smee.io"
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Teams Choose Unhook Over Smee.io
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Smee.io is great for quick tests, but professional teams need
                more than basic proxying.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {smeeComparison.reasons.map((reason) => (
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
          competitor="Smee.io"
          ctaText="Upgrade from Smee.io to Unhook"
          description="Join professional teams using Unhook for enterprise-grade webhook testing."
        />
        <FooterSection />
      </main>
    </div>
  );
}
