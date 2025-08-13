# VS Code Extension Analytics Events

This document outlines all the PostHog analytics events being tracked in the Unhook VS Code extension.

## Extension Lifecycle Events

### Extension Management
- **`extension_activated`** - When the extension is activated
  - Properties:
    - `activation_time_ms`: Time taken to activate the extension
    - `has_config_file`: Whether a configuration file exists
    - `workspace_folders`: Number of workspace folders
  - Location: Extension activation

- **`extension_deactivated`** - When the extension is deactivated
  - Properties: None
  - Location: Extension deactivation

## Authentication Events

### Sign In/Out Actions
- **`auth_sign_in_success`** - When user successfully signs in
  - Properties:
    - `method`: Authentication method (e.g., "vscode_authentication")
  - Location: Auth commands

- **`auth_sign_in_failed`** - When sign-in fails
  - Properties:
    - `reason`: Reason for failure (e.g., "no_session_returned")
  - Location: Auth commands

- **`auth_sign_out_success`** - When user successfully signs out
  - Properties: None
  - Location: Auth commands

- **`auth_sign_in_cancelled`** - When user cancels authentication
  - Properties: None
  - Location: Auth commands

### User Management
- **`user_signed_in`** - When user transitions to signed-in state
  - Properties:
    - `method`: Authentication method (e.g., "vscode")
  - Location: Analytics service

- **`user_signed_out`** - ~~When user transitions to signed-out state~~ **DEPRECATED**: This event was automatically tracked on any auth state change. Now use `auth_sign_out_success` or `quick_pick_sign_out` for explicit logout tracking.
  - Properties: None
  - Location: Analytics service

## Events Management

### Event Interactions
- **`events_refresh`** - When user refreshes the events list
  - Properties: None
  - Location: Events commands

- **`events_expand_all`** - When user expands all events
  - Properties: None
  - Location: Events commands

- **`events_collapse_all`** - When user collapses all events
  - Properties: None
  - Location: Events commands

- **`events_filter`** - When user applies or clears event filters
  - Properties:
    - `filter_text`: The filter text applied
    - `action`: Whether filter was "applied" or "cleared"
  - Location: Events commands

### Individual Event Actions
- **`event_view`** - When user views event details
  - Properties:
    - `event_id`: The ID of the event being viewed
    - `event_name`: The name/type of the event
    - `source`: The source of the event
  - Location: Events commands

- **`event_copy`** - When user copies event data
  - Properties:
    - `event_id`: The ID of the event being copied
    - `event_name`: The name/type of the event
    - `source`: The source of the event
  - Location: Events commands

- **`event_replay`** - When user replays an event
  - Properties:
    - `event_id`: The ID of the event being replayed
    - `event_name`: The name/type of the event
    - `source`: The source of the event
    - `event_type`: Type of event (e.g., "event")
  - Location: Events commands

### Request Actions
- **`request_view`** - When user views request details
  - Properties:
    - `request_id`: The ID of the request being viewed
    - `event_id`: The ID of the parent event
    - `event_name`: The name/type of the parent event
    - `source`: The source of the event
  - Location: Events commands

- **`request_replay`** - When user replays a request
  - Properties:
    - `request_id`: The ID of the request being replayed
    - `event_id`: The ID of the parent event
    - `event_name`: The name/type of the parent event
    - `source`: The source of the event
    - `event_type`: Type of event (e.g., "request")
  - Location: Events commands

## Configuration Management

### Configuration File Operations
- **`config_file_created`** - When user creates a new configuration file
  - Properties:
    - `filename`: Name of the created file
    - `workspace`: Name of the workspace
    - `has_webhook_id`: Whether user has a webhook ID
  - Location: Config commands

- **`config_file_opened`** - When user opens a configuration file
  - Properties:
    - `config_path`: Path to the opened config file
  - Location: Config panel commands

- **`config_file_path_set`** - When user sets a custom config file path
  - Properties:
    - `new_path`: The new path set
  - Location: Settings commands

### Server Configuration
- **`server_urls_configured`** - When user configures server URLs
  - Properties:
    - `type`: Configuration type ("cloud" or "self_hosted")
    - `api_url`: The API URL configured
    - `dashboard_url`: The dashboard URL configured
  - Location: Config commands

### Configuration Panel Actions
- **`config_panel_refresh`** - When user refreshes the configuration panel
  - Properties: None
  - Location: Config panel commands

- **`config_value_copied`** - When user copies a configuration value
  - Properties:
    - `key`: The configuration key copied
    - `value_type`: The type of value copied
  - Location: Config panel commands

## Polling Management

### Polling Operations
- **`polling_started`** - When polling is started
  - Properties: None
  - Location: Polling commands

