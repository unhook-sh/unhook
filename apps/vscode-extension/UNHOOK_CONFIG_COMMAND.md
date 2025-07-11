# Unhook Configuration File Creation Command

## Overview

A new VSCode command has been added to the Unhook extension that allows users to easily create an `unhook.yml` configuration file for their projects.

## How to Use

### Method 1: Command Palette
1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS)
2. Type "Unhook: Create Configuration File"
3. Select the command from the list

### Method 2: Quick Pick Menu
1. Click on the Unhook status bar icon
2. Select "Create Configuration File" from the quick pick menu

### Method 3: Direct Command
- Execute the command `unhook.createConfig` programmatically

## Features

When executed, the command will:

1. **Check for workspace**: Ensures you have a workspace folder open
2. **Configuration type selection**: Choose between:
   - **Cloud Configuration**: For connecting to the Unhook cloud service (unhook.sh)
   - **Self-Hosted Configuration**: For connecting to your own Unhook instance
3. **Workspace folder selection**: If multiple workspace folders are open, you can choose where to create the file
4. **Filename selection**: Choose between `unhook.yml` or `unhook.yaml`
5. **Overwrite protection**: Warns if the file already exists and asks for confirmation
6. **Auto-open**: Automatically opens the created file in the editor

## Configuration Templates

### Cloud Configuration (Default)
```yaml
# Unhook Webhook Configuration
# For more information, visit: https://docs.unhook.sh/configuration

webhookId: wh_example
destination:
  - name: local
    url: http://localhost:3000/api/webhooks
delivery:
  - destination: local
```

### Self-Hosted Configuration
```yaml
# Unhook Self-Hosted Configuration

webhookId: wh_example

server:
  apiUrl: https://api.your-domain.com
  dashboardUrl: https://dashboard.your-domain.com

destination:
  - name: local
    url: http://localhost:3000/api/webhooks

delivery:
  - destination: local

debug: false
```

## Implementation Details

- Located in: `apps/vscode-extension/src/commands/init.commands.ts`
- Command ID: `unhook.createConfig`
- Uses VSCode's built-in file system API for cross-platform compatibility
- Fully integrated with the extension's quick pick menu and command palette