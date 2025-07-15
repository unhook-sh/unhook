import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';

export const metadata = {
  description:
    'Compare Unhook and Svix for webhook development. While Svix offers enterprise webhook infrastructure, Unhook focuses on team-friendly webhook testing with VS Code integration.',
  keywords: [
    'Unhook vs Svix',
    'Svix alternative',
    'webhook testing',
    'webhook infrastructure',
    'team collaboration',
  ],
  title: 'Unhook vs Svix: Webhook Testing vs Webhook Infrastructure | Unhook',
};

const svixComparison = {
  competitor: 'Svix',
  features: [
    {
      category: 'Core Focus',
      items: [
        {
          competitor: 'Production webhook infrastructure',
          feature: 'Primary use case',
          unhook: 'Webhook testing & development',
          unhookAdvantage: true,
        },
        {
          competitor: 'Enterprise organizations',
          feature: 'Target audience',
          unhook: 'Development teams',
          unhookAdvantage: true,
        },
        {
          competitor: 'Requires integration',
          feature: 'Setup complexity',
          unhook: 'Minutes to start',
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
      category: 'Team Features',
      items: [
        {
          competitor: 'Per-application model',
          feature: 'Shared webhook URLs',
          unhook: 'One URL for team',
          unhookAdvantage: true,
        },
        {
          competitor: 'API/Dashboard based',
          feature: 'Config file sharing',
          unhook: 'In your repo',
          unhookAdvantage: true,
        },
        {
          competitor: 'Individual endpoints',
          feature: 'Collaborative debugging',
          unhook: 'Built for teams',
          unhookAdvantage: true,
        },
        {
          competitor: 'Moderate',
          feature: 'Learning curve',
          unhook: 'Minimal',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Production Features',
      items: [
        {
          competitor: 'Full production sending',
          feature: 'Sending webhooks',
          unhook: 'Testing only',
          unhookAdvantage: false,
        },
        {
          competitor: 'Advanced retry logic',
          feature: 'Retry management',
          unhook: 'Basic retries',
          unhookAdvantage: false,
        },
        {
          competitor: 'Customer embeddable',
          feature: 'Webhook portal',
          unhook: 'Developer focused',
          unhookAdvantage: false,
        },
        {
          competitor: 'Enterprise grade',
          feature: 'Message queuing',
          unhook: 'Not needed',
          unhookAdvantage: false,
        },
      ],
    },
    {
      category: 'Developer Experience',
      items: [
        {
          competitor: 'API focused',
          feature: 'Local development',
          unhook: 'First-class support',
          unhookAdvantage: true,
        },
        {
          competitor: 'API/Dashboard based',
          feature: 'Event replay',
          unhook: 'One-click in editor',
          unhookAdvantage: true,
        },
        {
          competitor: 'Secondary feature',
          feature: 'Testing focus',
          unhook: 'Purpose-built',
          unhookAdvantage: true,
        },
        {
          competitor: 'Comprehensive API docs',
          feature: 'Documentation',
          unhook: 'Simple & clear',
          unhookAdvantage: true,
        },
      ],
    },
  ],
  hero: {
    competitorLogo: (
      <div className="text-2xl font-bold text-purple-600">Svix</div>
    ),
    description:
      'Svix provides enterprise webhook infrastructure for sending webhooks at scale. Unhook focuses on making webhook testing and development simple with team collaboration and VS Code integration.',
    subtitle: 'Webhook Testing vs Enterprise Infrastructure',
    title: 'Unhook vs Svix',
  },
  pricing: {
    competitor: [
      {
        features: [
          '50K messages/month',
          'Basic features',
          '3 team members',
          '99.9% SLA',
        ],
        name: 'Free',
        period: 'month',
        price: '$0',
      },
      {
        features: [
          '50K included messages',
          'Transformations',
          '10 team members',
          '99.99% SLA',
        ],
        name: 'Professional',
        period: 'month',
        price: '$490',
      },
      {
        features: [
          'Custom limits',
          'On-prem option',
          'SSO & compliance',
          '99.999% SLA',
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
        'While Svix excels at production webhook infrastructure, Unhook is purpose-built for the development and testing phase where you spend most of your time.',
      icon: '🛠️',
      title: 'Built for Development',
    },
    {
      description:
        'One shared webhook URL for your entire team with a config file that lives in your repo. No complex per-application setup.',
      icon: '👥',
      title: 'Team Collaboration',
    },
    {
      description:
        'Debug webhooks without leaving your editor. See events in real-time and replay with one click.',
      icon: '💻',
      title: 'VS Code Native',
    },
    {
      description:
        'Straightforward team-based pricing for development. No per-message billing or complex calculations.',
      icon: '💰',
      title: 'Simple Pricing',
    },
  ],
};

export default function UnhookVsSvixPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <ComparisonHero {...svixComparison.hero} />
        <ComparisonFeatures
          competitor="Svix"
          features={svixComparison.features}
        />
        <ComparisonPricing
          competitor="Svix"
          competitorPricing={svixComparison.pricing.competitor}
          unhookPricing={svixComparison.pricing.unhook}
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Development Teams Choose Unhook
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Svix is excellent for production webhook infrastructure, but
                Unhook is designed for the development workflow where testing
                happens.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {svixComparison.reasons.map((reason) => (
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
          competitor="Svix"
          ctaText="Try Unhook for Development"
          description="Experience webhook testing designed for development teams."
        />
        <FooterSection />
      </main>
    </div>
  );
}
