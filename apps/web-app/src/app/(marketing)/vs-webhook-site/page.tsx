import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  title: 'Unhook vs Webhook.site: Professional Webhook Testing | Unhook',
  description:
    'Compare Unhook and Webhook.site for webhook testing. See why teams choose Unhook for better collaboration, VS Code integration, and professional features.',
  keywords: [
    'Unhook vs webhook.site',
    'webhook.site alternative',
    'webhook testing',
    'team collaboration',
    'professional webhook tools',
  ],
};

const webhookSiteComparison = {
  competitor: 'Webhook.site',
  hero: {
    title: 'Unhook vs Webhook.site',
    subtitle: 'Professional Webhook Testing for Development Teams',
    description:
      'While Webhook.site is great for quick testing, Unhook provides the professional features teams need. Compare capabilities and see why teams choose Unhook for serious webhook development.',
    competitorLogo: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">W</span>
        </div>
        <span className="font-bold text-lg">Webhook.site</span>
      </div>
    ),
  },
  features: [
    {
      category: 'Team Collaboration',
      items: [
        {
          feature: 'Team webhook sharing',
          unhook: 'One URL for entire team + config file',
          competitor: 'Individual URLs only',
          unhookAdvantage: true,
        },
        {
          feature: 'User management',
          unhook: 'Role-based access control',
          competitor: 'No user management',
          unhookAdvantage: true,
        },
        {
          feature: 'Team visibility',
          unhook: 'See active team members',
          competitor: 'No team features',
          unhookAdvantage: true,
        },
        {
          feature: 'Collaborative debugging',
          unhook: 'Share and replay events',
          competitor: 'Individual debugging',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Developer Experience',
      items: [
        {
          feature: 'VS Code integration',
          unhook: 'Native extension',
          competitor: 'Web-only interface',
          unhookAdvantage: true,
        },
        {
          feature: 'Event replay',
          unhook: 'One-click replay',
          competitor: 'Manual replay',
          unhookAdvantage: true,
        },
        {
          feature: 'Real-time monitoring',
          unhook: 'Built into editor',
          competitor: 'Web dashboard only',
          unhookAdvantage: true,
        },
        {
          feature: 'Local routing',
          unhook: 'Intelligent routing',
          competitor: 'Public URLs only',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Professional Features',
      items: [
        {
          feature: 'Custom domains',
          unhook: 'Included in team plan',
          competitor: 'Premium feature',
          unhookAdvantage: true,
        },
        {
          feature: 'Data retention',
          unhook: 'Configurable retention',
          competitor: 'Limited retention',
          unhookAdvantage: true,
        },
        {
          feature: 'API access',
          unhook: 'Full REST API',
          competitor: 'Basic API',
          unhookAdvantage: true,
        },
        {
          feature: 'Workflow automation',
          unhook: 'Built-in automations',
          competitor: 'Manual workflows',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Security & Reliability',
      items: [
        {
          feature: 'End-to-end encryption',
          unhook: '✓',
          competitor: '✓',
          unhookAdvantage: false,
        },
        {
          feature: 'Authentication methods',
          unhook: 'Multiple auth options',
          competitor: 'Basic auth',
          unhookAdvantage: true,
        },
        {
          feature: 'Enterprise security',
          unhook: 'SOC2, HIPAA ready',
          competitor: 'Basic security',
          unhookAdvantage: true,
        },
        {
          feature: 'SLA guarantees',
          unhook: '99.9% uptime SLA',
          competitor: 'Best effort',
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
          'Custom domains included',
          'Advanced monitoring',
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
          'Enterprise security',
          'SLA support',
          'Dedicated account manager',
          'Custom integrations',
        ],
      },
    ],
    competitor: [
      {
        name: 'Free',
        price: '$0',
        period: 'month',
        features: [
          'Unlimited requests',
          'Basic webhook testing',
          'Limited data retention',
          'Community support',
        ],
      },
      {
        name: 'Premium',
        price: '$7.5',
        period: 'month',
        features: [
          'All free features',
          'Custom domains',
          'Extended data retention',
          'Advanced workflows',
          'Priority support',
        ],
      },
    ],
  },
  reasons: [
    {
      title: 'Team-First Design',
      description:
        "Unlike Webhook.site's individual focus, Unhook provides one shared webhook URL for your entire team with a config file that lives in your repo. New team members get instant access.",
      icon: '👥',
    },
    {
      title: 'Editor Integration',
      description:
        'Debug webhooks without leaving VS Code. Our native extension brings webhook monitoring directly into your development environment.',
      icon: '💻',
    },
    {
      title: 'Professional Features',
      description:
        'Get enterprise-grade features like custom domains, advanced security, and SLA guarantees that Webhook.site lacks.',
      icon: '🏢',
    },
    {
      title: 'Better Value',
      description:
        'More features for less money. Our team plan includes everything you need without nickel-and-diming for basic features.',
      icon: '💰',
    },
  ],
};

export default function UnhookVsWebhookSitePage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <ComparisonHero {...webhookSiteComparison.hero} />
        <ComparisonFeatures
          features={webhookSiteComparison.features}
          competitor="Webhook.site"
        />
        <ComparisonPricing
          unhookPricing={webhookSiteComparison.pricing.unhook}
          competitorPricing={webhookSiteComparison.pricing.competitor}
          competitor="Webhook.site"
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Teams Upgrade from Webhook.site to Unhook
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                See why development teams are moving from basic webhook testing
                to professional webhook development.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {webhookSiteComparison.reasons.map((reason) => (
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
          competitor="Webhook.site"
          ctaText="Upgrade from Webhook.site"
          description="Join teams who've upgraded from basic webhook testing to professional webhook development."
        />
        <FooterSection />
      </main>
    </div>
  );
}
