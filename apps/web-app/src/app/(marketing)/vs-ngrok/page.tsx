import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';

export const metadata = {
  description:
    'Compare Unhook and ngrok for webhook testing. See why teams choose Unhook for better collaboration, VS Code integration, and team-friendly pricing.',
  keywords: [
    'Unhook vs ngrok',
    'ngrok alternative',
    'webhook testing',
    'team collaboration',
    'VS Code integration',
  ],
  title: 'Unhook vs ngrok: Better Webhook Testing for Teams | Unhook',
};

const ngrokComparison = {
  competitor: 'ngrok',
  features: [
    {
      category: 'Team Collaboration',
      items: [
        {
          competitor: 'Individual URLs only',
          feature: 'Shared webhook URLs',
          unhook: 'One URL for entire team + config file',
          unhookAdvantage: true,
        },
        {
          competitor: 'Manual URL sharing',
          feature: 'Config file sharing',
          unhook: 'Checked-in config file',
          unhookAdvantage: true,
        },
        {
          competitor: 'Individual debugging',
          feature: 'Collaborative debugging',
          unhook: 'Share events & replay',
          unhookAdvantage: true,
        },
        {
          competitor: 'No team features',
          feature: 'Team management',
          unhook: 'Role-based access',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Developer Experience',
      items: [
        {
          competitor: 'CLI only',
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
          competitor: 'Basic webhook testing',
          feature: 'AI/MCP testing',
          unhook: 'Full AI workflow support',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Pricing & Limits',
      items: [
        {
          competitor: '1GB/month',
          feature: 'Free tier bandwidth',
          unhook: 'Generous limits',
          unhookAdvantage: true,
        },
        {
          competitor: '$14/domain/month',
          feature: 'Custom domains',
          unhook: 'Included in team plan',
          unhookAdvantage: true,
        },
        {
          competitor: 'Per-user pricing',
          feature: 'Team pricing',
          unhook: 'Per-team pricing',
          unhookAdvantage: true,
        },
        {
          competitor: 'Paid plans only',
          feature: 'Commercial use',
          unhook: 'All plans',
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
          feature: 'Custom authentication',
          unhook: 'Multiple methods',
          unhookAdvantage: true,
        },
        {
          competitor: 'Not available',
          feature: 'Self-hosting option',
          unhook: 'Enterprise plan',
          unhookAdvantage: true,
        },
        {
          competitor: 'Best effort',
          feature: 'Uptime SLA',
          unhook: '99.9% (Enterprise)',
          unhookAdvantage: true,
        },
      ],
    },
  ],
  hero: {
    competitorLogo: (
      <svg
        aria-label="ngrok Logo"
        className="dark:fill-white fill-black"
        fill="none"
        height="32"
        viewBox="0 0 80 32"
        width="80"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>ngrok Logo</title>
        <path d="M8 4h8v24H8V4zm16 0h8v24h-8V4zm16 0h8v24h-8V4zm16 0h8v24h-8V4z" />
        <text className="text-sm font-bold" x="10" y="20">
          ngrok
        </text>
      </svg>
    ),
    description:
      'While ngrok is great for individual developers, Unhook is built for teams. Compare features, pricing, and see why teams are switching to Unhook for better collaboration and VS Code integration.',
    subtitle: 'Better Webhook Testing for Development Teams',
    title: 'Unhook vs ngrok',
  },
  pricing: {
    competitor: [
      {
        features: [
          '1GB bandwidth/month',
          '3 endpoints',
          'HTTP/HTTPS tunnels',
          'Email support',
        ],
        name: 'Free',
        period: 'month',
        price: '$0',
      },
      {
        features: [
          'All free features',
          '1 custom domain',
          '1 reserved TCP address',
          'TCP tunnels',
        ],
        name: 'Personal',
        period: 'month',
        price: '$8',
      },
      {
        features: [
          'All personal features',
          'Load balancing',
          'IP restrictions',
          'Additional domains: $14/month each',
        ],
        name: 'Pro',
        period: 'month',
        price: '$20',
      },
      {
        features: [
          'All pro features',
          'Mutual TLS',
          'SAML SSO',
          'Role-based access',
        ],
        name: 'Enterprise',
        period: 'month',
        price: '$39',
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
          'Custom domains included',
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
        "Unlike ngrok's individual-focused approach, Unhook provides one shared webhook URL for your entire team with a config file that lives in your repo. No more hunting for the right URL.",
      icon: '👥',
      title: 'Built for Teams',
    },
    {
      description:
        'Debug webhooks without leaving your editor. Our VS Code extension brings webhook monitoring directly into your development environment.',
      icon: '💻',
      title: 'VS Code Native',
    },
    {
      description:
        'No per-domain fees, no bandwidth caps, and team-friendly pricing. Get more value without the nickel-and-diming.',
      icon: '💰',
      title: 'Better Pricing',
    },
    {
      description:
        'Full support for testing AI workflows and MCP server integrations. Perfect for modern AI-driven development.',
      icon: '🤖',
      title: 'AI-First',
    },
  ],
};

export default function UnhookVsNgrokPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <ComparisonHero {...ngrokComparison.hero} />
        <ComparisonFeatures
          competitor="ngrok"
          features={ngrokComparison.features}
        />
        <ComparisonPricing
          competitor="ngrok"
          competitorPricing={ngrokComparison.pricing.competitor}
          unhookPricing={ngrokComparison.pricing.unhook}
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Teams Choose Unhook Over ngrok
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                See why development teams are switching from ngrok to Unhook for
                better collaboration and productivity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="md:col-span-2 lg:col-span-2">
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
                      Unlike ngrok's individual-focused approach, Unhook
                      provides one shared webhook URL for your entire team with
                      a config file that lives in your repo. No more hunting for
                      the right URL.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-8 h-full relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl opacity-20">
                    💻
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-6">💻</div>
                    <h3 className="text-2xl font-bold mb-4 text-purple-900 dark:text-purple-100">
                      VS Code Native
                    </h3>
                    <p className="text-purple-800 dark:text-purple-200 text-lg leading-relaxed">
                      Debug webhooks without leaving your editor. Our VS Code
                      extension brings webhook monitoring directly into your
                      development environment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 h-full relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl opacity-20">
                    💰
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-6">💰</div>
                    <h3 className="text-2xl font-bold mb-4 text-green-900 dark:text-green-100">
                      Better Pricing
                    </h3>
                    <p className="text-green-800 dark:text-green-200 text-lg leading-relaxed">
                      No per-domain fees, no bandwidth caps, and team-friendly
                      pricing. Get more value without the nickel-and-diming.
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-2">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-8 h-full relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl opacity-20">
                    🤖
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-6">🤖</div>
                    <h3 className="text-2xl font-bold mb-4 text-orange-900 dark:text-orange-100">
                      AI-First
                    </h3>
                    <p className="text-orange-800 dark:text-orange-200 text-lg leading-relaxed">
                      Full support for testing AI workflows and MCP server
                      integrations. Perfect for modern AI-driven development.
                    </p>
                  </div>
                </div>
              </div>
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
