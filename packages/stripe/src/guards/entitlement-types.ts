// Type-safe entitlement definitions
// These are extracted from the Stripe entities configuration in create-stripe-entities.ts

/**
 * All available entitlements in the Unhook system
 * These are the lookup keys used in Stripe's entitlements system
 */
export const ENTITLEMENTS = {
  ADVANCED_MONITORING_ANALYTICS: 'advanced_monitoring_analytics',
  AI_POWERED_DEBUGGING: 'ai_powered_debugging',
  BASIC_MONITORING: 'basic_monitoring',
  CLI_EDITOR_ACCESS: 'cli_editor_access',
  COMMUNITY_SUPPORT: 'community_support',
  CUSTOM_WEBHOOK_SUBDOMAINS: 'custom_webhook_subdomains',
  CUSTOM_WEBHOOK_TRANSFORMATIONS: 'custom_webhook_transformations',

  // Addon Entitlements
  DEDICATED_SLACK_SUPPORT: 'dedicated_slack_support',
  LOCAL_EVENT_ROUTING: 'local_event_routing',
  MCP_SERVER_ACCESS: 'mcp_server_access',
  PRIVATE_WEBHOOK_URLS: 'private_webhook_urls',
  PUBLIC_WEBHOOK_URLS: 'public_webhook_urls',
  ROUTE_TO_EXTERNAL_INTEGRATIONS: 'route_to_external_integrations',
  SINGLE_WEBHOOK_URL: 'single_webhook_url',
  TEAM_WEBHOOK_SHARING: 'team_webhook_sharing',
  TRACE_AI_AGENT_WORKFLOWS: 'trace_ai_agent_workflows',
  UNLIMITED_DEVELOPERS: 'unlimited_developers',

  // Team Plan Entitlements
  UNLIMITED_WEBHOOK_EVENTS: 'unlimited_webhook_events',
  UNLIMITED_WEBHOOK_URLS: 'unlimited_webhook_urls',
  // Free Plan Entitlements
  WEBHOOK_EVENTS_50_PER_DAY: 'webhook_events_50_per_day',
} as const;

/**
 * Type representing all available entitlement keys
 */
export type EntitlementKey = (typeof ENTITLEMENTS)[keyof typeof ENTITLEMENTS];

/**
 * Type representing a record of entitlements with boolean values
 */
export type EntitlementsRecord = Record<EntitlementKey, boolean>;

/**
 * Type representing partial entitlements (for checking specific entitlements)
 */
export type PartialEntitlementsRecord = Partial<EntitlementsRecord>;

/**
 * Entitlement categories for better organization
 */
export const ENTITLEMENT_CATEGORIES = {
  ADDONS: [ENTITLEMENTS.DEDICATED_SLACK_SUPPORT] as const,
  FREE_PLAN: [
    ENTITLEMENTS.WEBHOOK_EVENTS_50_PER_DAY,
    ENTITLEMENTS.SINGLE_WEBHOOK_URL,
    ENTITLEMENTS.BASIC_MONITORING,
    ENTITLEMENTS.CLI_EDITOR_ACCESS,
    ENTITLEMENTS.LOCAL_EVENT_ROUTING,
    ENTITLEMENTS.PUBLIC_WEBHOOK_URLS,
    ENTITLEMENTS.COMMUNITY_SUPPORT,
  ] as const,

  TEAM_PLAN: [
    ENTITLEMENTS.UNLIMITED_WEBHOOK_EVENTS,
    ENTITLEMENTS.UNLIMITED_WEBHOOK_URLS,
    ENTITLEMENTS.MCP_SERVER_ACCESS,
    ENTITLEMENTS.AI_POWERED_DEBUGGING,
    ENTITLEMENTS.TRACE_AI_AGENT_WORKFLOWS,
    ENTITLEMENTS.TEAM_WEBHOOK_SHARING,
    ENTITLEMENTS.UNLIMITED_DEVELOPERS,
    ENTITLEMENTS.PRIVATE_WEBHOOK_URLS,
    ENTITLEMENTS.CUSTOM_WEBHOOK_TRANSFORMATIONS,
    ENTITLEMENTS.CUSTOM_WEBHOOK_SUBDOMAINS,
    ENTITLEMENTS.ADVANCED_MONITORING_ANALYTICS,
    ENTITLEMENTS.ROUTE_TO_EXTERNAL_INTEGRATIONS,
  ] as const,
} as const;

/**
 * Entitlement metadata for better UX
 */
export const ENTITLEMENT_METADATA: Record<
  EntitlementKey,
  {
    name: string;
    description: string;
    category: 'free' | 'team' | 'addon';
    requiresUpgrade?: boolean;
  }
