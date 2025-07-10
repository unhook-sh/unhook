import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  description:
    'Compare Unhook and Localtunnel for webhook testing. See why teams choose Unhook for reliability, team features, and professional webhook development.',
  keywords: [
    'Unhook vs Localtunnel',
    'Localtunnel alternative',
    'webhook testing',
    'tunneling',
    'team collaboration',
  ],
  title: 'Unhook vs Localtunnel: Professional vs Basic Tunneling | Unhook',
};

const localtunnelComparison = {
  competitor: 'Localtunnel',
  features: [
    {
      category: 'Reliability & Maintenance',
      items: [
        {
          competitor: 'Stagnant (last update 2022)',
          feature: 'Active development',
          unhook: 'Actively maintained',
          unhookAdvantage: true,
        },
        {
          competitor: 'Best effort only',
          feature: 'Uptime guarantee',
          unhook: '99.9% SLA available',
          unhookAdvantage: true,
        },
        {
          competitor: 'Community only',
          feature: 'Support quality',
          unhook: 'Professional support',
          unhookAdvantage: true,
        },
        {
          competitor: 'Single server dependency',
          feature: 'Infrastructure',
          unhook: 'Enterprise-grade',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Team Features',
      items: [
        {
          competitor: 'No team support',
          feature: 'Team collaboration',
          unhook: 'Built-in team features',
          unhookAdvantage: true,
        },
        {
          competitor: 'Individual tunnels only',
          feature: 'Shared webhooks',
          unhook: 'One URL for entire team + config file',
          unhookAdvantage: true,
        },
        {
          competitor: 'No user management',
          feature: 'User management',
          unhook: 'Role-based access',
          unhookAdvantage: true,
        },
        {
          competitor: 'No team awareness',
          feature: 'Team visibility',
          unhook: 'See active team members',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Professional Features',
      items: [
        {
          competitor: 'No custom domains',
          feature: 'Custom domains',
          unhook: 'Full custom domain support',
          unhookAdvantage: true,
        },
        {
          competitor: 'No authentication',
          feature: 'Authentication',
          unhook: 'Multiple auth methods',
          unhookAdvantage: true,
        },
        {
          competitor: 'Basic logging only',
          feature: 'Monitoring & analytics',
          unhook: 'Advanced monitoring',
          unhookAdvantage: true,
        },
        {
          competitor: 'CLI only',
          feature: 'VS Code integration',
          unhook: 'Native extension',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Webhook-Specific',
      items: [
        {
          competitor: 'Basic HTTP tunneling',
          feature: 'Webhook routing',
          unhook: 'Intelligent routing',
          unhookAdvantage: true,
        },
        {
          competitor: 'No replay features',
          feature: 'Event replay',
          unhook: 'One-click replay',
          unhookAdvantage: true,
        },
        {
          competitor: 'Generic HTTP only',
          feature: 'Provider integrations',
          unhook: 'Stripe, GitHub, Clerk ready',
          unhookAdvantage: true,
        },
        {
          competitor: 'Manual validation',
          feature: 'Webhook validation',
          unhook: 'Built-in validation',
          unhookAdvantage: true,
        },
      ],
    },
  ],
  hero: {
    competitorLogo: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">LT</span>
        </div>
        <span className="font-bold text-lg">Localtunnel</span>
      </div>
    ),
    description:
      'While Localtunnel provides basic tunneling, Unhook offers a complete webhook development platform with team collaboration, reliability, and professional features.',
    subtitle: 'Professional Webhook Platform vs Basic Tunneling',
    title: 'Unhook vs Localtunnel',
  },
  pricing: {
    competitor: [
      {
        features: [
          'Basic HTTP tunneling',
          'Random subdomain',
          'No authentication',
          'Community support',
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
        "Unlike Localtunnel's aging infrastructure, Unhook provides enterprise-grade reliability with SLA guarantees and active maintenance.",
      icon: '🛡️',
      title: 'Reliability You Can Trust',
    },
    {
      description:
        'Localtunnel creates individual tunnels. Unhook provides one shared webhook URL for your entire team with a config file that lives in your repo.',
      icon: '👥',
      title: 'Built for Teams',
    },
    {
      description:
        'Go beyond basic tunneling with custom domains, authentication, monitoring, and VS Code integration.',
      icon: '🏢',
      title: 'Professional Features',
    },
    {
      description:
        'Purpose-built for webhook development with intelligent routing, event replay, and provider integrations.',
      icon: '🎯',
      title: 'Webhook-Focused',
    },
  ],
};

export default function UnhookVsLocaltunnelPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <ComparisonHero {...localtunnelComparison.hero} />
        <ComparisonFeatures
          competitor="Localtunnel"
          features={localtunnelComparison.features}
        />
        <ComparisonPricing
          competitor="Localtunnel"
          competitorPricing={localtunnelComparison.pricing.competitor}
          unhookPricing={localtunnelComparison.pricing.unhook}
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Teams Upgrade from Basic Tunneling to Professional Webhook
                Platforms
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                See why teams are moving from basic tunneling tools to
                comprehensive webhook development platforms.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {localtunnelComparison.reasons.map((reason) => (
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
          competitor="Localtunnel"
          ctaText="Upgrade to Professional Webhook Platform"
          description="Join teams who've upgraded from basic tunneling to comprehensive webhook development."
        />
        <FooterSection />
      </main>
    </div>
  );
}