- **`polling_paused`** - When polling is paused
  - Properties: None
  - Location: Polling commands

- **`polling_resumed`** - When polling is resumed
  - Properties: None
  - Location: Polling commands

- **`polling_stopped`** - When polling is stopped
  - Properties: None
  - Location: Polling commands

- **`polling_toggled_pause`** - When polling is toggled to pause
  - Properties: None
  - Location: Polling commands

- **`polling_toggled_resume`** - When polling is toggled to resume
  - Properties: None
  - Location: Polling commands

## Webhook Access

### Access Requests
- **`webhook_access_requested`** - When user requests access to a webhook
  - Properties:
    - `has_message`: Whether user provided a message
    - `message_length`: Length of the message provided
  - Location: Webhook access commands

## Settings Management

### Output Settings
- **`auto_show_output_toggled`** - When auto-show output setting is toggled
  - Properties:
    - `new_value`: The new setting value
  - Location: Settings commands

- **`output_focused`** - When output panel is focused
  - Properties: None
  - Location: Output commands

- **`output_cleared`** - When output panel is cleared
  - Properties: None
  - Location: Output commands

- **`output_toggled`** - When output panel is toggled
  - Properties: None
  - Location: Output commands

### Event Settings
- **`auto_clear_events_toggled`** - When auto-clear events setting is toggled
  - Properties:
    - `new_value`: The new setting value
  - Location: Settings commands

### Notification Settings
- **`notifications_toggled`** - When event notifications setting is toggled
  - Properties:
    - `new_value`: The new setting value
  - Location: Settings commands

## Sign-in Notification Preferences

### Preference Resets
- **`sign_in_notification_reset_all`** - When all sign-in notification preferences are reset
  - Properties: None
  - Location: Sign-in notification commands

- **`sign_in_notification_reset_workspace`** - When workspace-specific sign-in notification preference is reset
  - Properties: None
  - Location: Sign-in notification commands

- **`sign_in_notification_reset_global`** - When global sign-in notification preference is reset
  - Properties: None
  - Location: Sign-in notification commands

## Quick Pick Usage

### Quick Pick Actions
- **`quick_pick_show_from_status_bar`** - When quick pick is shown from status bar
  - Properties: None
  - Location: Extension commands

- **`quick_pick_sign_in`** - When user selects sign-in from quick pick
  - Properties: None
  - Location: Quick pick

- **`quick_pick_sign_out`** - When user selects sign-out from quick pick
  - Properties: None
  - Location: Quick pick

- **`quick_pick_add_event`** - When user selects add event from quick pick
  - Properties: None
  - Location: Quick pick

- **`quick_pick_refresh_events`** - When user selects refresh events from quick pick
  - Properties: None
  - Location: Quick pick

- **`quick_pick_create_config`** - When user selects create config from quick pick
  - Properties: None
  - Location: Quick pick

- **`quick_pick_configure_server_urls`** - When user selects configure server URLs from quick pick
  - Properties: None
  - Location: Quick pick

- **`quick_pick_mcp_server_setup`** - When user selects MCP server setup from quick pick
  - Properties: None
  - Location: Quick pick

- **`quick_pick_open_settings`** - When user selects open settings from quick pick
  - Properties: None
  - Location: Quick pick

## Command Execution

### Command Tracking
- **`command_executed`** - When any command is executed
  - Properties:
    - `command`: The command that was executed
    - `timestamp`: When the command was executed
  - Location: Analytics provider (automatic)

- **`command_completed`** - When a command completes successfully
  - Properties:
    - `command`: The command that completed
    - `duration_ms`: How long the command took to execute
    - `success`: Whether the command succeeded (true)
  - Location: Analytics provider (automatic)

- **`command_failed`** - When a command fails
  - Properties:
    - `command`: The command that failed
    - `duration_ms`: How long the command took before failing
    - `error`: The error message
  - Location: Analytics provider (automatic)

## Configuration Changes

### Workspace Configuration
- **`workspace_config_changed`** - When workspace configuration changes
  - Properties:
    - `sections`: Array of configuration sections that changed
  - Location: Analytics provider (automatic)

### Individual Settings
- **`config_changed`** - When individual configuration settings change
  - Properties:
    - `setting`: The setting that changed
    - `value`: The new value
  - Location: Analytics service

## Webhook Events

### Event Reception
- **`webhook_event_received`** - When a webhook event is received
  - Properties:
    - `event`: The type of event
    - `provider`: The provider of the event
  - Location: Analytics service

## Exception Tracking

### Error Tracking
- **`exception`** - When an exception occurs
  - Properties:
    - `args`: Number of arguments passed to the command
    - `command`: The command that caused the exception
  - Location: Analytics provider (automatic)

## Implementation Notes

