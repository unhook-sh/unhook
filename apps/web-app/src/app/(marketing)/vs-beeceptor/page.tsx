import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  description:
    'Compare Unhook and Beeceptor for webhook testing. See why teams choose Unhook for better collaboration, VS Code integration, and team-focused features.',
  keywords: [
    'Unhook vs Beeceptor',
    'Beeceptor alternative',
    'webhook testing',
    'API mocking',
    'team collaboration',
  ],
  title: 'Unhook vs Beeceptor: Better Webhook Testing for Teams | Unhook',
};

const beeceptorComparison = {
  competitor: 'Beeceptor',
  features: [
    {
      category: 'Webhook-Specific Features',
      items: [
        {
          competitor: 'Basic HTTP endpoints',
          feature: 'Webhook routing',
          unhook: 'Intelligent team routing',
          unhookAdvantage: true,
        },
        {
          competitor: 'Manual request replay',
          feature: 'Event replay',
          unhook: 'One-click webhook replay',
          unhookAdvantage: true,
        },
        {
          competitor: 'Generic HTTP handling',
          feature: 'Provider integrations',
          unhook: 'Stripe, GitHub, Clerk ready',
          unhookAdvantage: true,
        },
        {
          competitor: 'Manual validation',
          feature: 'Webhook validation',
          unhook: 'Built-in signature validation',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Team Collaboration',
      items: [
        {
          competitor: 'Individual endpoints',
          feature: 'Team webhook sharing',
          unhook: 'One URL for entire team + config file',
          unhookAdvantage: true,
        },
        {
          competitor: 'Individual debugging',
          feature: 'Collaborative debugging',
          unhook: 'Share events & insights',
          unhookAdvantage: true,
        },
        {
          competitor: 'No team features',
          feature: 'Team management',
          unhook: 'Role-based access',
          unhookAdvantage: true,
        },
        {
          competitor: 'No team visibility',
          feature: 'Activity visibility',
          unhook: 'See active team members',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Developer Experience',
      items: [
        {
          competitor: 'Web dashboard only',
          feature: 'VS Code integration',
          unhook: 'Native extension',
          unhookAdvantage: true,
        },
        {
          competitor: 'Tunnel setup required',
          feature: 'Local development',
          unhook: 'Seamless local routing',
          unhookAdvantage: true,
        },
        {
          competitor: 'Web interface only',
          feature: 'Real-time monitoring',
          unhook: 'Built into editor',
          unhookAdvantage: true,
        },
        {
          competitor: 'General API tool',
          feature: 'Webhook-first design',
          unhook: 'Purpose-built for webhooks',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Pricing & Value',
      items: [
        {
          competitor: 'Limited free tier',
          feature: 'Free tier',
          unhook: 'Generous free tier',
          unhookAdvantage: true,
        },
        {
          competitor: 'Per-user pricing',
          feature: 'Team pricing',
          unhook: 'Per-team pricing',
          unhookAdvantage: true,
        },
        {
          competitor: 'Additional cost',
          feature: 'Custom domains',
          unhook: 'Included in team plan',
          unhookAdvantage: true,
        },
        {
          competitor: 'General support',
          feature: 'Support quality',
          unhook: 'Webhook-expert support',
          unhookAdvantage: true,
        },
      ],
    },
  ],
  hero: {
    competitorLogo: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <span className="font-bold text-lg">Beeceptor</span>
      </div>
    ),
    description:
      'While Beeceptor offers general API mocking and testing, Unhook is laser-focused on webhook development with team collaboration and VS Code integration.',
    subtitle: 'Focused Webhook Testing vs General API Tools',
    title: 'Unhook vs Beeceptor',
  },
  pricing: {
    competitor: [
      {
        features: [
          'Limited requests',
          'Basic HTTP mocking',
          'Simple endpoints',
          'Community support',
        ],
        name: 'Free',
        period: 'month',
        price: '$0',
      },
      {
        features: [
          'Unlimited requests',
          'Advanced mocking',
          'Custom domains',
          'Priority support',
        ],
        name: 'Professional',
        period: 'month',
        price: '$49',
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
        "Unlike Beeceptor's general API approach, Unhook is specifically designed for webhook development with purpose-built features.",
      icon: '🎯',
      title: 'Webhook-Focused',
    },
    {
      description:
        'One shared webhook URL for your entire team with a config file that lives in your repo. No more manual URL sharing or setup for new team members.',
      icon: '👥',
      title: 'Team Collaboration',
    },
    {
      description:
        'Debug webhooks directly in VS Code without switching to a web interface. Stay in your development flow.',
      icon: '💻',
      title: 'Editor Integration',
    },
    {
      description:
        "More webhook-specific features at a better price point. Our team plan costs less than Beeceptor's professional plan.",
      icon: '💰',
      title: 'Better Value',
    },
  ],
};

export default function UnhookVsBeeceptorPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <ComparisonHero {...beeceptorComparison.hero} />
        <ComparisonFeatures
          competitor="Beeceptor"
          features={beeceptorComparison.features}
        />
        <ComparisonPricing
          competitor="Beeceptor"
          competitorPricing={beeceptorComparison.pricing.competitor}
          unhookPricing={beeceptorComparison.pricing.unhook}
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose Webhook-Focused Tools Over General API Tools
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                See why teams are choosing specialized webhook tools over
                general-purpose API testing platforms.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {beeceptorComparison.reasons.map((reason) => (
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
          competitor="Beeceptor"
          ctaText="Switch to Webhook-Focused Tools"
          description="Join teams who've moved from general API tools to specialized webhook development platforms."
        />
        <FooterSection />
      </main>
    </div>
  );
}
