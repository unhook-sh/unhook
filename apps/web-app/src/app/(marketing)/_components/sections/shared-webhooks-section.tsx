'use client';

import { Badge } from '@unhook/ui/components/badge';
import { Button } from '@unhook/ui/components/button';
import { BorderBeam } from '@unhook/ui/magicui/border-beam';
import { Copy, FileText, Share2, Users } from 'lucide-react';
import { motion } from 'motion/react';

export function SharedWebhooksSection() {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="px-4 py-2 mb-4">
            Team Collaboration
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            One Webhook URL, Entire Team
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Share the same webhook URL across all services and team members. No
            more hunting for the right URL or managing individual endpoints.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Benefits */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Universal Webhook URL
                </h3>
                <p className="text-muted-foreground">
                  Use the same webhook URL across Stripe, GitHub, Clerk, and all
                  your services. One URL that routes to the right developer
                  automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Config File in Your Repo
                </h3>
                <p className="text-muted-foreground">
                  Check in your webhook configuration with your code. New team
                  members get instant access without manual setup or URL
                  sharing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Intelligent Routing
                </h3>
                <p className="text-muted-foreground">
                  Webhooks automatically route to active developers. No
                  conflicts, no confusion - just seamless team collaboration.
                </p>
              </div>
            </div>

            <Button size="lg" className="w-full sm:w-auto">
              Try Team Webhooks Free
            </Button>
          </div>

          {/* Right side - Code Example */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative bg-card border rounded-lg overflow-hidden"
            >
              <BorderBeam size={250} duration={12} delay={9} />

              {/* Terminal Header */}
              <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <span className="text-sm text-muted-foreground ml-2">
                  unhook.config.json
                </span>
              </div>

              {/* Config File Content */}
              <div className="p-6 font-mono text-sm">
                <div className="space-y-2">
                  <div className="text-muted-foreground">
                    {/* Shared across your entire team */}
                  </div>
                  <div className="text-blue-400">{'{'}</div>
                  <div className="ml-4">
                    <span className="text-green-400">"webhookUrl"</span>
                    <span className="text-white">: </span>
                    <span className="text-yellow-400">
                      "https://unhook.sh/wh_abc123"
                    </span>
                    <span className="text-white">,</span>
                  </div>
                  <div className="ml-4">
                    <span className="text-green-400">"services"</span>
                    <span className="text-white">: {'{'}</span>
                  </div>
                  <div className="ml-8">
                    <span className="text-green-400">"stripe"</span>
                    <span className="text-white">: </span>
                    <span className="text-yellow-400">
                      "https://unhook.sh/wh_abc123?from=stripe"
                    </span>
                    <span className="text-white">,</span>
                  </div>
                  <div className="ml-8">
                    <span className="text-green-400">"github"</span>
                    <span className="text-white">: </span>
                    <span className="text-yellow-400">
                      "https://unhook.sh/wh_abc123?from=github"
                    </span>
                    <span className="text-white">,</span>
                  </div>
                  <div className="ml-8">
                    <span className="text-green-400">"clerk"</span>
                    <span className="text-white">: </span>
                    <span className="text-yellow-400">
                      "https://unhook.sh/wh_abc123?from=clerk"
                    </span>
                  </div>
                  <div className="ml-4 text-white">{'}'}</div>
                  <div className="text-blue-400">{'}'}</div>
                </div>
              </div>

              {/* Copy Button */}
              <div className="absolute top-4 right-4">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>

            {/* Benefits callouts */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Version Controlled
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Config lives in your repo alongside your code
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Zero Setup
                  </span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-500">
                  New team members get instant access
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section - Problem/Solution */}
        <div className="mt-20 bg-muted/30 rounded-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-red-600">
                ❌ The Old Way (Other Tools)
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Different webhook URLs for each developer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Manual URL sharing via Slack/email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>New team members need manual setup</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>URLs get lost or become outdated</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-green-600">
                ✅ The Unhook Way
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>
                    One URL shared across all services and team members
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Config file checked into your repository</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Automatic access for new team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Intelligent routing to active developers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