### Analytics Service Integration
The VS Code extension uses a centralized `AnalyticsService` that:
- Automatically tracks command executions, completions, and failures
- Provides common VS Code properties (version, platform, etc.)
- Handles PostHog initialization and user identification
- Respects user privacy settings and VS Code telemetry preferences

### Event Properties
All events include common properties:
- Extension version and platform information
- VS Code version and session details
- User authentication state
- Timestamp information

### Privacy and Consent
- Analytics respect VS Code telemetry settings
- User can disable analytics through extension settings
- No personally identifiable information is tracked without consent
- Session-based tracking with user control

### Command Decorators
The analytics provider automatically decorates all VS Code commands to track:
- Execution start and completion
- Success/failure status
- Execution duration
- Error details

## Webview Interactions

### Webview Panel Events
- **`webview_request_details_viewed`** - When request details are viewed in webview
  - Properties:
    - `request_id`: The ID of the request being viewed
    - `event_id`: The ID of the parent event
    - `event_name`: Whether the event has a body
    - `source`: The source of the event
  - Location: Request details webview

- **`webview_event_details_viewed`** - When event details are viewed in webview
  - Properties:
    - `event_id`: The ID of the event being viewed
    - `event_name`: Whether the event has a body
    - `source`: The source of the event
    - `request_count`: Number of requests in the event
    - `status`: Status of the event
  - Location: Event details webview

- **`webview_panel_disposed`** - When a webview panel is closed
  - Properties:
    - `panel_type`: Type of panel ("request_details" or "event_details")
  - Location: Request details webview

### Webview Component Interactions
- **`webview_interaction`** - Generic webview interaction tracking
  - Properties:
    - `action`: The specific action performed
    - `component`: The component that triggered the action
    - Additional properties specific to each action
  - Location: Various webview components

### JSON Viewer Interactions
- **`json_viewer_expanded`** - When JSON viewer is expanded/collapsed
  - Properties:
    - `expanded`: Whether the viewer is expanded
    - `title`: Title of the JSON viewer
    - `data_type`: Type of data being displayed
    - `is_array`: Whether the data is an array
  - Location: JSON viewer component

- **`json_node_expanded`** - When individual JSON nodes are expanded/collapsed
  - Properties:
    - `expanded`: Whether the node is expanded
    - `level`: Nesting level of the node
    - `has_key`: Whether the node has a key name
    - `data_type`: Type of data in the node
    - `is_array`: Whether the node contains an array
  - Location: JSON viewer component

- **`json_copied`** - When JSON data is copied to clipboard
  - Properties:
    - `title`: Title of the JSON viewer
    - `data_type`: Type of data copied
    - `is_array`: Whether the data is an array
    - `data_size`: Size of the copied data
  - Location: JSON viewer component

- **`json_copy_failed`** - When JSON copy operation fails
  - Properties:
    - `title`: Title of the JSON viewer
    - `error`: Error message
  - Location: JSON viewer component

- **`json_view_mode_toggled`** - When switching between raw and tree view
  - Properties:
    - `title`: Title of the JSON viewer
    - `new_mode`: New view mode ("raw" or "tree")
    - `data_type`: Type of data being displayed
    - `is_array`: Whether the data is an array
  - Location: JSON viewer component

### Request Card Interactions
- **`request_card_expanded`** - When request card is expanded/collapsed
  - Properties:
    - `expanded`: Whether the card is expanded
    - `request_id`: ID of the request
    - `event_id`: ID of the parent event
    - `destination_name`: Name of the destination
    - `status`: Status of the request
  - Location: Request card component

- **`destination_url_copied`** - When destination URL is copied
  - Properties:
    - `request_id`: ID of the request
    - `event_id`: ID of the parent event
    - `destination_name`: Name of the destination
    - `url_length`: Length of the copied URL
  - Location: Request card component

- **`request_body_copied`** - When request body is copied
  - Properties:
    - `request_id`: ID of the request
    - `event_id`: ID of the parent event
    - `destination_name`: Name of the destination
    - `body_length`: Length of the copied body
  - Location: Request card component

- **`response_body_copied`** - When response body is copied
  - Properties:
    - `request_id`: ID of the request
    - `event_id`: ID of the parent event
    - `destination_name`: Name of the destination
    - `body_length`: Length of the copied body
  - Location: Request card component

### Header Interactions
- **`replay_button_clicked`** - When replay button is clicked in request header
  - Properties:
    - `request_id`: ID of the request
    - `event_id`: ID of the parent event
    - `event_name`: Name of the event
    - `source`: Source of the event
    - `is_replaying`: Whether replay is already in progress
  - Location: Request header component

This provides comprehensive insights into extension usage patterns while maintaining user privacy and control.
