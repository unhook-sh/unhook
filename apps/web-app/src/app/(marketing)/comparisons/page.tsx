import { Badge } from '@unhook/ui/components/badge';
import { Button } from '@unhook/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/components/card';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  description:
    'Compare Unhook with ngrok, Webhook.site, Beeceptor, Localtunnel and other webhook testing tools. See why teams choose Unhook for better collaboration and VS Code integration.',
  keywords: [
    'webhook testing comparison',
    'ngrok vs unhook',
    'webhook.site alternative',
    'beeceptor alternative',
    'webhook testing tools',
  ],
  title: 'Unhook vs Competitors: Webhook Testing Tool Comparisons | Unhook',
};

const competitors = [
  {
    category: 'Tunneling Platform',
    comparison: '/vs-ngrok',
    description: 'Popular tunneling tool for individual developers',
    logo: '🚇',
    marketShare: 'High',
    name: 'ngrok',
    pricing: 'From $8/month',
    strengths: ['Easy to use', 'Popular', 'Good documentation'],
    unhookAdvantages: [
      'One shared URL for entire team',
      'Config file in your repo',
      'VS Code integration',
      'No per-domain fees',
    ],
    weaknesses: [
      'Expensive for teams',
      'No team features',
      'Per-domain pricing',
    ],
  },
  {
    category: 'Webhook Testing',
    comparison: '/vs-webhook-site',
    description: 'Simple webhook testing and inspection tool',
    logo: '🌐',
    marketShare: 'Medium',
    name: 'Webhook.site',
    pricing: 'From $7.5/month',
    strengths: ['Simple interface', 'Quick setup', 'Good for testing'],
    unhookAdvantages: [
      'One shared URL for entire team',
      'Config file in your repo',
      'VS Code integration',
      'Professional features',
    ],
    weaknesses: [
      'Limited team features',
      'Basic functionality',
      'No editor integration',
    ],
  },
  {
    category: 'API Mocking',
    comparison: '/vs-beeceptor',
    description: 'API mocking and webhook testing platform',
    logo: '🐝',
    marketShare: 'Medium',
    name: 'Beeceptor',
    pricing: 'From $49/month',
    strengths: ['API mocking', 'Multiple protocols', 'Good features'],
    unhookAdvantages: [
      'One shared URL for entire team',
      'Config file in your repo',
      'Webhook-focused design',
      'Better pricing',
    ],
    weaknesses: ['Expensive', 'General-purpose tool', 'No webhook focus'],
  },
  {
    category: 'Basic Tunneling',
    comparison: '/vs-localtunnel',
    description: 'Basic tunneling solution (no longer maintained)',
    logo: '🔗',
    marketShare: 'Low',
    name: 'Localtunnel',
    pricing: 'Free only',
    strengths: ['Free', 'Simple', 'Open source'],
    unhookAdvantages: [
      'One shared URL for entire team',
      'Config file in your repo',
      'Active maintenance',
      'Enterprise reliability',
    ],
    weaknesses: [
      'Unmaintained',
      'Unreliable',
      'No team features',
      'Basic functionality',
    ],
  },
  {
    category: 'Webhook Proxy',
    comparison: '/vs-smee',
    description: 'GitHub webhook proxy for quick testing',
    logo: '🔌',
    marketShare: 'Medium',
    name: 'Smee.io',
    pricing: 'Free',
    strengths: ['Free', 'GitHub integration', 'Quick setup'],
    unhookAdvantages: [
      'Professional features',
      'Team collaboration',
      'VS Code integration',
      'Persistent URLs',
    ],
    weaknesses: [
      'Basic features only',
      'No team support',
      'No authentication',
      'Temporary URLs only',
    ],
  },
  {
    category: 'Infrastructure Tunneling',
    comparison: '/vs-cloudflare-tunnel',
    description: 'Enterprise-grade secure tunneling solution',
    logo: '☁️',
    marketShare: 'High',
    name: 'Cloudflare Tunnel',
    pricing: 'From $7/user/month',
    strengths: ['Enterprise security', 'Global network', 'Zero-trust'],
    unhookAdvantages: [
      'Built for webhooks',
      'Simple setup',
      'Team collaboration',
      'No DNS requirements',
    ],
    weaknesses: [
      'Complex setup',
      'Not webhook-focused',
      'Requires Cloudflare DNS',
      'Steep learning curve',
    ],
  },
  {
    category: 'Event Gateway',
    comparison: '/vs-hookdeck',
    description: 'Event gateway for production webhook infrastructure',
    logo: '🎣',
    marketShare: 'Medium',
    name: 'Hookdeck',
    pricing: 'From $49/month',
    strengths: ['Production-ready', 'Advanced routing', 'Event queuing'],
    unhookAdvantages: [
      'Development-focused',
      'Simple setup',
      'VS Code integration',
      'Better for testing',
    ],
    weaknesses: [
      'Complex for development',
      'Higher pricing',
      'No VS Code integration',
      'Production-focused',
    ],
  },
  {
    category: 'Webhook Infrastructure',
    comparison: '/vs-svix',
    description: 'Enterprise webhook infrastructure as a service',
    logo: '🚀',
    marketShare: 'High',
    name: 'Svix',
    pricing: 'From $490/month',
    strengths: [
      'Enterprise-grade',
      'Sending & receiving',
      'Full infrastructure',
    ],
    unhookAdvantages: [
      'Built for development',
      'Simple team setup',
      'VS Code integration',
      'Testing-focused',
    ],
    weaknesses: [
      'Production-focused',
      'Complex integration',
      'High pricing',
      'Not for testing',
    ],
  },
];

