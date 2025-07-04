'use client';

import { BorderBeam } from '@unhook/ui/magicui/border-beam';
import { RetroGrid } from '@unhook/ui/magicui/retro-grid';
import { ArrowRight, Brain, Code, Play, Settings, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const MCPWorkflow = () => {
  return (
    <div className="relative w-full max-w-5xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden border border-gray-700">
      <BorderBeam size={300} duration={15} delay={0} />

      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-400" />
            <span className="text-white font-medium">
              AI + MCP + Webhook Testing
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">Live Testing</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Workflow Steps */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Step 1: AI Agent */}
          <motion.div
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium">AI Agent</span>
            </div>
            <p className="text-gray-300 text-sm">
              AI agent receives user request and needs to execute actions via
              MCP tools
            </p>
          </motion.div>

          {/* Step 2: MCP Server */}
          <motion.div
            className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium">MCP Server</span>
            </div>
            <p className="text-gray-300 text-sm">
              MCP server processes tool calls and triggers webhooks to external
              services
            </p>
          </motion.div>

          {/* Step 3: Webhook Testing */}
          <motion.div
            className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium">Unhook Testing</span>
            </div>
            <p className="text-gray-300 text-sm">
              Capture, inspect, and replay webhook events triggered by AI
              actions
            </p>
          </motion.div>
        </div>

        {/* Code Example */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">
              MCP Tool Implementation
            </span>
            <Code className="w-4 h-4 text-gray-400" />
          </div>
          <motion.pre
            className="text-sm text-green-400 font-mono overflow-x-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {`// AI Agent triggers MCP tool
await mcp.callTool('webhook-trigger', {
  endpoint: 'https://unhook.sh/wh_abc123',
  action: 'user_created',
  data: { userId: '12345', email: 'user@example.com' }
});

// Unhook captures the webhook
POST /wh_abc123
{
  "event": "user_created",
  "data": { "userId": "12345", "email": "user@example.com" },
  "timestamp": "2025-01-09T10:30:00Z"
}`}
          </motion.pre>
        </div>

        {/* Real-time Demo */}
        <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">
              Live AI Testing Session
            </span>
            <Play className="w-4 h-4 text-green-400" />
          </div>
          <div className="space-y-2">
            <motion.div
              className="flex items-center space-x-3 text-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
            >
              <span className="text-blue-400">AI:</span>
              <span className="text-gray-300">
                "Creating user account via MCP tool..."
              </span>
            </motion.div>
            <motion.div
              className="flex items-center space-x-3 text-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
            >
              <span className="text-purple-400">MCP:</span>
              <span className="text-gray-300">
                Tool execution → Webhook triggered
              </span>
            </motion.div>
            <motion.div
              className="flex items-center space-x-3 text-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 }}
            >
              <span className="text-green-400">Unhook:</span>
              <span className="text-gray-300">
                ✓ Webhook captured & ready for inspection
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function AIMCPSection() {
  return (
    <section className="w-full py-20 relative overflow-hidden">
      <div className="absolute inset-0">
        <RetroGrid />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">
              AI Integration
            </span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Test AI Actions with MCP Servers
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Debug AI agent workflows by testing webhooks triggered by Model
            Context Protocol (MCP) servers. Perfect for validating AI-driven
            automations and agentic systems.
          </p>
        </motion.div>

        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <MCPWorkflow />
        </motion.div>

        {/* Use Cases Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-primary mb-3">
              AI Agent Testing
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Test AI agents that trigger webhooks through MCP tools. Validate
              that your AI correctly executes actions and handles responses.
            </p>
            <div className="text-xs text-blue-400">
              Use Cases: Customer service bots, task automation, data processing
              agents
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-6">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-primary mb-3">
              MCP Tool Validation
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Debug MCP server tools that call external APIs. Ensure your tools
              properly format requests and handle webhook responses.
            </p>
            <div className="text-xs text-purple-400">
              Use Cases: CRM integrations, payment processing, notification
              systems
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-6">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-primary mb-3">
              End-to-End AI Workflows
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Test complete AI workflows from trigger to completion. Monitor
              webhook chains and validate multi-step AI processes.
            </p>
            <div className="text-xs text-green-400">
              Use Cases: Order processing, content generation, security
              monitoring
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-8 max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold text-primary mb-3">
              Ready to test your AI-powered webhooks?
            </h3>
            <p className="text-muted-foreground mb-6">
              Set up Unhook in VS Code and start debugging your MCP-powered AI
              agents today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <span>Install VS Code Extension</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="inline-flex items-center space-x-2 border border-border hover:bg-accent text-primary px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <span>View MCP Examples</span>
                <Code className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
