import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';

export const metadata = {
  description:
    'Compare Unhook and Cloudflare Tunnel. While Cloudflare Tunnel excels at infrastructure tunneling, Unhook specializes in webhook testing with team collaboration and VS Code integration.',
  keywords: [
    'Unhook vs Cloudflare Tunnel',
    'Cloudflare Tunnel alternative',
    'webhook testing',
    'tunneling solution',
    'team collaboration',
  ],
  title:
    'Unhook vs Cloudflare Tunnel: Webhook Testing vs Infrastructure Tunneling | Unhook',
};

const cloudflareComparison = {
  competitor: 'Cloudflare Tunnel',
  features: [
    {
      category: 'Webhook Features',
      items: [
        {
          competitor: 'General tunneling',
          feature: 'Webhook-specific tools',
          unhook: 'Purpose-built for webhooks',
          unhookAdvantage: true,
        },
        {
          competitor: 'Not available',
          feature: 'Event replay',
          unhook: 'One-click replay',
          unhookAdvantage: true,
        },
        {
          competitor: 'Basic logging',
          feature: 'Webhook monitoring',
          unhook: 'Real-time dashboard',
          unhookAdvantage: true,
        },
        {
          competitor: 'Not available',
          feature: 'VS Code integration',
          unhook: 'Native extension',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Team Collaboration',
      items: [
        {
          competitor: 'Individual tunnels',
          feature: 'Shared webhook URLs',
          unhook: 'Built-in sharing',
          unhookAdvantage: true,
        },
        {
          competitor: 'Manual configuration',
          feature: 'Config file in repo',
          unhook: 'Version controlled',
          unhookAdvantage: true,
        },
        {
          competitor: 'Cloudflare account based',
          feature: 'Team management',
          unhook: 'Role-based access',
          unhookAdvantage: true,
        },
        {
          competitor: 'Not designed for this',
          feature: 'Collaborative debugging',
          unhook: 'Share & replay events',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Infrastructure & Security',
      items: [
        {
          competitor: 'Advanced zero-trust',
          feature: 'Zero-trust network',
          unhook: 'Standard security',
          unhookAdvantage: false,
        },
        {
          competitor: 'Enterprise-grade',
          feature: 'DDoS protection',
          unhook: 'Basic protection',
          unhookAdvantage: false,
        },
        {
          competitor: 'Cloudflare network',
          feature: 'Global network',
          unhook: 'Standard CDN',
          unhookAdvantage: false,
        },
        {
          competitor: 'Complex configuration',
          feature: 'Setup complexity',
          unhook: 'Simple, webhook-focused',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Pricing & Usage',
      items: [
        {
          competitor: 'Limited free tier',
          feature: 'Free tier',
          unhook: 'Generous free tier',
          unhookAdvantage: true,
        },
        {
          competitor: 'Cloudflare DNS required',
          feature: 'Domain requirements',
          unhook: 'Any domain',
          unhookAdvantage: true,
        },
        {
          competitor: 'Steep learning curve',
          feature: 'Learning curve',
          unhook: 'Minutes to start',
          unhookAdvantage: true,
        },
        {
          competitor: 'Infrastructure access',
          feature: 'Target use case',
          unhook: 'Webhook development',
          unhookAdvantage: true,
        },
      ],
    },
  ],
  hero: {
    competitorLogo: (
      <svg
        aria-label="Cloudflare Logo"
        className="dark:fill-white fill-orange-500"
        fill="none"
        height="32"
        viewBox="0 0 80 32"
        width="80"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Cloudflare Logo</title>
        <path d="M20 8c0-2.2 1.8-4 4-4h32c2.2 0 4 1.8 4 4v16c0 2.2-1.8 4-4 4H24c-2.2 0-4-1.8-4-4V8z" />
      </svg>
    ),
    description:
      'Cloudflare Tunnel is excellent for secure infrastructure access, but Unhook is specifically designed for webhook testing. Compare features and see why developers choose Unhook for webhook development.',
    subtitle: 'Purpose-Built Webhook Testing vs General Tunneling',
    title: 'Unhook vs Cloudflare Tunnel',
  },
  pricing: {
    competitor: [
      {
        features: [
          'Up to 50 users',
          'Basic tunneling',
          'Cloudflare DNS required',
          'Community support',
        ],
        name: 'Free',
        period: 'month',
        price: '$0',
      },
      {
        features: [
          'Advanced security',
          'Access policies',
          'Device posture',
          'WARP client',
        ],
        name: 'Zero Trust',
        period: 'user/month',
        price: '$7',
      },
      {
        features: [
          'Everything in Zero Trust',
          'Advanced analytics',
          'Dedicated support',
          'Custom contracts',
        ],
        name: 'Enterprise',
        period: 'month',
        price: 'Custom',
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
        'While Cloudflare Tunnel is great for infrastructure, Unhook is purpose-built for webhook development with specialized tools.',
      icon: '🎯',
      title: 'Built for Webhooks',
    },
    {
      description:
        'Get started in minutes, not hours. No complex configuration or DNS requirements.',
      icon: '⚡',
      title: 'Simple Setup',
    },
    {
      description:
        'Share webhook URLs with your team through a config file. Built for collaborative development.',
      icon: '👥',
      title: 'Team Collaboration',
    },
    {
      description:
        'VS Code integration, one-click replay, and webhook-specific features that developers love.',
      icon: '💻',
      title: 'Developer Experience',
    },
  ],
};

export default function UnhookVsCloudflareTunnelPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <ComparisonHero {...cloudflareComparison.hero} />
        <ComparisonFeatures
          competitor="Cloudflare Tunnel"
          features={cloudflareComparison.features}
        />
        <ComparisonPricing
          competitor="Cloudflare Tunnel"
          competitorPricing={cloudflareComparison.pricing.competitor}
          unhookPricing={cloudflareComparison.pricing.unhook}
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Developers Choose Unhook for Webhook Testing
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Cloudflare Tunnel is excellent for infrastructure access, but
                Unhook is designed specifically for webhook development
                workflows.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {cloudflareComparison.reasons.map((reason) => (
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
          competitor="Cloudflare Tunnel"
          ctaText="Try Unhook for Webhook Testing"
          description="Experience purpose-built webhook testing with team collaboration features."
        />
        <FooterSection />
      </main>
    </div>
  );
}
