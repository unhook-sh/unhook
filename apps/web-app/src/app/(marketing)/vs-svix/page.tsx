import { ComparisonCTA } from '../_components/sections/comparison-cta';
import { ComparisonFeatures } from '../_components/sections/comparison-features';
import { ComparisonHero } from '../_components/sections/comparison-hero';
import { ComparisonPricing } from '../_components/sections/comparison-pricing';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  title: 'Unhook vs Svix: Webhook Testing vs Webhook Infrastructure | Unhook',
  description:
    'Compare Unhook and Svix for webhook development. While Svix offers enterprise webhook infrastructure, Unhook focuses on team-friendly webhook testing with VS Code integration.',
  keywords: [
    'Unhook vs Svix',
    'Svix alternative',
    'webhook testing',
    'webhook infrastructure',
    'team collaboration',
  ],
};

const svixComparison = {
  competitor: 'Svix',
  hero: {
    title: 'Unhook vs Svix',
    subtitle: 'Webhook Testing vs Enterprise Infrastructure',
    description:
      'Svix provides enterprise webhook infrastructure for sending webhooks at scale. Unhook focuses on making webhook testing and development simple with team collaboration and VS Code integration.',
    competitorLogo: (
      <div className="text-2xl font-bold text-purple-600">Svix</div>
    ),
  },
  features: [
    {
      category: 'Core Focus',
      items: [
        {
          feature: 'Primary use case',
          unhook: 'Webhook testing & development',
          competitor: 'Production webhook infrastructure',
          unhookAdvantage: true,
        },
        {
          feature: 'Target audience',
          unhook: 'Development teams',
          competitor: 'Enterprise organizations',
          unhookAdvantage: true,
        },
        {
          feature: 'Setup complexity',
          unhook: 'Minutes to start',
          competitor: 'Requires integration',
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
      category: 'Team Features',
      items: [
        {
          feature: 'Shared webhook URLs',
          unhook: 'One URL for team',
          competitor: 'Per-application model',
          unhookAdvantage: true,
        },
        {
          feature: 'Config file sharing',
          unhook: 'In your repo',
          competitor: 'API/Dashboard based',
          unhookAdvantage: true,
        },
        {
          feature: 'Collaborative debugging',
          unhook: 'Built for teams',
          competitor: 'Individual endpoints',
          unhookAdvantage: true,
        },
        {
          feature: 'Learning curve',
          unhook: 'Minimal',
          competitor: 'Moderate',
          unhookAdvantage: true,
        },
      ],
    },
    {
      category: 'Production Features',
      items: [
        {
          feature: 'Sending webhooks',
          unhook: 'Testing only',
          competitor: 'Full production sending',
          unhookAdvantage: false,
        },
        {
          feature: 'Retry management',
          unhook: 'Basic retries',
          competitor: 'Advanced retry logic',
          unhookAdvantage: false,
        },
        {
          feature: 'Webhook portal',
          unhook: 'Developer focused',
          competitor: 'Customer embeddable',
          unhookAdvantage: false,
        },
        {
          feature: 'Message queuing',
          unhook: 'Not needed',
          competitor: 'Enterprise grade',
          unhookAdvantage: false,
        },
      ],
    },
    {
      category: 'Developer Experience',
      items: [
        {
          feature: 'Local development',
          unhook: 'First-class support',
          competitor: 'API focused',
          unhookAdvantage: true,
        },
        {
          feature: 'Event replay',
          unhook: 'One-click in editor',
          competitor: 'API/Dashboard based',
          unhookAdvantage: true,
        },
        {
          feature: 'Testing focus',
          unhook: 'Purpose-built',
          competitor: 'Secondary feature',
          unhookAdvantage: true,
        },
        {
          feature: 'Documentation',
          unhook: 'Simple & clear',
          competitor: 'Comprehensive API docs',
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
          '50K messages/month',
          'Basic features',
          '3 team members',
          '99.9% SLA',
        ],
      },
      {
        name: 'Professional',
        price: '$490',
        period: 'month',
        features: [
          '50K included messages',
          'Transformations',
          '10 team members',
          '99.99% SLA',
        ],
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        period: 'month',
        features: [
          'Custom limits',
          'On-prem option',
          'SSO & compliance',
          '99.999% SLA',
        ],
      },
    ],
  },
  reasons: [
    {
      title: 'Built for Development',
      description:
        'While Svix excels at production webhook infrastructure, Unhook is purpose-built for the development and testing phase where you spend most of your time.',
      icon: '🛠️',
    },
    {
      title: 'Team Collaboration',
      description:
        'One shared webhook URL for your entire team with a config file that lives in your repo. No complex per-application setup.',
      icon: '👥',
    },
    {
      title: 'VS Code Native',
      description:
        'Debug webhooks without leaving your editor. See events in real-time and replay with one click.',
      icon: '💻',
    },
    {
      title: 'Simple Pricing',
      description:
        'Straightforward team-based pricing for development. No per-message billing or complex calculations.',
      icon: '💰',
    },
  ],
};

export default function UnhookVsSvixPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <ComparisonHero {...svixComparison.hero} />
        <ComparisonFeatures
          features={svixComparison.features}
          competitor="Svix"
        />
        <ComparisonPricing
          unhookPricing={svixComparison.pricing.unhook}
          competitorPricing={svixComparison.pricing.competitor}
          competitor="Svix"
        />
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Development Teams Choose Unhook
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Svix is excellent for production webhook infrastructure, but Unhook is designed for the development workflow where testing happens.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {svixComparison.reasons.map((reason) => (
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
          competitor="Svix"
          ctaText="Try Unhook for Development"
          description="Experience webhook testing designed for development teams."
        />
        <FooterSection />
      </main>
    </div>
  );
}