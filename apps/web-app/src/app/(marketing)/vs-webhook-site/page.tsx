import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';

export const metadata = {
  description:
    'Compare Unhook and Webhook.site for webhook testing. See why teams choose Unhook for better collaboration, VS Code integration, and professional features.',
  keywords: [
    'Unhook vs webhook.site',
    'webhook.site alternative',
    'webhook testing',
    'team collaboration',
    'professional webhook tools',
  ],
  title: 'Unhook vs Webhook.site: Professional Webhook Testing | Unhook',
};

const webhookSiteComparison = {
  competitor: 'Webhook.site',
  features: [
    {
      category: 'Team Collaboration',
      items: [
        {
          competitor: 'Individual URLs only',
          feature: 'Team webhook sharing',
          unhook: 'One URL for entire team + config file',
          unhookAdvantage: true,
        },
        {
          competitor: 'No user management',
          feature: 'User management',
          unhook: 'Role-based access control',
          unhookAdvantage: true,
        },
        {
          competitor: 'No team features',
          feature: 'Team visibility',
          unhook: 'See active team members',
          unhookAdvantage: true,
        },
        {
          competitor: 'Individual debugging',
          feature: 'Collaborative debugging',
          unhook: 'Share and replay events',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Developer Experience',
      items: [
        {
          competitor: 'Web-only interface',
          feature: 'VS Code integration',
          unhook: 'Native extension',
          unhookAdvantage: true,
        },
        {
          competitor: 'Manual replay',
          feature: 'Event replay',
          unhook: 'One-click replay',
          unhookAdvantage: true,
        },
        {
          competitor: 'Web dashboard only',
          feature: 'Real-time monitoring',
          unhook: 'Built into editor',
          unhookAdvantage: true,
        },
        {
          competitor: 'Public URLs only',
          feature: 'Local routing',
          unhook: 'Intelligent routing',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Professional Features',
      items: [
        {
          competitor: 'Premium feature',
          feature: 'Custom domains',
          unhook: 'Included in team plan',
          unhookAdvantage: true,
        },
        {
          competitor: 'Limited retention',
          feature: 'Data retention',
          unhook: 'Configurable retention',
          unhookAdvantage: true,
        },
        {
          competitor: 'Basic API',
          feature: 'API access',
          unhook: 'Full REST API',
          unhookAdvantage: true,
        },
        {
          competitor: 'Manual workflows',
          feature: 'Workflow automation',
          unhook: 'Built-in automations',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Security & Reliability',
      items: [
        {
          competitor: '✓',
          feature: 'End-to-end encryption',
          unhook: '✓',
          unhookAdvantage: false,
        },
        {
          competitor: 'Basic auth',
          feature: 'Authentication methods',
          unhook: 'Multiple auth options',
          unhookAdvantage: true,
        },
        {
          competitor: 'Basic security',
          feature: 'Enterprise security',
          unhook: 'SOC2, HIPAA ready',
          unhookAdvantage: true,
        },
        {
          competitor: 'Best effort',
          feature: 'SLA guarantees',
          unhook: '99.9% uptime SLA',
          unhookAdvantage: true,
        },
      ],
    },
  ],
  hero: {
    competitorLogo: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">W</span>
        </div>
        <span className="font-bold text-lg">Webhook.site</span>
      </div>
    ),
    description:
      'While Webhook.site is great for quick testing, Unhook provides the professional features teams need. Compare capabilities and see why teams choose Unhook for serious webhook development.',
    subtitle: 'Professional Webhook Testing for Development Teams',
    title: 'Unhook vs Webhook.site',
  },
  pricing: {
    competitor: [
      {
        features: [
          'Unlimited requests',
          'Basic webhook testing',
          'Limited data retention',
          'Community support',
        ],
        name: 'Free',
        period: 'month',
        price: '$0',
      },
      {
        features: [
          'All free features',
          'Custom domains',
          'Extended data retention',
          'Advanced workflows',
          'Priority support',
        ],
        name: 'Premium',
        period: 'month',
        price: '$7.5',
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
          'Custom domains included',
          'Advanced monitoring',
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
          'Enterprise security',
          'SLA support',
          'Dedicated account manager',
          'Custom integrations',
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
        "Unlike Webhook.site's individual focus, Unhook provides one shared webhook URL for your entire team with a config file that lives in your repo. New team members get instant access.",
      icon: '👥',
      title: 'Team-First Design',
    },
    {
      description:
        'Debug webhooks without leaving VS Code. Our native extension brings webhook monitoring directly into your development environment.',
      icon: '💻',
      title: 'Editor Integration',
    },
    {
      description:
        'Get enterprise-grade features like custom domains, advanced security, and SLA guarantees that Webhook.site lacks.',
      icon: '🏢',
      title: 'Professional Features',
    },
    {
      description:
        'More features for less money. Our team plan includes everything you need without nickel-and-diming for basic features.',
      icon: '💰',
      title: 'Better Value',
    },
  ],
};

export default function UnhookVsWebhookSitePage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <ComparisonHero {...webhookSiteComparison.hero} />
        <ComparisonFeatures
          competitor="Webhook.site"
          features={webhookSiteComparison.features}
        />
        <ComparisonPricing
          competitor="Webhook.site"
          competitorPricing={webhookSiteComparison.pricing.competitor}
          unhookPricing={webhookSiteComparison.pricing.unhook}
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
          competitor="Webhook.site"
          ctaText="Upgrade from Webhook.site"
          description="Join teams who've upgraded from basic webhook testing to professional webhook development."
        />
        <FooterSection />
      </main>
    </div>
  );
}
