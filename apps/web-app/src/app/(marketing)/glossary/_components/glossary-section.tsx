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
import { Input } from '@unhook/ui/input';
import { MagicCard } from '@unhook/ui/magicui/magic-card';
import { Search, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

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

const webhookTerms = {
  A: [
    {
      description:
        'An API endpoint is a specific URL within a web service that can receive webhook payloads. It acts as the destination where webhook data is sent and processed.',
      term: 'API Endpoint',
      tlDr: 'A specific URL that accepts webhook requests and processes them according to predefined rules.',
    },
    {
      description:
        "Webhook authentication methods like HMAC signatures, API keys, or OAuth tokens help verify that webhook requests come from legitimate sources and haven't been tampered with.",
      term: 'Authentication',
      tlDr: 'The process of verifying the identity of webhook senders to ensure data security.',
    },
    {
      description:
        'API keys are unique identifiers used to authenticate webhook requests and control access to webhook endpoints, ensuring only authorized applications can send webhook data.',
      term: 'API Key',
      tlDr: 'A unique identifier used to authenticate and authorize webhook requests.',
    },
  ],
  B: [
    {
      description:
        'Batch processing allows systems to handle multiple webhook events in a single operation, reducing overhead and improving performance when dealing with high volumes of events.',
      term: 'Batch Processing',
      tlDr: 'Processing multiple webhook events together instead of individually for improved efficiency.',
    },
    {
      description:
        'Backoff strategies automatically adjust retry intervals when webhook delivery fails, starting with short delays and gradually increasing to avoid overwhelming receiving systems.',
      term: 'Backoff Strategy',
      tlDr: 'A retry mechanism that gradually increases delay between failed webhook attempts.',
    },
  ],
  C: [
    {
      description:
        "A callback URL is the destination address that receives webhook payloads. It's the endpoint that gets called whenever the triggering event happens in the source system.",
      term: 'Callback URL',
      tlDr: 'The URL where webhook notifications are sent when specific events occur.',
    },
    {
      description:
        'The Content-Type header tells the receiving system how to parse the webhook payload. Most webhooks use application/json, but some may use application/x-www-form-urlencoded or other formats.',
      term: 'Content-Type',
      tlDr: 'HTTP header that specifies the format of webhook payload data (usually application/json).',
    },
    {
      description:
        'CORS (Cross-Origin Resource Sharing) policies control which domains can send webhook requests to your endpoints, providing an additional layer of security for webhook processing.',
      term: 'CORS',
      tlDr: 'Security policy that controls which domains can access your webhook endpoints.',
    },
  ],
  D: [
    {
      description:
        'When webhook delivery fails repeatedly, events are moved to a dead letter queue for manual inspection and potential reprocessing, preventing data loss.',
      term: 'Dead Letter Queue',
      tlDr: 'A storage mechanism for webhook events that failed to be processed after multiple retry attempts.',
    },
    {
      description:
        'Different webhook providers offer varying levels of delivery guarantees, from at-least-once delivery to exactly-once delivery, affecting how applications handle duplicate events.',
      term: 'Delivery Guarantee',
      tlDr: 'The assurance level that webhook events will be successfully delivered to their destination.',
    },
    {
      description:
        'Webhook debugging involves analyzing webhook requests, responses, and processing logic to identify and resolve issues in webhook implementations.',
      term: 'Debugging',
      tlDr: 'The process of identifying and fixing issues in webhook processing and delivery.',
    },
  ],
  E: [
    {
      description:
        'Event-driven architecture uses webhooks to decouple systems, allowing them to communicate asynchronously when specific events occur, improving scalability and maintainability.',
      term: 'Event-Driven Architecture',
      tlDr: 'A software design pattern where webhooks trigger actions based on system events.',
    },
    {
      description:
        'The event payload contains all relevant data about what happened, including timestamps, user information, and any changes that occurred, formatted as JSON or XML.',
      term: 'Event Payload',
      tlDr: 'The data structure sent in a webhook request containing information about the triggering event.',
    },
    {
      description:
        'End-to-end encryption ensures that webhook data is encrypted from the sender to the receiver, protecting sensitive information during transmission.',
      term: 'End-to-End Encryption',
      tlDr: 'Security method that encrypts webhook data throughout its entire journey from sender to receiver.',
    },
  ],
  F: [
    {
      description:
        'Fan-out patterns allow one event to trigger multiple webhook endpoints, enabling complex workflows where different systems need to react to the same event.',
      term: 'Fan-out',
      tlDr: 'Sending a single webhook event to multiple destinations simultaneously.',
    },
    {
      description:
        'Webhook filtering allows you to process only specific events based on criteria like event type, user ID, or custom attributes, reducing unnecessary processing.',
      term: 'Filtering',
      tlDr: 'Selectively processing webhook events based on specific criteria or conditions.',
    },
  ],
  H: [
    {
      description:
        'HTTP status codes like 200 (success), 4xx (client errors), and 5xx (server errors) help webhook providers understand if delivery was successful and determine retry strategies.',
      term: 'HTTP Status Codes',
      tlDr: 'Standard response codes that indicate the success or failure of webhook delivery.',
    },
    {
      description:
        'HMAC (Hash-based Message Authentication Code) signatures use a secret key to create a unique hash of the webhook payload, allowing receivers to verify the request came from the expected sender.',
      term: 'HMAC Signature',
      tlDr: 'A cryptographic method to verify webhook authenticity and prevent tampering.',
    },
    {
      description:
        'HTTP headers in webhook requests contain metadata like Content-Type, User-Agent, and custom headers that provide context about the request and its origin.',
      term: 'HTTP Headers',
      tlDr: 'Metadata fields in webhook requests that provide context and control request behavior.',
    },
  ],
  I: [
    {
      description:
        "Idempotent webhook processing ensures that processing the same event multiple times (due to retries) doesn't cause duplicate actions or data corruption.",
      term: 'Idempotency',
      tlDr: 'The property that allows webhook processing to be safely repeated without side effects.',
    },
    {
      description:
        'Webhook integration involves connecting external services and applications through webhook endpoints to enable real-time data exchange and automation.',
      term: 'Integration',
      tlDr: 'The process of connecting systems and services through webhook endpoints.',
    },
  ],
  J: [
    {
      description:
        "JSON webhooks are the standard format for modern webhook implementations, providing structured, human-readable data that's easy to parse and process.",
      term: 'JSON Webhook',
      tlDr: 'A webhook that sends data in JSON format, the most common webhook payload format.',
    },
  ],
  L: [
    {
      description:
        'Local development with webhooks involves testing webhook endpoints on your local machine before deploying to production, using tools to route external webhooks to localhost.',
      term: 'Local Development',
      tlDr: 'Testing webhook endpoints locally before deploying to production environments.',
    },
    {
      description:
        'Webhook logging captures detailed information about incoming requests, processing steps, and responses for debugging, monitoring, and audit purposes.',
      term: 'Logging',
      tlDr: 'Recording webhook events and processing details for debugging and monitoring.',
    },
  ],
  M: [
    {
      description:
        'Webhook monitoring involves tracking the health, performance, and reliability of webhook endpoints to ensure they are functioning correctly and meeting SLAs.',
      term: 'Monitoring',
      tlDr: 'Tracking webhook endpoint health, performance, and reliability in real-time.',
    },
    {
      description:
        'Middleware in webhook processing allows you to add custom logic, validation, or transformation between receiving a webhook and processing it.',
      term: 'Middleware',
      tlDr: 'Custom processing logic that runs between webhook reception and final processing.',
    },
  ],
  N: [
    {
      description:
        'Webhook notifications are real-time alerts sent from one system to another when specific events occur, enabling immediate response to important changes.',
      term: 'Notifications',
      tlDr: 'Real-time alerts sent between systems when specific events occur.',
    },
  ],
  O: [
    {
      description:
        'OAuth tokens are used to authenticate webhook requests, providing secure access to protected resources without sharing sensitive credentials.',
      term: 'OAuth',
      tlDr: 'An authentication protocol used to secure webhook access to protected resources.',
    },
  ],
  P: [
    {
      description:
        'The webhook payload contains all the relevant information about the event that occurred, including metadata, timestamps, and any associated data that needs to be processed.',
      term: 'Payload',
      tlDr: 'The actual data sent in a webhook request containing event information.',
    },
    {
      description:
        'Polling involves regularly querying an API to check for new events, as opposed to webhooks which push events immediately when they occur.',
      term: 'Polling',
      tlDr: 'An alternative to webhooks where systems repeatedly check for new data instead of receiving push notifications.',
    },
    {
      description:
        'Webhook providers are services that send webhook notifications when events occur in their systems, such as payment processors, version control platforms, or SaaS applications.',
      term: 'Provider',
      tlDr: 'A service that sends webhook notifications when events occur in their system.',
    },
  ],
  Q: [
    {
      description:
        'Webhook queuing systems store incoming webhook events in a queue for processing, ensuring reliable delivery even when the receiving system is temporarily unavailable.',
      term: 'Queuing',
      tlDr: 'Storing webhook events in a queue for reliable processing and delivery.',
    },
  ],
  R: [
    {
      description:
        "Rate limiting ensures that webhook endpoints don't receive too many requests too quickly, protecting both the sender and receiver from performance issues.",
      term: 'Rate Limiting',
      tlDr: 'Controlling the frequency of webhook requests to prevent system overload.',
    },
    {
      description:
        'Retry logic automatically attempts to redeliver webhook requests that failed, typically using exponential backoff to avoid overwhelming the receiving system.',
      term: 'Retry Logic',
      tlDr: 'Automatic re-attempts to deliver failed webhook requests with exponential backoff.',
    },
    {
      description:
        'Webhook routing determines which endpoint or service should receive and process incoming webhook events based on rules, filters, or routing logic.',
      term: 'Routing',
      tlDr: 'Directing webhook events to the appropriate endpoints or services for processing.',
    },
  ],
  S: [
    {
      description:
        'Secret keys are used in webhook authentication to create signatures that verify the authenticity and integrity of webhook requests.',
      term: 'Secret Key',
      tlDr: 'A private key used to sign and verify webhook requests for security.',
    },
    {
      description:
        "Signature verification involves checking that webhook requests were actually sent by the expected source and haven't been modified in transit.",
      term: 'Signature Verification',
      tlDr: 'The process of validating webhook signatures to ensure request authenticity.',
    },
    {
      description:
        'SSL/TLS encryption secures webhook communications by encrypting data in transit, preventing unauthorized access to sensitive webhook payloads.',
      term: 'SSL/TLS',
      tlDr: 'Security protocols that encrypt webhook data during transmission.',
    },
    {
      description:
        'Webhook security involves implementing measures like authentication, encryption, and validation to protect webhook endpoints and data from unauthorized access.',
      term: 'Security',
      tlDr: 'Protecting webhook endpoints and data from unauthorized access and tampering.',
    },
  ],
  T: [
    {
      description:
        'Webhook timeouts prevent requests from hanging indefinitely, ensuring that failed deliveries are detected and can be retried appropriately.',
      term: 'Timeout',
      tlDr: 'The maximum time a webhook request will wait for a response before failing.',
    },
    {
      description:
        'TLS (Transport Layer Security) and SSL (Secure Sockets Layer) encrypt webhook communications, ensuring that sensitive data cannot be intercepted during transmission.',
      term: 'TLS/SSL',
      tlDr: 'Security protocols that encrypt webhook data in transit to prevent interception.',
    },
    {
      description:
        'Webhook testing involves validating that webhook endpoints correctly process incoming requests, handle errors, and integrate properly with other systems.',
      term: 'Testing',
      tlDr: 'Validating webhook endpoints and their integration with other systems.',
    },
  ],
  U: [
    {
      description:
        'Webhook URLs are the complete addresses where webhook notifications are sent, typically following patterns like https://api.example.com/webhooks/events.',
      term: 'URL',
      tlDr: 'The complete address where webhook notifications are sent.',
    },
  ],
  V: [
    {
      description:
        'Webhook verification typically involves responding to a challenge request to prove that the endpoint is owned by the intended recipient and can process webhook requests.',
      term: 'Verification',
      tlDr: 'The process of confirming webhook endpoint ownership and functionality.',
    },
    {
      description:
        'Webhook validation ensures that incoming webhook requests contain the expected data structure, format, and required fields before processing.',
      term: 'Validation',
      tlDr: 'Checking webhook requests for correct format, structure, and required data.',
    },
  ],
  W: [
    {
      description:
        'Webhooks are HTTP callbacks that allow one application to notify another application about events in real-time, enabling event-driven integrations between systems.',
      term: 'Webhook',
      tlDr: 'A way for applications to send real-time data to other applications when specific events occur.',
    },
    {
      description:
        'A webhook URL is the full endpoint address (e.g., https://api.example.com/webhooks/orders) that receives webhook notifications when events occur.',
      term: 'Webhook URL',
      tlDr: 'The complete address where webhook notifications are sent, including protocol and path.',
    },
    {
      description:
        'Webhook workflows are automated sequences of actions triggered by webhook events, enabling complex business logic and system integrations.',
      term: 'Workflow',
      tlDr: 'Automated sequences of actions triggered by webhook events.',
    },
  ],
};

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function GlossarySection() {
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten all terms for search
  const allTerms = useMemo(() => {
    return Object.entries(webhookTerms).flatMap(([letter, terms]) =>
      terms.map((term) => ({ ...term, letter })),
    );
  }, []);

  // Scroll to term when page loads with hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = decodeURIComponent(window.location.hash.slice(1)); // Remove the # symbol and decode
      if (hash) {
        console.log('Hash found:', hash);
        // Find the term in allTerms to check if it exists
        const termExists = allTerms.some((term) => term.term === hash);
        console.log('Term exists:', termExists);
        if (termExists) {
          // Small delay to ensure the component is rendered
          setTimeout(() => {
            const element = document.getElementById(hash);
            console.log('Element found:', element);
            if (element) {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }
          }, 500); // Increased delay to ensure rendering
        }
      }
    }
  }, [allTerms]);

  // Filter terms based on search query or selected letter
  const filteredTerms = useMemo(() => {
    // If there's a search query, filter all terms
    if (searchQuery.trim()) {
      return allTerms.filter(
        (term) =>
          term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
          term.tlDr.toLowerCase().includes(searchQuery.toLowerCase()) ||
          term.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // If a specific letter is selected, show only that letter's terms
    if (selectedLetter && selectedLetter !== 'ALL') {
      return webhookTerms[selectedLetter as keyof typeof webhookTerms] || [];
    }

    // Default: show all terms
    return allTerms;
  }, [searchQuery, selectedLetter, allTerms]);

  return (
    <section className="w-full relative py-24" id="glossary">
      <div className="relative flex flex-col items-center w-full px-6">
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
              Webhook Terminology
            </Badge>
          </motion.div>

          <motion.div variants={fadeInUpVariants}>
            <H1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance mb-6">
              Webhook Glossary
            </H1>
          </motion.div>

          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
            variants={fadeInUpVariants}
          >
            A comprehensive guide to webhook terminology and concepts.
            Understand the key terms and definitions used in webhook development
            and integration.
          </motion.p>

          <motion.div variants={fadeInUpVariants}>
            <Button asChild className="rounded-full" size="lg">
              <a
                href="https://docs.unhook.sh"
                rel="noopener noreferrer"
                target="_blank"
              >
                View Documentation
              </a>
            </Button>
          </motion.div>
        </motion.div>

        {/* Main Content with Sidebar */}
        <motion.div
          animate="visible"
          className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6"
          initial="hidden"
          variants={staggerContainer}
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Sidebar */}
            <motion.div
              className="w-64 flex-shrink-0"
              variants={fadeInUpVariants}
            >
              <div className="sticky top-15">
                <H2 className="text-lg font-semibold mb-4">Find a term</H2>
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    type="text"
                    value={searchQuery}
                  />
                </div>

                {/* Alphabet Navigation */}
                <div className="flex flex-wrap gap-1">
                  {/* ALL button */}
                  <button
                    className={`px-2 py-1 text-sm font-medium transition-all duration-200 ${
                      selectedLetter === 'ALL'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    key="ALL"
                    onClick={() => setSelectedLetter('ALL')}
                    type="button"
                  >
                    ALL
                  </button>

                  {alphabet.map((letter) => {
                    const hasTerms =
                      webhookTerms[letter as keyof typeof webhookTerms]
                        ?.length > 0;
                    return (
                      <button
                        className={`px-2 py-1 text-sm font-medium transition-all duration-200 ${
                          !hasTerms
                            ? 'text-muted-foreground/40 cursor-not-allowed'
                            : selectedLetter === letter
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                        disabled={!hasTerms}
                        key={letter}
                        onClick={() => hasTerms && setSelectedLetter(letter)}
                        type="button"
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Terms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTerms.map((term, index) => (
                  <motion.div
                    id={term.term}
                    key={`${term.term}-${index}`}
                    variants={fadeInUpVariants}
                  >
                    <Card className="p-0 max-w-sm w-full shadow-none border-none h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
                      <button
                        aria-label={`View details for ${term.term}`}
                        className="w-full h-full text-left bg-transparent border-none p-0 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => {
                          const url = new URL(window.location.href);
                          url.hash = `#${term.term}`;
                          window.history.pushState({}, '', url);
                        }}
                        type="button"
                      >
                        <MagicCard
                          className="p-0 h-full flex flex-col"
                          gradientColor="var(--muted)"
                          gradientFrom="var(--primary)"
                          gradientOpacity={0.6}
                          gradientTo="var(--secondary)"
                        >
                          <CardHeader className="border-b border-border p-4 [.border-b]:pb-4 flex-shrink-0">
                            <CardTitle className="text-lg font-semibold text-primary mb-3">
                              {term.term}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="h-4 w-4 text-primary" />
                              <Badge className="text-xs" variant="outline">
                                TL;DR
                              </Badge>
                            </div>
                            <CardDescription className="text-sm leading-relaxed min-h-[60px]">
                              {term.tlDr}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 flex-1 flex flex-col">
                            <CardDescription className="text-sm leading-relaxed flex-1">
                              {term.description}
                            </CardDescription>
                          </CardContent>
                        </MagicCard>
                      </button>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* No Terms Message */}
              {filteredTerms.length === 0 && (
                <motion.div
                  className="text-center py-12"
                  variants={fadeInUpVariants}
                >
                  <P className="text-muted-foreground">
                    {searchQuery
                      ? `No webhook terms found matching "${searchQuery}". Try a different search term.`
                      : selectedLetter === 'ALL'
                        ? 'No webhook terms found. Check back soon for more terms!'
                        : `No webhook terms found for letter "${selectedLetter}". Check back soon for more terms!`}
                  </P>
                </motion.div>
              )}
            </div>
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
            Need help with webhooks?
          </H2>
          <P className="text-muted-foreground mb-6">
            Start building with Unhook today and get real-time webhook testing
            and management.
          </P>
          <Button asChild className="rounded-full">
            <a href="/app/onboarding">Get Started with Unhook</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
