import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  title: 'Unhook vs Localtunnel: Professional vs Basic Tunneling | Unhook',
  description: 'Compare Unhook and Localtunnel for webhook testing. See why teams choose Unhook for reliability, team features, and professional webhook development.',
  keywords: ['Unhook vs Localtunnel', 'Localtunnel alternative', 'webhook testing', 'tunneling', 'team collaboration'],
};

const localtunnelComparison = {
  competitor: 'Localtunnel',
  hero: {
    title: 'Unhook vs Localtunnel',
    subtitle: 'Professional Webhook Platform vs Basic Tunneling',
    description: 'While Localtunnel provides basic tunneling, Unhook offers a complete webhook development platform with team collaboration, reliability, and professional features.',
    competitorLogo: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">LT</span>
        </div>
        <span className="font-bold text-lg">Localtunnel</span>
      </div>
    ),
  },
  features: [
    {
      category: 'Reliability & Maintenance',
      items: [
        {
          feature: 'Active development',
          unhook: 'Actively maintained',
          competitor: 'Stagnant (last update 2022)',
          unhookAdvantage: true,
        },
        {
          feature: 'Uptime guarantee',
          unhook: '99.9% SLA available',
          competitor: 'Best effort only',
          unhookAdvantage: true,
        },
        {
          feature: 'Support quality',
          unhook: 'Professional support',
          competitor: 'Community only',
          unhookAdvantage: true,
        },
        {
          feature: 'Infrastructure',
          unhook: 'Enterprise-grade',
          competitor: 'Single server dependency',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Team Features',
      items: [
        {
          feature: 'Team collaboration',
          unhook: 'Built-in team features',
          competitor: 'No team support',
          unhookAdvantage: true,
        },
        {
          feature: 'Shared webhooks',
          unhook: 'Team webhook sharing',
          competitor: 'Individual tunnels only',
          unhookAdvantage: true,
        },
        {
          feature: 'User management',
          unhook: 'Role-based access',
          competitor: 'No user management',
          unhookAdvantage: true,
        },
        {
          feature: 'Team visibility',
          unhook: 'See active team members',
          competitor: 'No team awareness',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Professional Features',
      items: [
        {
          feature: 'Custom domains',
          unhook: 'Full custom domain support',
          competitor: 'No custom domains',
          unhookAdvantage: true,
        },
        {
          feature: 'Authentication',
          unhook: 'Multiple auth methods',
          competitor: 'No authentication',
          unhookAdvantage: true,
        },
        {
          feature: 'Monitoring & analytics',
          unhook: 'Advanced monitoring',
          competitor: 'Basic logging only',
          unhookAdvantage: true,
        },
        {
          feature: 'VS Code integration',
          unhook: 'Native extension',
          competitor: 'CLI only',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Webhook-Specific',
      items: [
        {
          feature: 'Webhook routing',
          unhook: 'Intelligent routing',
          competitor: 'Basic HTTP tunneling',
          unhookAdvantage: true,
        },
        {
          feature: 'Event replay',
          unhook: 'One-click replay',
          competitor: 'No replay features',
          unhookAdvantage: true,
        },
        {
          feature: 'Provider integrations',
          unhook: 'Stripe, GitHub, Clerk ready',
          competitor: 'Generic HTTP only',
          unhookAdvantage: true,
        },
        {
          feature: 'Webhook validation',
          unhook: 'Built-in validation',
          competitor: 'Manual validation',
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
        period: 'forever',
        features: [
          'Basic HTTP tunneling',
          'Random subdomain',
          'No authentication',
          'Community support',
        ],
      },
    ],
  },
  reasons: [
    {
      title: 'Reliability You Can Trust',
      description: 'Unlike Localtunnel\'s aging infrastructure, Unhook provides enterprise-grade reliability with SLA guarantees and active maintenance.',
      icon: '🛡️',
    },
    {
      title: 'Built for Teams',
      description: 'Localtunnel is designed for individual use. Unhook provides the team collaboration features modern development teams need.',
      icon: '👥',
    },
    {
      title: 'Professional Features',
      description: 'Go beyond basic tunneling with custom domains, authentication, monitoring, and VS Code integration.',
      icon: '🏢',
    },
    {
      title: 'Webhook-Focused',
      description: 'Purpose-built for webhook development with intelligent routing, event replay, and provider integrations.',
      icon: '🎯',
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
        <ComparisonFeatures features={localtunnelComparison.features} competitor="Localtunnel" />
        <ComparisonPricing 
          unhookPricing={localtunnelComparison.pricing.unhook}
          competitorPricing={localtunnelComparison.pricing.competitor}
          competitor="Localtunnel"
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Teams Upgrade from Basic Tunneling to Professional Webhook Platforms
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                See why teams are moving from basic tunneling tools to comprehensive webhook development platforms.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {localtunnelComparison.reasons.map((reason, index) => (
                <div key={index} className="bg-card border rounded-lg p-6">
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