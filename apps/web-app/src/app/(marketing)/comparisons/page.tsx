import { Badge } from '@unhook/ui/components/badge';
import { Button } from '@unhook/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@unhook/ui/components/card';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { FooterSection } from '../_components/sections/footer-section';
import { Navbar } from '../_components/sections/navbar';
import { siteConfig } from '../_lib/config';

export const metadata = {
  title: 'Unhook vs Competitors: Webhook Testing Tool Comparisons | Unhook',
  description: 'Compare Unhook with ngrok, Webhook.site, Beeceptor, Localtunnel and other webhook testing tools. See why teams choose Unhook for better collaboration and VS Code integration.',
  keywords: ['webhook testing comparison', 'ngrok vs unhook', 'webhook.site alternative', 'beeceptor alternative', 'webhook testing tools'],
};

const competitors = [
  {
    name: 'ngrok',
    logo: '🚇',
    description: 'Popular tunneling tool for individual developers',
    category: 'Tunneling Platform',
    pricing: 'From $8/month',
    marketShare: 'High',
    strengths: ['Easy to use', 'Popular', 'Good documentation'],
    weaknesses: ['Expensive for teams', 'No team features', 'Per-domain pricing'],
    comparison: '/vs-ngrok',
    unhookAdvantages: [
      'Team-first pricing',
      'Built-in collaboration',
      'VS Code integration',
      'No per-domain fees'
    ]
  },
  {
    name: 'Webhook.site',
    logo: '🌐',
    description: 'Simple webhook testing and inspection tool',
    category: 'Webhook Testing',
    pricing: 'From $7.5/month',
    marketShare: 'Medium',
    strengths: ['Simple interface', 'Quick setup', 'Good for testing'],
    weaknesses: ['Limited team features', 'Basic functionality', 'No editor integration'],
    comparison: '/vs-webhook-site',
    unhookAdvantages: [
      'Advanced team features',
      'VS Code integration',
      'Better reliability',
      'Professional features'
    ]
  },
  {
    name: 'Beeceptor',
    logo: '🐝',
    description: 'API mocking and webhook testing platform',
    category: 'API Mocking',
    pricing: 'From $49/month',
    marketShare: 'Medium',
    strengths: ['API mocking', 'Multiple protocols', 'Good features'],
    weaknesses: ['Expensive', 'General-purpose tool', 'No webhook focus'],
    comparison: '/vs-beeceptor',
    unhookAdvantages: [
      'Webhook-focused design',
      'Better pricing',
      'Team collaboration',
      'Editor integration'
    ]
  },
  {
    name: 'Localtunnel',
    logo: '🔗',
    description: 'Basic tunneling solution (no longer maintained)',
    category: 'Basic Tunneling',
    pricing: 'Free only',
    marketShare: 'Low',
    strengths: ['Free', 'Simple', 'Open source'],
    weaknesses: ['Unmaintained', 'Unreliable', 'No team features', 'Basic functionality'],
    comparison: '/vs-localtunnel',
    unhookAdvantages: [
      'Active maintenance',
      'Enterprise reliability',
      'Team features',
      'Professional support'
    ]
  }
];

const comparisonMatrix = [
  {
    feature: 'Team Collaboration',
    unhook: true,
    ngrok: false,
    webhookSite: false,
    beeceptor: false,
    localtunnel: false,
  },
  {
    feature: 'VS Code Integration',
    unhook: true,
    ngrok: false,
    webhookSite: false,
    beeceptor: false,
    localtunnel: false,
  },
  {
    feature: 'Custom Domains Included',
    unhook: true,
    ngrok: false,
    webhookSite: false,
    beeceptor: false,
    localtunnel: false,
  },
  {
    feature: 'Event Replay',
    unhook: true,
    ngrok: true,
    webhookSite: true,
    beeceptor: true,
    localtunnel: false,
  },
  {
    feature: 'Free Tier',
    unhook: true,
    ngrok: true,
    webhookSite: true,
    beeceptor: true,
    localtunnel: true,
  },
  {
    feature: 'Enterprise Features',
    unhook: true,
    ngrok: true,
    webhookSite: false,
    beeceptor: true,
    localtunnel: false,
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
              <Badge variant="outline" className="px-4 py-2">
                Tool Comparisons
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                How Unhook Compares
              </h1>
              <p className="text-xl md:text-2xl text-primary font-semibold">
                See why teams choose Unhook over other webhook testing tools
              </p>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Compare Unhook with popular webhook testing and tunneling tools. Discover why development teams are switching to Unhook for better collaboration, VS Code integration, and team-friendly features.
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
                In-depth analysis of how Unhook compares to each major competitor in the webhook testing space.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {competitors.map((competitor, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-4xl">{competitor.logo}</span>
                      <div>
                        <CardTitle className="text-xl">{competitor.name}</CardTitle>
                        <CardDescription>{competitor.category}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-auto">
                        {competitor.marketShare} Usage
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{competitor.description}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Starting Price:</span>
                      <span className="text-primary font-semibold">{competitor.pricing}</span>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 text-green-600">Why Teams Choose Unhook:</h4>
                      <ul className="space-y-2">
                        {competitor.unhookAdvantages.map((advantage, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {advantage}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2 text-green-600">Strengths:</h5>
                        <ul className="space-y-1">
                          {competitor.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-muted-foreground">• {strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2 text-red-600">Limitations:</h5>
                        <ul className="space-y-1">
                          {competitor.weaknesses.map((weakness, i) => (
                            <li key={i} className="text-sm text-muted-foreground">• {weakness}</li>
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
                Quick overview of key features across all webhook testing platforms.
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full bg-card border rounded-lg">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Feature</th>
                    <th className="text-center p-4 font-medium text-primary">Unhook</th>
                    <th className="text-center p-4 font-medium">ngrok</th>
                    <th className="text-center p-4 font-medium">Webhook.site</th>
                    <th className="text-center p-4 font-medium">Beeceptor</th>
                    <th className="text-center p-4 font-medium">Localtunnel</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonMatrix.map((row, index) => (
                    <tr key={index} className="border-b last:border-b-0 hover:bg-muted/30">
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
                Join thousands of developers who've made the switch to better webhook testing with team collaboration and VS Code integration.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="px-8">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="px-8">
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