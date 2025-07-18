'use client';

import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import { BorderBeam } from '@unhook/ui/magicui/border-beam';
import { CodeBlock, CodeBlockCode } from '@unhook/ui/magicui/code-block';
import { File, Folder, Tree } from '@unhook/ui/magicui/file-tree';
import { Terminal } from '@unhook/ui/magicui/terminal';
import { Copy, FileText, Share2, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from 'next-themes';

const unhookConfigCode = `webhookId: wh_1bad2

destination:
  - name: default
    url: http://localhost:3000/api/webhooks/clerk

delivery:
  - source: clerk
    destination: default
`;

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export function SharedWebhooksSection() {
  const { theme } = useTheme();

  return (
    <section className="w-full py-20 relative">
      <div className="absolute inset-0">
        <div className="absolute inset-0 -z-10 h-full w-full [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_40%,var(--secondary)_100%)] rounded-xl" />
      </div>
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          animate="visible"
          className="text-center mb-16"
          initial="hidden"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUpVariants}>
            <Badge
              className="px-4 py-2 mb-4 border-border bg-accent hover:bg-accent/50 transition-colors"
              variant="outline"
            >
              Team Collaboration
            </Badge>
          </motion.div>
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tighter text-balance text-center text-primary mb-4"
            variants={fadeInUpVariants}
          >
            One Webhook URL, Entire Team
          </motion.h2>
          <motion.p
            className="text-base md:text-lg text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight max-w-3xl mx-auto"
            variants={fadeInUpVariants}
          >
            Share the same webhook URL across all services and team members. No
            more hunting for the right URL or managing individual endpoints.
          </motion.p>
        </motion.div>

        <motion.div
          animate="visible"
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial="hidden"
          variants={staggerContainer}
        >
          {/* Left side - Benefits */}
          <motion.div className="space-y-8" variants={fadeInUpVariants}>
            <motion.div
              className="flex items-start gap-4"
              variants={fadeInUpVariants}
            >
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-secondary/30">
                <Share2 className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-primary">
                  Universal Webhook URL
                </h3>
                <p className="text-muted-foreground font-medium">
                  Use the same webhook URL across Stripe, GitHub, Clerk, and all
                  your services. One URL that routes to the right developer
                  automatically.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-start gap-4"
              variants={fadeInUpVariants}
            >
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-secondary/30">
                <FileText className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-primary">
                  Config File in Your Repo
                </h3>
                <p className="text-muted-foreground font-medium">
                  Check in your webhook configuration with your code. New team
                  members get instant access without manual setup or URL
                  sharing.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-start gap-4"
              variants={fadeInUpVariants}
            >
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-secondary/30">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-primary">
                  Intelligent Routing
                </h3>
                <p className="text-muted-foreground font-medium">
                  Webhooks automatically route to active developers. No
                  conflicts, no confusion - just seamless team collaboration.
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUpVariants}>
              <Button
                className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all ease-out active:scale-95 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12]"
                size="lg"
              >
                Try Team Webhooks Free
              </Button>
            </motion.div>
          </motion.div>

          {/* Right side - Code Example */}
          <motion.div className="relative" variants={fadeInUpVariants}>
            <motion.div
              className="relative bg-card border border-border rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <BorderBeam delay={9} duration={12} size={250} />

              {/* Terminal with File Tree and Code */}
              <Terminal className="h-full w-full min-w-full min-h-full">
                <div className="flex flex-row gap-2 h-full">
                  <Tree>
                    <File isSelectable={false} value="readme">
                      README.md
                    </File>
                    <File isSelectable={false} value="package">
                      package.json
                    </File>
                    <Folder element="src" isSelectable={false} value="src">
                      <File isSelectable={false} value="index">
                        index.ts
                      </File>
                      <File value="app">app.ts</File>
                    </Folder>
                    <File isSelect value="config">
                      unhook.yaml
                    </File>
                  </Tree>
                  <CodeBlock className="flex-1">
                    <CodeBlockCode
                      code={unhookConfigCode}
                      language="yaml"
                      theme={theme === 'dark' ? 'github-dark' : 'github-light'}
                    />
                  </CodeBlock>
                </div>
              </Terminal>

              {/* Copy Button */}
              <div className="absolute top-4 right-4">
                <Button
                  className="h-8 w-8 p-0 bg-accent hover:bg-accent/50 border-border"
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>

            {/* Benefits callouts */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-sm font-medium text-secondary">
                    Version Controlled
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Config lives in your repo alongside your code
                </p>
              </div>

              <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-sm font-medium text-secondary">
                    Zero Setup
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  New team members get instant access
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom section - Problem/Solution */}
        <motion.div
          animate="visible"
          className="mt-20 bg-muted/30 border border-border rounded-lg p-8"
          initial="hidden"
          variants={staggerContainer}
        >
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div variants={fadeInUpVariants}>
              <h3 className="text-xl font-semibold mb-4 text-destructive">
                ❌ The Old Way (Other Tools)
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span className="font-medium">
                    Different webhook URLs for each developer
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span className="font-medium">
                    Manual URL sharing via Slack/email
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span className="font-medium">
                    New team members need manual setup
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span className="font-medium">
                    URLs get lost or become outdated
                  </span>
                </li>
              </ul>
            </motion.div>

            <motion.div variants={fadeInUpVariants}>
              <h3 className="text-xl font-semibold mb-4 text-secondary">
                ✅ The Unhook Way
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span className="font-medium">
                    One URL shared across all services and team members
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span className="font-medium">
                    Config file checked into your repository
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span className="font-medium">
                    Automatic access for new team members
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span className="font-medium">
                    Intelligent routing to active developers
                  </span>
                </li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
