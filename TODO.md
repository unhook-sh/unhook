# Unhook Todo List - Organized Backlog

## Priority Matrix

### P0 - Critical (Do immediately)
- Authentication/VSCode bugs
- Billing issues
- Data integrity issues

### P1 - High (Do this week)
- Core VSCode features
- Dashboard improvements
- Basic documentation

### P2 - Medium (Do this month)
- Marketing site
- Analytics
- Performance optimizations

### P3 - Low (Future roadmap)
- Advanced features
- New integrations
- Workflow automation

## Effort Estimates

- **Low**: < 2 hours
- **Medium**: 2-8 hours
- **High**: > 8 hours or requires significant architecture changes

## 🚨 Critical Bugs (High Priority, Low-Medium Effort)

### VSCode Issues
- [ ] Vscode not signing in on dev
- [ ] I think in dev it's pointing to the wrong endpoint
- [ ] Fix issue where if user clicks sign in twice it doesn't work
- [ ] Issue with hitting replay doesn't make the latest request show up but it goes through
- [x] Vscode not seeing events
- [x] VScode refreshing auth and not seeing events
- [x] Fix issue where realtime is anon

### Billing & Subscription Issues
- [ ] Redirect from billing stripe page doesn't go back to the correct page
- [ ] Downgrade is on the wrong button on billing page
- [ ] Invoices formatting is wrong showing id
- [ ] Subscription metrics are incorrect
- [ ] Billing page styles are messed up
- [x] Upserting org keeps creating new stripe subscription
- [x] Sidebar notification for billing usage doesn't keep showing

### Data & Request Issues
- [ ] (P0) Fix issue where requests are getting created twice when an event comes in
- [ ] Copying event in vscode doesn't decode the body from base64
- [ ] Add idempotency key
- [ ] Make sure to only get requests for an individual user
- [x] Optimize getting events by webhook id with cursor/pagination
- [x] Set max on get events
- [x] Playground isn't actually sending events

## 🔧 Core Features (High Priority, Medium Effort)

### VSCode Extension Enhancements
- [ ] Add upgrade account in vscode
- [ ] Toggle auto refresh
- [ ] Make it so that the unhook bottom bar turns red if the unhook.yml doesn't exist
- [ ] Reorder vscode things
- [ ] Create a vscode command to setup the MCP server
- [ ] Add report bug to vscode
- [ ] Make transparent logo for vscode
- [ ] Bug with vscode icons not showing up

### Dashboard & UI Improvements
- [ ] Add vscode link and cli link in the web app side bar
- [ ] Make it so that the auth code page has instructions on the yaml file and webhook url
- [ ] Make it so that we show the event name in the notification in vscode
- [x] Make sure to create a default api key when an org is created
- [x] When installing from vscode, need to make a default webhook
- [x] Add default event to show events
- [x] Add example curl

### Real-time & Performance
- [x] I think when the user logs in we need to read the config right away
- [x] Move to realtime

## 🗄️ Data Storage & Architecture (Medium Priority, High Effort)

- [x] Fix issue where we are creating too many orgs to 1 users as well as webhooks
- [x] Create script to clean up pegs and database
- [x] Store payload in s3
- [x] Remove request.request and just use request.event.originalRequest

## 📚 Documentation & Setup (Medium Priority, Low Effort)

- [ ] Create docs for MCP server
- [ ] Add "install cli / vscode /etc" to dashboard
- [ ] Somehow get on everyone's docs (e.g., https://www.hanko.io/oss-friends)
- [ ] bun x --bun @magicuidesign/cli@latest install cursor
- [x] Add script copy button https://magicui.design/docs/components/script-copy-btn

## 🎨 Marketing & Landing Page (Medium Priority, Medium Effort)

### Marketing Site Updates
- [ ] Make sure to point out that you can use the same webhook across all the services
- [ ] Show config based routing
- [ ] Show analytics
- [ ] Make it more geared towards checking in a file and keeping it in git for your team
- [ ] Add section for AI
- [ ] Show mock hooks events from services
- [ ] Open source emphasis
- [ ] svix play section
- [ ] Make social share image
- [x] Issue with icons for images
- [x] "What is a webhook?" section

