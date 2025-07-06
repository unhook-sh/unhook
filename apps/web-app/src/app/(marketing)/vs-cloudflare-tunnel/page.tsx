import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  title: 'Unhook vs Cloudflare Tunnel: Webhook Testing vs Infrastructure Tunneling | Unhook',
  description:
    'Compare Unhook and Cloudflare Tunnel. While Cloudflare Tunnel excels at infrastructure tunneling, Unhook specializes in webhook testing with team collaboration and VS Code integration.',
  keywords: [
    'Unhook vs Cloudflare Tunnel',
    'Cloudflare Tunnel alternative',
    'webhook testing',
    'tunneling solution',
    'team collaboration',
  ],
};

const cloudflareComparison = {
  competitor: 'Cloudflare Tunnel',
  hero: {
    title: 'Unhook vs Cloudflare Tunnel',
    subtitle: 'Purpose-Built Webhook Testing vs General Tunneling',
    description:
      'Cloudflare Tunnel is excellent for secure infrastructure access, but Unhook is specifically designed for webhook testing. Compare features and see why developers choose Unhook for webhook development.',
    competitorLogo: (
      <svg
        width="80"
        height="32"
        viewBox="0 0 80 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="dark:fill-white fill-orange-500"
        aria-label="Cloudflare Logo"
      >
        <title>Cloudflare Logo</title>
        <path d="M20 8c0-2.2 1.8-4 4-4h32c2.2 0 4 1.8 4 4v16c0 2.2-1.8 4-4 4H24c-2.2 0-4-1.8-4-4V8z" />
      </svg>
    ),
  },
  features: [
    {
      category: 'Webhook Features',
      items: [
        {
          feature: 'Webhook-specific tools',
          unhook: 'Purpose-built for webhooks',
          competitor: 'General tunneling',
          unhookAdvantage: true,
        },
        {
          feature: 'Event replay',
          unhook: 'One-click replay',
          competitor: 'Not available',
          unhookAdvantage: true,
        },
        {
          feature: 'Webhook monitoring',
          unhook: 'Real-time dashboard',
          competitor: 'Basic logging',
          unhookAdvantage: true,
        },
        {
          feature: 'VS Code integration',
          unhook: 'Native extension',
          competitor: 'Not available',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Team Collaboration',
      items: [
        {
          feature: 'Shared webhook URLs',
          unhook: 'Built-in sharing',
          competitor: 'Individual tunnels',
          unhookAdvantage: true,
        },
        {
          feature: 'Config file in repo',
          unhook: 'Version controlled',
          competitor: 'Manual configuration',
          unhookAdvantage: true,
        },
        {
          feature: 'Team management',
          unhook: 'Role-based access',
          competitor: 'Cloudflare account based',
          unhookAdvantage: true,
        },
        {
          feature: 'Collaborative debugging',
          unhook: 'Share & replay events',
          competitor: 'Not designed for this',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Infrastructure & Security',
      items: [
        {
          feature: 'Zero-trust network',
          unhook: 'Standard security',
          competitor: 'Advanced zero-trust',
          unhookAdvantage: false,
        },
        {
          feature: 'DDoS protection',
          unhook: 'Basic protection',
          competitor: 'Enterprise-grade',
          unhookAdvantage: false,
        },
        {
          feature: 'Global network',
          unhook: 'Standard CDN',
          competitor: 'Cloudflare network',
          unhookAdvantage: false,
        },
        {
          feature: 'Setup complexity',
          unhook: 'Simple, webhook-focused',
          competitor: 'Complex configuration',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Pricing & Usage',
      items: [
        {
          feature: 'Free tier',
          unhook: 'Generous free tier',
          competitor: 'Limited free tier',
          unhookAdvantage: true,
        },
        {
          feature: 'Domain requirements',
          unhook: 'Any domain',
          competitor: 'Cloudflare DNS required',
          unhookAdvantage: true,
        },
        {
          feature: 'Learning curve',
          unhook: 'Minutes to start',
          competitor: 'Steep learning curve',
          unhookAdvantage: true,
        },
        {
          feature: 'Target use case',
          unhook: 'Webhook development',
          competitor: 'Infrastructure access',
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
        period: 'month',
        features: [
          'Up to 50 users',
          'Basic tunneling',
          'Cloudflare DNS required',
          'Community support',
        ],
      },
      {
        name: 'Zero Trust',
        price: '$7',
        period: 'user/month',
        features: [
          'Advanced security',
          'Access policies',
          'Device posture',
          'WARP client',
        ],
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        period: 'month',
        features: [
          'Everything in Zero Trust',
          'Advanced analytics',
          'Dedicated support',
          'Custom contracts',
        ],
      },
    ],
  },
  reasons: [
    {
      title: 'Built for Webhooks',
      description:
        'While Cloudflare Tunnel is great for infrastructure, Unhook is purpose-built for webhook development with specialized tools.',
      icon: '🎯',
    },
    {
      title: 'Simple Setup',
      description:
        'Get started in minutes, not hours. No complex configuration or DNS requirements.',
      icon: '⚡',
    },
    {
      title: 'Team Collaboration',
      description:
        'Share webhook URLs with your team through a config file. Built for collaborative development.',
      icon: '👥',
    },
    {
      title: 'Developer Experience',
      description:
        'VS Code integration, one-click replay, and webhook-specific features that developers love.',
      icon: '💻',
    },
  ],
};

export default function UnhookVsCloudflareTunnelPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <ComparisonHero {...cloudflareComparison.hero} />
        <ComparisonFeatures
          features={cloudflareComparison.features}
          competitor="Cloudflare Tunnel"
        />
        <ComparisonPricing
          unhookPricing={cloudflareComparison.pricing.unhook}
          competitorPricing={cloudflareComparison.pricing.competitor}
          competitor="Cloudflare Tunnel"
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Developers Choose Unhook for Webhook Testing
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Cloudflare Tunnel is excellent for infrastructure access, but Unhook is designed specifically for webhook development workflows.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {cloudflareComparison.reasons.map((reason) => (
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
          competitor="Cloudflare Tunnel"
          ctaText="Try Unhook for Webhook Testing"
          description="Experience purpose-built webhook testing with team collaboration features."
        />
        <FooterSection />
      </main>
    </div>
  );
}