import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  description:
    'Compare Unhook and Smee.io for webhook testing. While Smee.io offers basic webhook proxying, Unhook provides team collaboration, VS Code integration, and enterprise features.',
  keywords: [
    'Unhook vs Smee.io',
    'Smee.io alternative',
    'webhook testing',
    'GitHub webhook proxy',
    'team collaboration',
  ],
  title:
    'Unhook vs Smee.io: Professional Webhook Testing vs Basic Proxy | Unhook',
};

const smeeComparison = {
  competitor: 'Smee.io',
  features: [
    {
      category: 'Core Features',
      items: [
        {
          competitor: 'Individual use only',
          feature: 'Team collaboration',
          unhook: 'Full team features',
          unhookAdvantage: true,
        },
        {
          competitor: 'Not available',
          feature: 'VS Code integration',
          unhook: 'Native extension',
          unhookAdvantage: true,
        },
        {
          competitor: 'Manual copy/paste',
          feature: 'Event replay',
          unhook: 'Built-in replay',
          unhookAdvantage: true,
        },
        {
          competitor: 'Not available',
          feature: 'Custom domains',
          unhook: 'Full support',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Webhook Capabilities',
      items: [
        {
          competitor: 'Basic viewing',
          feature: 'Webhook inspection',
          unhook: 'Advanced monitoring',
          unhookAdvantage: true,
        },
        {
          competitor: 'Temporary only',
          feature: 'Request history',
          unhook: 'Persistent storage',
          unhookAdvantage: true,
        },
        {
          competitor: 'Not available',
          feature: 'Response configuration',
          unhook: 'Full control',
          unhookAdvantage: true,
        },
        {
          competitor: 'None',
          feature: 'Authentication',
          unhook: 'Multiple methods',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Reliability & Support',
      items: [
        {
          competitor: 'Best effort',
          feature: 'Uptime guarantee',
          unhook: '99.9% SLA',
          unhookAdvantage: true,
        },
        {
          competitor: 'GitHub issues only',
          feature: 'Support',
          unhook: 'Priority support',
          unhookAdvantage: true,
        },
        {
          competitor: 'Session only',
          feature: 'Data retention',
          unhook: 'Configurable',
          unhookAdvantage: true,
        },
        {
          competitor: 'None',
          feature: 'Enterprise features',
          unhook: 'Full suite',
          unhookAdvantage: true,
        },
      ],
    },
  ],
  hero: {
    competitorLogo: (
      <div className="text-2xl font-bold text-primary">Smee.io</div>
    ),
    description:
      'Smee.io is great for quick GitHub webhook testing, but teams need more. Unhook provides enterprise-grade webhook testing with team collaboration, VS Code integration, and advanced monitoring.',
    subtitle: 'From Basic Proxy to Professional Webhook Testing',
    title: 'Unhook vs Smee.io',
  },
  pricing: {
    competitor: [
      {
        features: [
          'Basic webhook proxying',
          'GitHub integration',
          'Temporary URLs',
          'No authentication',
          'No support',
        ],
        name: 'Free',
        period: 'forever',
        price: '$0',
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
        'While Smee.io offers basic proxying, Unhook provides professional webhook testing with team collaboration, authentication, and enterprise-grade reliability.',
      icon: '🚀',
      title: 'Professional Features',
    },
    {
      description:
        'Share webhook URLs across your team with a config file in your repo. No more individual testing silos.',
      icon: '👥',
      title: 'Team Collaboration',
    },
    {
      description:
        'Test and debug webhooks without leaving your editor. See events in real-time and replay with one click.',
      icon: '💻',
      title: 'VS Code Integration',
    },
    {
      description:
        'Get 99.9% uptime SLA, priority support, and enterprise features when you need them.',
      icon: '🛡️',
      title: 'Reliable Infrastructure',
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
          competitor="Smee.io"
          features={smeeComparison.features}
        />
        <ComparisonPricing
          competitor="Smee.io"
          competitorPricing={smeeComparison.pricing.competitor}
          unhookPricing={smeeComparison.pricing.unhook}
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
          competitor="Smee.io"
          ctaText="Upgrade from Smee.io to Unhook"
          description="Join professional teams using Unhook for enterprise-grade webhook testing."
        />
        <FooterSection />
      </main>
    </div>
  );
}
