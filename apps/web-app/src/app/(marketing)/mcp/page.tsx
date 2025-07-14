import { AIMCPSection } from '~/app/(marketing)/_components/sections/ai-mcp-section';
import { FooterSection } from '~/app/(marketing)/_components/sections/footer-section';
import { Navbar } from '~/app/(marketing)/_components/sections/navbar';
import { siteConfig } from '../_lib/config';
export default function MCPPage() {
  return (
    <div className="max-w-7xl mx-auto border-x relative">
      <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10" />
      <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10" />
      <Navbar navs={siteConfig.nav.links} />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <MCPHeroSection />
        <AIMCPSection />
        <MCPFeaturesSection />
        <MCPUseCasesSection />
        <MCPIntegrationSection />
        <MCPFAQSection />
        <MCPCTASection />
        <FooterSection />
      </main>
    </div>
  );
}

// Custom Hero Section for MCP
function MCPHeroSection() {
  return (
    <section className="w-full py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <svg
              aria-label="MCP Integration"
              className="text-blue-400"
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>MCP Integration</title>
              <path d="M12 2L2 7v10c0 5.55 3.84 9.05 9 10 5.16-.95 9-4.45 9-10V7l-10-5z" />
              <path d="M12 22V8" />
              <path d="M8 12h8" />
            </svg>
            <span className="text-blue-400 text-sm font-medium">
              AI-Powered Webhook Debugging
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
            Debug AI Agents with
            <br />
            Model Context Protocol
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Use Unhook's MCP server to access webhook data directly from Claude,
            Cursor, and other AI assistants. Debug webhook issues faster with
            intelligent analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              href="/webhooks/create?utm_source=mcp-page&utm_medium=hero-cta"
            >
              Get Started with MCP
            </a>
            <a
              className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
              href="https://docs.unhook.sh/mcp-integration"
            >
              View Documentation
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// MCP Features Section
function MCPFeaturesSection() {
  const features = [
    {
      description:
        'Query your webhook events and requests directly from AI assistants',
      icon: (
        <svg
          aria-label="Access Webhook Data"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Access Webhook Data</title>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M13 8L8 13" />
          <path d="M16 8l-5 5" />
        </svg>
      ),
      title: 'Access Webhook Data',
    },
    {
      description:
        'Get AI-powered insights into webhook failures and performance issues',
      icon: (
        <svg
          aria-label="Intelligent Analysis"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Intelligent Analysis</title>
          <path d="M12 2v20" />
          <path d="M2 12h20" />
          <path d="M7 7l10 10" />
          <path d="M17 7L7 17" />
        </svg>
      ),
      title: 'Intelligent Analysis',
    },
    {
      description: 'Debug webhook issues as they happen with live data access',
      icon: (
        <svg
          aria-label="Real-time Debugging"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Real-time Debugging</title>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      title: 'Real-time Debugging',
    },
    {
      description:
        'Enterprise-grade security with scoped access and authentication',
      icon: (
        <svg
          aria-label="Secure Integration"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Secure Integration</title>
          <rect height="10" rx="2" ry="2" width="18" x="3" y="11" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      title: 'Secure Integration',
    },
  ];

  return (
    <section className="w-full py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Powerful MCP Features
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Everything you need to debug webhooks with AI assistance
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div className="text-center" key={feature.title}>
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 text-primary">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// MCP Use Cases Section
function MCPUseCasesSection() {
  const useCases = [
    {
      description:
        'Ask Claude or Cursor why your webhooks are failing and get instant analysis with actionable fixes.',
      example:
        '"Why are my Stripe webhooks failing?" → Get detailed error analysis and solutions',
      title: 'Debug Failed Webhooks',
    },
    {
      description:
        'Track webhook performance metrics and identify bottlenecks with AI-powered insights.',
      example:
        '"Generate a performance report for my webhooks" → See response times, success rates, and trends',
      title: 'Performance Monitoring',
    },
    {
      description:
        'Examine webhook payloads and headers to debug integration issues quickly.',
      example:
        '"Show me the last GitHub webhook payload" → Instantly access and analyze webhook data',
      title: 'Payload Inspection',
    },
  ];

  return (
    <section className="w-full py-20 bg-accent/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            How Teams Use MCP
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Real-world examples of debugging webhooks with AI assistance
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase) => (
            <div
              className="bg-background border border-border rounded-lg p-6"
              key={useCase.title}
            >
              <h3 className="font-semibold text-primary mb-3">
                {useCase.title}
              </h3>
              <p className="text-muted-foreground mb-4">
                {useCase.description}
              </p>
              <div className="bg-accent/50 rounded p-3 text-sm">
                <code className="text-primary">{useCase.example}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// MCP Integration Section
function MCPIntegrationSection() {
  return (
    <section className="w-full py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              Easy Integration
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Set up Unhook's MCP server in minutes and start debugging webhooks
              with AI assistance. Works seamlessly with Claude Desktop, Cursor,
              and any MCP-compatible AI assistant.
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Quick Setup</title>
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-primary">Quick Setup</h4>
                  <p className="text-muted-foreground text-sm">
                    Add Unhook to your AI assistant config in under 2 minutes
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Secure Access</title>
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-primary">Secure Access</h4>
                  <p className="text-muted-foreground text-sm">
                    API token authentication with organization-scoped data
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Full Feature Access</title>
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-primary">
                    Full Feature Access
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Search, analyze, and debug webhooks with powerful tools
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-accent/50 rounded-lg p-6 border border-border">
            <h4 className="font-medium text-primary mb-4">
              Claude Desktop Configuration
            </h4>
            <pre className="bg-background rounded p-4 overflow-x-auto text-sm">
              <code className="text-primary">{`{
  "mcpServers": {
    "unhook": {
      "url": "https://app.unhook.sh/api/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN"
      }
    }
  }
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

// MCP FAQ Section
function MCPFAQSection() {
  const faqs = [
    {
      answer:
        "MCP is an open standard that enables AI assistants to securely access data and tools from external systems. With Unhook's MCP server, AI assistants can access your webhook data for debugging and analysis.",
      question: 'What is Model Context Protocol (MCP)?',
    },
    {
      answer:
        "Currently, Claude Desktop and Cursor have built-in MCP support. Any AI assistant that implements the MCP standard can connect to Unhook's MCP server.",
      question: 'Which AI assistants support MCP?',
    },
    {
      answer:
        'Yes, all MCP requests require authentication via API tokens. Data access is scoped to your organization only, and all communication is encrypted over HTTPS.',
      question: 'Is my webhook data secure?',
    },
    {
      answer:
        'You can search webhook events, analyze failures, inspect payloads, get performance reports, and receive AI-powered debugging recommendations—all without leaving your AI assistant.',
      question: 'What can I do with the MCP integration?',
    },
  ];

  return (
    <section className="w-full py-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            MCP Integration FAQ
          </h2>
        </div>
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div
              className="border border-border rounded-lg p-6"
              key={faq.question}
            >
              <h3 className="font-semibold text-primary mb-3">
                {faq.question}
              </h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// MCP CTA Section
function MCPCTASection() {
  return (
    <section className="w-full py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Start Debugging with AI Today
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Connect your AI assistant to Unhook and experience the future of
            webhook debugging. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              href="/webhooks/create?utm_source=mcp-page&utm_medium=cta-button"
            >
              Create Your First Webhook
            </a>
            <a
              className="inline-flex items-center justify-center px-8 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
              href="https://docs.unhook.sh/mcp-integration"
            >
              Read MCP Documentation
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