const comparisonMatrix = [
  {
    beeceptor: false,
    cloudflare: false,
    feature: 'Shared Webhook URLs',
    hookdeck: false,
    localtunnel: false,
    ngrok: false,
    smee: false,
    svix: false,
    unhook: true,
    webhookSite: false,
  },
  {
    beeceptor: false,
    cloudflare: false,
    feature: 'Config File in Repo',
    hookdeck: false,
    localtunnel: false,
    ngrok: false,
    smee: false,
    svix: false,
    unhook: true,
    webhookSite: false,
  },
  {
    beeceptor: false,
    cloudflare: false,
    feature: 'VS Code Integration',
    hookdeck: false,
    localtunnel: false,
    ngrok: false,
    smee: false,
    svix: false,
    unhook: true,
    webhookSite: false,
  },
  {
    beeceptor: false,
    cloudflare: false,
    feature: 'Custom Domains Included',
    hookdeck: false,
    localtunnel: false,
    ngrok: false,
    smee: false,
    svix: false,
    unhook: true,
    webhookSite: false,
  },
  {
    beeceptor: true,
    cloudflare: false,
    feature: 'Event Replay',
    hookdeck: true,
    localtunnel: false,
    ngrok: true,
    smee: false,
    svix: true,
    unhook: true,
    webhookSite: true,
  },
  {
    beeceptor: true,
    cloudflare: true,
    feature: 'Free Tier',
    hookdeck: true,
    localtunnel: true,
    ngrok: true,
    smee: true,
    svix: true,
    unhook: true,
    webhookSite: true,
  },
  {
    beeceptor: true,
    cloudflare: true,
    feature: 'Enterprise Features',
    hookdeck: true,
    localtunnel: false,
    ngrok: true,
    smee: false,
    svix: true,
    unhook: true,
    webhookSite: false,
  },
];

export default function ComparisonsPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        {/* Hero Section */}
        <section className="w-full py-20 lg:py-32">
          <div className="container mx-auto px-6">
            <div className="text-center space-y-8">
              <Badge className="px-4 py-2" variant="outline">
                Tool Comparisons
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                How Unhook Compares
              </h1>
              <p className="text-xl md:text-2xl text-primary font-semibold">
                See why teams choose Unhook over other webhook testing tools
              </p>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Compare Unhook with popular webhook testing and tunneling tools.
                Discover why development teams are switching to Unhook for
                better collaboration, VS Code integration, and team-friendly
                features.
              </p>
              <p className="text-sm text-muted-foreground max-w-3xl mx-auto mt-4">
                Also evaluating: Webhook Relay, Zrok, Bore, Serveo, Pagekite,
                Tailscale Funnel, Localhost.run, Pinggy, and more emerging
                tools...
              </p>
            </div>
          </div>
        </section>

        {/* Competitor Cards */}
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Detailed Competitor Comparisons
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                In-depth analysis of how Unhook compares to each major
                competitor in the webhook testing space.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {competitors.map((competitor) => (
                <Card
                  className="relative overflow-hidden"
                  key={competitor.name}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-4xl">{competitor.logo}</span>
                      <div>
                        <CardTitle className="text-xl">
                          {competitor.name}
                        </CardTitle>
                        <CardDescription>{competitor.category}</CardDescription>
                      </div>
                      <Badge className="ml-auto" variant="secondary">
                        {competitor.marketShare} Usage
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {competitor.description}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Starting Price:</span>
                      <span className="text-primary font-semibold">
                        {competitor.pricing}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 text-green-600">
                        Why Teams Choose Unhook:
                      </h4>
                      <ul className="space-y-2">
                        {competitor.unhookAdvantages.map((advantage) => (
                          <li
                            className="flex items-center gap-2 text-sm"
                            key={advantage}
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {advantage}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2 text-green-600">
                          Strengths:
                        </h5>
                        <ul className="space-y-1">
                          {competitor.strengths.map((strength) => (
                            <li
                              className="text-sm text-muted-foreground"
                              key={strength}
                            >
                              • {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2 text-red-600">
                          Limitations:
                        </h5>
                        <ul className="space-y-1">
                          {competitor.weaknesses.map((weakness) => (
                            <li
                              className="text-sm text-muted-foreground"
                              key={weakness}
                            >
                              • {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Link href={competitor.comparison}>
                      <Button className="w-full">
                        View Detailed Comparison
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Matrix */}
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Feature Comparison Matrix
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Quick overview of key features across all webhook testing
                platforms.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-card border rounded-lg">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Feature</th>
                    <th className="text-center p-4 font-medium text-primary">
                      Unhook
                    </th>
                    <th className="text-center p-4 font-medium">ngrok</th>
                    <th className="text-center p-4 font-medium">
                      Webhook.site
                    </th>
                    <th className="text-center p-4 font-medium">Beeceptor</th>
                    <th className="text-center p-4 font-medium">Localtunnel</th>
                    <th className="text-center p-4 font-medium">Smee.io</th>
                    <th className="text-center p-4 font-medium">Cloudflare</th>
                    <th className="text-center p-4 font-medium">Hookdeck</th>
                    <th className="text-center p-4 font-medium">Svix</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonMatrix.map((row) => (
                    <tr
                      className="border-b last:border-b-0 hover:bg-muted/30"
                      key={row.feature}
                    >
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center">
                        {row.unhook ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.ngrok ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.webhookSite ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.beeceptor ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.localtunnel ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.smee ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.cloudflare ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.hookdeck ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.svix ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20">
          <div className="container mx-auto px-6">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border rounded-lg p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to See the Difference?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of developers who've made the switch to better
                webhook testing with team collaboration and VS Code integration.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="px-8" size="lg">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button className="px-8" size="lg" variant="outline">
                  Schedule Demo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                No credit card required • Free forever plan available
              </p>
            </div>
          </div>
        </section>

        <FooterSection />
      </main>
    </div>
  );
}
