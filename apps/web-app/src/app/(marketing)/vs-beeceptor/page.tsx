import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  title: 'Unhook vs Beeceptor: Better Webhook Testing for Teams | Unhook',
  description: 'Compare Unhook and Beeceptor for webhook testing. See why teams choose Unhook for better collaboration, VS Code integration, and team-focused features.',
  keywords: ['Unhook vs Beeceptor', 'Beeceptor alternative', 'webhook testing', 'API mocking', 'team collaboration'],
};

const beeceptorComparison = {
  competitor: 'Beeceptor',
  hero: {
    title: 'Unhook vs Beeceptor',
    subtitle: 'Focused Webhook Testing vs General API Tools',
    description: 'While Beeceptor offers general API mocking and testing, Unhook is laser-focused on webhook development with team collaboration and VS Code integration.',
    competitorLogo: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <span className="font-bold text-lg">Beeceptor</span>
      </div>
    ),
  },
  features: [
    {
      category: 'Webhook-Specific Features',
      items: [
        {
          feature: 'Webhook routing',
          unhook: 'Intelligent team routing',
          competitor: 'Basic HTTP endpoints',
          unhookAdvantage: true,
        },
        {
          feature: 'Event replay',
          unhook: 'One-click webhook replay',
          competitor: 'Manual request replay',
          unhookAdvantage: true,
        },
        {
          feature: 'Provider integrations',
          unhook: 'Stripe, GitHub, Clerk ready',
          competitor: 'Generic HTTP handling',
          unhookAdvantage: true,
        },
        {
          feature: 'Webhook validation',
          unhook: 'Built-in signature validation',
          competitor: 'Manual validation',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Team Collaboration',
      items: [
        {
          feature: 'Team webhook sharing',
          unhook: 'Built-in team sharing',
          competitor: 'Individual endpoints',
          unhookAdvantage: true,
        },
        {
          feature: 'Collaborative debugging',
          unhook: 'Share events & insights',
          competitor: 'Individual debugging',
          unhookAdvantage: true,
        },
        {
          feature: 'Team management',
          unhook: 'Role-based access',
          competitor: 'No team features',
          unhookAdvantage: true,
        },
        {
          feature: 'Activity visibility',
          unhook: 'See active team members',
          competitor: 'No team visibility',
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
          competitor: 'Web dashboard only',
          unhookAdvantage: true,
        },
        {
          feature: 'Local development',
          unhook: 'Seamless local routing',
          competitor: 'Tunnel setup required',
          unhookAdvantage: true,
        },
        {
          feature: 'Real-time monitoring',
          unhook: 'Built into editor',
          competitor: 'Web interface only',
          unhookAdvantage: true,
        },
        {
          feature: 'Webhook-first design',
          unhook: 'Purpose-built for webhooks',
          competitor: 'General API tool',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Pricing & Value',
      items: [
        {
          feature: 'Free tier',
          unhook: 'Generous free tier',
          competitor: 'Limited free tier',
          unhookAdvantage: true,
        },
        {
          feature: 'Team pricing',
          unhook: 'Per-team pricing',
          competitor: 'Per-user pricing',
          unhookAdvantage: true,
        },
        {
          feature: 'Custom domains',
          unhook: 'Included in team plan',
          competitor: 'Additional cost',
          unhookAdvantage: true,
        },
        {
          feature: 'Support quality',
          unhook: 'Webhook-expert support',
          competitor: 'General support',
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
          'Limited requests',
          'Basic HTTP mocking',
          'Simple endpoints',
          'Community support',
        ],
      },
      {
        name: 'Professional',
        price: '$49',
        period: 'month',
        features: [
          'Unlimited requests',
          'Advanced mocking',
          'Custom domains',
          'Priority support',
        ],
      },
    ],
  },
  reasons: [
    {
      title: 'Webhook-Focused',
      description: 'Unlike Beeceptor\'s general API approach, Unhook is specifically designed for webhook development with purpose-built features.',
      icon: '🎯',
    },
    {
      title: 'Team Collaboration',
      description: 'Built-in team features that Beeceptor lacks - shared webhooks, collaborative debugging, and team management.',
      icon: '👥',
    },
    {
      title: 'Editor Integration',
      description: 'Debug webhooks directly in VS Code without switching to a web interface. Stay in your development flow.',
      icon: '💻',
    },
    {
      title: 'Better Value',
      description: 'More webhook-specific features at a better price point. Our team plan costs less than Beeceptor\'s professional plan.',
      icon: '💰',
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
        <ComparisonFeatures features={beeceptorComparison.features} competitor="Beeceptor" />
        <ComparisonPricing 
          unhookPricing={beeceptorComparison.pricing.unhook}
          competitorPricing={beeceptorComparison.pricing.competitor}
          competitor="Beeceptor"
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose Webhook-Focused Tools Over General API Tools
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                See why teams are choosing specialized webhook tools over general-purpose API testing platforms.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {beeceptorComparison.reasons.map((reason, index) => (
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
          competitor="Beeceptor"
          ctaText="Switch to Webhook-Focused Tools"
          description="Join teams who've moved from general API tools to specialized webhook development platforms."
        />
        <FooterSection />
      </main>
    </div>
  );
}