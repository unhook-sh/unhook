import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  title: 'Unhook vs ngrok: Better Webhook Testing for Teams | Unhook',
  description: 'Compare Unhook and ngrok for webhook testing. See why teams choose Unhook for better collaboration, VS Code integration, and team-friendly pricing.',
  keywords: ['Unhook vs ngrok', 'ngrok alternative', 'webhook testing', 'team collaboration', 'VS Code integration'],
};

const ngrokComparison = {
  competitor: 'ngrok',
  hero: {
    title: 'Unhook vs ngrok',
    subtitle: 'Better Webhook Testing for Development Teams',
    description: 'While ngrok is great for individual developers, Unhook is built for teams. Compare features, pricing, and see why teams are switching to Unhook for better collaboration and VS Code integration.',
    competitorLogo: (
      <svg width="80" height="32" viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="dark:fill-white fill-black">
        <path d="M8 4h8v24H8V4zm16 0h8v24h-8V4zm16 0h8v24h-8V4zm16 0h8v24h-8V4z"/>
        <text x="10" y="20" className="text-sm font-bold">ngrok</text>
      </svg>
    ),
  },
  features: [
    {
      category: 'Team Collaboration',
      items: [
        {
          feature: 'Shared webhook URLs',
          unhook: 'Built-in team sharing',
          competitor: 'Individual URLs only',
          unhookAdvantage: true,
        },
        {
          feature: 'Team member visibility',
          unhook: 'See active team members',
          competitor: 'No team visibility',
          unhookAdvantage: true,
        },
        {
          feature: 'Collaborative debugging',
          unhook: 'Share events & replay',
          competitor: 'Individual debugging',
          unhookAdvantage: true,
        },
        {
          feature: 'Team management',
          unhook: 'Role-based access',
          competitor: 'No team features',
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
          competitor: 'CLI only',
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
          feature: 'AI/MCP testing',
          unhook: 'Full AI workflow support',
          competitor: 'Basic webhook testing',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Pricing & Limits',
      items: [
        {
          feature: 'Free tier bandwidth',
          unhook: 'Generous limits',
          competitor: '1GB/month',
          unhookAdvantage: true,
        },
        {
          feature: 'Custom domains',
          unhook: 'Included in team plan',
          competitor: '$14/domain/month',
          unhookAdvantage: true,
        },
        {
          feature: 'Team pricing',
          unhook: 'Per-team pricing',
          competitor: 'Per-user pricing',
          unhookAdvantage: true,
        },
        {
          feature: 'Commercial use',
          unhook: 'All plans',
          competitor: 'Paid plans only',
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
          feature: 'Custom authentication',
          unhook: 'Multiple methods',
          competitor: 'Basic auth',
          unhookAdvantage: true,
        },
        {
          feature: 'Self-hosting option',
          unhook: 'Enterprise plan',
          competitor: 'Not available',
          unhookAdvantage: true,
        },
        {
          feature: 'Uptime SLA',
          unhook: '99.9% (Enterprise)',
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
          'Advanced monitoring',
          'Custom domains included',
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
          '1GB bandwidth/month',
          '3 endpoints',
          'HTTP/HTTPS tunnels',
          'Email support',
        ],
      },
      {
        name: 'Personal',
        price: '$8',
        period: 'month',
        features: [
          'All free features',
          '1 custom domain',
          '1 reserved TCP address',
          'TCP tunnels',
        ],
      },
      {
        name: 'Pro',
        price: '$20',
        period: 'month',
        features: [
          'All personal features',
          'Load balancing',
          'IP restrictions',
          'Additional domains: $14/month each',
        ],
      },
      {
        name: 'Enterprise',
        price: '$39',
        period: 'month',
        features: [
          'All pro features',
          'Mutual TLS',
          'SAML SSO',
          'Role-based access',
        ],
      },
    ],
  },
  reasons: [
    {
      title: 'Built for Teams',
      description: 'Unlike ngrok\'s individual-focused approach, Unhook is designed from the ground up for team collaboration with shared URLs, team visibility, and collaborative debugging.',
      icon: '👥',
    },
    {
      title: 'VS Code Native',
      description: 'Debug webhooks without leaving your editor. Our VS Code extension brings webhook monitoring directly into your development environment.',
      icon: '💻',
    },
    {
      title: 'Better Pricing',
      description: 'No per-domain fees, no bandwidth caps, and team-friendly pricing. Get more value without the nickel-and-diming.',
      icon: '💰',
    },
    {
      title: 'AI-First',
      description: 'Full support for testing AI workflows and MCP server integrations. Perfect for modern AI-driven development.',
      icon: '🤖',
    },
  ],
};

export default function UnhookVsNgrokPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <ComparisonHero {...ngrokComparison.hero} />
        <ComparisonFeatures features={ngrokComparison.features} competitor="ngrok" />
        <ComparisonPricing 
          unhookPricing={ngrokComparison.pricing.unhook}
          competitorPricing={ngrokComparison.pricing.competitor}
          competitor="ngrok"
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Teams Choose Unhook Over ngrok
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                See why development teams are switching from ngrok to Unhook for better collaboration and productivity.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {ngrokComparison.reasons.map((reason, index) => (
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
          competitor="ngrok"
          ctaText="Switch from ngrok to Unhook"
          description="Join thousands of developers who've made the switch to better webhook testing."
        />
        <FooterSection />
      </main>
    </div>
  );
}