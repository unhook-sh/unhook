'use client';

import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { H1, H2, P } from '@unhook/ui/custom/typography';
import { MagicCard } from '@unhook/ui/magicui/magic-card';
import { ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const ossProjects = [
  {
    category: 'Automation',
    description:
      'Open source, no-code, AI-first business automation tool. Alternative to Zapier, Make and Workato.',
    name: 'Activepieces',
    url: 'https://www.activepieces.com',
  },
  {
    category: 'Development',
    description: 'Build custom software on top of your data.',
    name: 'Appsmith',
    url: 'https://www.appsmith.com',
  },
  {
    category: 'Analytics',
    description:
      'Analytics for Apps, open source, simple and privacy-friendly. SDKs for Swift, React Native, Electron, Flutter and many others.',
    name: 'Aptabase',
    url: 'https://aptabase.com',
  },
  {
    category: 'Testing',
    description:
      'Argos provides the developer tools to debug tests and detect visual regressions.',
    name: 'Argos',
    url: 'https://argos-ci.com',
  },
  {
    category: 'Productivity',
    description:
      'Cal.com is a scheduling tool that helps you schedule meetings without the back-and-forth emails.',
    name: 'Cal.com',
    url: 'https://cal.com',
  },
  {
    category: 'Education',
    description:
      'ClassroomIO is a no-code tool that allows you build and scale your own teaching platform with ease.',
    name: 'ClassroomIO.com',
    url: 'https://classroomio.com',
  },
  {
    category: 'Documentation',
    description:
      'The Open-Source DocuSign Alternative. We aim to earn your trust by enabling you to self-host the platform and examine its inner workings.',
    name: 'Documenso',
    url: 'https://documenso.com',
  },
  {
    category: 'Analytics',
    description:
      'Open source survey software and Experience Management Platform. Understand your customers, keep full control over your data.',
    name: 'Formbricks',
    url: 'https://formbricks.com',
  },
  {
    category: 'Finance',
    description:
      'Ghostfolio is a privacy-first, open source dashboard for your personal finances. Designed to simplify asset tracking and empower informed investment decisions.',
    name: 'Ghostfolio',
    url: 'https://ghostfol.io',
  },
  {
    category: 'Authentication',
    description:
      'Open-source authentication and user management for the passkey era. Integrated in minutes, for web and mobile apps.',
    name: 'Hanko',
    url: 'https://hanko.io',
  },
  {
    category: 'Webhooks',
    description:
      'Open-Source Webhooks-as-a-service (WaaS) that makes it easy for developers to send webhooks.',
    name: 'Hook0',
    url: 'https://hook0.com',
  },
  {
    category: 'Productivity',
    description:
      'Inbox Zero makes it easy to clean up your inbox and reach inbox zero fast. It provides bulk newsletter unsubscribe, cold email blocking, email analytics, and AI automations.',
    name: 'Inbox Zero',
    url: 'https://inboxzero.com',
  },
  {
    category: 'Security',
    description:
      'Open source, end-to-end encrypted platform that lets you securely manage secrets and configs across your team, devices, and infrastructure.',
    name: 'Infisical',
    url: 'https://infisical.com',
  },
  {
    category: 'DevOps',
    description: 'Keep is an open-source AIOps (AI for IT operations) platform',
    name: 'KeepHQ',
    url: 'https://keephq.dev',
  },
  {
    category: 'AI',
    description:
      'Open source LLM engineering platform. Debug, analyze and iterate together.',
    name: 'Langfuse',
    url: 'https://langfuse.com',
  },
  {
    category: 'Development',
    description:
      'Mockoon is the easiest and quickest way to design and run mock REST APIs.',
    name: 'Mockoon',
    url: 'https://mockoon.com',
  },
  {
    category: 'Notifications',
    description:
      'The open-source notification infrastructure for developers. Simple components and APIs for managing all communication channels in one place.',
    name: 'Novu',
    url: 'https://novu.co',
  },
  {
    category: 'Finance',
    description:
      'Democratizing investment research through an open source financial ecosystem. The OpenBB Terminal allows everyone to perform investment research, from everywhere.',
    name: 'OpenBB',
    url: 'https://openbb.co',
  },
  {
    category: 'Monitoring',
    description: 'Open-source monitoring platform with beautiful status pages',
    name: 'OpenStatus',
    url: 'https://openstatus.dev',
  },
  {
    category: 'Documentation',
    description:
      'Open-Source Docsend Alternative to securely share documents with real-time analytics.',
    name: 'Papermark',
    url: 'https://papermark.io',
  },
  {
    category: 'AI',
    description:
      'AI Gateway with integrated Guardrails. Route to 250+ LLMs and 50+ Guardrails with 1-fast API. Supports caching, retries, and edge deployment for low latency.',
    name: 'Portkey AI',
    url: 'https://portkey.ai',
  },
  {
    category: 'Database',
    description:
      'Simplify working with databases. Build, optimize, and grow your app easily with an intuitive data model, type-safety, automated migrations, connection pooling, caching, and real-time db subscriptions.',
    name: 'Prisma',
    url: 'https://prisma.io',
  },
  {
    category: 'Development',
    description:
      'Makes frontend development cycle 10x faster with API Client, Mock Server, Intercept & Modify HTTP Requests and Session Replays.',
    name: 'Requestly',
    url: 'https://requestly.com',
  },
  {
    category: 'Gaming',
    description:
      'Open-source solution to deploy, scale, and operate your multiplayer game.',
    name: 'Rivet',
    url: 'https://rivet.gg',
  },
  {
    category: 'Asset Management',
    description:
      'Open Source Asset and Equipment tracking software that lets you create QR asset labels, manage and overview your assets across locations.',
    name: 'Shelf.nu',
    url: 'https://shelf.nu',
  },
  {
    category: 'Networking',
    description:
      'Sniffnet is a network monitoring tool to help you easily keep track of your Internet traffic.',
    name: 'Sniffnet',
    url: 'https://sniffnet.net',
  },
  {
    category: 'AI',
    description:
      'The innovative open-source framework for developing LLM-enabled chatbots, Tiledesk empowers developers to create advanced, conversational AI agents.',
    name: 'Tiledesk',
    url: 'https://tiledesk.com',
  },
  {
    category: 'Localization',
    description: 'Software localization from A to Z made really easy.',
    name: 'Tolgee',
    url: 'https://tolgee.io',
  },
  {
    category: 'Development',
    description:
      'Create long-running Jobs directly in your codebase with features like API integrations, webhooks, scheduling and delays.',
    name: 'Trigger.dev',
    url: 'https://trigger.dev',
  },
  {
    category: 'Chatbots',
    description:
      'Typebot gives you powerful blocks to create unique chat experiences. Embed them anywhere on your apps and start collecting results like magic.',
    name: 'Typebot',
    url: 'https://typebot.io',
  },
  {
    category: 'CRM',
    description:
      'A modern CRM offering the flexibility of open-source, advanced features and sleek design.',
    name: 'Twenty',
    url: 'https://twenty.com',
  },
  {
    category: 'API',
    description:
      'An API authentication and authorization platform for scaling user facing APIs. Create, verify, and manage low latency API keys in seconds.',
    name: 'Unkey',
    url: 'https://unkey.com',
  },
  {
    category: 'AI',
    description:
      'Open Source TypeScript framework for building AI agents with enterprise-grade capabilities and seamless integrations.',
    name: 'Voltagent',
    url: 'https://voltagent.ai',
  },
  {
    category: 'CMS',
    description:
      'Open-source enterprise-grade serverless CMS. Own your data. Scale effortlessly. Customize everything.',
    name: 'Webiny',
    url: 'https://webiny.com',
  },
  {
    category: 'Design',
    description: 'Webstudio is an open source alternative to Webflow',
    name: 'Webstudio',
    url: 'https://webstudio.is',
  },
];

export function OSSFriendsSection() {
  return (
    <section className="w-full relative py-24" id="oss-friends">
      <div className="relative flex flex-col items-center w-full px-4 md:px-6">
        <div className="absolute inset-0">
          <div className="absolute inset-0 -z-10 h-[600px] md:h-[800px] w-full [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_40%,var(--secondary)_100%)] rounded-b-xl" />
        </div>

        {/* Hero Section */}
        <motion.div
          animate="visible"
          className="relative z-10 max-w-4xl mx-auto text-center mb-16"
          initial="hidden"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUpVariants}>
            <Badge className="mb-4" variant="secondary">
              Open Source Community
            </Badge>
          </motion.div>

          <motion.div variants={fadeInUpVariants}>
            <H1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance mb-6">
              Our Open Source Friends
            </H1>
          </motion.div>

          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
            variants={fadeInUpVariants}
          >
            Unhook finds inspiration in open-source projects. Here's a list of
            our favorite ones that are building amazing developer tools and
            platforms.
          </motion.p>

          <motion.div variants={fadeInUpVariants}>
            <Button asChild className="rounded-full" size="lg">
              <a
                href="https://github.com/unhook-sh/unhook"
                rel="noopener noreferrer"
                target="_blank"
              >
                View Unhook on GitHub
              </a>
            </Button>
          </motion.div>
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          animate="visible"
          className="relative z-10 w-full max-w-7xl mx-auto px-6"
          initial="hidden"
          variants={staggerContainer}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:max-w-2/3 mx-auto">
            {ossProjects.map((project) => (
              <motion.div
                className="group"
                key={project.name}
                variants={fadeInUpVariants}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2, ease: 'easeOut' },
                  y: -4,
                }}
              >
                <Card className="p-0 max-w-sm w-full shadow-none border-none">
                  <MagicCard
                    className="p-0 transition-all duration-300 group-hover:shadow-lg"
                    gradientColor="var(--muted)"
                    gradientFrom="var(--primary)"
                    gradientOpacity={0.6}
                    gradientTo="var(--secondary)"
                  >
                    <a
                      className="block h-full"
                      href={project.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <CardHeader className="border-b border-border p-4 [.border-b]:pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold mb-2 transition-colors duration-200 group-hover:text-primary">
                              {project.name}
                            </CardTitle>
                            <Badge className="text-xs" variant="outline">
                              {project.category}
                            </Badge>
                          </div>
                          <motion.div
                            className="h-8 w-8 flex items-center justify-center"
                            transition={{ duration: 0.2 }}
                            whileHover={{ scale: 1.1 }}
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
                          </motion.div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <CardDescription className="text-sm leading-relaxed min-h-[96px] flex items-start transition-colors duration-200 group-hover:text-muted-foreground">
                          {project.description}
                        </CardDescription>
                      </CardContent>
                    </a>
                  </MagicCard>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          animate="visible"
          className="relative z-10 max-w-2xl mx-auto text-center mt-16"
          initial="hidden"
          variants={fadeInUpVariants}
        >
          <H2 className="text-2xl md:text-3xl font-medium tracking-tighter mb-4">
            Building something amazing?
          </H2>
          <P className="text-muted-foreground mb-6">
            If you're building an open source project that helps developers,
            we'd love to feature you here.
          </P>
          <Button asChild className="rounded-full" variant="outline">
            <a href="mailto:chris.watts.t@gmail.com?subject=OSS Friends Feature Request">
              Get in Touch
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