> = {
  [ENTITLEMENTS.WEBHOOK_EVENTS_50_PER_DAY]: {
    category: 'free',
    description: 'Process up to 50 webhook events per day',
    name: '50 Webhook Events Per Day',
  },
  [ENTITLEMENTS.SINGLE_WEBHOOK_URL]: {
    category: 'free',
    description: 'Create one webhook URL for testing',
    name: 'Single Webhook URL',
  },
  [ENTITLEMENTS.BASIC_MONITORING]: {
    category: 'free',
    description: 'Basic monitoring and logging of webhook events',
    name: 'Basic Webhook Monitoring',
  },
  [ENTITLEMENTS.CLI_EDITOR_ACCESS]: {
    category: 'free',
    description: 'Access to CLI tools and editor extensions',
    name: 'CLI & Editor Extension Access',
  },
  [ENTITLEMENTS.LOCAL_EVENT_ROUTING]: {
    category: 'free',
    description: 'Route webhook events to your local development environment',
    name: 'Local Event Routing',
  },
  [ENTITLEMENTS.PUBLIC_WEBHOOK_URLS]: {
    category: 'free',
    description: 'Create public webhook URLs accessible from the internet',
    name: 'Public Webhook URLs',
  },
  [ENTITLEMENTS.COMMUNITY_SUPPORT]: {
    category: 'free',
    description: 'Access to community support channels',
    name: 'Community Support',
  },
  [ENTITLEMENTS.UNLIMITED_WEBHOOK_EVENTS]: {
    category: 'team',
    description: 'Process unlimited webhook events',
    name: 'Unlimited Webhook Events',
    requiresUpgrade: true,
  },
  [ENTITLEMENTS.UNLIMITED_WEBHOOK_URLS]: {
    category: 'team',
    description: 'Create unlimited webhook URLs',
    name: 'Unlimited Webhook URLs',
    requiresUpgrade: true,
  },
  [ENTITLEMENTS.MCP_SERVER_ACCESS]: {
    category: 'team',
    description: 'Access to Model Context Protocol server for AI integration',
    name: 'MCP Server Access',
    requiresUpgrade: true,
  },
  [ENTITLEMENTS.AI_POWERED_DEBUGGING]: {
    category: 'team',
    description: 'AI-powered debugging capabilities through MCP server',
    name: 'AI-Powered Debugging with MCP Server',
    requiresUpgrade: true,
  },
  [ENTITLEMENTS.TRACE_AI_AGENT_WORKFLOWS]: {
    category: 'team',
    description: 'Trace and monitor AI agent workflows',
    name: 'Trace AI Agent Workflows',
    requiresUpgrade: true,
  },
  [ENTITLEMENTS.TEAM_WEBHOOK_SHARING]: {
    category: 'team',
    description: 'Share webhook URLs and configurations with team members',
    name: 'Team Webhook Sharing',
    requiresUpgrade: true,
  },
  [ENTITLEMENTS.UNLIMITED_DEVELOPERS]: {
    category: 'team',
    description: 'Add unlimited developers to your team',
    name: 'Unlimited Developers',
    requiresUpgrade: true,
  },
  [ENTITLEMENTS.PRIVATE_WEBHOOK_URLS]: {
    category: 'team',
    description: 'Create private webhook URLs with authentication',
    name: 'Private Webhook URLs',
    requiresUpgrade: true,
  },
  [ENTITLEMENTS.CUSTOM_WEBHOOK_TRANSFORMATIONS]: {
    category: 'team',
    description: 'Transform webhook payloads with custom logic',
    name: 'Custom Webhook Transformations',
    requiresUpgrade: true,
  },
  [ENTITLEMENTS.CUSTOM_WEBHOOK_SUBDOMAINS]: {
    category: 'team',
    description: 'Use custom subdomains for webhook URLs',
    name: 'Custom Webhook Subdomains',
    requiresUpgrade: true,
  },
  [ENTITLEMENTS.ADVANCED_MONITORING_ANALYTICS]: {
    category: 'team',
    description: 'Advanced monitoring, analytics, and insights',
    name: 'Advanced Monitoring & Analytics',
    requiresUpgrade: true,
  },
  [ENTITLEMENTS.ROUTE_TO_EXTERNAL_INTEGRATIONS]: {
    category: 'team',
    description: 'Route webhooks to external services and integrations',
    name: 'Route to External Integrations',
    requiresUpgrade: true,
  },
  [ENTITLEMENTS.DEDICATED_SLACK_SUPPORT]: {
    category: 'addon',
    description: 'Dedicated support through private Slack channel',
    name: 'Dedicated Slack Support',
    requiresUpgrade: true,
  },
};

/**
 * Helper type for entitlement arrays
 */
export type EntitlementArray = readonly EntitlementKey[];

/**
 * Helper type for checking if an entitlement requires upgrade
 */
export type EntitlementRequiringUpgrade = {
  [K in EntitlementKey]: (typeof ENTITLEMENT_METADATA)[K]['requiresUpgrade'] extends true
    ? K
    : never;
}[EntitlementKey];

/**
 * Helper type for free entitlements
 */
export type FreeEntitlement = {
  [K in EntitlementKey]: (typeof ENTITLEMENT_METADATA)[K]['category'] extends 'free'
    ? K
    : never;
}[EntitlementKey];

/**
 * Helper type for team entitlements
 */
export type TeamEntitlement = {
  [K in EntitlementKey]: (typeof ENTITLEMENT_METADATA)[K]['category'] extends 'team'
    ? K
    : never;
}[EntitlementKey];

/**
 * Helper type for addon entitlements
 */
export type AddonEntitlement = {
  [K in EntitlementKey]: (typeof ENTITLEMENT_METADATA)[K]['category'] extends 'addon'
    ? K
    : never;
}[EntitlementKey];