### Versus Pages
- [x] vs Ngrok
- [x] vs SVIX
- [x] vs localtunnel
- [x] vs CloudFront Reverse Proxy
- [x] vs smee
- [x] vs XXX (other competitors)

### Key Features to Highlight
- [ ] One hook to rule them all
  - [ ] Loop through different destination examples (?destination=local, ?destination=local&d=slack, ?destination=email)
- [ ] Directly integrate (Stripe, Clerk, Slack, etc)
- [ ] No more changing urls
- [ ] Automatically get notified everywhere for any service with one URL

## 📊 Dashboard Analytics (Medium Priority, Medium Effort)

- [ ] /app/events is slow
- [ ] Stats: Failure rate
- [ ] Chart of the number of requests success/failure
- [ ] Analytics dashboard
- [ ] Maybe add cli command in main dashboard
- [ ] Webhooks page
- [ ] Webhook ID page with Settings and Delivery rules
- [ ] Private webhooks functionality
- [x] Team management page

## 💰 Pricing & Business Model (Low Priority, Low Effort)

- [ ] 1 public url for free
- [ ] Unlimited private urls
- [ ] Analytics
- [ ] 1 team members
- [ ] Enterprise team members
- [ ] Add subdomain support
- [ ] Private (API KEY) webhooks
- [ ] $10.00 / user

## 🔮 Future Features (Low Priority, High Effort)

### Advanced Webhook Features
- [ ] Webhook verification system
- [ ] Rate limiting at the tunnel level
- [ ] Multi org auth by using webhook id in storage json
- [ ] Error alerting (via Slack/email)
- [ ] Full webhook service like svix for 3rd party
- [x] Create a synthetic webhook

### Integrations & Extensions
- [ ] MCP Server integration
- [ ] Integrate with SVIX to take their users
- [ ] Easy integration for next.js
- [ ] Docker support for local CLI
- [ ] Electron app

### Workflow & Automation
- [ ] Drag drop UI for webhook event delivery workflows
- [ ] Add mocks in config
- [ ] Be able to add custom headers/cookies from tunnel config
- [x] Watch config for changes

## 🚀 Marketing & Distribution (Low Priority, Low Effort)

### Channels
- [ ] Hacker News
- [ ] Twitter
- [ ] Reddit
- [ ] Magic ui
- [ ] LinkedIn
- [ ] R/supabase
- [ ] R/next
- [ ] Add to firefrawl

## 📝 Production Checklist (Reference)

### Before Launch
- [x] Make sure to add stripe ids
- [x] Make sure to create default API key

### Production Issues to Fix
- [x] Refreshing /webhooks/create refreshes icon every time we come back to the page
- [x] We are not redirecting them to init if the webhook is inactive or deleted
- [x] If the user is not in the db we need to create it when we initialize the app
- [x] Installing cli after we run a build on github workflow doesn't work

### Completed Items (from original list)
- [x] Billing page takes a while to load
- [x] Slight issue with scrolling horizontally
- [x] Various auth and setup issues (marked as completed in original)

## 🧪 Testing & Development Features (Medium Priority, Medium Effort)

### CLI Enhancements
- [ ] Add rate limiting at the tunnel level
- [ ] Add per user config (i.e. "userId": { delivery: {"destination", "source"} })
- [ ] Simplify showing install / init command on readme and marketing site
- [ ] Fix issue with view request / response (currently you have to hit left or right to see it)
- [ ] We need to check that the webhook exists otherwise go back to init
- [ ] Add docs during onboarding for selecting different services like Stripe
- [x] Create UI with table view, grid view, metrics, details view
- [x] Add org name to init
- [x] Fix Events table wrapping

### Webhook Verification & Security
- [ ] Add verification system with header/signature support
- [ ] Be able to pass in signature through env var for verification
- [x] Make it so you can create new org

