import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';

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
      <Navbar />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="md:col-span-2 lg:col-span-2">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-8 h-full relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl opacity-20">
                    🛡️
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-6">🛡️</div>
                    <h3 className="text-2xl font-bold mb-4 text-emerald-900 dark:text-emerald-100">
                      Reliability You Can Trust
                    </h3>
                    <p className="text-emerald-800 dark:text-emerald-200 text-lg leading-relaxed">
                      Unlike Localtunnel's aging infrastructure, Unhook provides
                      enterprise-grade reliability with SLA guarantees and
                      active maintenance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 h-full relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl opacity-20">
                    👥
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-6">👥</div>
                    <h3 className="text-2xl font-bold mb-4 text-blue-900 dark:text-blue-100">
                      Built for Teams
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 text-lg leading-relaxed">
                      Localtunnel creates individual tunnels. Unhook provides
                      one shared webhook URL for your entire team with a config
                      file that lives in your repo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/20 dark:to-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-8 h-full relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl opacity-20">
                    🏢
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-6">🏢</div>
                    <h3 className="text-2xl font-bold mb-4 text-violet-900 dark:text-violet-100">
                      Professional Features
                    </h3>
                    <p className="text-violet-800 dark:text-violet-200 text-lg leading-relaxed">
                      Go beyond basic tunneling with custom domains,
                      authentication, monitoring, and VS Code integration.
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-2">
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/20 dark:to-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-8 h-full relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl opacity-20">
                    🎯
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-6">🎯</div>
                    <h3 className="text-2xl font-bold mb-4 text-rose-900 dark:text-rose-100">
                      Webhook-Focused
                    </h3>
                    <p className="text-rose-800 dark:text-rose-200 text-lg leading-relaxed">
                      Purpose-built for webhook development with intelligent
                      routing, event replay, and provider integrations.
                    </p>
                  </div>
                </div>
              </div>
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