### Advanced CLI Features
- [ ] Be able to add mocks in config
- [ ] Add ability to list available tunnels
- [ ] Make it so you can have custom tunnel names (t_seawatts)
- [ ] Make it so you can redirect to services like "Slack" directly
- [ ] Make it so we can wait for it to return from the client (proxy back to webhook sender)
- [ ] Add headless and debug option for the cli
- [ ] Keep track of when we are retrying
- [ ] Add config where they can select headers to map event types and expired at field
- [ ] Add ability to delete request
- [ ] Be able to select in cli and see request details and press replay
- [ ] Be able to show history and hit replay all
- [ ] Add filtering in cli
- [ ] Add env vars for mock requests
- [ ] Make it so we can specify endpoint when creating mock event
- [ ] Add optimistic entry when you hit (r) for retry
- [ ] Use Tabs in response details
- [ ] Fix truncating columns issue
- [ ] Add loading and empty state to requests table
- [ ] Use overflow hidden on table
- [ ] Error when trying to have ping set to true or url - connectionId not setup
- [ ] Add auto timeout for requests to fail after X time
- [ ] Figure out how to not scroll to bottom when switching rendering
- [ ] Have expired at config (Stripe is 300 seconds)
- [ ] Show help for why latency turns yellow and red
- [ ] Maybe add Connection status to requests page
- [ ] Protect main branch from getting pushed by other contributors
- [ ] Add integration tests
- [ ] Add Stripe-like fixtures for sending random events from services
- [ ] Add templated header allow list like clerk for svix
- [ ] Add time to live and auto removal of requests
- [ ] Make dropdown of all events that could be sent as demo events
- [ ] Fix auto-scrolling to bottom
- [ ] For curl GET /tunnels/id return fancy ascii text
- [ ] Add more vim hotkeys (gg goes to top of first page)
- [ ] Add config filter for event type names
- [ ] Webhook Observability for prod data
- [ ] Add ability to add headers or cookies from tunnel config
- [ ] Make connection icon pulse
- [ ] Make it so you can press c to copy request from table
- [ ] Make electron app
- [ ] Use node-notifier for connect/disconnect/event notifications
- [ ] Make request to disconnect when closing client
- [ ] Make it so you can quickly copy payload and headers
- [ ] Make audit log of connect/disconnect from cli
- [ ] Keep track of connected state and record to db
- [ ] How to do presets for Stripe/Clerk
- [ ] Add switch org in cli login
- [ ] Backfill requests when client connects

## 🏗️ Infrastructure & Architecture (High Priority, High Effort)

### URL & Routing Configuration
- [ ] Support for integration parameters (?integration=slack&integration=email)
- [ ] Custom tunnel routing with port/endpoint config in file
- [x] URL pattern improvements for endpoints (e.g., https://unhook.sh/t_123?e=webhook/clerk)

### Performance & Scaling
- [ ] Setup SQS queue with lambda for webhook request handling
- [ ] Local config with publishable/private key system
- [x] Connection database setup

## ✅ Completed Production Checklist Items

### Authentication & Setup (Completed)
- [x] Bug where webhook isn't in db when validating webhook
- [x] Issue where after we do init and then go back to events page we don't have valid subscription
- [x] Streaming doesn't update on events table
- [x] Make it so we publish @unhook/client on github actions
- [x] Docs at docs.unhook.sh
- [x] README documentation
- [x] Ensure we can replay requests (currently crashes)
- [x] Auth error when loading cli
- [x] Add enter to open login
- [x] Onboarding flow improvements
- [x] Change "from" to "source" and "to" to "destination"
- [x] Turn off trpc query logs in cli
- [x] Rename "forward" to "deliver"
- [x] Redirect to homepage after init
- [x] Add org switcher to cli login page
- [x] Add logout button
- [x] Unhook command picking up config
- [x] Auto create default org
- [x] Fix styles on sign in with auth for cli
- [x] Remove select tunnel during cli login
- [x] Event subscription working
- [x] Listen/Init/Login navigation
- [x] Tie webhook id to auth code
- [x] Move to supabase client or trpc
- [x] Setup row level security
- [x] Fix webhook url on menu
- [x] Handle JWT auth expiration gracefully
- [x] Sort event table by timestamp
- [x] Make sure requests are forwarded
- [x] Navigation hotkeys fixed
- [x] Requests showing up
- [x] Logger working
- [x] Subscription connection closing on ctrl+c
- [x] Access token provided to createClient
- [x] Add authz to tunnelId when logging in
- [x] Filter requests by user/org/tunnelId
- [x] Analytics setup
- [x] Limit vercel spend
- [x] Vscode extension
- [x] PostHog integration
- [x] Make it so you can create new org
- [x] Add version variable for runtime checks
- [x] Add view docs menu item
- [x] Make "from" optional in init
- [x] Don't create request when no delivery rule
- [x] Auto select last org id for cli login
- [x] Move to clack for init command
- [x] Add report issue menu item
- [x] New webhook working on init
- [x] Setup supabase locally

### Additional Completed Features
- [x] Add documentation links in cli
- [x] CLI UI improvements (api key display, escape navigation)
- [x] Request details page shows all attempts
- [x] Add attempt column
- [x] Pull verificationWindowMs into global config
- [x] Add ability to have non-localhost destination
- [x] Fix width truncating of requests table
- [x] Replay failed messages
- [x] Add docs and marketing site
- [x] Ship binary and submit to brew
- [x] Add tunnel url display
- [x] Add base url display
- [x] Automate changeset release
- [x] Add allowed IP address
- [x] Paid features structure
- [x] Fix tab colors and selection
- [x] Move request details above tabs
- [x] Put request details in table
- [x] Add event and requests to details page
- [x] Add retry columns
- [x] Add response body to request details
- [x] Get production keys into infisical
- [x] Show retry status
- [x] Add expired at header
- [x] Move to bun
- [x] Turn off posthog telemetry option
- [x] Make auth cli login automatic
- [x] Add posthog and sentry to cli
- [x] Add source to request db
- [x] Event/request structure for retries
- [x] Track entire request url
- [x] Local cache file for client id
- [x] Name search param
- [x] Remove redirect page template
- [x] Fix webhook url on homepage
- [x] Fix ping redirect connectionId error
- [x] Change agent header on replay
- [x] Tunnel port configuration
- [x] Add ability to create new tunnel from cli
- [x] Network reconnect for useSubscription
- [x] Add posthog event for config file loaded
- [x] Create cli login system with clerk jwt
- [x] Auto focus sign in with auth
- [x] Watch for config changes
- [x] Fix replay
- [x] Marketing site
- [x] Run with no config and public url
- [x] Onboarding flow
- [x] Auth improvements
- [x] Use keyring for credentials
- [x] Anonymous posthog user creation
- [x] Add logging to file
- [x] Add local webhook testing
- [x] Fix request body on failed request
- [x] Track webhooks waiting for client
- [x] Track service type (stripe vs clerk)
- [x] Track retry requests with correct timestamp

## 🔗 Reference Links

- https://youtube.com/shorts/BYpirNrDV1Y?si=3n8__VJpZzRhDLF7
- https://ngrok.com/docs/integrations/clerk/webhooks/
- https://news.ycombinator.com/item?id=38559139
- https://news.ycombinator.com/item?id=44158399
- https://magicui.design/docs/mcp
- https://www.svix.com/ingest/
- https://infisical.com/docs/cli/overview#arch-linux

### Webhook URL Pattern Example
```
https://unhook.sh/t_123?e=webhook/clerk
```

### Vercel Webhook Verification Example
```javascript
const crypto = require('crypto');

async function verifySignature(req) {
  const payload = await req.text();
  const signature = crypto
    .createHmac('sha1', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return signature === req.headers['x-vercel-signature'];
}
```
